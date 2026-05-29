import polars as pl
import shutil
from pathlib import Path
from loguru import logger
from core.config import DATASETS_DIR, BRONZE_DIR
import json, re
from datetime import datetime

def _clean_col_name(name: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_]', '_', name.strip()).lower()

def ingest_to_bronze(file_path: Path) -> dict:
    name = file_path.stem
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', name).lower()
    out_path = BRONZE_DIR / f"{safe_name}.parquet"

    try:
        df = pl.read_csv(
            file_path,
            infer_schema_length=10000,
            ignore_errors=True,
            truncate_ragged_lines=True,
        )
        # rename columns
        df = df.rename({c: _clean_col_name(c) for c in df.columns})

        df.write_parquet(str(out_path))

        meta = {
            "source_file": str(file_path),
            "bronze_path": str(out_path),
            "table_name": safe_name,
            "rows": df.height,
            "columns": df.columns,
            "ingested_at": datetime.utcnow().isoformat(),
        }
        meta_path = BRONZE_DIR / f"{safe_name}_meta.json"
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        logger.info(f"[BRONZE] {safe_name}: {df.height} rows, {len(df.columns)} cols")
        return meta

    except Exception as e:
        logger.error(f"[BRONZE] Failed {name}: {e}")
        raise

def run_bronze_layer() -> list[dict]:
    results = []
    csv_files = list(DATASETS_DIR.glob("*.csv"))
    logger.info(f"[BRONZE] Found {len(csv_files)} CSV files")
    for f in csv_files:
        meta = ingest_to_bronze(f)
        results.append(meta)
    return results

def list_bronze_tables() -> list[dict]:
    tables = []
    for meta_file in BRONZE_DIR.glob("*_meta.json"):
        with open(meta_file) as f:
            tables.append(json.load(f))
    return tables
