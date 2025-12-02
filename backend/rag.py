import os
import logging
import numpy as np
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
import nltk
from langchain_core.documents import Document
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from langchain_community.vectorstores import Chroma
from langchain_core.embeddings import Embeddings

from data_preparation import load_all_books

logger = logging.getLogger("HarryPotterRAG")
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
ch = logging.StreamHandler()
ch.setFormatter(formatter)
logger.addHandler(ch)

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

def tokenize(text: str) -> List[str]:
    return [word.lower() for word in nltk.word_tokenize(text) if word.isalpha()]

class SemanticChunker:
    def __init__(self, model: SentenceTransformer, max_chunk_size: int = 600, similarity_threshold: float = 0.65):
        self.model = model
        self.max_chunk_size = max_chunk_size
        self.similarity_threshold = similarity_threshold

    def chunk_text(self, text: str) -> List[str]:
        if not text or not text.strip():
            return []
        sentences = nltk.sent_tokenize(text)
        if not sentences:
            return [text.strip()]
        
        # Обработка очень длинных текстов
        if len(sentences) > 2000:
            logger.warning(f"Очень длинный текст: {len(sentences)} предложений. Обрезаем до 2000.")
            sentences = sentences[:2000]

        # Кодируем с батчингом
        all_embeddings = self.model.encode(
            sentences,
            convert_to_numpy=True,
            batch_size=32,
            show_progress_bar=False
        )
        chunks = []
        current_chunk = [sentences[0]]
        current_embeddings = [all_embeddings[0]]

        for i in range(1, len(sentences)):
            sentence = sentences[i]
            sent_emb = all_embeddings[i]
            avg_emb = np.mean(current_embeddings, axis=0)
            sim = cosine_similarity([avg_emb], [sent_emb])[0][0]
            current_len = sum(len(s) + 1 for s in current_chunk)

            if sim < self.similarity_threshold or current_len + len(sentence) > self.max_chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = [sentence]
                current_embeddings = [sent_emb]
            else:
                current_chunk.append(sentence)
                current_embeddings.append(sent_emb)

        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

# === Кастомная embedding-функция для LangChain ===
class PreloadedSentenceTransformerEmbeddings(Embeddings):
    def __init__(self, model: SentenceTransformer):
        self.model = model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        filtered_texts = [t if t.strip() else " " for t in texts]
        embeddings = self.model.encode(
            filtered_texts,
            convert_to_numpy=True,
            batch_size=32
        )
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode(
            [text if text.strip() else " "],
            convert_to_numpy=True,
            batch_size=1
        )
        return embedding[0].tolist()

