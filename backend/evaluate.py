import json
import requests
import time
import os

API_URL = "http://localhost:8000/ask"
INPUT_FILE = "evaluation/valid_questions.json"
OUTPUT_FILE = "evaluation/results.json"

# Загружаем вопросы
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    questions = json.load(f)

print(f"📨 Запуск оценки: {len(questions)} вопросов")
results = []

for i, q in enumerate(questions):
    print(f"[{i+1}/{len(questions)}] {q['question']}")
    try:
        resp = requests.post(
            API_URL,
            json={"question": q["question"]},
            timeout=30
        )
        if resp.status_code == 200:
            answer = resp.json().get("answer", "")
        else:
            answer = f"ERROR: HTTP {resp.status_code}"
    except Exception as e:
        answer = f"EXCEPTION: {str(e)}"

    results.append({
        "question": q["question"],
        "expected_answer": q["expected_answer"],
        "expected_source": q.get("expected_source", ""),
        "model_answer": answer,
        "is_correct": None  # заполняется руками после ответов
    })

    # Небольшая пауза, чтобы не перегружать Mistral API
    time.sleep(3)

# Сохраняем результаты
os.makedirs("evaluation", exist_ok=True)
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Результаты сохранены в {OUTPUT_FILE}. Проставьте 'is_correct': true/false для каждого ответа")