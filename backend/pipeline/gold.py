import polars as pl
import duckdb
import json
from pathlib import Path
from loguru import logger
from core.config import SILVER_DIR, GOLD_DIR, DB_PATH
from datetime import datetime

def _load_silver(table: str) -> pl.DataFrame:
    p = SILVER_DIR / f"{table}.parquet"
    if not p.exists():
        raise FileNotFoundError(f"Silver table not found: {table}")
    return pl.read_parquet(str(p))

def build_gold_layer() -> dict:
    conn = duckdb.connect(str(DB_PATH))
    results = {}

    # Load all silver tables
    tables = {}
    for pf in SILVER_DIR.glob("*.parquet"):
        name = pf.stem
        df = pl.read_parquet(str(pf))
        tables[name] = df
        # Register in DuckDB
        conn.register(name, df.to_arrow())
        logger.info(f"[GOLD] Registered {name} in DuckDB ({df.height} rows)")

    # ---- FACT: unified sales ----
    if "adventureworks_sales_2016" in tables and "adventureworks_sales_2017" in tables:
        sales = pl.concat([
            tables["adventureworks_sales_2016"],
            tables["adventureworks_sales_2017"],
        ])
        conn.register("fact_sales_raw", sales.to_arrow())

        # Join with products to get price/cost
        if "adventureworks_products" in tables:
            products = tables["adventureworks_products"]
            conn.register("dim_products_raw", products.to_arrow())

            fact_sales = conn.execute("""
                SELECT
                    s.orderdate,
                    s.stockdate,
                    s.ordernumber,
                    s.productkey,
                    s.customerkey,
                    s.territorykey,
                    s.orderlineitem,
                    s.orderquantity,
                    COALESCE(p.productprice, 0) AS unit_price,
                    COALESCE(p.productcost, 0)  AS unit_cost,
                    ROUND(s.orderquantity * COALESCE(p.productprice, 0), 2) AS revenue,
                    ROUND(s.orderquantity * COALESCE(p.productcost, 0), 2)  AS cost,
                    ROUND(
                        s.orderquantity * COALESCE(p.productprice, 0) -
                        s.orderquantity * COALESCE(p.productcost, 0), 2
                    ) AS profit
                FROM fact_sales_raw s
                LEFT JOIN dim_products_raw p ON s.productkey = p.productkey
            """).pl()

            out = GOLD_DIR / "fact_sales.parquet"
            fact_sales.write_parquet(str(out))
            conn.register("fact_sales", fact_sales.to_arrow())
            results["fact_sales"] = {"rows": fact_sales.height, "path": str(out)}
            logger.info(f"[GOLD] fact_sales: {fact_sales.height} rows")

    # ---- DIM: customers ----
    if "adventureworks_customers" in tables:
        customers = tables["adventureworks_customers"]
        out = GOLD_DIR / "dim_customers.parquet"
        customers.write_parquet(str(out))
        conn.register("dim_customers", customers.to_arrow())
        results["dim_customers"] = {"rows": customers.height, "path": str(out)}

    # ---- DIM: products (enriched) ----
    if all(k in tables for k in ["adventureworks_products", "adventureworks_product_subcategories", "adventureworks_product_categories"]):
        dim_products = conn.execute("""
            SELECT
                p.productkey,
                p.productsku,
                p.productname,
                p.modelname,
                p.productcolor,
                p.productsize,
                p.productstyle,
                p.productcost,
                p.productprice,
                s.subcategoryname,
                c.categoryname
            FROM adventureworks_products p
            LEFT JOIN adventureworks_product_subcategories s
                ON p.productsubcategorykey = s.productsubcategorykey
            LEFT JOIN adventureworks_product_categories c
                ON s.productcategorykey = c.productcategorykey
        """).pl()
        out = GOLD_DIR / "dim_products.parquet"
        dim_products.write_parquet(str(out))
        conn.register("dim_products", dim_products.to_arrow())
        results["dim_products"] = {"rows": dim_products.height, "path": str(out)}
        logger.info(f"[GOLD] dim_products enriched: {dim_products.height} rows")

    # ---- DIM: territories ----
    if "adventureworks_territories" in tables:
        terr = tables["adventureworks_territories"]
        out = GOLD_DIR / "dim_territories.parquet"
        terr.write_parquet(str(out))
        conn.register("dim_territories", terr.to_arrow())
        results["dim_territories"] = {"rows": terr.height, "path": str(out)}

    # ---- FACT: returns ----
    if "adventureworks_returns" in tables:
        out = GOLD_DIR / "fact_returns.parquet"
        tables["adventureworks_returns"].write_parquet(str(out))
        conn.register("fact_returns", tables["adventureworks_returns"].to_arrow())
        results["fact_returns"] = {"rows": tables["adventureworks_returns"].height, "path": str(out)}

    # ---- KPIs ----
    kpis = _build_kpis(conn)
    results["kpis"] = kpis

    # Persist DuckDB tables from gold parquets
    for pf in GOLD_DIR.glob("*.parquet"):
        tbl = pf.stem
        try:
            conn.execute(f"DROP VIEW IF EXISTS {tbl}")
            conn.execute(f"DROP TABLE IF EXISTS {tbl}")
            conn.execute(f"CREATE TABLE {tbl} AS SELECT * FROM read_parquet('{str(pf)}')")
        except Exception as e:
            logger.warning(f"[GOLD] Could not persist {tbl}: {e}")

    conn.close()
    meta_path = GOLD_DIR / "gold_meta.json"
    with open(meta_path, "w") as f:
        json.dump({"built_at": datetime.utcnow().isoformat(), "tables": results}, f, indent=2)

    return results

def _build_kpis(conn: duckdb.DuckDBPyConnection) -> dict:
    kpis = {}
    try:
        r = conn.execute("""
            SELECT
                ROUND(SUM(revenue), 2)              AS total_revenue,
                ROUND(SUM(profit), 2)               AS total_profit,
                ROUND(SUM(cost), 2)                 AS total_cost,
                COUNT(DISTINCT ordernumber)          AS total_orders,
                COUNT(DISTINCT customerkey)          AS unique_customers,
                ROUND(AVG(revenue), 2)              AS avg_order_value,
                ROUND(SUM(profit)/NULLIF(SUM(revenue),0)*100, 2) AS profit_margin_pct
            FROM fact_sales
        """).fetchone()
        kpis["summary"] = {
            "total_revenue": r[0],
            "total_profit": r[1],
            "total_cost": r[2],
            "total_orders": r[3],
            "unique_customers": r[4],
            "avg_order_value": r[5],
            "profit_margin_pct": r[6],
        }
        logger.info(f"[GOLD] KPIs: {kpis['summary']}")
    except Exception as e:
        logger.error(f"[GOLD] KPI build failed: {e}")
    return kpis

def get_kpis() -> dict:
    conn = duckdb.connect(":memory:")
    fact_sales_path = GOLD_DIR / "fact_sales.parquet"
    if fact_sales_path.exists():
        conn.execute(f"CREATE VIEW fact_sales AS SELECT * FROM read_parquet('{str(fact_sales_path)}')")
    kpis = _build_kpis(conn)
    conn.close()
    return kpis
