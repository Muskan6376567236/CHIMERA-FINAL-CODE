from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import shutil
from pathlib import Path
from loguru import logger
from core.config import DATASETS_DIR, BRONZE_DIR, SILVER_DIR, GOLD_DIR

router = APIRouter(prefix="/api/upload", tags=["upload"])

def _clear_layer(directory: Path):
    if directory.exists():
        shutil.rmtree(directory)
    directory.mkdir(parents=True, exist_ok=True)

@router.post("/csv")
async def upload_csvs(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    for f in files:
        if not f.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail=f"Only CSV files accepted. Got: {f.filename}")
    if DATASETS_DIR.exists():
        for old_csv in DATASETS_DIR.glob("*.csv"):
            old_csv.unlink()
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    _clear_layer(BRONZE_DIR)
    _clear_layer(SILVER_DIR)
    _clear_layer(GOLD_DIR)
    saved = []
    for upload in files:
        dest = DATASETS_DIR / upload.filename
        with open(dest, "wb") as out:
            content = await upload.read()
            out.write(content)
        size_kb = round(len(content) / 1024, 1)
        saved.append({"filename": upload.filename, "size_kb": size_kb})
        logger.info(f"[UPLOAD] Saved {upload.filename} ({size_kb} KB)")
    return {
        "status": "uploaded",
        "files": saved,
        "message": f"{len(saved)} CSV files saved. Now run the pipeline."
    }

@router.get("/files")
def list_uploaded_files():
    files = []
    for csv in sorted(DATASETS_DIR.glob("*.csv")):
        stat = csv.stat()
        files.append({"filename": csv.name, "size_kb": round(stat.st_size / 1024, 1)})
    return {"files": files, "count": len(files)}

@router.delete("/clear")
def clear_datasets():
    removed = []
    for csv in DATASETS_DIR.glob("*.csv"):
        removed.append(csv.name)
        csv.unlink()
    _clear_layer(BRONZE_DIR)
    _clear_layer(SILVER_DIR)
    _clear_layer(GOLD_DIR)
    return {"status": "cleared", "removed": removed}