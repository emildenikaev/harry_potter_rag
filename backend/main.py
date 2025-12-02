from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import nltk
nltk.download('punkt_tab')

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = None

class QueryRequest(BaseModel):
    question: str

@app.on_event("startup")
async def startup_event():
    global rag
    print("⏳ Инициализация RAG...")
    from rag import HarryPotterRAG
    rag = HarryPotterRAG()
    print("✅ RAG готов!")

@app.post("/ask")
def ask_question(request: QueryRequest):
    global rag
    if rag is None:
        raise HTTPException(status_code=503, detail="Система ещё инициализируется, подождите...")
    try:
        result = rag.query(request.question)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return {"answer": result["answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))