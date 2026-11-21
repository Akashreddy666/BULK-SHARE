from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.fulfillment import (
    MemberFulfillmentRead,
    VerifyPickupRequest,
    UpdateFulfillmentStatusRequest,
)
from app.services.fulfillment import (
    get_order_fulfillments,
    verify_pickup_code,
    update_delivery_status,
)

router = APIRouter(tags=["Fulfillment"])


@router.get(
    "/orders/{group_order_id}/fulfillments",
    response_model=List[MemberFulfillmentRead],
    summary="List member fulfillment records for a group order",
)
def list_fulfillments(
    group_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_order_fulfillments(
        db=db,
        group_order_id=group_order_id,
        user=current_user,
    )


@router.post(
    "/orders/{group_order_id}/fulfillments/verify-pickup",
    response_model=MemberFulfillmentRead,
    summary="Verify customer pickup code at the hub and release goods",
)
def hub_verify_pickup(
    group_order_id: str,
    payload: VerifyPickupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return verify_pickup_code(
        db=db,
        group_order_id=group_order_id,
        pickup_code=payload.pickup_code,
        verifier_user=current_user,
    )


@router.patch(
    "/orders/{group_order_id}/fulfillments/{fulfillment_id}/status",
    response_model=MemberFulfillmentRead,
    summary="Update home delivery fulfillment status",
)
def change_delivery_status(
    group_order_id: str,
    fulfillment_id: str,
    payload: UpdateFulfillmentStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_delivery_status(
        db=db,
        group_order_id=group_order_id,
        fulfillment_id=fulfillment_id,
        new_status=payload.status,
        verifier_user=current_user,
        notes=payload.notes,
    )
