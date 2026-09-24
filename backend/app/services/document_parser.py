import io
from fastapi import UploadFile, HTTPException
import pypdf

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".txt"}

def validate_file(filename: str, file_size: int) -> None:
    """Validate file extension and size."""
    if not filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    import os
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats are: PDF, TXT."
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 10MB ({file_size / (1024*1024):.1f}MB detected)."
        )

def extract_text_from_pdf(content: bytes) -> str:
    """Extract readable text from PDF bytes using pypdf."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(content))
        if len(reader.pages) == 0:
            raise ValueError("The uploaded PDF has 0 pages.")

        extracted_text = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_text.append(f"--- Page {idx + 1} ---\n{page_text.strip()}")

        full_text = "\n\n".join(extracted_text).strip()
        if not full_text:
            raise ValueError("No extractable text found in the PDF. The document may be scanned or empty.")
        return full_text
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from PDF: {str(e)}"
        )

def extract_text_from_txt(content: bytes) -> str:
    """Extract string from text file bytes."""
    for encoding in ["utf-8", "latin-1", "cp1252"]:
        try:
            text = content.decode(encoding).strip()
            if text:
                return text
        except UnicodeDecodeError:
            continue
    raise HTTPException(status_code=400, detail="Unable to decode text file. Ensure it is encoded in UTF-8.")

async def parse_uploaded_document(file: UploadFile) -> str:
    """
    Validate and extract text from uploaded PDF or TXT file.
    """
    content = await file.read()
    file_size = len(content)

    validate_file(file.filename or "", file_size)

    import os
    _, ext = os.path.splitext((file.filename or "").lower())

    if ext == ".pdf":
        return extract_text_from_pdf(content)
    elif ext == ".txt":
        return extract_text_from_txt(content)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'.")
