from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

# Configure logging
logger.remove()
logger.add(sys.stdout, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}")

app = FastAPI(
    title="CHIMERA BI Platform",
    description="Autonomous AI Business Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.pipeline_router import router as pipeline_router
from api.analytics_router import router as analytics_router
from api.chat_router import router as chat_router
from api.query_router import router as query_router
from api.upload_router import router as upload_router

app.include_router(pipeline_router)
app.include_router(analytics_router)
app.include_router(chat_router)
app.include_router(query_router)
app.include_router(upload_router)

@app.get("/")
def root():
    return {"status": "CHIMERA BI Platform running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
