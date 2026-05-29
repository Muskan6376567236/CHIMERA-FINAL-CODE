@echo off
echo Starting CHIMERA Backend...
cd /d "%~dp0..\backend"
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
echo Installing dependencies...
pip install -r requirements.txt -q
echo Starting FastAPI server on http://localhost:8000
uvicorn main:app --reload --host 0.0.0.0 --port 8000
