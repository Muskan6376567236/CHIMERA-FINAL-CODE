import duckdb
from core.config import GOLD_DIR
from loguru import logger

def get_connection() -> duckdb.DuckDBPyConnection:
    conn = duckdb.connect(":memory:")
    conn.execute("PRAGMA threads=4")
    for pf in GOLD_DIR.glob("*.parquet"):
        try:
            conn.execute(f"CREATE VIEW {pf.stem} AS SELECT * FROM read_parquet('{str(pf)}')")
        except Exception as e:
            logger.warning(f"Could not load {pf.stem}: {e}")
    return conn

def execute_query(sql: str, params=None):
    conn = get_connection()
    try:
        if params:
            result = conn.execute(sql, params).fetchdf()
        else:
            result = conn.execute(sql).fetchdf()
        conn.close()
        return result
    except Exception as e:
        conn.close()
        logger.error(f"Query error: {e}")
        raise
