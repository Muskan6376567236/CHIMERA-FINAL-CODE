from pipeline.bronze import run_bronze_layer
from pipeline.silver import run_silver_layer
from pipeline.gold import build_gold_layer
from loguru import logger

class MedallionPipelineAgent:
    def run(self) -> dict:
        logger.info("[AGENT] Starting Medallion Pipeline")
        bronze = run_bronze_layer()
        silver = run_silver_layer()
        gold = build_gold_layer()
        logger.info("[AGENT] Medallion Pipeline Complete")
        return {"bronze": bronze, "silver": silver, "gold": gold}

medallion_agent = MedallionPipelineAgent()
