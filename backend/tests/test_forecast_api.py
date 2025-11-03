# backend/tests/test_forecast_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_forecast_api():
    res = client.get("/api/analytics/forecast?menu_id=all&days=7")
    assert res.status_code == 200
    data = res.json()
    assert "data" in data
    assert isinstance(data["data"], list)

def test_heatmap_api():
    res = client.get("/api/analytics/heatmap?menu_id=all&start=2025-10-01&end=2025-10-27")
    assert res.status_code == 200
    data = res.json()
    assert "data" in data
    assert all("dow" in c and "hour" in c for c in data["data"])