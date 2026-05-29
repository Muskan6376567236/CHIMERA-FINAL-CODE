from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "phi3:latest"
    DATA_DIR: str = "../datasets"
    MEDALLION_DIR: str = "../medallion"
    DB_PATH: str = "../chimera.duckdb"

    class Config:
        env_file = ".env"

settings = Settings()

BASE_DIR = Path(__file__).parent.parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
MEDALLION_DIR = BASE_DIR / "medallion"
BRONZE_DIR = MEDALLION_DIR / "bronze"
SILVER_DIR = MEDALLION_DIR / "silver"
GOLD_DIR = MEDALLION_DIR / "gold"
DB_PATH = BASE_DIR / "chimera.duckdb"

for d in [BRONZE_DIR, SILVER_DIR, GOLD_DIR]:
    d.mkdir(parents=True, exist_ok=True)
