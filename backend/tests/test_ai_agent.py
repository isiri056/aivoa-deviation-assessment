import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.deviation import DeviationFields, AssessmentFields
from app.agents.graph import FieldUpdateResult

client = TestClient(app)

def test_ai_log_empty_text():
    response = client.post("/api/ai/log-deviation", json={"text": ""})
    assert response.status_code == 400

def test_ai_edit_empty_instruction():
    response = client.post("/api/ai/edit-deviation", json={
        "instruction": "",
        "current_deviation": {"batch_lot_number": "API-1"}
    })
    assert response.status_code == 400

def test_ai_missing_groq_key_graceful_error():
    with patch("app.services.ai_service.settings.GROQ_API_KEY", ""):
        response = client.post("/api/ai/log-deviation", json={"text": "Temperature excursion in batch 1"})
        assert response.status_code == 503
        assert "Groq API Key is not configured" in response.json()["detail"]

def test_ai_edit_delta_preservation():
    """Verify that an edit operation returns ONLY changed fields and preserves existing data."""
    mock_field_update = FieldUpdateResult(
        updates={"batch_lot_number": "API-260925", "affected_quantity": "50 kg"},
        confirmation_message="Updated batch number to API-260925 and affected quantity to 50 kg.",
        reassess_risk=False
    )

    current_dev = {
        "site_plant": "Plant 1",
        "date_of_occurrence": "2026-09-24",
        "title": "Drying excursion",
        "source": "Operator",
        "product_material": "Paracetamol API",
        "batch_lot_number": "API-260924",
        "affected_quantity": "500 kg",
        "detailed_description": "Excursion during drying."
    }

    with patch("app.services.ai_service.settings.GROQ_API_KEY", "mock-groq-key"):
        with patch("app.agents.graph.get_groq_llm") as mock_get_llm:
            mock_llm = MagicMock()
            mock_structured = MagicMock()
            mock_structured.invoke.return_value = mock_field_update
            mock_llm.with_structured_output.return_value = mock_structured
            mock_get_llm.return_value = mock_llm

            response = client.post("/api/ai/edit-deviation", json={
                "instruction": "Sorry, the batch number is API-260925 and the affected quantity is 50 kg.",
                "current_deviation": current_dev
            })

            assert response.status_code == 200
            data = response.json()
            assert data["action"] == "edit_deviation"
            assert data["updates"] == {
                "batch_lot_number": "API-260925",
                "affected_quantity": "50 kg"
            }
            # Unchanged fields are NOT in updates dict
            assert "site_plant" not in data["updates"]
            assert "detailed_description" not in data["updates"]
            assert "Updated batch number" in data["message"]
