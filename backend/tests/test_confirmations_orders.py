import json
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_demo_token
from app.models.user import User, UserRole
from app.models.group import BuyingGroup, GroupMember, GroupVisibility, GroupStatus
from app.models.catalog import Product, ProductVariant, ProductCategory
from app.models.grocery_list import GroceryListItem, BrandPreference
from app.models.wholesale import SupplierProfile
from app.models.quotation import DemandSnapshot, SupplierQuotation, QuotationItem, QuotationStatus
from app.models.order import (
    ConfirmationRound,
    MemberConfirmation,
    GroupOrder,
    RoundStatus,
    MemberConfirmationStatus,
    OrderLockStatus,
)

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def setup_m4_data(db_session: Session):
    # Setup users
    org = db_session.execute(
        select(User).where(User.email == "test.org.m4@bulkshare.com")
    ).scalar_one_or_none()
    if not org:
        org = User(
            id="m4-user-org",
            supabase_uid="m4-uid-org",
            email="test.org.m4@bulkshare.com",
            full_name="M4 Organizer",
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        db_session.add(org)

    cust1 = db_session.execute(
        select(User).where(User.email == "test.cust1.m4@bulkshare.com")
    ).scalar_one_or_none()
    if not cust1:
        cust1 = User(
            id="m4-user-cust1",
            supabase_uid="m4-uid-cust1",
            email="test.cust1.m4@bulkshare.com",
            full_name="M4 Customer 1",
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        db_session.add(cust1)

    supp_user = db_session.execute(
        select(User).where(User.email == "test.supp.m4@bulkshare.com")
    ).scalar_one_or_none()
    if not supp_user:
        supp_user = User(
            id="m4-user-supp",
            supabase_uid="m4-uid-supp",
            email="test.supp.m4@bulkshare.com",
            full_name="M4 Supplier User",
            role=UserRole.SUPPLIER.value,
            is_active=True,
        )
        db_session.add(supp_user)

    db_session.commit()

    # Supplier Profile
    supp_prof = db_session.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == supp_user.id)
    ).scalar_one_or_none()
    if not supp_prof:
        supp_prof = SupplierProfile(
            id="m4-supp-prof",
            user_id=supp_user.id,
            company_name="Apex Wholesale Foodgrains Ltd",
            city="Bengaluru",
            is_verified=True,
        )
        db_session.add(supp_prof)

    # Product & Variant
    prod = db_session.execute(select(Product).where(Product.id == "m4-prod")).scalar_one_or_none()
    if not prod:
        prod = Product(
            id="m4-prod",
            name="M4 Atta",
            category=ProductCategory.FLOUR.value,
            base_unit="kg",
            is_active=True,
        )
        db_session.add(prod)
        db_session.flush()

        variant = ProductVariant(
            id="m4-var-atta-10kg",
            product_id=prod.id,
            brand="Aashirvaad",
            pack_quantity=10,
            pack_unit="kg",
            sku="M4-ATTA-10KG",
            reference_retail_price=450.0,
            is_active=True,
        )
        db_session.add(variant)

    # Buying Group
    now = datetime.now(timezone.utc)
    group = db_session.execute(select(BuyingGroup).where(BuyingGroup.id == "m4-group-01")).scalar_one_or_none()
    if not group:
        group = BuyingGroup(
            id="m4-group-01",
            name="M4 Confirmation Test Group",
            neighborhood_id="11111111-1111-1111-1111-111111111111",
            organizer_id=org.id,
            visibility=GroupVisibility.PUBLIC.value,
            status=GroupStatus.QUOTING.value,
            deadline=now + timedelta(days=5),
            min_members=2,
            version=1,
        )
        db_session.add(group)
        db_session.flush()

        m1 = GroupMember(group_id=group.id, user_id=org.id, is_organizer=True)
        m2 = GroupMember(group_id=group.id, user_id=cust1.id, is_organizer=False)
        db_session.add_all([m1, m2])

        # Grocery Items
        i1 = GroceryListItem(
            group_id=group.id,
            user_id=cust1.id,
            variant_id="m4-var-atta-10kg",
            pack_quantity=2,
            brand_preference=BrandPreference.EXACT.value,
        )
        i2 = GroceryListItem(
            group_id=group.id,
            user_id=org.id,
            variant_id="m4-var-atta-10kg",
            pack_quantity=3,
            brand_preference=BrandPreference.EXACT.value,
        )
        db_session.add_all([i1, i2])

    # Demand Snapshot
    snapshot = db_session.execute(
        select(DemandSnapshot).where(DemandSnapshot.group_id == "m4-group-01")
    ).scalar_one_or_none()
    if not snapshot:
        snapshot = DemandSnapshot(
            id="m4-snap-01",
            group_id="m4-group-01",
            snapshot_version=1,
            snapshot_data='{"items": [{"variant_id": "m4-var-atta-10kg", "total_packs": 5}]}',
            total_retail_value=2250.0,
            total_packs=5,
        )
        db_session.add(snapshot)
        db_session.flush()

        # Quotation: Wholesale bid 360 per pack (vs 450 retail, 20% off)
        quote = SupplierQuotation(
            id="m4-quote-01",
            demand_snapshot_id=snapshot.id,
            supplier_id="m4-supp-prof",
            status=QuotationStatus.SUBMITTED.value,
            total_quoted_price=1800.0,
            valid_until=now + timedelta(days=3),
            notes="Guaranteed sealed bags.",
        )
        db_session.add(quote)
        db_session.flush()

        qi = QuotationItem(
            quotation_id=quote.id,
            variant_id="m4-var-atta-10kg",
            quoted_packs=5,
            quoted_price_per_pack=360.0,
            line_total=1800.0,
        )
        db_session.add(qi)

    # Clean prior rounds & orders for repeatable test execution
    from sqlalchemy import delete
    db_session.execute(delete(GroupOrder).where(GroupOrder.group_id == "m4-group-01"))
    db_session.execute(delete(MemberConfirmation).where(MemberConfirmation.group_id == "m4-group-01"))
    db_session.execute(delete(ConfirmationRound).where(ConfirmationRound.group_id == "m4-group-01"))
    if group:
        group.status = GroupStatus.QUOTING.value
        db_session.add(group)

    db_session.commit()
    return {
        "org": org,
        "cust1": cust1,
        "supp": supp_user,
        "group_id": "m4-group-01",
        "quote_id": "m4-quote-01",
    }


