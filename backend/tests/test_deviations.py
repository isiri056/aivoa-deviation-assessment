import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

valid_payload = {
    "site_plant": "API Synthesis Facility - Plant 1",
    "date_of_occurrence": "2026-09-24",
    "title": "Drying temperature excursion during Paracetamol API synthesis",
    "source": "Production Operator",
    "product_material": "Paracetamol API",
    "batch_lot_number": "API-260924",
    "affected_quantity": "500 kg",
    "detailed_description": "During drying, temperature reached 82°C for 18 minutes exceeding validated limit of 70-75°C. Batch placed on hold.",
    "initial_impact": "High",
    "initial_severity": "Major",
    "severity_reason": "CPP exceeded validated limits during critical drying stage.",
    "recommended_action": "Quarantine batch API-260924; perform HPLC degradation testing."
}

def test_create_deviation_success():
    response = client.post("/api/deviations", json=valid_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["site_plant"] == valid_payload["site_plant"]
    assert data["batch_lot_number"] == valid_payload["batch_lot_number"]
    assert data["initial_impact"] == "High"
    assert data["initial_severity"] == "Major"

def test_create_deviation_missing_required_field():
    incomplete = valid_payload.copy()
    incomplete["site_plant"] = ""
    response = client.post("/api/deviations", json=incomplete)
    assert response.status_code == 400
    assert "Site / Plant is required" in response.json()["detail"]

def test_get_deviations():
    response = client.get("/api/deviations")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) > 0

def test_get_deviation_by_id():
    # First create
    res = client.post("/api/deviations", json=valid_payload)
    dev_id = res.json()["id"]

    # Fetch
    get_res = client.get(f"/api/deviations/{dev_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == dev_id

def test_get_nonexistent_deviation():
    response = client.get("/api/deviations/9999999")
    assert response.status_code == 404
