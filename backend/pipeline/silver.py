import polars as pl
import json, re
from pathlib import Path
from loguru import logger
from core.config import BRONZE_DIR, SILVER_DIR
from datetime import datetime

DATE_PATTERNS = ["%m/%d/%Y", "%Y-%m-%d", "%d/%m/%Y", "%m-%d-%Y"]

def _parse_money(series: pl.Series) -> pl.Series:
    return (
        series.cast(pl.Utf8)
        .str.replace_all(r"[\$,\s]", "")
        .cast(pl.Float64, strict=False)
    )

def _detect_date_col(col: str) -> bool:
    keywords = ["date", "dt", "day", "month", "year", "period"]
    return any(k in col.lower() for k in keywords)

def _cast_dates(df: pl.DataFrame) -> pl.DataFrame:
    for col in df.columns:
        if _detect_date_col(col) and df[col].dtype == pl.Utf8:
            for fmt in DATE_PATTERNS:
                try:
                    df = df.with_columns(
                        pl.col(col).str.strptime(pl.Date, fmt, strict=False).alias(col)
                    )
                    if df[col].null_count() < df.height * 0.8:
                        logger.info(f"[SILVER] Parsed date col '{col}' with format {fmt}")
                        break
                except Exception:
                    continue
    return df

def _cast_money_cols(df: pl.DataFrame) -> pl.DataFrame:
    for col in df.columns:
        if df[col].dtype == pl.Utf8:
            sample = df[col].drop_nulls().head(20).to_list()
            if any(str(v).startswith("$") for v in sample if v):
                df = df.with_columns(_parse_money(pl.col(col)).alias(col))
                logger.info(f"[SILVER] Parsed money col '{col}'")
    return df

def _drop_full_duplicates(df: pl.DataFrame) -> pl.DataFrame:
    before = df.height
    df = df.unique()
    after = df.height
    if before != after:
        logger.info(f"[SILVER] Dropped {before - after} duplicate rows")
    return df

def clean_table(table_name: str) -> dict:
    bronze_path = BRONZE_DIR / f"{table_name}.parquet"
    if not bronze_path.exists():
        raise FileNotFoundError(f"Bronze file not found: {bronze_path}")

    df = pl.read_parquet(str(bronze_path))
    original_rows = df.height

    df = _drop_full_duplicates(df)
    df = _cast_money_cols(df)
    df = _cast_dates(df)

    # drop columns that are >80% null
    keep_cols = [c for c in df.columns if df[c].null_count() / df.height < 0.8]
    df = df.select(keep_cols)

    out_path = SILVER_DIR / f"{table_name}.parquet"
    df.write_parquet(str(out_path))

    meta = {
        "table_name": table_name,
        "silver_path": str(out_path),
        "rows_before": original_rows,
        "rows_after": df.height,
        "columns": df.columns,
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "cleaned_at": datetime.utcnow().isoformat(),
    }
    meta_path = SILVER_DIR / f"{table_name}_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    logger.info(f"[SILVER] {table_name}: {df.height} rows after cleaning")
    return meta

def run_silver_layer() -> list[dict]:
    results = []
    for parquet in BRONZE_DIR.glob("*.parquet"):
        table_name = parquet.stem
        try:
            meta = clean_table(table_name)
            results.append(meta)
        except Exception as e:
            logger.error(f"[SILVER] Failed {table_name}: {e}")
    return results

def list_silver_tables() -> list[dict]:
    tables = []
    for meta_file in SILVER_DIR.glob("*_meta.json"):
        with open(meta_file) as f:
            tables.append(json.load(f))
    return tables
