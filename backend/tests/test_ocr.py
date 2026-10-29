import base64
import io

import pymupdf
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont

from app.main import app
from app.ocr import run_ocr

client = TestClient(app)


def make_test_image_bytes(text: str = "HELLO WORLD") -> bytes:
    img = Image.new("RGB", (500, 150), color="white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32
        )
    except OSError:
        font = ImageFont.load_default()
    draw.text((15, 50), text, fill="black", font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_test_pdf_bytes(page_texts: list) -> bytes:
    """Builds a simple multi-page PDF with real (vector) text on each page,
    which get_pixmap() then rasterizes — same code path a scanned PDF from a
    user would go through."""
    doc = pymupdf.open()
    for text in page_texts:
        page = doc.new_page()
        page.insert_text((50, 100), text, fontsize=24)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


# --- Core OCR pipeline -------------------------------------------------

def test_run_ocr_txt():
    result = run_ocr(make_test_image_bytes("HELLO"), is_pdf=False, formats={"txt"})
    assert "HELLO" in result["text"].upper()
    assert result["hocr"] is None
    assert result["pdf_base64"] is None


def test_run_ocr_always_returns_metadata_even_if_not_requested_as_format():
    result = run_ocr(make_test_image_bytes("METADATA"), is_pdf=False, formats={"hocr"})
    # text field itself wasn't requested...
    assert result["text"] is None
    # ...but the metadata that depends on it was still computed
    assert result["confidence"] is not None
    assert result["detected_language"] is not None
    assert result["duration_ms"] >= 0
    assert result["page_count"] == 1


def test_run_ocr_hocr_contains_markup():
    result = run_ocr(make_test_image_bytes("HOCR TEST"), is_pdf=False, formats={"hocr"})
    assert "<html" in result["hocr"].lower()
    assert "ocr_page" in result["hocr"]


def test_run_ocr_pdf_output_is_valid():
    result = run_ocr(make_test_image_bytes("PDF TEST"), is_pdf=False, formats={"pdf"})
    decoded = base64.b64decode(result["pdf_base64"])
    assert decoded.startswith(b"%PDF")


def test_run_ocr_confidence_in_range():
    result = run_ocr(make_test_image_bytes("CONFIDENCE CHECK"), is_pdf=False, formats={"txt"})
    assert 0 <= result["confidence"] <= 100


def test_run_ocr_preprocess_toggle_both_work():
    with_pre = run_ocr(make_test_image_bytes("TOGGLE"), is_pdf=False, formats={"txt"}, do_preprocess=True)
    without_pre = run_ocr(make_test_image_bytes("TOGGLE"), is_pdf=False, formats={"txt"}, do_preprocess=False)
    assert "TOGGLE" in with_pre["text"].upper()
    assert "TOGGLE" in without_pre["text"].upper()


def test_run_ocr_rejects_bad_image():
    with pytest.raises(ValueError):
        run_ocr(b"not an image", is_pdf=False, formats={"txt"})


# --- PDF input -----------------------------------------------------------

def test_run_ocr_single_page_pdf():
    pdf_bytes = make_test_pdf_bytes(["SINGLE PAGE PDF"])
    result = run_ocr(pdf_bytes, is_pdf=True, formats={"txt"})
    assert result["page_count"] == 1
    assert "SINGLE PAGE PDF" in result["text"].upper()


def test_run_ocr_multi_page_pdf():
    pdf_bytes = make_test_pdf_bytes(["PAGE ONE CONTENT", "PAGE TWO CONTENT"])
    result = run_ocr(pdf_bytes, is_pdf=True, formats={"txt", "pdf"})
    assert result["page_count"] == 2
    assert "PAGE ONE CONTENT" in result["text"].upper()
    assert "PAGE TWO CONTENT" in result["text"].upper()
    # merged PDF should still be a single valid, readable multi-page file
    decoded = base64.b64decode(result["pdf_base64"])
    reader_page_count = len(pymupdf.open(stream=decoded, filetype="pdf"))
    assert reader_page_count == 2


def test_run_ocr_rejects_bad_pdf():
    with pytest.raises(ValueError):
        run_ocr(b"not a pdf", is_pdf=True, formats={"txt"})


# --- API endpoint ----------------------------------------------------------

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "version" in body
    assert "eng" in body["supported_languages"]


def test_scan_endpoint_defaults():
    image_bytes = make_test_image_bytes("API TEST")
    resp = client.post(
        "/api/scan",
        files={"file": ("scan.png", image_bytes, "image/png")},
        data={"formats": "txt"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "API TEST" in body["text"].upper()
    assert body["confidence"] is not None


def test_scan_endpoint_with_language_and_preprocess_params():
    image_bytes = make_test_image_bytes("LANG TEST")
    resp = client.post(
        "/api/scan",
        files={"file": ("scan.png", image_bytes, "image/png")},
        data={"formats": "txt", "lang": "eng", "preprocess": "false"},
    )
    assert resp.status_code == 200


def test_scan_endpoint_rejects_bad_language():
    image_bytes = make_test_image_bytes()
    resp = client.post(
        "/api/scan",
        files={"file": ("scan.png", image_bytes, "image/png")},
        data={"formats": "txt", "lang": "klingon"},
    )
    assert resp.status_code == 400


def test_scan_endpoint_rejects_bad_format():
    image_bytes = make_test_image_bytes()
    resp = client.post(
        "/api/scan",
        files={"file": ("scan.png", image_bytes, "image/png")},
        data={"formats": "docx"},
    )
    assert resp.status_code == 400


def test_scan_endpoint_rejects_bad_content_type():
    resp = client.post(
        "/api/scan",
        files={"file": ("scan.txt", b"hello", "text/plain")},
        data={"formats": "txt"},
    )
    assert resp.status_code == 400


def test_scan_endpoint_accepts_pdf():
    pdf_bytes = make_test_pdf_bytes(["PDF UPLOAD TEST"])
    resp = client.post(
        "/api/scan",
        files={"file": ("scan.pdf", pdf_bytes, "application/pdf")},
        data={"formats": "txt"},
    )
    assert resp.status_code == 200
    assert "PDF UPLOAD TEST" in resp.json()["text"].upper()