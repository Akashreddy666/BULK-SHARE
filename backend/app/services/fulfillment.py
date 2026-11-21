from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import GroupOrder, OrderLockStatus
from app.models.fulfillment import MemberFulfillment, FulfillmentStatus
from app.models.group import BuyingGroup
from app.models.user import User, UserRole
from app.schemas.fulfillment import MemberFulfillmentRead
from app.services.audit import log_audit_event
from app.services.notification import create_notification
from app.models.notification import NotificationType


def get_order_fulfillments(
    db: Session,
    group_order_id: str,
    user: User,
) -> List[MemberFulfillmentRead]:
    """Retrieve fulfillment tracking records with appropriate role-based privacy."""
    group_order = db.execute(
        select(GroupOrder).where(GroupOrder.id == group_order_id)
    ).scalar_one_or_none()
    if not group_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group order not found")

    group = db.execute(
        select(BuyingGroup).where(BuyingGroup.id == group_order.group_id)
    ).scalar_one_or_none()

    is_admin = user.role == UserRole.ADMIN.value
    is_organizer = group and group.organizer_id == user.id

    query = select(MemberFulfillment).where(MemberFulfillment.group_order_id == group_order_id)
    if not (is_admin or is_organizer):
        # Regular customer only views their own fulfillment record
        query = query.where(MemberFulfillment.user_id == user.id)

    fulfillments = db.execute(query).scalars().all()

    # Enrich with user contact details
    results: List[MemberFulfillmentRead] = []
    user_cache = {}

    for f in fulfillments:
        if f.user_id not in user_cache:
            u_obj = db.execute(select(User).where(User.id == f.user_id)).scalar_one_or_none()
            user_cache[f.user_id] = u_obj
        u = user_cache[f.user_id]

        results.append(
            MemberFulfillmentRead(
                id=f.id,
                group_order_id=f.group_order_id,
                user_id=f.user_id,
                user_name=u.full_name if u else "Member",
                user_phone=u.phone if u else None,
                fulfillment_type=f.fulfillment_type,
                pickup_code=f.pickup_code,
                delivery_address=f.delivery_address,
                status=f.status,
                dispatched_at=f.dispatched_at,
                completed_at=f.completed_at,
                verified_by_user_id=f.verified_by_user_id,
                notes=f.notes,
                created_at=f.created_at,
            )
        )

    return results


def verify_pickup_code(
    db: Session,
    group_order_id: str,
    pickup_code: str,
    verifier_user: User,
) -> MemberFulfillment:
    """Verify customer pickup code at the neighborhood hub and release sealed goods."""
    clean_code = pickup_code.strip().upper()

    fulfillment = db.execute(
        select(MemberFulfillment).where(
            MemberFulfillment.group_order_id == group_order_id,
            MemberFulfillment.pickup_code == clean_code,
        )
    ).scalar_one_or_none()

    if not fulfillment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid pickup code. No matching order found for this group.",
        )

    if fulfillment.status == FulfillmentStatus.PICKED_UP.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This package has already been picked up at {fulfillment.completed_at.strftime('%Y-%m-%d %H:%M') if fulfillment.completed_at else 'earlier'}.",
        )

    now_dt = datetime.now(timezone.utc)
    fulfillment.status = FulfillmentStatus.PICKED_UP.value
    fulfillment.completed_at = now_dt
    fulfillment.verified_by_user_id = verifier_user.id
    db.add(fulfillment)
    db.commit()
    db.refresh(fulfillment)

    # Check if all fulfillments completed
    _check_and_mark_order_fulfilled(db, group_order_id)

    # Log audit event
    log_audit_event(
        entity_type="MEMBER_FULFILLMENT",
        entity_id=fulfillment.id,
        action="PICKUP_VERIFIED",
        db=db,
        actor_user_id=verifier_user.id,
        actor_role=verifier_user.role,
        details={
            "pickup_code": clean_code,
            "recipient_user_id": fulfillment.user_id,
            "group_order_id": group_order_id,
        },
    )

    # Notify member
    create_notification(
        db=db,
        user_id=fulfillment.user_id,
        title="Pickup Completed!",
        message=f"Your sealed grocery packages have been verified and handed over at the neighborhood hub.",
        type=NotificationType.DELIVERED.value,
    )

    return fulfillment


def update_delivery_status(
    db: Session,
    group_order_id: str,
    fulfillment_id: str,
    new_status: str,
    verifier_user: User,
    notes: Optional[str] = None,
) -> MemberFulfillment:
    """Mark home delivery completed."""
    fulfillment = db.execute(
        select(MemberFulfillment).where(
            MemberFulfillment.id == fulfillment_id,
            MemberFulfillment.group_order_id == group_order_id,
        )
    ).scalar_one_or_none()

    if not fulfillment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fulfillment record not found")

    now_dt = datetime.now(timezone.utc)
    fulfillment.status = new_status
    if notes:
        fulfillment.notes = notes

    if new_status == FulfillmentStatus.DELIVERED.value:
        fulfillment.completed_at = now_dt
        fulfillment.verified_by_user_id = verifier_user.id

        create_notification(
            db=db,
            user_id=fulfillment.user_id,
            title="Home Delivery Completed",
            message="Your bulk groceries have been delivered to your home address.",
            type=NotificationType.DELIVERED.value,
        )

    db.add(fulfillment)
    db.commit()
    db.refresh(fulfillment)

    # Check if all fulfillments completed
    _check_and_mark_order_fulfilled(db, group_order_id)

    # Log audit event
    log_audit_event(
        entity_type="MEMBER_FULFILLMENT",
        entity_id=fulfillment.id,
        action=f"FULFILLMENT_{new_status}",
        db=db,
        actor_user_id=verifier_user.id,
        actor_role=verifier_user.role,
        details={"status": new_status, "recipient_user_id": fulfillment.user_id},
    )

    return fulfillment


def _check_and_mark_order_fulfilled(db: Session, group_order_id: str) -> None:
    """If all member fulfillments are completed (picked up or delivered), mark group order FULFILLED."""
    all_fuls = db.execute(
        select(MemberFulfillment).where(MemberFulfillment.group_order_id == group_order_id)
    ).scalars().all()

    if all_fuls and all(
        f.status in [FulfillmentStatus.PICKED_UP.value, FulfillmentStatus.DELIVERED.value]
        for f in all_fuls
    ):
        group_order = db.execute(
            select(GroupOrder).where(GroupOrder.id == group_order_id)
        ).scalar_one_or_none()
        if group_order:
            group_order.status = OrderLockStatus.FULFILLED.value
            db.add(group_order)
            db.commit()
