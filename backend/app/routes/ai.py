from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.schemas.deviation import (
    AILogDeviationRequest,
    AIEditDeviationRequest,
    AILogDeviationResponse,
    AIEditDeviationResponse,
)
from app.services.ai_service import (
    run_log_deviation,
    run_edit_deviation,
    run_extract_document,
)
from app.services.document_parser import parse_uploaded_document

router = APIRouter(prefix="/api/ai", tags=["AI Intake"])

@router.post("/log-deviation", response_model=AILogDeviationResponse)
async def log_deviation_endpoint(request: AILogDeviationRequest):
    """
    TOOL 1: LOG DEVIATION
    Extracts structured deviation parameters and generates an initial GxP risk assessment
    from natural language narrative or pasted incident description.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deviation narrative or input text cannot be empty."
        )

    result = await run_log_deviation(
        text=request.text.strip(),
        current_deviation=request.current_deviation
    )
    return result

@router.post("/edit-deviation", response_model=AIEditDeviationResponse)
async def edit_deviation_endpoint(request: AIEditDeviationRequest):
    """
    TOOL 2: EDIT DEVIATION
    Modifies specific existing deviation fields using natural language conversation.
    Returns delta updates ONLY, preserving all other existing fields.
    """
    if not request.instruction or not request.instruction.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edit instruction cannot be empty."
        )

    result = await run_edit_deviation(
        instruction=request.instruction.strip(),
        current_deviation=request.current_deviation,
        current_assessment=request.current_assessment
    )
    return result

@router.post("/extract-document", response_model=AILogDeviationResponse)
async def extract_document_endpoint(file: UploadFile = File(...)):
    """
    TOOL 3: DOCUMENT EXTRACTION
    Receives an uploaded PDF or TXT deviation document, validates size & format,
    extracts the raw text, and runs the LangGraph extraction & assessment pipeline.
    """
    # Parse and validate file
    extracted_text = await parse_uploaded_document(file)

    if not extracted_text or not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract readable text from the uploaded document."
        )

    result = await run_extract_document(extracted_text)
    return result
