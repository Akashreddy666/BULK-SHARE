import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.catalog import Product, ProductVariant, ProductCategory
from app.models.group import BuyingGroup, GroupMember, GroupVisibility, GroupStatus
from app.models.grocery_list import GroceryListItem, BrandPreference
from app.core.security import create_demo_token


@pytest.fixture
def second_customer(db_session: Session) -> User:
    user = User(
        id="test-customer-02",
        supabase_uid="test-customer-02-uid",
        email="anita.customer@bulkshare.com",
        full_name="Anita Roy",
        phone="+91 98765 43212",
        role=UserRole.CUSTOMER.value,
        neighborhood_id="test-neighborhood-01",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_customer_auth_headers(second_customer: User) -> dict:
    token = create_demo_token(
        user_id=second_customer.id,
        email=second_customer.email,
        role=second_customer.role,
        supabase_uid=second_customer.supabase_uid,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_catalog(db_session: Session) -> Product:
    prod = Product(
        id="prod-test-rice",
        name="Sona Masoori Raw Rice",
        category=ProductCategory.RICE.value,
        base_unit="kg",
        description="Premium aged raw rice",
        is_active=True,
    )
    db_session.add(prod)
    db_session.flush()

    var1 = ProductVariant(
        id="var-test-rice-25kg",
        product_id=prod.id,
        brand="India Gate",
        pack_quantity=25,
        pack_unit="kg",
        reference_retail_price=1650.00,
        sku="RICE-IG-25KG",
        is_active=True,
    )
    var2 = ProductVariant(
        id="var-test-rice-10kg",
        product_id=prod.id,
        brand="Fortune",
        pack_quantity=10,
        pack_unit="kg",
        reference_retail_price=720.00,
        sku="RICE-FRT-10KG",
        is_active=True,
    )
    db_session.add_all([var1, var2])
    db_session.commit()
    return prod


def test_create_buying_group(client: TestClient, customer_auth_headers: dict):
    future_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    payload = {
        "name": "Indiranagar Rice & Oil Club",
        "description": "Weekly staple groceries pool",
        "neighborhood_id": "test-neighborhood-01",
        "visibility": "PUBLIC",
        "deadline": future_date,
        "close_rule": "DEADLINE_OR_TARGET",
        "min_members": 3,
        "max_members": 20,
    }

    response = client.post("/api/v1/groups", json=payload, headers=customer_auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Indiranagar Rice & Oil Club"
    assert data["organizer_id"] == "test-customer-01"
    assert data["status"] == "OPEN"
    assert data["members_count"] == 1
    assert data["is_organizer"] is True
    assert data["is_member"] is True


def test_list_buying_groups(client: TestClient, customer_auth_headers: dict):
    # Create group first within this test function
    future_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    client.post(
        "/api/v1/groups",
        json={
            "name": "Indiranagar Rice & Oil Club",
            "neighborhood_id": "test-neighborhood-01",
            "visibility": "PUBLIC",
            "deadline": future_date,
        },
        headers=customer_auth_headers,
    )

    response = client.get("/api/v1/groups?neighborhood_id=test-neighborhood-01", headers=customer_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(g["name"] == "Indiranagar Rice & Oil Club" for g in data)


def test_join_and_leave_buying_group(
    client: TestClient,
    customer_auth_headers: dict,
    second_customer_auth_headers: dict,
):
    # Customer 1 creates a group
    future_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    group_resp = client.post(
        "/api/v1/groups",
        json={
            "name": "Koramangala Community Bulk",
            "neighborhood_id": "test-neighborhood-01",
            "visibility": "PUBLIC",
            "deadline": future_date,
            "min_members": 2,
        },
        headers=customer_auth_headers,
    )
    assert group_resp.status_code == 201
    group_id = group_resp.json()["id"]

    # Customer 2 joins
    join_resp = client.post(f"/api/v1/groups/{group_id}/join", headers=second_customer_auth_headers)
    assert join_resp.status_code == 200
    assert join_resp.json()["is_organizer"] is False

    # Verify group detail shows 2 members
    detail_resp = client.get(f"/api/v1/groups/{group_id}", headers=second_customer_auth_headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["members_count"] == 2
    assert detail_resp.json()["is_member"] is True
    assert detail_resp.json()["is_organizer"] is False

    # Customer 2 leaves
    leave_resp = client.post(f"/api/v1/groups/{group_id}/leave", headers=second_customer_auth_headers)
    assert leave_resp.status_code == 200

    # Verify member count decreased
    detail_resp2 = client.get(f"/api/v1/groups/{group_id}", headers=customer_auth_headers)
    assert detail_resp2.json()["members_count"] == 1


def test_private_group_invitation_flow(
    client: TestClient,
    customer_auth_headers: dict,
    second_customer_auth_headers: dict,
):
    # Organizer creates a PRIVATE group
    future_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    group_resp = client.post(
        "/api/v1/groups",
        json={
            "name": "Defense Colony Gated Group",
            "description": "Private group for tower A & B",
            "neighborhood_id": "test-neighborhood-01",
            "visibility": "PRIVATE",
            "deadline": future_date,
            "min_members": 2,
        },
        headers=customer_auth_headers,
    )
    assert group_resp.status_code == 201
    group_id = group_resp.json()["id"]

    # Customer 2 should NOT see this private group in public listing
    list_resp = client.get("/api/v1/groups", headers=second_customer_auth_headers)
    assert list_resp.status_code == 200
    assert not any(g["id"] == group_id for g in list_resp.json())

    # Organizer generates invitation
    invite_resp = client.post(
        f"/api/v1/groups/{group_id}/invitations",
        json={"expires_in_days": 3, "max_uses": 5},
        headers=customer_auth_headers,
    )
    assert invite_resp.status_code == 201
    invite_token = invite_resp.json()["token"]

    # Customer 2 redeems invitation
    redeem_resp = client.post(
        "/api/v1/groups/invitations/redeem",
        json={"token": invite_token},
        headers=second_customer_auth_headers,
    )
    assert redeem_resp.status_code == 200
    assert redeem_resp.json()["id"] == group_id
    assert redeem_resp.json()["is_member"] is True

    # Now Customer 2 is a member and CAN see it in their groups
    list_after = client.get("/api/v1/groups?my_groups_only=true", headers=second_customer_auth_headers)
    assert any(g["id"] == group_id for g in list_after.json())


def test_catalog_browsing(client: TestClient, customer_auth_headers: dict, sample_catalog: Product):
    resp = client.get("/api/v1/products", headers=customer_auth_headers)
    assert resp.status_code == 200
    products = resp.json()
    assert len(products) >= 1
    rice = next(p for p in products if p["id"] == sample_catalog.id)
    assert rice["category"] == "RICE"
    assert len(rice["variants"]) == 2

    # Filter by category
    rice_resp = client.get("/api/v1/products?category=RICE", headers=customer_auth_headers)
    assert rice_resp.status_code == 200
    assert all(p["category"] == "RICE" for p in rice_resp.json())


def test_grocery_list_crud_and_privacy(
    client: TestClient,
    customer_auth_headers: dict,
    second_customer_auth_headers: dict,
    sample_catalog: Product,
):
    # Setup group with 2 members
    future_date = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    group_resp = client.post(
        "/api/v1/groups",
        json={
            "name": "Groceries Group For List Test",
            "neighborhood_id": "test-neighborhood-01",
            "visibility": "PUBLIC",
            "deadline": future_date,
        },
        headers=customer_auth_headers,
    )
    group_id = group_resp.json()["id"]
    client.post(f"/api/v1/groups/{group_id}/join", headers=second_customer_auth_headers)

    variant_id = sample_catalog.variants[0].id

    # Customer 1 adds 2 packs of rice
    add_payload = {
        "variant_id": variant_id,
        "pack_quantity": 2,
        "brand_preference": "EXACT",
    }
    add_resp = client.post(f"/api/v1/groups/{group_id}/my-items", json=add_payload, headers=customer_auth_headers)
    assert add_resp.status_code == 201
    item_data = add_resp.json()
    assert item_data["pack_quantity"] == 2
    assert item_data["brand_preference"] == "EXACT"
    item_id = item_data["id"]

    # Validation: pack_quantity <= 0 must fail (sealed packs only, positive integer)
    invalid_resp = client.post(
        f"/api/v1/groups/{group_id}/my-items",
        json={"variant_id": variant_id, "pack_quantity": 0, "brand_preference": "EXACT"},
        headers=customer_auth_headers,
    )
    assert invalid_resp.status_code == 422

    # Customer 1 reads their items
    my_items_resp = client.get(f"/api/v1/groups/{group_id}/my-items", headers=customer_auth_headers)
    assert my_items_resp.status_code == 200
    my_items = my_items_resp.json()
    assert len(my_items["items"]) == 1
    assert my_items["items"][0]["id"] == item_id
    assert my_items["total_packs"] == 2

    # PRIVACY ISOLATION (FR-LIST-04): Customer 2 must NOT see Customer 1's grocery list items!
    cust2_items_resp = client.get(f"/api/v1/groups/{group_id}/my-items", headers=second_customer_auth_headers)
    assert cust2_items_resp.status_code == 200
    assert len(cust2_items_resp.json()["items"]) == 0

    # Customer 1 updates quantity to 3 packs and brand preference to FLEXIBLE
    update_resp = client.patch(
        f"/api/v1/groups/{group_id}/my-items/{item_id}",
        json={"pack_quantity": 3, "brand_preference": "FLEXIBLE"},
        headers=customer_auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["pack_quantity"] == 3
    assert update_resp.json()["brand_preference"] == "FLEXIBLE"

    # Customer 1 deletes item
    del_resp = client.delete(f"/api/v1/groups/{group_id}/my-items/{item_id}", headers=customer_auth_headers)
    assert del_resp.status_code == 204

    # List is now empty
    my_items_empty = client.get(f"/api/v1/groups/{group_id}/my-items", headers=customer_auth_headers)
    assert len(my_items_empty.json()["items"]) == 0
