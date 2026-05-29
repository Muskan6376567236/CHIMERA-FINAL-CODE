from fastapi import APIRouter
from pydantic import BaseModel
from agents.llm_agent import chat_with_llm, generate_insight
from pipeline.gold import get_kpis
from loguru import logger

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    messages: list[dict]
    include_context: bool = True

class InsightRequest(BaseModel):
    topic: str
    data: list[dict]

@router.post("/message")
async def chat(req: ChatRequest):
    context = None
    if req.include_context:
        try:
            context = get_kpis()
        except Exception:
            context = {}
    response = await chat_with_llm(req.messages, context)
    return {"response": response}

@router.post("/insight")
async def insight(req: InsightRequest):
    result = await generate_insight(req.topic, req.data)
    return {"insight": result}
