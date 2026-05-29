from fastapi import APIRouter
from agents.ingestion_agent import medallion_agent
from loguru import logger

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

@router.post("/run")
def run_pipeline():
    logger.info("[API] Running full Medallion pipeline")
    result = medallion_agent.run()
    return {
        "status": "success",
        "bronze_tables": len(result["bronze"]),
        "silver_tables": len(result["silver"]),
        "gold_summary": result["gold"],
    }

@router.get("/status")
def pipeline_status():
    from core.config import BRONZE_DIR, SILVER_DIR, GOLD_DIR
    bronze = list(BRONZE_DIR.glob("*.parquet"))
    silver = list(SILVER_DIR.glob("*.parquet"))
    gold = list(GOLD_DIR.glob("*.parquet"))
    return {
        "bronze": [f.stem for f in bronze],
        "silver": [f.stem for f in silver],
        "gold": [f.stem for f in gold],
        "ready": len(gold) > 0,
    }
