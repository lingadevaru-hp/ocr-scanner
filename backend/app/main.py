from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import subprocess

from app.config import (
    ALLOWED_CONTENT_TYPES,
    ALLOWED_FORMATS,
    APP_VERSION,
    CORS_ORIGINS,
    DEFAULT_LANGUAGE,
    MAX_UPLOAD_SIZE_MB,
    SUPPORTED_LANGUAGES,
)
from app.ocr import run_ocr
from app.schemas import HealthResponse, ScanResult

app = FastAPI(title="OCR Scanner API", version=APP_VERSION)
print(subprocess.run(["tesseract", "--version"], capture_output=True, text=True).stdout)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        supported_languages=SUPPORTED_LANGUAGES,
    )


@app.post("/api/scan", response_model=ScanResult)
async def scan_image(
    file: UploadFile = File(..., description="Image or PDF to scan"),
    formats: str = Form("txt,hocr,pdf", description="Comma-separated: txt,hocr,pdf"),
    lang: str = Form(DEFAULT_LANGUAGE, description="Tesseract language code"),
    preprocess: bool = Form(True, description="Apply denoise/threshold before OCR"),
):
    requested = {f.strip().lower() for f in formats.split(",") if f.strip()}
    if not requested:
        raise HTTPException(status_code=400, detail="No output format requested")

    invalid = requested - ALLOWED_FORMATS
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format(s): {', '.join(sorted(invalid))}. "
                   f"Allowed: {', '.join(sorted(ALLOWED_FORMATS))}",
        )

    if lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {lang}. "
                   f"Allowed: {', '.join(sorted(SUPPORTED_LANGUAGES))}",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}",
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_UPLOAD_SIZE_MB}MB limit",
        )

    is_pdf = file.content_type == "application/pdf"

    try:
        output = run_ocr(contents, is_pdf, requested, lang=lang, do_preprocess=preprocess)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {e}")

    return ScanResult(filename=file.filename or "scan", **output)