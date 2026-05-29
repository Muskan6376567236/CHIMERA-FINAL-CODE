from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import duckdb
from core.config import GOLD_DIR
from loguru import logger

router = APIRouter(prefix="/api/query", tags=["query"])

class QueryRequest(BaseModel):
    sql: str

def _get_conn():
    conn = duckdb.connect(":memory:")
    for pf in GOLD_DIR.glob("*.parquet"):
        try:
            conn.execute(f"CREATE VIEW {pf.stem} AS SELECT * FROM read_parquet('{str(pf)}')")
        except Exception as e:
            logger.warning(f"Could not load {pf.stem}: {e}")
    return conn

@router.post("/execute")
def run_query(req: QueryRequest):
    sql = req.sql.strip()
    sql_upper = sql.upper()
    if any(kw in sql_upper for kw in ["DROP", "DELETE", "INSERT", "UPDATE", "CREATE", "ALTER", "TRUNCATE"]):
        raise HTTPException(status_code=400, detail="Only SELECT queries are allowed")
    conn = _get_conn()
    try:
        df = conn.execute(sql).fetchdf()
        conn.close()
        return {
            "columns": list(df.columns),
            "rows": df.to_dict(orient="records"),
            "row_count": len(df),
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tables")
def list_tables():
    tables = [pf.stem for pf in GOLD_DIR.glob("*.parquet")]
    return {"tables": sorted(tables)}