def test_select_quotation_and_start_round_1(setup_m4_data):
    """Test organizer selecting quotation moves group to CONFIRMING and seeds member approvals."""
    data = setup_m4_data
    token = create_demo_token(
        user_id=data["org"].id,
        email=data["org"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["org"].supabase_uid,
    )

    payload = {
        "quotation_id": data["quote_id"],
        "deadline_hours": 48,
        "notes": "Selected Apex Wholesale for high quality and best price.",
    }

    response = client.post(
        f"/api/v1/groups/{data['group_id']}/select-quotation",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    res = response.json()

    assert res["group_id"] == data["group_id"]
    assert res["round_number"] == 1
    assert res["status"] == "OPEN"
    assert res["total_members"] == 2
    assert res["pending_count"] == 2
    assert res["confirmed_count"] == 0

    # Verify group status changed to CONFIRMING
    grp_res = client.get(
        f"/api/v1/groups/{data['group_id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert grp_res.status_code == 200
    assert grp_res.json()["status"] == "CONFIRMING"


def test_member_confirmation_flow(setup_m4_data):
    """Test member submitting ACCEPT confirmation with fulfillment preference."""
    data = setup_m4_data
    token = create_demo_token(
        user_id=data["cust1"].id,
        email=data["cust1"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["cust1"].supabase_uid,
    )

    confirm_payload = {
        "status": "ACCEPTED",
        "fulfillment_preference": "HOME_DELIVERY",
        "delivery_address": "Flat 302, Green Glen Layout, Indiranagar",
    }

    response = client.post(
        f"/api/v1/groups/{data['group_id']}/confirmation-round/confirm",
        json=confirm_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    res = response.json()

    assert res["status"] == "ACCEPTED"
    assert res["fulfillment_preference"] == "HOME_DELIVERY"
    assert res["delivery_address"] == "Flat 302, Green Glen Layout, Indiranagar"
    assert res["total_household_cost"] == 720.0  # 2 packs * 360
    assert res["total_household_savings"] == 180.0  # (450 - 360) * 2

    # Check round progress
    round_res = client.get(
        f"/api/v1/groups/{data['group_id']}/confirmation-round",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert round_res.status_code == 200
    round_data = round_res.json()
    assert round_data["confirmed_count"] == 1
    assert round_data["pending_count"] == 1


def test_order_locking_and_freezing_allocations(setup_m4_data):
    """Test locking the group order transitions group to LOCKED and saves frozen allocations."""
    data = setup_m4_data
    org_token = create_demo_token(
        user_id=data["org"].id,
        email=data["org"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["org"].supabase_uid,
    )

    # Organizer also confirms their own allocation
    client.post(
        f"/api/v1/groups/{data['group_id']}/confirmation-round/confirm",
        json={"status": "ACCEPTED", "fulfillment_preference": "PICKUP"},
        headers={"Authorization": f"Bearer {org_token}"},
    )

    # Organizer locks the order
    lock_res = client.post(
        f"/api/v1/groups/{data['group_id']}/lock-order",
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert lock_res.status_code == 200
    order_data = lock_res.json()

    assert order_data["group_id"] == data["group_id"]
    assert order_data["status"] == "LOCKED"
    assert order_data["total_packs"] == 5
    assert order_data["total_wholesale_amount"] == 1800.0  # 5 * 360
    assert order_data["total_savings_amount"] == 450.0  # 5 * 90
    snapshot = json.loads(order_data["order_allocations_data"])
    assert snapshot["member_count"] == 2
    assert all(item["user_id"] == data["org"].id for item in snapshot["items"])
    assert all(member["user_id"] == data["org"].id for member in snapshot["members"])
    assert "Flat 302" not in order_data["order_allocations_data"]

    # Verify group status is LOCKED
    grp_res = client.get(
        f"/api/v1/groups/{data['group_id']}",
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert grp_res.status_code == 200
    assert grp_res.json()["status"] == "LOCKED"

    # Verify audit logs recorded ORDER_LOCKED
    audit_res = client.get(
        f"/api/v1/audit/groups/{data['group_id']}",
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert audit_res.status_code == 200
    actions = [log["action"] for log in audit_res.json()]
    assert "QUOTATION_SELECTED" in actions
    assert "ORDER_LOCKED" in actions
