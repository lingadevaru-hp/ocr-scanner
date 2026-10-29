"""App-wide settings. Values can be overridden via environment variables
(see .env.example) — none are hardcoded secrets, so committing this file is fine.
"""
import os

APP_VERSION = "1.1.0"

# Formats the /api/scan endpoint knows how to produce
ALLOWED_FORMATS = {"txt", "hocr", "pdf"}

# Content-Types accepted for the uploaded file — images plus PDF (each PDF
# page is rendered to an image and OCR'd individually, see app/ocr.py)
ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "application/pdf",
}

# Tesseract language codes this deployment has language data installed for.
# Adding a language here requires installing its tessdata too — see the
# Dockerfile (or, for local Windows/Mac dev, your Tesseract install's docs).
SUPPORTED_LANGUAGES = {
    "eng": "English",
    "hin": "Hindi",
    "fra": "French",
    "deu": "German",
    "spa": "Spanish",
}
DEFAULT_LANGUAGE = "eng"

# Reject uploads larger than this to avoid tying up the OCR pipeline
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "15"))

# Frontend origins allowed to call this API (comma-separated in the env var)
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://ai-ocr-scannerr.netlify.app/",
).split(",")