import re
import os
from langchain_core.documents import Document

# Отображение имён файлов - названий книг
BOOK_TITLES = {
    "harry_potter_and_the_philosophers_stone.txt": "Гарри Поттер и философский камень",
    "harry_potter_and_the_chamber_of_secrets.txt": "Гарри Поттер и Тайная комната",
    "harry_potter_and_the_prisoner_of_azkaban.txt": "Гарри Поттер и узник Азкабана",
    "harry_potter_and_the_goblet_of_fire.txt": "Гарри Поттер и кубок огня",
    "harry_potter_and_the_order_of_the_phoenix.txt": "Гарри Поттер и Орден Феникса",
    "harry_potter_and_the_half_blood_prince.txt": "Гарри Поттер и Принц-полукровка",
    "harry_potter_and_the_deathly_hallows.txt": "Гарри Поттер и Дары Смерти"
}

def parse_book_to_chapters(file_path: str) -> list[Document]:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r'[\u2028\u2029\xA0]', ' ', content)

    book_title = BOOK_TITLES.get(os.path.basename(file_path), "Неизвестная книга")
    
    chapter_pattern = re.compile(r'^\s*Глава\s+(\d+)', re.MULTILINE)
    splits = chapter_pattern.split(content)

    chapters = []
    
    if len(splits) < 2:
        return chapters

    for i in range(1, len(splits), 2):
        chapter_num = splits[i].strip()
        chapter_text = splits[i + 1].strip() if i + 1 < len(splits) else ""
        
        if chapter_text:
            chapters.append(
                Document(
                    page_content=chapter_text,
                    metadata={"book": book_title, "chapter": chapter_num}
                )
            )
    
    return chapters

def load_all_books(data_dir: str = "data") -> list[Document]:
    all_docs = []
    for filename in os.listdir(data_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(data_dir, filename)
            print(f"Загружаем: {filename}")
            docs = parse_book_to_chapters(filepath)
            print(f" → найдено глав: {len(docs)}")
            all_docs.extend(docs)
    return all_docs