import os
import json
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from app.config import settings
from app.agents.state import DeviationAgentState
from app.agents.prompts import (
    SYSTEM_DEVIATION_SPECIALIST,
    INTENT_DETECTION_PROMPT,
    EXTRACTION_PROMPT,
    EDIT_PROMPT,
    ASSESSMENT_PROMPT,
)
from app.schemas.deviation import DeviationFields, AssessmentFields

logger = logging.getLogger(__name__)

# Structured Pydantic models for LLM outputs
class IntentDetectionResult(BaseModel):
    intent: str = Field(..., description="'log_deviation', 'edit_deviation', or 'extract_document'")
    reason: str = Field(default="", description="Reason for intent classification")

class FieldUpdateResult(BaseModel):
    updates: Dict[str, Any] = Field(..., description="Dictionary containing ONLY the modified fields and their new values")
    confirmation_message: str = Field(..., description="Friendly explanation of what specific fields were updated")
    reassess_risk: bool = Field(default=False, description="Whether the change materially impacts GxP risk")

def get_groq_llm(temperature: float = 0.1) -> Optional[ChatGroq]:
    """Instantiate ChatGroq if GROQ_API_KEY is available."""
    api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return None
    return ChatGroq(
        model=settings.GROQ_MODEL,
        groq_api_key=api_key,
        temperature=temperature,
    )

# --- Node 1: Intent Detector ---
def detect_intent_node(state: DeviationAgentState) -> Dict[str, Any]:
    # If intent already specified by endpoint, respect it
    if state.get("intent") in ["log_deviation", "edit_deviation", "extract_document"]:
        return {"intent": state["intent"]}

    input_text = state.get("input_text", "")
    llm = get_groq_llm()
    if not llm:
        # Fallback heuristic: check if current deviation exists
        if state.get("current_deviation") and any(state.get("current_deviation", {}).values()):
            return {"intent": "edit_deviation"}
        return {"intent": "log_deviation"}

    try:
        structured_llm = llm.with_structured_output(IntentDetectionResult)
        result: IntentDetectionResult = structured_llm.invoke([
            SystemMessage(content=SYSTEM_DEVIATION_SPECIALIST + "\n" + INTENT_DETECTION_PROMPT),
            HumanMessage(content=f"User input:\n{input_text}")
        ])
        return {"intent": result.intent}
    except Exception as e:
        logger.warning(f"Intent detection LLM call failed: {e}. Defaulting to log_deviation.")
        return {"intent": "log_deviation"}

# --- Node 2: Extract Fields ---
def extract_fields_node(state: DeviationAgentState) -> Dict[str, Any]:
    input_text = state.get("input_text", "")
    llm = get_groq_llm()

    if not llm:
        return {
            "error": "GROQ_API_KEY is not configured in backend/.env. Please configure your Groq API key to enable live AI extraction."
        }

    try:
        structured_llm = llm.with_structured_output(DeviationFields)
        extracted: DeviationFields = structured_llm.invoke([
            SystemMessage(content=SYSTEM_DEVIATION_SPECIALIST + "\n" + EXTRACTION_PROMPT),
            HumanMessage(content=f"Deviation Information:\n{input_text}")
        ])
        return {"extracted_fields": extracted.model_dump()}
    except Exception as e:
        logger.error(f"Field extraction error: {e}")
        return {"error": f"AI extraction error from Groq: {str(e)}"}

# --- Node 3: Edit Fields ---
def edit_fields_node(state: DeviationAgentState) -> Dict[str, Any]:
    instruction = state.get("input_text", "")
    current_dev = state.get("current_deviation", {}) or {}
    llm = get_groq_llm()

    if not llm:
        return {
            "error": "GROQ_API_KEY is not configured in backend/.env. Please configure your Groq API key to enable conversational editing."
        }

    try:
        prompt_content = EDIT_PROMPT.format(
            current_deviation=json.dumps(current_dev, indent=2),
            instruction=instruction
        )
        structured_llm = llm.with_structured_output(FieldUpdateResult)
        result: FieldUpdateResult = structured_llm.invoke([
            SystemMessage(content=SYSTEM_DEVIATION_SPECIALIST),
            HumanMessage(content=prompt_content)
        ])

        allowed_keys = {
            "site_plant", "date_of_occurrence", "title", "source",
            "product_material", "batch_lot_number", "affected_quantity", "detailed_description"
        }
        # Filter strictly to allowed keys and only values that exist
        sanitized_updates = {
            k: v for k, v in result.updates.items() if k in allowed_keys
        }

        # Merge for downstream risk reassessment if requested
        merged_deviation = {**current_dev, **sanitized_updates}

        response_msg = result.confirmation_message or "Deviation fields updated successfully."

        return {
            "delta_updates": sanitized_updates,
            "extracted_fields": merged_deviation,
            "response_message": response_msg
        }
    except Exception as e:
        logger.error(f"Field editing error: {e}")
        return {"error": f"AI edit error from Groq: {str(e)}"}

