from typing import TypedDict, Optional, Dict, Any, List

class DeviationAgentState(TypedDict, total=False):
    input_text: str
    intent: str  # "log_deviation", "edit_deviation", "extract_document"
    current_deviation: Optional[Dict[str, Any]]
    current_assessment: Optional[Dict[str, Any]]
    extracted_fields: Optional[Dict[str, Any]]
    delta_updates: Optional[Dict[str, Any]]
    assessment: Optional[Dict[str, Any]]
    response_message: Optional[str]
    error: Optional[str]
