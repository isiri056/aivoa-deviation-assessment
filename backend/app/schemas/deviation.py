from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class DeviationFields(BaseModel):
    site_plant: Optional[str] = Field(default="", description="Manufacturing site or plant name")
    date_of_occurrence: Optional[str] = Field(default="", description="Date when deviation occurred (YYYY-MM-DD format if known)")
    title: Optional[str] = Field(default="", description="Short concise summary or title of the deviation")
    source: Optional[str] = Field(default="", description="Source of detection e.g. Production Operator, In-process Control, QC Lab, Automated Sensor")
    product_material: Optional[str] = Field(default="", description="Related product or material name e.g. Paracetamol API")
    batch_lot_number: Optional[str] = Field(default="", description="Batch or Lot number e.g. API-260924")
    affected_quantity: Optional[str] = Field(default="", description="Affected quantity or batch size e.g. 100 kg, 500 L")
    detailed_description: Optional[str] = Field(default="", description="Comprehensive technical narrative of the deviation event")

class AssessmentFields(BaseModel):
    impact: str = Field(default="Medium", description="Initial GxP Impact: High, Medium, or Low")
    severity: str = Field(default="Major", description="Initial Severity: Critical, Major, or Minor")
    reason: str = Field(default="", description="Technical rationale for the severity and impact classification")
    recommended_action: str = Field(default="", description="Recommended immediate containment, QA notification, or CAPA next action")

class DeviationCreate(BaseModel):
    site_plant: str
    date_of_occurrence: str
    title: str
    source: str
    product_material: Optional[str] = ""
    batch_lot_number: Optional[str] = ""
    affected_quantity: Optional[str] = ""
    detailed_description: str
    initial_impact: str
    initial_severity: str
    severity_reason: Optional[str] = ""
    recommended_action: Optional[str] = ""

class DeviationResponse(BaseModel):
    id: int
    site_plant: str
    date_of_occurrence: str
    title: str
    source: str
    product_material: Optional[str] = None
    batch_lot_number: Optional[str] = None
    affected_quantity: Optional[str] = None
    detailed_description: str
    initial_impact: str
    initial_severity: str
    severity_reason: Optional[str] = None
    recommended_action: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AILogDeviationRequest(BaseModel):
    text: str = Field(..., description="Pasted narrative or natural language deviation statement")
    current_deviation: Optional[Dict[str, Any]] = None

class AIEditDeviationRequest(BaseModel):
    instruction: str = Field(..., description="Natural language modification instruction from the user")
    current_deviation: Dict[str, Any] = Field(..., description="Current state of deviation form fields")
    current_assessment: Optional[Dict[str, Any]] = None

class AILogDeviationResponse(BaseModel):
    action: Literal["log_deviation"] = "log_deviation"
    deviation: Dict[str, Any]
    assessment: Dict[str, Any]
    message: str

class AIEditDeviationResponse(BaseModel):
    action: Literal["edit_deviation"] = "edit_deviation"
    updates: Dict[str, Any]
    assessment: Optional[Dict[str, Any]] = None
    message: str

class APIErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
