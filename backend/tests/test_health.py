from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "BULK SHARE"
    assert data["demo_mode"] is True
    assert "timestamp" in data


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "BULK SHARE"
    assert "Welcome to BULK SHARE API" in data["message"]
