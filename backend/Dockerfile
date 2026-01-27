# Используем один образ — без разделения на builder/final
FROM python:3.11-slim

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Копируем и устанавливаем зависимости
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Загружаем NLTK и модель
RUN python -c "import nltk; nltk.download('punkt', download_dir='/root/nltk_data')" && \
    python -c "from sentence_transformers import SentenceTransformer; print('Загрузка rubert-tiny2...'); SentenceTransformer('cointegrated/rubert-tiny2')"

# Копируем код
COPY . .

# Переменные окружения
ENV NLTK_DATA=/root/nltk_data

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]