class HarryPotterRAG:
    def __init__(self):
        logger.info("=== Инициализация HarryPotterRAG (русская версия) ===")
        logger.info("Загрузка книг...")
        self.documents: List[Document] = load_all_books()
        logger.info(f"Загружено {len(self.documents)} глав.")

        # Загрузка РУССКОЙ embedding-модели
        logger.info("Загрузка русской embedding-модели 'cointegrated/rubert-tiny2'...")
        embedding_model = SentenceTransformer("cointegrated/rubert-tiny2", device="cpu")
        logger.info("Модель успешно загружена.")

        # Семантический чанкинг
        logger.info("Выполнение семантического чанкинга...")
        chunker = SemanticChunker(model=embedding_model, max_chunk_size=600, similarity_threshold=0.65)
        self.docs: List[Document] = []
        for doc in self.documents:
            chunks = chunker.chunk_text(doc.page_content)
            for chunk in chunks:
                self.docs.append(Document(page_content=chunk, metadata=doc.metadata))
        logger.info(f"Создано {len(self.docs)} чанков.")

        # BM25
        logger.info("Создание BM25 индекса...")
        self.tokenized_corpus = [tokenize(doc.page_content) for doc in self.docs]
        self.bm25 = BM25Okapi(self.tokenized_corpus)

        # Векторное хранилище
        logger.info("Создание векторного хранилища (Chroma)...")
        self.embeddings = PreloadedSentenceTransformerEmbeddings(embedding_model)
        self.db = Chroma.from_documents(self.docs, self.embeddings)
        logger.info("Индексация завершена.")

        # LLM
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY не найден в .env")
        self.llm = ChatMistralAI(
            model="mistral-small-latest",
            mistral_api_key=api_key,
            temperature=0.0,
            max_retries=2
        )

        # Промпт
        self.prompt = ChatPromptTemplate.from_template(
            """Ты — эксперт по книгам о Гарри Поттере. Ответь на вопрос, используя ТОЛЬКО приведённые отрывки.

СЛЕДУЙ ПРАВИЛАМ:
1. Если в отрывках есть информация, позволяющая однозначно ответить на вопрос — ответь.
2. ОБЯЗАТЕЛЬНО приведи ТОЧНУЮ цитату из текста, которая подтверждает твой ответ.
3. Укажи НАЗВАНИЕ КНИГИ и НОМЕР ГЛАВЫ.
4. Если в отрывках недостаточно информации для однозначного ответа — напиши: «Не знаю».

НЕ выдумывай. НЕ используй внешние знания.

Отрывки:
{context}

Вопрос: {question}

Ответ:"""
        )
        self.chain = self.prompt | self.llm | StrOutputParser()

        # Расширение запроса
        self.expansion_prompt = ChatPromptTemplate.from_template(
            "Какие 3–5 ключевых слов или фраз (включая синонимы) лучше всего описывают суть этого вопроса? Ответь списком, по одной строке.\n\n{question}"
        )
        self.expander_chain = self.expansion_prompt | self.llm | StrOutputParser()

    def _reciprocal_rank_fusion(self, results_list: List[List[Document]], k: int = 60) -> List[Document]:
        fused_scores = {}
        doc_map = {}
        for docs in results_list:
            for rank, doc in enumerate(docs):
                key = doc.page_content
                if key not in fused_scores:
                    fused_scores[key] = 0
                    doc_map[key] = doc
                fused_scores[key] += 1 / (rank + k)
        return [doc_map[key] for key in sorted(fused_scores, key=fused_scores.get, reverse=True)]

    def _hybrid_search(self, query: str, k: int = 30) -> List[Document]:
        try:
            vector_docs = self.db.similarity_search(query, k=k)
            tokenized = tokenize(query)
            scores = self.bm25.get_scores(tokenized)
            top_idx = np.argsort(scores)[::-1][:k]
            bm25_docs = [self.docs[i] for i in top_idx]
            return self._reciprocal_rank_fusion([vector_docs, bm25_docs], k=60)
        except Exception as e:
            logger.error(f"Ошибка в гибридном поиске: {e}")
            return []

    def _format_docs_with_metadata(self, docs: List[Document]) -> str:
        formatted = []
        for doc in docs:
            book = doc.metadata.get("book", "Неизвестная книга")
            chapter = doc.metadata.get("chapter", "?")
            formatted.append(f"[ИСТОЧНИК: {book}, глава {chapter}]\n{doc.page_content.strip()}")
        return "\n\n---\n\n".join(formatted)

    def query(self, question: str) -> Dict[str, Any]:
        logger.info(f"Вопрос: '{question}'")

        try:
            keywords_raw = self.expander_chain.invoke({"question": question})
            keywords = " ".join([k.strip() for k in keywords_raw.split("\n") if k.strip()])
            expanded_query = f"{question} {keywords}"
            logger.debug(f"Расширенный запрос: {expanded_query}")
        except Exception as e:
            logger.warning(f"Не удалось расширить запрос: {e}")
            expanded_query = question

        # Поиск
        candidates = self._hybrid_search(expanded_query, k=30)
        logger.info(f"Найдено {len(candidates)} кандидатов")

        # БЕЗ реранкера — используем топ-15 из гибридного поиска
        relevant_docs = candidates[:15]

        # Логирование топ-3
        if relevant_docs:
            logger.debug("ТОП-3 источника:")
            for i, doc in enumerate(relevant_docs[:3]):
                book = doc.metadata.get("book", "?")
                ch = doc.metadata.get("chapter", "?")
                preview = doc.page_content[:120].replace("\n", " ")
                logger.debug(f"  {i+1}. {book}, гл.{ch}: ...{preview}...")

        context = self._format_docs_with_metadata(relevant_docs)
        try:
            response = self.chain.invoke({"context": context, "question": question})
            return {"answer": response.strip()}
        except Exception as e:
            logger.exception("Ошибка генерации ответа")
            return {"answer": "Извините, произошла ошибка.", "error": str(e)}