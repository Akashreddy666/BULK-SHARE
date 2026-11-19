from fastapi.testclient import TestClient


def test_get_users_me_unauthorized(client: TestClient):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert "Missing or invalid authentication token" in response.json()["detail"]


def test_get_users_me_authorized(client: TestClient, customer_auth_headers: dict):
    response = client.get("/api/v1/users/me", headers=customer_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "priya.customer@bulkshare.com"
    assert data["full_name"] == "Priya Sharma"
    assert data["role"] == "CUSTOMER"
    assert data["neighborhood"]["name"] == "Indiranagar Central"


def test_update_users_me_profile(client: TestClient, customer_auth_headers: dict):
    update_payload = {
        "full_name": "Priya Sharma Updated",
        "phone": "+91 91234 56789",
    }
    response = client.patch(
        "/api/v1/users/me",
        json=update_payload,
        headers=customer_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Priya Sharma Updated"
    assert data["phone"] == "+91 91234 56789"


def test_list_neighborhoods(client: TestClient):
    response = client.get("/api/v1/neighborhoods")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["name"] == "Indiranagar Central"
    assert data[0]["postal_code"] == "560038"


def test_demo_login_endpoint(client: TestClient):
    response = client.post(
        "/api/v1/users/demo-login",
        json={"role": "CUSTOMER"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["demo_mode"] is True
    assert data["user"]["email"] == "priya.customer@bulkshare.com"
