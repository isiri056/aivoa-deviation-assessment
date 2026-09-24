from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    site_plant = Column(String(255), nullable=False)
    date_of_occurrence = Column(String(50), nullable=False)
    title = Column(String(500), nullable=False)
    source = Column(String(255), nullable=False)
    product_material = Column(String(255), nullable=True)
    batch_lot_number = Column(String(100), nullable=True)
    affected_quantity = Column(String(100), nullable=True)
    detailed_description = Column(Text, nullable=False)
    initial_impact = Column(String(50), nullable=False)  # High, Medium, Low
    initial_severity = Column(String(50), nullable=False) # Critical, Major, Minor
    severity_reason = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "site_plant": self.site_plant,
            "date_of_occurrence": self.date_of_occurrence,
            "title": self.title,
            "source": self.source,
            "product_material": self.product_material,
            "batch_lot_number": self.batch_lot_number,
            "affected_quantity": self.affected_quantity,
            "detailed_description": self.detailed_description,
            "initial_impact": self.initial_impact,
            "initial_severity": self.initial_severity,
            "severity_reason": self.severity_reason,
            "recommended_action": self.recommended_action,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