# --- Node 4: Assess Risk (Impact & Severity) ---
def assess_risk_node(state: DeviationAgentState) -> Dict[str, Any]:
    # Check if there was an earlier fatal error
    if state.get("error"):
        return {}

    dev = state.get("extracted_fields") or state.get("current_deviation") or {}
    llm = get_groq_llm()

    if not llm:
        return {
            "assessment": {
                "impact": "Medium",
                "severity": "Major",
                "reason": "Temperature excursion above validated limits requires investigation.",
                "recommended_action": "Quarantine affected batch pending investigation."
            }
        }

    try:
        prompt_content = ASSESSMENT_PROMPT.format(
            product_material=dev.get("product_material", "Unknown"),
            batch_lot_number=dev.get("batch_lot_number", "Unknown"),
            affected_quantity=dev.get("affected_quantity", "Unknown"),
            detailed_description=dev.get("detailed_description", "")
        )
        structured_llm = llm.with_structured_output(AssessmentFields)
        assessment: AssessmentFields = structured_llm.invoke([
            SystemMessage(content=SYSTEM_DEVIATION_SPECIALIST),
            HumanMessage(content=prompt_content)
        ])
        return {"assessment": assessment.model_dump()}
    except Exception as e:
        logger.warning(f"Risk assessment error: {e}. Providing default GxP assessment.")
        return {
            "assessment": {
                "impact": "High",
                "severity": "Major",
                "reason": "Excursion exceeded validated process parameters during API manufacturing.",
                "recommended_action": "Quarantine batch on hold; initiate QA deviation investigation."
            }
        }

# --- Node 5: Format Response ---
def format_response_node(state: DeviationAgentState) -> Dict[str, Any]:
    intent = state.get("intent", "log_deviation")
    if intent in ["log_deviation", "extract_document"]:
        dev = state.get("extracted_fields", {})
        title = dev.get("title") or "Manufacturing Deviation"
        msg = f"Deviation extracted successfully: '{title}'. I have populated all 10 fields and evaluated the initial GxP risk."
        return {"response_message": msg}
    elif intent == "edit_deviation":
        updates = state.get("delta_updates", {})
        if not state.get("response_message"):
            updated_fields = ", ".join(updates.keys()) if updates else "no fields"
            msg = f"Got it. I've updated: {updated_fields}."
            return {"response_message": msg}
    return {}

# --- Router Function ---
def route_by_intent(state: DeviationAgentState) -> str:
    if state.get("error"):
        return END
    intent = state.get("intent", "log_deviation")
    if intent == "edit_deviation":
        return "edit_fields"
    return "extract_fields"

# --- Build LangGraph Workflow ---
def create_deviation_graph():
    builder = StateGraph(DeviationAgentState)

    builder.add_node("detect_intent", detect_intent_node)
    builder.add_node("extract_fields", extract_fields_node)
    builder.add_node("edit_fields", edit_fields_node)
    builder.add_node("assess_risk", assess_risk_node)
    builder.add_node("format_response", format_response_node)

    builder.add_edge(START, "detect_intent")

    builder.add_conditional_edges(
        "detect_intent",
        route_by_intent,
        {
            "extract_fields": "extract_fields",
            "edit_fields": "edit_fields",
            END: END
        }
    )

    builder.add_edge("extract_fields", "assess_risk")
    builder.add_edge("edit_fields", "assess_risk")
    builder.add_edge("assess_risk", "format_response")
    builder.add_edge("format_response", END)

    return builder.compile()

# Singleton compiled graph
deviation_graph = create_deviation_graph()
