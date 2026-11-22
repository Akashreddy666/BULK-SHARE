import json
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_demo_token
from app.models.user import User, UserRole
from app.models.group import BuyingGroup, GroupStatus, GroupVisibility
from app.models.catalog import Product, ProductVariant, ProductCategory
from app.models.wholesale import SupplierProfile
from app.models.quotation import SupplierQuotation, QuotationStatus, DemandSnapshot
from app.models.order import (
    ConfirmationRound,
    MemberConfirmation,
    GroupOrder,
    RoundStatus,
    MemberConfirmationStatus,
    OrderLockStatus,
)
from app.models.payment import PaymentTransaction, PaymentStatus
from app.models.procurement import ProcurementOrder, ProcurementStatus
from app.models.fulfillment import MemberFulfillment, FulfillmentStatus
from app.models.notification import Notification
from app.models.dispute import OrderDispute, DisputeStatus

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def setup_m5_data(db_session: Session):
    # Setup test users
    admin = db_session.execute(
        select(User).where(User.email == "test.admin.m5@bulkshare.com")
    ).scalar_one_or_none()
    if not admin:
        admin = User(
            id="m5-user-admin",
            supabase_uid="m5-uid-admin",
            email="test.admin.m5@bulkshare.com",
            full_name="M5 Admin",
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        db_session.add(admin)

    org = db_session.execute(
        select(User).where(User.email == "test.org.m5@bulkshare.com")
    ).scalar_one_or_none()
    if not org:
        org = User(
            id="m5-user-org",
            supabase_uid="m5-uid-org",
            email="test.org.m5@bulkshare.com",
            full_name="M5 Organizer",
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        db_session.add(org)

    cust = db_session.execute(
        select(User).where(User.email == "test.cust.m5@bulkshare.com")
    ).scalar_one_or_none()
    if not cust:
        cust = User(
            id="m5-user-cust",
            supabase_uid="m5-uid-cust",
            email="test.cust.m5@bulkshare.com",
            full_name="M5 Customer",
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        db_session.add(cust)

    supplier_user = db_session.execute(
        select(User).where(User.email == "test.supplier.m5@bulkshare.com")
    ).scalar_one_or_none()
    if not supplier_user:
        supplier_user = User(
            id="m5-user-supplier",
            supabase_uid="m5-uid-supplier",
            email="test.supplier.m5@bulkshare.com",
            full_name="M5 Wholesale Mart",
            role=UserRole.SUPPLIER.value,
            is_active=True,
        )
        db_session.add(supplier_user)

    db_session.commit()

    # Supplier profile
    supplier = db_session.execute(
        select(SupplierProfile).where(SupplierProfile.id == "m5-supplier-profile")
    ).scalar_one_or_none()
    if not supplier:
        supplier = SupplierProfile(
            id="m5-supplier-profile",
            user_id=supplier_user.id,
            company_name="M5 Wholesale Supplies Ltd",
            gstin="29ABCDE1234F1Z5",
            is_verified=True,
        )
        db_session.add(supplier)

    # Product & variant
    prod = db_session.execute(select(Product).where(Product.id == "m5-prod-rice")).scalar_one_or_none()
    if not prod:
        prod = Product(
            id="m5-prod-rice",
            name="M5 Premium Basmati",
            category=ProductCategory.RICE.value,
            base_unit="kg",
        )
        db_session.add(prod)

    variant = db_session.execute(select(ProductVariant).where(ProductVariant.id == "m5-var-rice")).scalar_one_or_none()
    if not variant:
        variant = ProductVariant(
            id="m5-var-rice",
            product_id=prod.id,
            brand="Royal Feast",
            sku="M5-ROYAL-5KG",
            pack_quantity=5,
            pack_unit="kg",
            reference_retail_price=500.0,
        )
        db_session.add(variant)

    # Buying group
    group = db_session.execute(select(BuyingGroup).where(BuyingGroup.id == "m5-group-01")).scalar_one_or_none()
    if not group:
        group = BuyingGroup(
            id="m5-group-01",
            name="M5 Palm Meadows Club",
            organizer_id=org.id,
            neighborhood_id="11111111-1111-1111-1111-111111111111",
            visibility=GroupVisibility.PUBLIC.value,
            status=GroupStatus.LOCKED.value,
            deadline=datetime.now(timezone.utc),
            min_members=2,
        )
        db_session.add(group)

    # Clean existing orders/confirmations for clean runs
    db_session.execute(delete(OrderDispute).where(OrderDispute.group_order_id == "m5-order-01"))
    db_session.execute(delete(MemberFulfillment).where(MemberFulfillment.group_order_id == "m5-order-01"))
    db_session.execute(delete(ProcurementOrder).where(ProcurementOrder.group_order_id == "m5-order-01"))
    db_session.execute(delete(PaymentTransaction).where(PaymentTransaction.group_order_id == "m5-order-01"))
    db_session.execute(delete(GroupOrder).where(GroupOrder.id == "m5-order-01"))
    db_session.execute(delete(MemberConfirmation).where(MemberConfirmation.group_id == "m5-group-01"))
    db_session.execute(delete(ConfirmationRound).where(ConfirmationRound.group_id == "m5-group-01"))
    db_session.execute(delete(SupplierQuotation).where(SupplierQuotation.id == "m5-quotation-01"))
    db_session.execute(delete(DemandSnapshot).where(DemandSnapshot.id == "m5-snap-01"))
    db_session.commit()

    # Demand snapshot
    snapshot = DemandSnapshot(
        id="m5-snap-01",
        group_id=group.id,
        snapshot_version=1,
        snapshot_data='{"items": []}',
        total_retail_value=2000.0,
    )
    db_session.add(snapshot)
    db_session.flush()

    # Supplier quotation
    quotation = SupplierQuotation(
        id="m5-quotation-01",
        demand_snapshot_id=snapshot.id,
        supplier_id=supplier.id,
        status=QuotationStatus.ACCEPTED.value,
        total_quoted_price=1600.0,
        valid_until=datetime.now(timezone.utc),
    )
    db_session.add(quotation)

    # Confirmation round
    c_round = ConfirmationRound(
        id="m5-round-01",
        group_id=group.id,
        selected_quotation_id=quotation.id,
        round_number=1,
        status=RoundStatus.COMPLETED.value,
        deadline=datetime.now(timezone.utc),
    )
    db_session.add(c_round)

    # Member confirmations
    conf_cust = MemberConfirmation(
        id="m5-conf-cust",
        confirmation_round_id=c_round.id,
        group_id=group.id,
        user_id=cust.id,
        status=MemberConfirmationStatus.ACCEPTED.value,
        total_household_cost=800.0,
        total_household_savings=200.0,
        fulfillment_preference="PICKUP",
        confirmed_at=datetime.now(timezone.utc),
    )
    db_session.add(conf_cust)

    conf_org = MemberConfirmation(
        id="m5-conf-org",
        confirmation_round_id=c_round.id,
        group_id=group.id,
        user_id=org.id,
        status=MemberConfirmationStatus.ACCEPTED.value,
        total_household_cost=800.0,
        total_household_savings=200.0,
        fulfillment_preference="HOME_DELIVERY",
        delivery_address="Villa 42, Palm Meadows",
        confirmed_at=datetime.now(timezone.utc),
    )
    db_session.add(conf_org)

    # Frozen order allocations
    allocations = {
        "group_id": group.id,
        "group_name": group.name,
        "locked_at": datetime.now(timezone.utc).isoformat(),
        "selected_quotation_id": quotation.id,
        "members": [
            {
                "user_id": cust.id,
                "user_name": cust.full_name,
                "household_cost": 800.0,
                "household_savings": 200.0,
                "fulfillment_preference": "PICKUP",
                "delivery_address": None,
            },
            {
                "user_id": org.id,
                "user_name": org.full_name,
                "household_cost": 800.0,
                "household_savings": 200.0,
                "fulfillment_preference": "HOME_DELIVERY",
                "delivery_address": "Villa 42, Palm Meadows",
            },
        ],
        "items": [
            {
                "user_id": cust.id,
                "variant_id": variant.id,
                "brand": variant.brand,
                "sku": variant.sku,
                "pack_quantity": 2,
                "brand_preference": "EXACT",
            },
            {
                "user_id": org.id,
                "variant_id": variant.id,
                "brand": variant.brand,
                "sku": variant.sku,
                "pack_quantity": 2,
                "brand_preference": "EXACT",
            },
        ],
    }

    # Group Order
    order = GroupOrder(
        id="m5-order-01",
        group_id=group.id,
        selected_quotation_id=quotation.id,
        confirmation_round_id=c_round.id,
        status=OrderLockStatus.LOCKED.value,
        total_retail_amount=2000.0,
        total_wholesale_amount=1600.0,
        total_savings_amount=400.0,
        total_packs=4,
        locked_at=datetime.now(timezone.utc),
        locked_by_user_id=org.id,
        order_allocations_data=json.dumps(allocations),
    )
    db_session.add(order)
    db_session.commit()

    return {
        "admin": admin,
        "org": org,
        "cust": cust,
        "supplier_user": supplier_user,
        "supplier": supplier,
        "group": group,
        "order": order,
    }


def test_invoice_and_simulated_payment(setup_m5_data):
    """Test household invoice generation and simulated payment processing."""
    data = setup_m5_data
    cust_token = create_demo_token(
        user_id=data["cust"].id,
        email=data["cust"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["cust"].supabase_uid,
    )

    # 1. Get household invoice
    res_inv = client.get(
        f"/api/v1/orders/{data['order'].id}/invoice",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert res_inv.status_code == 200
    inv = res_inv.json()
    assert inv["user_id"] == data["cust"].id
    assert inv["fulfillment_type"] == "PICKUP"
    assert inv["delivery_surcharge"] == 0.0
    assert inv["subtotal_wholesale"] == 800.0
    assert inv["final_payable"] == 800.0
    assert inv["payment_status"] == "PENDING"
    assert len(inv["items"]) == 1

    # 2. Simulate payment
    pay_payload = {"payment_method": "UPI", "notes": "UPI pay via GPay"}
    res_pay = client.post(
        f"/api/v1/orders/{data['order'].id}/payments/simulate",
        json=pay_payload,
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert res_pay.status_code == 201
    pay_data = res_pay.json()
    assert pay_data["amount"] == 800.0
    assert pay_data["status"] == "COMPLETED"
    assert pay_data["transaction_ref"].startswith("TXN-BS-")
    assert pay_data["receipt_number"].startswith("RCP-BS-")

    # 3. Check updated invoice reflects PAID with receipt
    res_inv2 = client.get(
        f"/api/v1/orders/{data['order'].id}/invoice",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert res_inv2.status_code == 200
    inv2 = res_inv2.json()
    assert inv2["payment_status"] == "PAID"
    assert inv2["receipt_number"] == pay_data["receipt_number"]

    # 4. Check payment summary shows 1 of 2 members paid
    res_sum = client.get(
        f"/api/v1/orders/{data['order'].id}/payments/summary",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert res_sum.status_code == 200
    sum_data = res_sum.json()
    assert sum_data["paid_members_count"] == 1
    assert sum_data["total_members"] == 2
    assert sum_data["all_paid"] is False


def test_admin_procurement_placement_and_supplier_dispatch(setup_m5_data):
    """Test admin placing wholesale purchase order, and supplier acknowledging & dispatching."""
    data = setup_m5_data
    admin_token = create_demo_token(
        user_id=data["admin"].id,
        email=data["admin"].email,
        role=UserRole.ADMIN.value,
        supabase_uid=data["admin"].supabase_uid,
    )
    supplier_token = create_demo_token(
        user_id=data["supplier_user"].id,
        email=data["supplier_user"].email,
        role=UserRole.SUPPLIER.value,
        supabase_uid=data["supplier_user"].supabase_uid,
    )

    # 1. Admin places procurement order
    po_res = client.post(
        f"/api/v1/orders/{data['order'].id}/procurement/place",
        json={"notes": "Priority morning delivery requested"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert po_res.status_code == 201
    po = po_res.json()
    assert po["status"] == "PLACED"
    assert po["po_number"].startswith("PO-BS-")
    assert po["total_amount"] == 1600.0

    # 2. Supplier views assigned POs
    sup_pos = client.get(
        "/api/v1/supplier/procurement-orders",
        headers={"Authorization": f"Bearer {supplier_token}"},
    )
    assert sup_pos.status_code == 200
    pos_list = sup_pos.json()
    assert any(p["id"] == po["id"] for p in pos_list)

    # 3. Supplier confirms and dispatches to hub
    conf_res = client.patch(
        f"/api/v1/procurement/{po['id']}/status",
        json={"status": "CONFIRMED_BY_SUPPLIER", "notes": "Packaging sealed sacks"},
        headers={"Authorization": f"Bearer {supplier_token}"},
    )
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] == "CONFIRMED_BY_SUPPLIER"

    dispatch_res = client.patch(
        f"/api/v1/procurement/{po['id']}/status",
        json={"status": "DISPATCHED_TO_HUB", "notes": "Van KA-01-AB-1234 on the way"},
        headers={"Authorization": f"Bearer {supplier_token}"},
    )
    assert dispatch_res.status_code == 200
    assert dispatch_res.json()["status"] == "DISPATCHED_TO_HUB"

    # 4. Mark delivered to hub
    delivered_res = client.patch(
        f"/api/v1/procurement/{po['id']}/status",
        json={"status": "DELIVERED_TO_HUB", "notes": "Unloaded at Indiranagar Community Hall"},
        headers={"Authorization": f"Bearer {supplier_token}"},
    )
    assert delivered_res.status_code == 200
    assert delivered_res.json()["status"] == "DELIVERED_TO_HUB"


def test_hub_pickup_verification_and_fulfillment(setup_m5_data):
    """Test customer viewing pickup code, and hub organizer verifying pickup at hub."""
    data = setup_m5_data
    cust_token = create_demo_token(
        user_id=data["cust"].id,
        email=data["cust"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["cust"].supabase_uid,
    )
    org_token = create_demo_token(
        user_id=data["org"].id,
        email=data["org"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["org"].supabase_uid,
    )

    # 1. Customer checks their fulfillment record
    cust_fuls = client.get(
        f"/api/v1/orders/{data['order'].id}/fulfillments",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert cust_fuls.status_code == 200
    c_list = cust_fuls.json()
    assert len(c_list) == 1
    my_ful = c_list[0]
    assert my_ful["status"] == "READY_FOR_PICKUP"
    assert my_ful["pickup_code"].startswith("BS-")
    pickup_code = my_ful["pickup_code"]

    # 2. Organizer lists all fulfillments for hub distribution
    org_fuls = client.get(
        f"/api/v1/orders/{data['order'].id}/fulfillments",
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert org_fuls.status_code == 200
    assert len(org_fuls.json()) == 2
    customer_record = next(record for record in org_fuls.json() if record["user_id"] == my_ful["user_id"])
    assert customer_record["pickup_code"] is None
    assert customer_record["delivery_address"] is None
    assert customer_record["user_phone"] is None

    # 3. Organizer enters customer pickup code
    verify_res = client.post(
        f"/api/v1/orders/{data['order'].id}/fulfillments/verify-pickup",
        json={"pickup_code": pickup_code},
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["status"] == "PICKED_UP"
    assert v_data["verified_by_user_id"] == data["org"].id

    # 4. Attempting to verify the same code again fails (already picked up)
    dup_res = client.post(
        f"/api/v1/orders/{data['order'].id}/fulfillments/verify-pickup",
        json={"pickup_code": pickup_code},
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert dup_res.status_code == 400


def test_notifications_lifecycle(setup_m5_data):
    """Test user fetching notifications and marking as read."""
    data = setup_m5_data
    cust_token = create_demo_token(
        user_id=data["cust"].id,
        email=data["cust"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["cust"].supabase_uid,
    )

    notifs_res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    assert len(notifs) >= 1

    first_notif = notifs[0]
    assert "id" in first_notif
    assert "title" in first_notif

    # Mark single read
    patch_res = client.patch(
        f"/api/v1/notifications/{first_notif['id']}/read",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_read"] is True

    # Mark all read
    all_res = client.post(
        "/api/v1/notifications/mark-all-read",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert all_res.status_code == 200


def test_dispute_submission_and_admin_resolution(setup_m5_data):
    """Test customer raising a dispute and platform administrator resolving it with refund."""
    data = setup_m5_data
    cust_token = create_demo_token(
        user_id=data["cust"].id,
        email=data["cust"].email,
        role=UserRole.CUSTOMER.value,
        supabase_uid=data["cust"].supabase_uid,
    )
    admin_token = create_demo_token(
        user_id=data["admin"].id,
        email=data["admin"].email,
        role=UserRole.ADMIN.value,
        supabase_uid=data["admin"].supabase_uid,
    )

    # 1. Customer creates a dispute
    disp_payload = {
        "category": "DAMAGED_PACKS",
        "description": "One 5kg bag of Basmati rice had a 2-inch tear along the top seal.",
    }
    disp_res = client.post(
        f"/api/v1/orders/{data['order'].id}/disputes",
        json=disp_payload,
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert disp_res.status_code == 201
    dispute = disp_res.json()
    assert dispute["category"] == "DAMAGED_PACKS"
    assert dispute["status"] == "OPEN"

    # 2. Admin lists open disputes
    admin_disps = client.get(
        "/api/v1/admin/disputes",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_disps.status_code == 200
    disps_list = admin_disps.json()
    assert any(d["id"] == dispute["id"] for d in disps_list)

    # 3. Admin resolves dispute with simulated partial refund
    resolve_payload = {
        "status": "RESOLVED",
        "resolution_notes": "Damaged bag confirmed. Crediting 1x package replacement refund.",
        "refund_amount": 400.0,
    }
    res_resolve = client.patch(
        f"/api/v1/admin/disputes/{dispute['id']}/resolve",
        json=resolve_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_resolve.status_code == 200
    res_data = res_resolve.json()
    assert res_data["status"] == "RESOLVED"
    assert res_data["refund_amount"] == 400.0
    assert "replacement refund" in res_data["resolution_notes"]
