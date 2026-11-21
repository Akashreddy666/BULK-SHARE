import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dispute import OrderDispute, DisputeStatus
from app.models.order import GroupOrder
from app.models.user import User, UserRole
from app.models.payment import PaymentTransaction, PaymentStatus
from app.schemas.dispute import OrderDisputeRead
from app.services.audit import log_audit_event
from app.services.notification import create_notification
from app.models.notification import NotificationType


def raise_dispute(
    db: Session,
    group_order_id: str,
    user: User,
    category: str,
    description: str,
) -> OrderDispute:
    """Submit a customer dispute or quality claim against a group purchase."""
    group_order = db.execute(
        select(GroupOrder).where(GroupOrder.id == group_order_id)
    ).scalar_one_or_none()
    if not group_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group order not found")

    dispute = OrderDispute(
        group_order_id=group_order_id,
        user_id=user.id,
        category=category,
        description=description,
        status=DisputeStatus.OPEN.value,
        refund_amount=0.0,
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    # Log audit event
    log_audit_event(
        entity_type="ORDER_DISPUTE",
        entity_id=dispute.id,
        action="DISPUTE_RAISED",
        db=db,
        actor_user_id=user.id,
        actor_role="CUSTOMER",
        details={
            "group_order_id": group_order_id,
            "category": category,
            "description": description[:100],
        },
    )

    # Notify user
    create_notification(
        db=db,
        user_id=user.id,
        title="Dispute Ticket Registered",
        message=f"Your ticket #{dispute.id[:8]} for '{category}' has been submitted. Platform admin is reviewing.",
        type=NotificationType.DISPUTE_RAISED.value,
    )

    return dispute


def resolve_dispute(
    db: Session,
    dispute_id: str,
    admin_user: User,
    status_choice: str,
    resolution_notes: str,
    refund_amount: Optional[float] = 0.0,
) -> OrderDispute:
    """Platform administrator resolves or rejects a customer dispute."""
    if admin_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform administrators can resolve customer disputes",
        )

    dispute = db.execute(
        select(OrderDispute).where(OrderDispute.id == dispute_id)
    ).scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute ticket not found")

    now_dt = datetime.now(timezone.utc)
    dispute.status = status_choice
    dispute.resolution_notes = resolution_notes
    dispute.refund_amount = round(refund_amount or 0.0, 2)
    dispute.resolved_at = now_dt
    dispute.resolved_by_user_id = admin_user.id

    # If refund granted, simulate refund payment record
    if dispute.refund_amount > 0 and status_choice == DisputeStatus.RESOLVED.value:
        refund_txn = PaymentTransaction(
            group_order_id=dispute.group_order_id,
            user_id=dispute.user_id,
            amount=-dispute.refund_amount,
            currency="INR",
            payment_method="SIMULATED_WALLET",
            transaction_ref=f"RFD-BS-{now_dt.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            receipt_number=f"RFD-RCP-{uuid.uuid4().hex[:6].upper()}",
            status=PaymentStatus.REFUNDED.value,
            paid_at=now_dt,
            notes=f"Simulated refund for Dispute #{dispute.id[:8]}: {resolution_notes}",
        )
        db.add(refund_txn)

    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    # Log audit event
    log_audit_event(
        entity_type="ORDER_DISPUTE",
        entity_id=dispute.id,
        action=f"DISPUTE_{status_choice}",
        db=db,
        actor_user_id=admin_user.id,
        actor_role="ADMIN",
        details={
            "status": status_choice,
            "refund_amount": dispute.refund_amount,
            "resolution_notes": resolution_notes,
        },
    )

    # Notify customer
    refund_msg = f" A simulated refund of ₹{dispute.refund_amount:.2f} has been credited." if dispute.refund_amount > 0 else ""
    create_notification(
        db=db,
        user_id=dispute.user_id,
        title=f"Dispute Ticket #{dispute.id[:8]} {status_choice.capitalize()}",
        message=f"{resolution_notes}{refund_msg}",
        type=NotificationType.DISPUTE_RESOLVED.value,
    )

    return dispute


def get_admin_disputes(
    db: Session,
    filter_status: Optional[str] = None,
) -> List[OrderDisputeRead]:
    """List disputes with user contact information for admin review."""
    query = select(OrderDispute)
    if filter_status:
        query = query.where(OrderDispute.status == filter_status)
    query = query.order_by(OrderDispute.created_at.desc())

    disputes = db.execute(query).scalars().all()
    results: List[OrderDisputeRead] = []

    user_cache = {}
    for d in disputes:
        if d.user_id not in user_cache:
            u_obj = db.execute(select(User).where(User.id == d.user_id)).scalar_one_or_none()
            user_cache[d.user_id] = u_obj
        u = user_cache[d.user_id]

        results.append(
            OrderDisputeRead(
                id=d.id,
                group_order_id=d.group_order_id,
                user_id=d.user_id,
                user_name=u.full_name if u else "Customer",
                category=d.category,
                description=d.description,
                status=d.status,
                refund_amount=d.refund_amount,
                resolution_notes=d.resolution_notes,
                resolved_at=d.resolved_at,
                resolved_by_user_id=d.resolved_by_user_id,
                created_at=d.created_at,
            )
        )

    return results
