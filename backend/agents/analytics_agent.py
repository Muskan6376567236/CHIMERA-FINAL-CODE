import duckdb
from loguru import logger
from core.config import GOLD_DIR

def _get_conn():
    """Open DuckDB in-memory and load all gold parquets"""
    conn = duckdb.connect(":memory:")
    conn.execute("PRAGMA threads=4")
    for pf in GOLD_DIR.glob("*.parquet"):
        try:
            conn.execute(f"CREATE VIEW {pf.stem} AS SELECT * FROM read_parquet('{str(pf)}')")
        except Exception as e:
            logger.warning(f"Could not load {pf.stem}: {e}")
    return conn

class AnalyticsAgent:

    def revenue_by_month(self) -> list:
        conn = _get_conn()
        try:
            df = conn.execute("""
                SELECT
                    STRFTIME(orderdate::DATE, '%Y-%m') AS month,
                    ROUND(SUM(revenue), 2) AS revenue,
                    ROUND(SUM(profit), 2)  AS profit,
                    COUNT(DISTINCT ordernumber) AS orders
                FROM fact_sales
                GROUP BY 1 ORDER BY 1
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"revenue_by_month: {e}"); return []

    def revenue_by_category(self) -> list:
        conn = _get_conn()
        try:
            df = conn.execute("""
                SELECT
                    COALESCE(p.categoryname, 'Unknown') AS category,
                    ROUND(SUM(s.revenue), 2) AS revenue,
                    ROUND(SUM(s.profit), 2)  AS profit,
                    SUM(s.orderquantity)      AS units_sold
                FROM fact_sales s
                LEFT JOIN dim_products p ON s.productkey = p.productkey
                GROUP BY 1 ORDER BY 2 DESC
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"revenue_by_category: {e}"); return []

    def revenue_by_region(self) -> list:
        conn = _get_conn()
        try:
            df = conn.execute("""
                SELECT
                    COALESCE(t.region, 'Unknown') AS region,
                    COALESCE(t.country, 'Unknown') AS country,
                    COALESCE(t.continent, 'Unknown') AS continent,
                    ROUND(SUM(s.revenue), 2) AS revenue,
                    ROUND(SUM(s.profit), 2)  AS profit,
                    COUNT(DISTINCT s.ordernumber) AS orders
                FROM fact_sales s
                LEFT JOIN dim_territories t ON s.territorykey = t.salesterritorykey
                GROUP BY 1, 2, 3 ORDER BY 4 DESC
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"revenue_by_region: {e}"); return []

    def top_products(self, limit: int = 10) -> list:
        conn = _get_conn()
        try:
            df = conn.execute(f"""
                SELECT
                    COALESCE(p.productname, 'Unknown') AS product_name,
                    COALESCE(p.categoryname, 'Unknown') AS category,
                    ROUND(SUM(s.revenue), 2) AS revenue,
                    ROUND(SUM(s.profit), 2)  AS profit,
                    SUM(s.orderquantity)      AS units_sold
                FROM fact_sales s
                LEFT JOIN dim_products p ON s.productkey = p.productkey
                GROUP BY 1, 2 ORDER BY 3 DESC LIMIT {limit}
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"top_products: {e}"); return []

    def top_customers(self, limit: int = 10) -> list:
        conn = _get_conn()
        try:
            df = conn.execute(f"""
                SELECT
                    s.customerkey,
                    COALESCE(c.firstname || ' ' || c.lastname, 'Unknown') AS customer_name,
                    COALESCE(c.occupation, 'Unknown') AS occupation,
                    ROUND(SUM(s.revenue), 2) AS revenue,
                    COUNT(DISTINCT s.ordernumber) AS orders
                FROM fact_sales s
                LEFT JOIN dim_customers c ON s.customerkey = c.customerkey
                GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT {limit}
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"top_customers: {e}"); return []

    def returns_analysis(self) -> list:
        conn = _get_conn()
        try:
            df = conn.execute("""
                SELECT
                    COALESCE(t.region, 'Unknown') AS region,
                    COALESCE(p.categoryname, 'Unknown') AS category,
                    SUM(r.returnquantity) AS total_returns
                FROM fact_returns r
                LEFT JOIN dim_territories t ON r.territorykey = t.salesterritorykey
                LEFT JOIN dim_products p ON r.productkey = p.productkey
                GROUP BY 1, 2 ORDER BY 3 DESC
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"returns_analysis: {e}"); return []

    def revenue_yoy(self) -> list:
        conn = _get_conn()
        try:
            df = conn.execute("""
                SELECT
                    YEAR(orderdate::DATE)       AS year,
                    ROUND(SUM(revenue), 2)      AS revenue,
                    ROUND(SUM(profit), 2)       AS profit,
                    COUNT(DISTINCT ordernumber) AS orders
                FROM fact_sales
                GROUP BY 1 ORDER BY 1
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"revenue_yoy: {e}"); return []

    def customer_segments(self) -> list:
        conn = _get_conn()
        try:
            df = conn.execute("""
                SELECT
                    COALESCE(c.occupation, 'Unknown') AS occupation,
                    COALESCE(c.educationlevel, 'Unknown') AS education,
                    COUNT(DISTINCT s.customerkey)     AS customers,
                    ROUND(SUM(s.revenue), 2)          AS revenue
                FROM fact_sales s
                LEFT JOIN dim_customers c ON s.customerkey = c.customerkey
                GROUP BY 1, 2 ORDER BY 4 DESC
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"customer_segments: {e}"); return []

    def monthly_returns(self) -> list:
        conn = _get_conn()
        try:
            df = conn.execute("""
                SELECT
                    STRFTIME(returndate::DATE, '%Y-%m') AS month,
                    SUM(returnquantity) AS returns
                FROM fact_returns
                GROUP BY 1 ORDER BY 1
            """).pl()
            conn.close(); return df.to_dicts()
        except Exception as e:
            conn.close(); logger.error(f"monthly_returns: {e}"); return []

analytics_agent = AnalyticsAgent()
