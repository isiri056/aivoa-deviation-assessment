import pytest
from pathlib import Path
from fastapi import HTTPException, UploadFile
import io
from app.services.document_parser import (
    validate_file,
    extract_text_from_pdf,
    extract_text_from_txt,
    parse_uploaded_document,
)

def test_validate_file_valid_extensions():
    # Should not raise exception
    validate_file("deviation.pdf", 1024)
    validate_file("REPORT.TXT", 2048)

def test_validate_file_invalid_extension():
    with pytest.raises(HTTPException) as exc_info:
        validate_file("deviation.exe", 1024)
    assert exc_info.value.status_code == 400
    assert "Unsupported file format" in exc_info.value.detail

def test_validate_file_oversized():
    with pytest.raises(HTTPException) as exc_info:
        validate_file("big.pdf", 15 * 1024 * 1024)
    assert exc_info.value.status_code == 400
    assert "exceeds maximum allowed size" in exc_info.value.detail

def test_extract_sample_pdf():
    sample_pdf_path = Path(__file__).resolve().parent.parent.parent / "sample-data" / "sample_deviation.pdf"
    assert sample_pdf_path.exists()
    content = sample_pdf_path.read_bytes()
    text = extract_text_from_pdf(content)
    assert "Paracetamol API" in text
    assert "API-260924" in text
    assert "82 C" in text or "82" in text

def test_extract_txt():
    content = b"Site: Plant 1\nBatch: API-123\nTemp: 80C"
    text = extract_text_from_txt(content)
    assert "Site: Plant 1" in text
    assert "Batch: API-123" in text
