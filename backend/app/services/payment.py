import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import GroupOrder, OrderLockStatus
from app.models.payment import PaymentTransaction, PaymentStatus, PaymentMethod
from app.models.user import User
from app.models.group import BuyingGroup
from app.models.catalog import ProductVariant, Product
from app.schemas.payment import (
    HouseholdInvoiceRead,
    HouseholdInvoiceItemRead,
    GroupOrderPaymentSummaryRead,
)
from app.services.audit import log_audit_event
from app.services.notification import create_notification
from app.models.notification import NotificationType

HOME_DELIVERY_SURCHARGE = 30.0


def get_household_invoice(
    db: Session,
    group_order_id: str,
    user_id: str,
) -> HouseholdInvoiceRead:
    """Generate an itemized household invoice and receipt for a group order allocation."""
    group_order = db.execute(
        select(GroupOrder).where(GroupOrder.id == group_order_id)
    ).scalar_one_or_none()
    if not group_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group order not found")

    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    group = db.execute(
        select(BuyingGroup).where(BuyingGroup.id == group_order.group_id)
    ).scalar_one_or_none()

    alloc_data = json.loads(group_order.order_allocations_data)
    members = alloc_data.get("members", [])
    user_member = next((m for m in members if m.get("user_id") == user_id), None)

    if not user_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User allocation not found in this group order",
        )

    # Find items for this user
    order_items = alloc_data.get("items", [])
    user_items_raw = [it for it in order_items if it.get("user_id") == user_id]

    invoice_items: List[HouseholdInvoiceItemRead] = []
    subtotal_retail = 0.0
    subtotal_wholesale = 0.0

    # Fetch variants for accurate product names & reference prices
    variant_ids = [it.get("variant_id") for it in user_items_raw if it.get("variant_id")]
    variants_map = {}
    if variant_ids:
        vars_res = db.execute(
            select(ProductVariant)
            .where(ProductVariant.id.in_(variant_ids))
        ).scalars().all()
        for v in vars_res:
            product = db.execute(select(Product).where(Product.id == v.product_id)).scalar_one_or_none()
            variants_map[v.id] = (v, product.name if product else "Staple Grocery")

    for raw in user_items_raw:
        vid = raw.get("variant_id")
        qty = raw.get("pack_quantity", 1)
        var_entry = variants_map.get(vid)
        if var_entry:
            v_obj, p_name = var_entry
            ret_rate = v_obj.reference_retail_price
            ret_tot = ret_rate * qty
            ratio = (
                group_order.total_wholesale_amount / group_order.total_retail_amount
                if group_order.total_retail_amount > 0
                else 0.85
            )
            ws_rate = round(ret_rate * ratio, 2)
            ws_tot = round(ws_rate * qty, 2)
            item_savings = round(ret_tot - ws_tot, 2)

            subtotal_retail += ret_tot
            subtotal_wholesale += ws_tot

            invoice_items.append(
                HouseholdInvoiceItemRead(
                    product_name=p_name,
                    variant_brand=v_obj.brand,
                    package_size=float(v_obj.pack_quantity),
                    unit=v_obj.pack_unit,
                    quantity=qty,
                    retail_rate=ret_rate,
                    wholesale_rate=ws_rate,
                    retail_total=ret_tot,
                    wholesale_total=ws_tot,
                    savings=item_savings,
                )
            )

    # Fulfillment & surcharge
    fulfillment_pref = user_member.get("fulfillment_preference", "PICKUP")
    delivery_surcharge = HOME_DELIVERY_SURCHARGE if fulfillment_pref == "HOME_DELIVERY" else 0.0
    final_payable = round(user_member.get("household_cost", subtotal_wholesale) + delivery_surcharge, 2)
    total_savings = round(subtotal_retail - user_member.get("household_cost", subtotal_wholesale), 2)

    # Check payment status
    existing_payment = db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.group_order_id == group_order.id,
            PaymentTransaction.user_id == user_id,
            PaymentTransaction.status == PaymentStatus.COMPLETED.value,
        )
    ).scalar_one_or_none()

    return HouseholdInvoiceRead(
        group_order_id=group_order.id,
        group_name=group.name if group else "Neighborhood Group",
        user_id=user.id,
        user_name=user.full_name,
        user_email=user.email,
        items=invoice_items,
        subtotal_retail=round(subtotal_retail, 2),
        subtotal_wholesale=round(user_member.get("household_cost", subtotal_wholesale), 2),
        total_savings=max(0.0, total_savings),
        fulfillment_type=fulfillment_pref,
        delivery_surcharge=delivery_surcharge,
        final_payable=final_payable,
        payment_status="PAID" if existing_payment else "PENDING",
        receipt_number=existing_payment.receipt_number if existing_payment else None,
        transaction_ref=existing_payment.transaction_ref if existing_payment else None,
        paid_at=existing_payment.paid_at if existing_payment else None,
    )


