import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import GroupOrder, OrderLockStatus
from app.models.procurement import ProcurementOrder, ProcurementStatus
from app.models.fulfillment import MemberFulfillment, FulfillmentStatus
from app.models.quotation import SupplierQuotation
from app.models.wholesale import SupplierProfile
from app.models.user import User, UserRole
from app.services.audit import log_audit_event
from app.services.notification import create_notification, broadcast_group_order_notification
from app.models.notification import NotificationType


def generate_pickup_code() -> str:
    """Generate a clean 6-digit alphanumeric pickup code, e.g. BS-4829."""
    digits = random.randint(1000, 9999)
    return f"BS-{digits}"


def place_procurement_order(
    db: Session,
    group_order_id: str,
    admin_user: User,
    estimated_delivery_date: Optional[datetime] = None,
    notes: Optional[str] = None,
) -> ProcurementOrder:
    """
    Per business rule 5: The organizer selects the quotation,
    but the platform admin places the simulated wholesale procurement order.
    """
    if admin_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform administrators can place simulated wholesale procurement orders",
        )

    group_order = db.execute(
        select(GroupOrder).where(GroupOrder.id == group_order_id)
    ).scalar_one_or_none()
    if not group_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group order not found")

    # Check if procurement order already exists
    existing_po = db.execute(
        select(ProcurementOrder).where(ProcurementOrder.group_order_id == group_order_id)
    ).scalar_one_or_none()
    if existing_po:
        return existing_po

    # Find supplier from selected quotation
    quotation = db.execute(
        select(SupplierQuotation).where(SupplierQuotation.id == group_order.selected_quotation_id)
    ).scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected quotation not found")

    supplier = db.execute(
        select(SupplierProfile).where(SupplierProfile.id == quotation.supplier_id)
    ).scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supplier profile not found")

    now_dt = datetime.now(timezone.utc)
    po_no = f"PO-BS-{now_dt.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    est_date = estimated_delivery_date or (now_dt + timedelta(days=2))

    po = ProcurementOrder(
        group_order_id=group_order_id,
        supplier_id=supplier.id,
        po_number=po_no,
        status=ProcurementStatus.PLACED.value,
        total_amount=group_order.total_wholesale_amount,
        estimated_delivery_date=est_date,
        notes=notes or f"Automated wholesale PO generated from locked Group Purchase {group_order.group_id}",
    )
    db.add(po)

    # Generate MemberFulfillment records for each confirmed member in frozen snapshot
    alloc_data = json.loads(group_order.order_allocations_data)
    members = alloc_data.get("members", [])

    for m in members:
        uid = m.get("user_id")
        if not uid:
            continue
        pref = m.get("fulfillment_preference", "PICKUP")
        addr = m.get("delivery_address")
        pickup_pin = generate_pickup_code() if pref == "PICKUP" else None

        existing_ful = db.execute(
            select(MemberFulfillment).where(
                MemberFulfillment.group_order_id == group_order_id,
                MemberFulfillment.user_id == uid,
            )
        ).scalar_one_or_none()

        if not existing_ful:
            ful = MemberFulfillment(
                group_order_id=group_order_id,
                user_id=uid,
                fulfillment_type=pref,
                pickup_code=pickup_pin,
                delivery_address=addr,
                status=FulfillmentStatus.PENDING_PROCUREMENT.value,
                notes=f"Fulfillment scheduled via {pref}",
            )
            db.add(ful)

    # Update GroupOrder status
    group_order.status = OrderLockStatus.PROCUREMENT_PENDING.value
    db.add(group_order)
    db.commit()
    db.refresh(po)

    # Log audit event
    log_audit_event(
        entity_type="PROCUREMENT_ORDER",
        entity_id=po.id,
        action="WHOLESALE_PO_PLACED",
        db=db,
        actor_user_id=admin_user.id,
        actor_role="ADMIN",
        details={
            "po_number": po_no,
            "supplier_id": supplier.id,
            "supplier_name": supplier.company_name,
            "total_amount": group_order.total_wholesale_amount,
        },
    )

    # Notify supplier user
    create_notification(
        db=db,
        user_id=supplier.user_id,
        title="New Wholesale Purchase Order",
        message=f"Purchase Order {po_no} for ₹{group_order.total_wholesale_amount:.2f} has been placed.",
        type=NotificationType.PO_PLACED.value,
    )

    # Broadcast notification to group members
    broadcast_group_order_notification(
        db=db,
        group_order=group_order,
        title="Wholesale Procurement Placed",
        message=f"Admin has dispatched wholesale order {po_no} to {supplier.company_name}.",
        type=NotificationType.PO_PLACED.value,
    )

    return po


