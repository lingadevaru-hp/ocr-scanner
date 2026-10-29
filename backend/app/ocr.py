"""Image/PDF preprocessing + OCR.

Handles both single images and multi-page PDFs (each PDF page is rendered to
an image, then goes through the same pipeline as a direct image upload).
"""
import base64
import io
import re
import time
from typing import Iterable, Optional

import cv2
import numpy as np
import pymupdf
import pytesseract
from langdetect import LangDetectException, detect
from pypdf import PdfReader, PdfWriter

PDF_RENDER_DPI = 250


def preprocess(img: np.ndarray) -> np.ndarray:
    """Clean the image up before OCR. This step moves accuracy more than
    which OCR engine you pick."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 else img
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    # Adaptive threshold handles uneven lighting/scan shadows better than a
    # single global threshold would.
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 2,
    )
    return thresh


def _decode_image_bytes(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image — is it a valid image file?")
    return img


def _pdf_to_images(pdf_bytes: bytes) -> list:
    """Render each page of a PDF to a BGR image array (same shape cv2 would
    give us from a photo), so the rest of the pipeline can't tell the
    difference between a scanned PDF page and an uploaded photo."""
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except pymupdf.FileDataError as e:
        raise ValueError(f"Could not read PDF — is it valid? ({e})")

    zoom = PDF_RENDER_DPI / 72  # PDF units are 72 points per inch
    matrix = pymupdf.Matrix(zoom, zoom)
    images = []
    for page in doc:
        pix = page.get_pixmap(matrix=matrix)
        arr = np.frombuffer(pix.tobytes("png"), dtype=np.uint8)
        images.append(cv2.imdecode(arr, cv2.IMREAD_COLOR))
    doc.close()

    if not images:
        raise ValueError("PDF has no pages")
    return images


def _average_confidence(ocr_input: np.ndarray, lang: str) -> Optional[float]:
    """Tesseract's per-word confidence, averaged across words it actually
    found text in (it reports -1 for regions it skipped, e.g. blank space)."""
    data = pytesseract.image_to_data(
        ocr_input, lang=lang, output_type=pytesseract.Output.DICT
    )
    scores = [float(c) for c in data.get("conf", []) if float(c) >= 0]
    if not scores:
        return None
    return round(sum(scores) / len(scores), 1)


def _detect_language(text: str) -> str:
    """Identifies what language the *recognized text* reads as — independent
    of which Tesseract language model was used to read it. Short/empty text
    isn't reliable enough to call, hence the length guard."""
    stripped = text.strip()
    if len(stripped) < 3:
        return "unknown"
    try:
        return detect(stripped)
    except LangDetectException:
        return "unknown"


def _merge_hocr_pages(hocr_docs: list) -> str:
    """Combine each page's standalone hOCR document into one multi-page
    document, the way a real multi-page hOCR file is structured."""
    if len(hocr_docs) == 1:
        return hocr_docs[0]

    head, _, _ = hocr_docs[0].partition("<body>")
    body_parts = []
    for i, doc in enumerate(hocr_docs, start=1):
        _, _, rest = doc.partition("<body>")
        body, _, _ = rest.partition("</body>")
        # Each page was OCR'd independently, so they all say id='page_1' —
        # renumber so IDs stay unique once merged into one document.
        body = re.sub(r"(id=['\"])page_1(['\"])", rf"\g<1>page_{i}\g<2>", body)
        body_parts.append(body)

    return f"{head}<body>\n{''.join(body_parts)}</body>\n</html>\n"


def _merge_pdf_pages(pdf_byte_chunks: list) -> bytes:
    """Combine each page's single-page searchable PDF into one multi-page
    PDF, in order."""
    if len(pdf_byte_chunks) == 1:
        return pdf_byte_chunks[0]

    writer = PdfWriter()
    for chunk in pdf_byte_chunks:
        for page in PdfReader(io.BytesIO(chunk)).pages:
            writer.add_page(page)
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def run_ocr(
    file_bytes: bytes,
    is_pdf: bool,
    formats: Iterable[str],
    lang: str = "eng",
    do_preprocess: bool = True,
) -> dict:
    """Run OCR on an image or (possibly multi-page) PDF.

    `text`, `confidence`, `detected_language`, `duration_ms`, and
    `page_count` are always computed (the results view and processing-info
    card need them regardless of which download formats were picked).
    `hocr` and `pdf_base64` are only computed when requested, since each is
    an extra full OCR pass.
    """
    formats = set(formats)
    start = time.perf_counter()

    pages = _pdf_to_images(file_bytes) if is_pdf else [_decode_image_bytes(file_bytes)]

    texts, confidences, hocr_pages, pdf_pages = [], [], [], []

    for page_img in pages:
        ocr_input = preprocess(page_img) if do_preprocess else page_img

        texts.append(pytesseract.image_to_string(ocr_input, lang=lang))

        conf = _average_confidence(ocr_input, lang)
        if conf is not None:
            confidences.append(conf)

        if "hocr" in formats:
            hocr_bytes = pytesseract.image_to_pdf_or_hocr(ocr_input, lang=lang, extension="hocr")
            hocr_pages.append(hocr_bytes.decode("utf-8"))

        if "pdf" in formats:
            pdf_pages.append(
                pytesseract.image_to_pdf_or_hocr(ocr_input, lang=lang, extension="pdf")
            )

    full_text = "\n\n--- Page Break ---\n\n".join(t.strip() for t in texts).strip()

    result: dict = {
        "confidence": round(sum(confidences) / len(confidences), 1) if confidences else None,
        "detected_language": _detect_language(full_text),
        "page_count": len(pages),
        "duration_ms": None,  # filled in below, after all processing is done
    }

    if "txt" in formats:
        result["text"] = full_text
    if "hocr" in formats:
        result["hocr"] = _merge_hocr_pages(hocr_pages)
    if "pdf" in formats:
        result["pdf_base64"] = base64.b64encode(_merge_pdf_pages(pdf_pages)).decode("ascii")

    result["duration_ms"] = int((time.perf_counter() - start) * 1000)
    return result