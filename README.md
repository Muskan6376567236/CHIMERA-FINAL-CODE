# CHIMERA — Autonomous AI Business Intelligence Platform

Medallion Architecture + AI Chatbot + Interactive Dashboards + SQL Engine

---

## Prerequisites

- Python 3.10.x
- Node.js v20.x
- Ollama installed and running
- Git (optional)
- VS Code

---

## Step 1 — Get the project

Open VS Code, open the `chimera` folder.

---

## Step 2 — Start Ollama

Open a terminal:

```
ollama serve
```

In a second terminal, pull the model if not already pulled:

```
ollama pull phi3:latest
```

---

## Step 3 — Backend Setup

Open Terminal 1 in VS Code (Ctrl+\`), navigate to backend:

```
cd chimera\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Start the backend:

```
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO: Uvicorn running on http://0.0.0.0:8000
```

Verify: open http://localhost:8000 in your browser — you should see `{"status":"CHIMERA BI Platform running"}`

---

## Step 4 — Run the Data Pipeline

Open Terminal 2, activate venv, run pipeline:

```
cd chimera\backend
.venv\Scripts\activate
python -c "
import sys; sys.path.insert(0,'.')
from pipeline.bronze import run_bronze_layer
from pipeline.silver import run_silver_layer
from pipeline.gold import build_gold_layer
run_bronze_layer()
run_silver_layer()
build_gold_layer()
print('Pipeline complete')
"
```

OR use the UI — go to http://localhost:3000/pipeline and click **Run Full Pipeline**.

Expected output:
- Bronze: 9 tables ingested
- Silver: 9 tables cleaned
- Gold: fact_sales (53,416 rows), dim_customers, dim_products, dim_territories, fact_returns
- KPIs: Revenue $18.5M, Profit $7.8M, Margin 42.44%

---

## Step 5 — Frontend Setup

Open Terminal 3:

```
cd chimera\frontend2
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000

---

## Pages

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Executive Dashboard — KPIs, Revenue Trend, Category Pie, Regional Bar, Top Products, YoY |
| http://localhost:3000/dashboard | Deep Analytics — Customers, Returns, Segments, Products tabs |
| http://localhost:3000/chat | AI Analyst chatbot powered by Ollama phi3 |
| http://localhost:3000/pipeline | Medallion pipeline runner with live status |
| http://localhost:3000/query | DuckDB SQL editor with sample queries |

---

## Backend API Endpoints

| Endpoint | Description |
|----------|-------------|
| POST /api/pipeline/run | Run full Bronze→Silver→Gold pipeline |
| GET /api/pipeline/status | Check layer status |
| GET /api/analytics/kpis | Summary KPIs |
| GET /api/analytics/revenue-by-month | Monthly revenue/profit |
| GET /api/analytics/revenue-by-category | By product category |
| GET /api/analytics/revenue-by-region | By territory/region |
| GET /api/analytics/top-products?limit=10 | Top products |
| GET /api/analytics/top-customers?limit=10 | Top customers |
| GET /api/analytics/returns | Returns by region/category |
| GET /api/analytics/yoy | Year-over-year |
| GET /api/analytics/customer-segments | By occupation/education |
| GET /api/analytics/monthly-returns | Monthly return trend |
| POST /api/chat/message | AI chat (Ollama) |
| POST /api/query/execute | Run DuckDB SQL |
| GET /api/query/tables | List gold tables |

Full Swagger docs: http://localhost:8000/docs

---

## Data Architecture

```
datasets/                   <- Raw CSV files (9 files)
medallion/
  bronze/                   <- Raw Parquet (immutable, typed)
  silver/                   <- Cleaned, date-parsed, money-parsed, deduped
  gold/                     <- Semantic model
    fact_sales.parquet      <- 53,416 rows (2016+2017 union + product enrichment)
    fact_returns.parquet    <- 1,809 rows
    dim_customers.parquet   <- 18,148 rows
    dim_products.parquet    <- 293 rows (enriched with category/subcategory)
    dim_territories.parquet <- 10 rows
chimera.duckdb              <- Persistent DuckDB database
```

---

## Gold Layer KPIs (actual data)

| KPI | Value |
|-----|-------|
| Total Revenue | $18,509,649 |
| Total Profit | $7,856,157 |
| Total Cost | $10,653,518 |
| Profit Margin | 42.44% |
| Total Orders | 22,534 |
| Unique Customers | 17,238 |
| Avg Order Value | $346.52 |

---

## Troubleshooting

**Backend won't start:**
- Make sure venv is activated: `.venv\Scripts\activate`
- Check Python version: `python --version` (needs 3.10)

**AI chatbot not responding:**
- Make sure Ollama is running: `ollama serve`
- Check model exists: `ollama list` — should show `phi3:latest`
- Check: http://localhost:11434

**Frontend error "Backend not ready":**
- Run the pipeline first (Step 4 or /pipeline page)
- Make sure backend is running on port 8000

**DuckDB locked error:**
- Only one backend process should run at a time
- Close any other Python processes using chimera.duckdb

---

## Project Structure

```
chimera/
  backend/
    main.py                 FastAPI app entry point
    core/
      config.py             Settings and paths
      database.py           DuckDB connection
    pipeline/
      bronze.py             CSV -> Parquet ingestion
      silver.py             Cleaning, type casting
      gold.py               Semantic model + KPI build
    agents/
      ingestion_agent.py    Orchestrates full pipeline
      analytics_agent.py    All analytics queries
      llm_agent.py          Ollama LLM integration
    api/
      pipeline_router.py    Pipeline endpoints
      analytics_router.py   Analytics endpoints
      chat_router.py        Chat endpoints
      query_router.py       SQL query endpoints
    requirements.txt
    .env
  frontend2/
    app/
      page.tsx              Executive dashboard
      dashboard/page.tsx    Deep analytics
      chat/page.tsx         AI chatbot
      pipeline/page.tsx     Pipeline runner
      query/page.tsx        SQL editor
    components/
      layout/Sidebar.tsx
      ui/KPICard.tsx
    lib/api.ts              API client
  datasets/                 CSV source files
  medallion/                Generated by pipeline
  scripts/                  Windows .bat shortcuts
  chimera.duckdb            Generated by pipeline
  README.md
```

Commands to run
Terminal 1
cd E:\chimera_final\backend
.venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

Terminal 2
cd E:\chimera_final\frontend
npm run dev

Terminal 3
cd E:\chimera_final\backend
.venv\Scripts\activate
python -c "import sys; sys.path.insert(0,'.'); from pipeline.bronze import run_bronze_layer; from pipeline.silver import run_silver_layer; from pipeline.gold import build_gold_layer; run_bronze_layer(); run_silver_layer(); build_gold_layer(); print('Pipeline complete')"