def update_procurement_status(
    db: Session,
    procurement_id: str,
    actor_user: User,
    new_status: str,
    notes: Optional[str] = None,
) -> ProcurementOrder:
    """Transition wholesale procurement lifecycle."""
    po = db.execute(
        select(ProcurementOrder).where(ProcurementOrder.id == procurement_id)
    ).scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procurement order not found")

    supplier = db.execute(
        select(SupplierProfile).where(SupplierProfile.id == po.supplier_id)
    ).scalar_one_or_none()

    # Access control: either admin or assigned supplier
    is_admin = actor_user.role == UserRole.ADMIN.value
    is_supplier = supplier and supplier.user_id == actor_user.id

    if not (is_admin or is_supplier):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only assigned supplier or admin can update procurement status",
        )

    now_dt = datetime.now(timezone.utc)
    po.status = new_status
    if notes:
        po.notes = notes

    group_order = db.execute(
        select(GroupOrder).where(GroupOrder.id == po.group_order_id)
    ).scalar_one_or_none()

    if new_status == ProcurementStatus.DISPATCHED_TO_HUB.value:
        po.dispatched_at = now_dt
        if group_order:
            broadcast_group_order_notification(
                db=db,
                group_order=group_order,
                title="Wholesale Goods Dispatched",
                message=f"Wholesale shipment {po.po_number} is in transit to the neighborhood hub.",
                type=NotificationType.PO_DISPATCHED.value,
            )

    elif new_status == ProcurementStatus.DELIVERED_TO_HUB.value:
        po.delivered_to_hub_at = now_dt
        if group_order:
            group_order.status = OrderLockStatus.PROCURED.value
            db.add(group_order)

            # Update all member fulfillments to ready state
            fulfillments = db.execute(
                select(MemberFulfillment).where(MemberFulfillment.group_order_id == group_order.id)
            ).scalars().all()

            for f in fulfillments:
                if f.fulfillment_type == "PICKUP":
                    f.status = FulfillmentStatus.READY_FOR_PICKUP.value
                    create_notification(
                        db=db,
                        user_id=f.user_id,
                        title="Your Groceries Are Ready for Pickup!",
                        message=f"Show verification code {f.pickup_code} at the neighborhood hub to collect your items.",
                        type=NotificationType.READY_FOR_PICKUP.value,
                    )
                else:
                    f.status = FulfillmentStatus.OUT_FOR_DELIVERY.value
                    f.dispatched_at = now_dt
                    create_notification(
                        db=db,
                        user_id=f.user_id,
                        title="Out for Home Delivery",
                        message="Your bulk share order has reached the neighborhood hub and is out for home delivery.",
                        type=NotificationType.PO_DISPATCHED.value,
                    )
                db.add(f)

    db.add(po)
    db.commit()
    db.refresh(po)

    # Log audit event
    log_audit_event(
        entity_type="PROCUREMENT_ORDER",
        entity_id=po.id,
        action=f"PO_{new_status}",
        db=db,
        actor_user_id=actor_user.id,
        actor_role=actor_user.role,
        details={"status": new_status, "notes": notes},
    )

    return po


def get_supplier_procurement_orders(
    db: Session,
    supplier_user: User,
) -> List[ProcurementOrder]:
    """List all procurement orders assigned to a supplier."""
    supplier = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == supplier_user.id)
    ).scalar_one_or_none()
    if not supplier:
        return []

    return db.execute(
        select(ProcurementOrder)
        .where(ProcurementOrder.supplier_id == supplier.id)
        .order_by(ProcurementOrder.created_at.desc())
    ).scalars().all()
