from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.dispute import OrderDispute
from app.schemas.dispute import (
    DisputeCreateRequest,
    DisputeResolveRequest,
    OrderDisputeRead,
)
from app.services.dispute import (
    raise_dispute,
    resolve_dispute,
    get_admin_disputes,
)

router = APIRouter(tags=["Disputes"])


@router.post(
    "/orders/{group_order_id}/disputes",
    response_model=OrderDisputeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Customer raises dispute or issue against an order",
)
def create_order_dispute(
    group_order_id: str,
    payload: DisputeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dispute = raise_dispute(
        db=db,
        group_order_id=group_order_id,
        user=current_user,
        category=payload.category,
        description=payload.description,
    )
    return OrderDisputeRead(
        id=dispute.id,
        group_order_id=dispute.group_order_id,
        user_id=dispute.user_id,
        user_name=current_user.full_name,
        category=dispute.category,
        description=dispute.description,
        status=dispute.status,
        refund_amount=dispute.refund_amount,
        resolution_notes=dispute.resolution_notes,
        resolved_at=dispute.resolved_at,
        resolved_by_user_id=dispute.resolved_by_user_id,
        created_at=dispute.created_at,
    )


@router.get(
    "/orders/{group_order_id}/disputes",
    response_model=List[OrderDisputeRead],
    summary="List disputes for a specific group order",
)
def list_order_disputes(
    group_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    disputes = db.execute(
        select(OrderDispute).where(OrderDispute.group_order_id == group_order_id)
    ).scalars().all()

    return [
        OrderDisputeRead(
            id=d.id,
            group_order_id=d.group_order_id,
            user_id=d.user_id,
            user_name="Member",
            category=d.category,
            description=d.description,
            status=d.status,
            refund_amount=d.refund_amount,
            resolution_notes=d.resolution_notes,
            resolved_at=d.resolved_at,
            resolved_by_user_id=d.resolved_by_user_id,
            created_at=d.created_at,
        )
        for d in disputes
    ]


@router.get(
    "/admin/disputes",
    response_model=List[OrderDisputeRead],
    summary="Platform admin lists all disputes",
)
def admin_list_disputes(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_admin_disputes(db=db, filter_status=status_filter)


@router.patch(
    "/admin/disputes/{dispute_id}/resolve",
    response_model=OrderDisputeRead,
    summary="Admin resolves or rejects a customer dispute",
)
def admin_resolve_dispute(
    dispute_id: str,
    payload: DisputeResolveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dispute = resolve_dispute(
        db=db,
        dispute_id=dispute_id,
        admin_user=current_user,
        status_choice=payload.status,
        resolution_notes=payload.resolution_notes,
        refund_amount=payload.refund_amount,
    )
    return OrderDisputeRead(
        id=dispute.id,
        group_order_id=dispute.group_order_id,
        user_id=dispute.user_id,
        user_name="Customer",
        category=dispute.category,
        description=dispute.description,
        status=dispute.status,
        refund_amount=dispute.refund_amount,
        resolution_notes=dispute.resolution_notes,
        resolved_at=dispute.resolved_at,
        resolved_by_user_id=dispute.resolved_by_user_id,
        created_at=dispute.created_at,
    )
