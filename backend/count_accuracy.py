import json

with open("evaluation/results.json", "r", encoding="utf-8") as f:
    results = json.load(f)

correct = sum(1 for r in results if r["is_correct"] is True)
total = len(results)
accuracy = correct / total if total > 0 else 0

print(f"\n🎯 Итоговая точность: {accuracy:.2%} ({correct}/{total})")
if accuracy >= 0.8:
    print("✅ Требование ≥80% выполнено!")
else:
    print("⚠️ Нужно улучшить RAG или промпт.")