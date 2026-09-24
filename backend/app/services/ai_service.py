import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.agents.graph import deviation_graph
from app.config import settings

logger = logging.getLogger(__name__)

async def run_log_deviation(text: str, current_deviation: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute LangGraph workflow for logging a new deviation."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Groq API Key is not configured. Please set GROQ_API_KEY in backend/.env to enable live AI deviation extraction."
        )

    initial_state = {
        "input_text": text,
        "intent": "log_deviation",
        "current_deviation": current_deviation or {},
    }

    try:
        result = await deviation_graph.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"LangGraph execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"AI service encountered an error while communicating with Groq: {str(e)}"
        )

    if result.get("error"):
        raise HTTPException(
            status_code=500,
            detail=result["error"]
        )

    extracted = result.get("extracted_fields") or {}
    assessment = result.get("assessment") or {}
    message = result.get("response_message") or (
        f"Deviation extracted successfully: '{extracted.get('title', 'Manufacturing Incident')}'. "
        "I've populated the fields and generated an initial risk assessment."
    )

    return {
        "action": "log_deviation",
        "deviation": extracted,
        "assessment": assessment,
        "message": message,
    }

async def run_edit_deviation(
    instruction: str,
    current_deviation: Dict[str, Any],
    current_assessment: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Execute LangGraph workflow for modifying specific fields via conversation."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Groq API Key is not configured. Please set GROQ_API_KEY in backend/.env to enable live conversational editing."
        )

    initial_state = {
        "input_text": instruction,
        "intent": "edit_deviation",
        "current_deviation": current_deviation,
        "current_assessment": current_assessment or {},
    }

    try:
        result = await deviation_graph.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"LangGraph execution failed during edit: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"AI service encountered an error while communicating with Groq: {str(e)}"
        )

    if result.get("error"):
        raise HTTPException(
            status_code=500,
            detail=result["error"]
        )

    updates = result.get("delta_updates") or {}
    assessment = result.get("assessment") or current_assessment or {}
    message = result.get("response_message") or "Requested fields have been updated."

    return {
        "action": "edit_deviation",
        "updates": updates,
        "assessment": assessment,
        "message": message,
    }

async def run_extract_document(text: str) -> Dict[str, Any]:
    """Execute LangGraph workflow for document text extraction."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Groq API Key is not configured. Please set GROQ_API_KEY in backend/.env to enable document extraction."
        )

    initial_state = {
        "input_text": text,
        "intent": "extract_document",
        "current_deviation": {},
    }

    try:
        result = await deviation_graph.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"LangGraph execution failed during document extraction: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"AI service encountered an error while communicating with Groq: {str(e)}"
        )

    if result.get("error"):
        raise HTTPException(
            status_code=500,
            detail=result["error"]
        )

    extracted = result.get("extracted_fields") or {}
    assessment = result.get("assessment") or {}
    message = result.get("response_message") or (
        f"Document processed successfully. Extracted deviation '{extracted.get('title', 'Deviation Report')}' "
        "and generated initial GxP impact and severity recommendations."
    )

    return {
        "action": "log_deviation",
        "deviation": extracted,
        "assessment": assessment,
        "message": message,
    }
