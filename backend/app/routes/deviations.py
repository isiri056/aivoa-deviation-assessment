from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.deviation import Deviation
from app.schemas.deviation import DeviationCreate, DeviationResponse

router = APIRouter(prefix="/api/deviations", tags=["Deviations"])

@router.post("", response_model=DeviationResponse, status_code=status.HTTP_201_CREATED)
def create_deviation(payload: DeviationCreate, db: Session = Depends(get_db)):
    """Save a verified deviation into the database."""
    # Validation of required fields
    if not payload.site_plant or not payload.site_plant.strip():
        raise HTTPException(status_code=400, detail="Site / Plant is required.")
    if not payload.date_of_occurrence or not payload.date_of_occurrence.strip():
        raise HTTPException(status_code=400, detail="Date of Occurrence is required.")
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title / Short Description is required.")
    if not payload.source or not payload.source.strip():
        raise HTTPException(status_code=400, detail="Source is required.")
    if not payload.detailed_description or not payload.detailed_description.strip():
        raise HTTPException(status_code=400, detail="Detailed Description is required.")
    if not payload.initial_impact or not payload.initial_impact.strip():
        raise HTTPException(status_code=400, detail="Initial Impact is required.")
    if not payload.initial_severity or not payload.initial_severity.strip():
        raise HTTPException(status_code=400, detail="Initial Severity is required.")

    deviation = Deviation(
        site_plant=payload.site_plant.strip(),
        date_of_occurrence=payload.date_of_occurrence.strip(),
        title=payload.title.strip(),
        source=payload.source.strip(),
        product_material=(payload.product_material or "").strip(),
        batch_lot_number=(payload.batch_lot_number or "").strip(),
        affected_quantity=(payload.affected_quantity or "").strip(),
        detailed_description=payload.detailed_description.strip(),
        initial_impact=payload.initial_impact.strip(),
        initial_severity=payload.initial_severity.strip(),
        severity_reason=(payload.severity_reason or "").strip(),
        recommended_action=(payload.recommended_action or "").strip(),
    )

    db.add(deviation)
    db.commit()
    db.refresh(deviation)
    return deviation.to_dict()

@router.get("", response_model=List[DeviationResponse])
def get_deviations(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve list of saved deviations ordered by creation date descending."""
    deviations = db.query(Deviation).order_by(Deviation.created_at.desc()).offset(skip).limit(limit).all()
    return [d.to_dict() for d in deviations]

@router.get("/{deviation_id}", response_model=DeviationResponse)
def get_deviation(deviation_id: int, db: Session = Depends(get_db)):
    """Retrieve a single deviation by ID."""
    deviation = db.query(Deviation).filter(Deviation.id == deviation_id).first()
    if not deviation:
        raise HTTPException(
            status_code=404,
            detail=f"Deviation with ID {deviation_id} not found."
        )
    return deviation.to_dict()
