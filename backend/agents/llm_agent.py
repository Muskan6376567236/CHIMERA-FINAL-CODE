import httpx
import json
from loguru import logger
from core.config import settings

SYSTEM_PROMPT = """You are CHIMERA, an expert AI Business Intelligence Analyst.
You have access to AdventureWorks data: Sales (2016-2017), Customers, Products, Returns, Territories.

Key facts about the data:
- Sales data: OrderDate, OrderNumber, ProductKey, CustomerKey, TerritoryKey, OrderQuantity, Revenue, Profit
- Products: ProductName, Category (Bikes, Components, Clothing, Accessories), SubCategory
- Customers: Name, Occupation, AnnualIncome, Education, MaritalStatus
- Territories: Region, Country, Continent
- Returns: ReturnDate, TerritoryKey, ProductKey, ReturnQuantity

When answering questions:
1. Be concise and data-focused
2. Mention specific numbers when you know them
3. If asked to create a chart, respond with: CHART:<type>:<metric>:<dimension>
4. Keep responses under 200 words
5. Speak like a senior data analyst
"""

async def chat_with_llm(messages: list[dict], context_data: dict = None) -> str:
    context = ""
    if context_data:
        context = f"\n\nCurrent KPI Context:\n{json.dumps(context_data, indent=2)}"

    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT + context},
            *messages,
        ],
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 400,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"]
    except Exception as e:
        logger.error(f"[LLM] Error: {e}")
        return f"I'm having trouble connecting to the AI model. Please ensure Ollama is running with: `ollama serve`\n\nError: {str(e)}"

async def generate_insight(topic: str, data: list[dict]) -> str:
    data_str = json.dumps(data[:20], indent=2)
    prompt = f"Analyze this {topic} data and provide 3 key business insights in bullet points:\n\n{data_str}"
    messages = [{"role": "user", "content": prompt}]
    return await chat_with_llm(messages)