def process_simulated_payment(
    db: Session,
    group_order_id: str,
    user_id: str,
    payment_method: str = "UPI",
    notes: Optional[str] = None,
) -> PaymentTransaction:
    """Process a simulated payment for a member's allocation."""
    group_order = db.execute(
        select(GroupOrder).where(GroupOrder.id == group_order_id)
    ).scalar_one_or_none()
    if not group_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group order not found")

    # Check for existing completed payment
    existing = db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.group_order_id == group_order_id,
            PaymentTransaction.user_id == user_id,
            PaymentTransaction.status == PaymentStatus.COMPLETED.value,
        )
    ).scalar_one_or_none()
    if existing:
        return existing

    # Calculate payable amount
    invoice = get_household_invoice(db, group_order_id, user_id)
    amount_payable = invoice.final_payable

    random_hex = uuid.uuid4().hex[:8].upper()
    now_dt = datetime.now(timezone.utc)
    txn_ref = f"TXN-BS-{now_dt.strftime('%Y%m%d')}-{random_hex}"
    receipt_no = f"RCP-BS-{now_dt.strftime('%Y%m%d')}-{random_hex}"

    payment = PaymentTransaction(
        group_order_id=group_order_id,
        user_id=user_id,
        amount=amount_payable,
        currency="INR",
        payment_method=payment_method,
        transaction_ref=txn_ref,
        receipt_number=receipt_no,
        status=PaymentStatus.COMPLETED.value,
        paid_at=now_dt,
        notes=notes or f"Simulated {payment_method} settlement for {invoice.group_name}",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Log audit event
    log_audit_event(
        entity_type="GROUP_ORDER",
        entity_id=group_order.id,
        action="PAYMENT_COMPLETED",
        db=db,
        actor_user_id=user_id,
        actor_role="CUSTOMER",
        details={
            "transaction_ref": txn_ref,
            "receipt_number": receipt_no,
            "amount": amount_payable,
            "payment_method": payment_method,
        },
    )

    # In-app notification
    create_notification(
        db=db,
        user_id=user_id,
        title="Payment Successful",
        message=f"Your payment of ₹{amount_payable:.2f} (Receipt #{receipt_no}) for {invoice.group_name} was successful.",
        type=NotificationType.PAYMENT_CONFIRMED.value,
    )

    # Check if all members have now paid
    summary = get_order_payment_summary(db, group_order_id)
    if summary.all_paid and group_order.status == OrderLockStatus.LOCKED.value:
        group_order.status = OrderLockStatus.PROCUREMENT_PENDING.value
        db.add(group_order)
        db.commit()

    return payment


def get_order_payment_summary(
    db: Session,
    group_order_id: str,
) -> GroupOrderPaymentSummaryRead:
    """Summarize overall collected member funds for a locked group order."""
    group_order = db.execute(
        select(GroupOrder).where(GroupOrder.id == group_order_id)
    ).scalar_one_or_none()
    if not group_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group order not found")

    alloc_data = json.loads(group_order.order_allocations_data)
    members = alloc_data.get("members", [])
    total_members = len(members)

    payments = db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.group_order_id == group_order_id,
            PaymentTransaction.status == PaymentStatus.COMPLETED.value,
        )
    ).scalars().all()

    total_collected = sum(p.amount for p in payments)
    paid_user_ids = {p.user_id for p in payments}
    paid_members_count = sum(1 for m in members if m.get("user_id") in paid_user_ids)

    return GroupOrderPaymentSummaryRead(
        group_order_id=group_order_id,
        total_wholesale_amount=group_order.total_wholesale_amount,
        total_collected=round(total_collected, 2),
        total_members=total_members,
        paid_members_count=paid_members_count,
        all_paid=(paid_members_count >= total_members and total_members > 0),
    )
