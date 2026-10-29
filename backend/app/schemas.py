from typing import Optional

from pydantic import BaseModel


class ScanResult(BaseModel):
    """Response returned by POST /api/scan.

    text/hocr/pdf_base64 are only filled in for the formats that were
    actually requested — the rest stay None. confidence, detected_language,
    duration_ms, and page_count are always populated.
    """

    filename: str
    text: Optional[str] = None
    hocr: Optional[str] = None
    pdf_base64: Optional[str] = None
    confidence: Optional[float] = None
    detected_language: Optional[str] = None
    duration_ms: int
    page_count: int


class HealthResponse(BaseModel):
    status: str
    version: str
    supported_languages: dict


class ErrorResponse(BaseModel):
    detail: str