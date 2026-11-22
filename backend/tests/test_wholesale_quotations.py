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
from app.models.wholesale import WholesalePriceTier, SupplierProfile, SupplierProductOffer
from app.models.quotation import DemandSnapshot, SupplierQuotation, QuotationStatus

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def setup_m3_data(db_session: Session):
    # Setup test users
    organizer = db_session.execute(
        select(User).where(User.email == "test.organizer.m3@bulkshare.com")
    ).scalar_one_or_none()
    if not organizer:
        organizer = User(
            id="m3-user-org-01",
            supabase_uid="m3-uid-org-01",
            email="test.organizer.m3@bulkshare.com",
            full_name="M3 Organizer User",
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        db_session.add(organizer)

    customer = db_session.execute(
        select(User).where(User.email == "test.customer.m3@bulkshare.com")
    ).scalar_one_or_none()
    if not customer:
        customer = User(
            id="m3-user-cust-02",
            supabase_uid="m3-uid-cust-02",
            email="test.customer.m3@bulkshare.com",
            full_name="M3 Customer User",
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        db_session.add(customer)

    supplier_user = db_session.execute(
        select(User).where(User.email == "test.supplier.m3@bulkshare.com")
    ).scalar_one_or_none()
    if not supplier_user:
        supplier_user = User(
            id="m3-user-supp-03",
            supabase_uid="m3-uid-supp-03",
            email="test.supplier.m3@bulkshare.com",
            full_name="M3 Wholesaler User",
            role=UserRole.SUPPLIER.value,
            is_active=True,
        )
        db_session.add(supplier_user)

    db_session.commit()

    # Product and Variant
    prod = db_session.execute(select(Product).where(Product.id == "m3-prod-01")).scalar_one_or_none()
    if not prod:
        prod = Product(
            id="m3-prod-01",
            name="Test M3 Sona Masoori Rice",
            category=ProductCategory.RICE.value,
            base_unit="kg",
            description="Rice for M3 tests",
            is_active=True,
        )
        db_session.add(prod)
        db_session.flush()

        variant = ProductVariant(
            id="m3-var-rice-5kg",
            product_id=prod.id,
            brand="TestBrand",
            pack_quantity=5,
            pack_unit="kg",
            sku="M3-RICE-5KG",
            reference_retail_price=300.0,
            is_active=True,
        )
        db_session.add(variant)
        db_session.flush()

        # Tiers: 5+ packs -> 250, 10+ packs -> 220
        t1 = WholesalePriceTier(
            variant_id=variant.id,
            min_quantity=5,
            price_per_pack=250.0,
            tier_label="Tier 1",
            is_active=True,
        )
        t2 = WholesalePriceTier(
            variant_id=variant.id,
            min_quantity=10,
            price_per_pack=220.0,
            tier_label="Tier 2",
            is_active=True,
        )
        db_session.add_all([t1, t2])

    # Buying Group
    now = datetime.now(timezone.utc)
    group = db_session.execute(select(BuyingGroup).where(BuyingGroup.id == "m3-group-01")).scalar_one_or_none()
    if not group:
        group = BuyingGroup(
            id="m3-group-01",
            name="M3 Test Buying Group",
            neighborhood_id="11111111-1111-1111-1111-111111111111",
            organizer_id=organizer.id,
            visibility=GroupVisibility.PUBLIC.value,
            status=GroupStatus.OPEN.value,
            deadline=now + timedelta(days=7),
            min_members=2,
            version=1,
        )
        db_session.add(group)
        db_session.flush()

        m_org = GroupMember(group_id=group.id, user_id=organizer.id, is_organizer=True)
        m_cust = GroupMember(group_id=group.id, user_id=customer.id, is_organizer=False)
        db_session.add_all([m_org, m_cust])

        # Grocery Items: customer has 3 packs, organizer has 3 packs -> Total = 6 packs (unlocks Tier 1 >= 5)
        item1 = GroceryListItem(
            group_id=group.id,
            user_id=customer.id,
            variant_id="m3-var-rice-5kg",
            pack_quantity=3,
            brand_preference=BrandPreference.EXACT.value,
        )
        item2 = GroceryListItem(
            group_id=group.id,
            user_id=organizer.id,
            variant_id="m3-var-rice-5kg",
            pack_quantity=3,
            brand_preference=BrandPreference.FLEXIBLE.value,
        )
        db_session.add_all([item1, item2])

    db_session.commit()
    return {
        "organizer": organizer,
        "customer": customer,
        "supplier": supplier_user,
        "group_id": "m3-group-01",
        "variant_id": "m3-var-rice-5kg",
    }


def test_demand_aggregation_privacy_and_tier_unlock(setup_m3_data):
    """Test that demand summary groups quantities, unlocks Tier 1, and discloses zero user IDs."""
    data = setup_m3_data
    token = create_demo_token(
        user_id=data["customer"].id,
        email=data["customer"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["customer"].supabase_uid,
    )

    response = client.get(
        f"/api/v1/groups/{data['group_id']}/demand-summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    res_data = response.json()

    assert res_data["group_id"] == data["group_id"]
    assert res_data["total_packs"] == 6  # 3 + 3
    assert res_data["total_retail_value"] == 1800.0  # 6 * 300

    # Privacy check: response JSON must NOT contain member IDs
    serialized = str(res_data)
    assert data["customer"].id not in serialized
    assert data["organizer"].id not in serialized
    assert "user_id" not in serialized

    # Check Tier qualification: 6 packs qualifies for Tier 1 (min 5)
    item = res_data["items"][0]
    assert item["variant_id"] == data["variant_id"]
    assert item["qualified_tier"] is not None
    assert item["qualified_tier"]["min_quantity"] == 5
    assert item["best_wholesale_price"] is not None
    assert item["estimated_wholesale_cost"] < item["total_retail_value"]
    assert item["estimated_savings"] > 0
    assert item["next_tier"] is not None
    assert item["packs_to_next_tier"] is not None


def test_household_savings_calculation(setup_m3_data):
    """Test individual household savings based on group-unlocked tiers."""
    data = setup_m3_data
    token = create_demo_token(
        user_id=data["customer"].id,
        email=data["customer"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["customer"].supabase_uid,
    )

    response = client.get(
        f"/api/v1/groups/{data['group_id']}/savings",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    res_data = response.json()

    assert res_data["user_id"] == data["customer"].id
    assert res_data["total_packs"] == 3
    assert res_data["total_retail_cost"] == 900.0  # 3 * 300
    assert res_data["total_wholesale_cost"] < 900.0
    assert res_data["total_savings"] > 0
    assert res_data["savings_percentage"] > 0


def test_supplier_profile_and_offer_lifecycle(setup_m3_data, db_session):
    """Test supplier profile creation and product offer management."""
    data = setup_m3_data
    token = create_demo_token(
        user_id=data["supplier"].id,
        email=data["supplier"].email,
        role=UserRole.SUPPLIER.value,
        supabase_uid=data["supplier"].supabase_uid,
    )

    # Clean existing profile for test supplier if present from prior runs
    existing = db_session.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == data["supplier"].id)
    ).scalar_one_or_none()
    if existing:
        db_session.delete(existing)
        db_session.commit()

    # 1. Create Profile
    prof_payload = {
        "company_name": "Agro Wholesale Direct",
        "gstin": "29AABCA1234A1Z1",
        "city": "Bengaluru",
        "address": "Yard 5, APMC",
        "description": "Bulk grains distributor",
    }
    res_prof = client.post(
        "/api/v1/suppliers/me/profile",
        json=prof_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_prof.status_code == 201
    assert res_prof.json()["company_name"] == "Agro Wholesale Direct"

    # 2. Add Product Offer
    offer_payload = {
        "variant_id": data["variant_id"],
        "offer_price_per_pack": 240.0,
        "min_order_packs": 5,
        "max_order_packs": 100,
    }
    blocked_offer = client.post(
        "/api/v1/suppliers/me/offers",
        json=offer_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert blocked_offer.status_code == 403

    profile = db_session.get(SupplierProfile, res_prof.json()["id"])
    profile.is_verified = True
    db_session.commit()

    res_offer = client.post(
        "/api/v1/suppliers/me/offers",
        json=offer_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_offer.status_code == 201
    assert res_offer.json()["offer_price_per_pack"] == 240.0

    # 3. List Offers
    res_list = client.get(
        "/api/v1/suppliers/me/offers",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1


def test_demand_snapshot_and_quotation_workflow(setup_m3_data):
    """Test creating demand snapshot and submitting a supplier wholesale quotation."""
    data = setup_m3_data
    org_token = create_demo_token(
        user_id=data["organizer"].id,
        email=data["organizer"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["organizer"].supabase_uid,
    )
    supp_token = create_demo_token(
        user_id=data["supplier"].id,
        email=data["supplier"].email,
        role=UserRole.SUPPLIER.value,
        supabase_uid=data["supplier"].supabase_uid,
    )

    # 1. Organizer triggers Demand Snapshot
    res_snap = client.post(
        f"/api/v1/groups/{data['group_id']}/demand-snapshot",
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert res_snap.status_code == 201
    snapshot_id = res_snap.json()["id"]
    assert res_snap.json()["snapshot_version"] >= 1
    assert res_snap.json()["total_packs"] == 6

    # 2. Supplier submits quotation against snapshot
    quote_payload = {
        "demand_snapshot_id": snapshot_id,
        "valid_until": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "notes": "Guaranteed 2-day delivery to local distribution hub.",
        "items": [
            {
                "variant_id": data["variant_id"],
                "quoted_price_per_pack": 235.0,  # Bid 235 per pack
            }
        ],
    }
    res_quote = client.post(
        "/api/v1/quotations",
        json=quote_payload,
        headers={"Authorization": f"Bearer {supp_token}"},
    )
    assert res_quote.status_code == 201
    quote_data = res_quote.json()
    assert quote_data["total_quoted_price"] == 1410.0  # 6 * 235
    assert quote_data["status"] == "SUBMITTED"
    assert quote_data["savings_amount"] == 390.0  # 1800 retail - 1410 quoted
    assert len(quote_data["items"]) == 1

    # 3. List quotations for the group
    res_quotes_list = client.get(
        f"/api/v1/groups/{data['group_id']}/quotations",
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert res_quotes_list.status_code == 200
    assert len(res_quotes_list.json()) >= 1
    assert res_quotes_list.json()[0]["savings_percentage"] > 20.0
