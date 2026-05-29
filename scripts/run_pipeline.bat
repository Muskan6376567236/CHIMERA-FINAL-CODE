@echo off
echo Running CHIMERA Medallion Pipeline...
cd /d "%~dp0..\backend"
call .venv\Scripts\activate.bat
python -c "
import sys
sys.path.insert(0, '.')
from pipeline.bronze import run_bronze_layer
from pipeline.silver import run_silver_layer
from pipeline.gold import build_gold_layer
print('=== BRONZE ===')
b = run_bronze_layer()
print(f'Bronze: {len(b)} tables')
print('=== SILVER ===')
s = run_silver_layer()
print(f'Silver: {len(s)} tables')
print('=== GOLD ===')
g = build_gold_layer()
print(f'Gold KPIs: {g[\"kpis\"]}')
print('Pipeline complete!')
"
pause
