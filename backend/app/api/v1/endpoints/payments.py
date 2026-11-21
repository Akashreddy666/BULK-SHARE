from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.payment import (
    PaymentCreateRequest,
    PaymentTransactionRead,
    HouseholdInvoiceRead,
    GroupOrderPaymentSummaryRead,
)
from app.services.payment import (
    process_simulated_payment,
    get_household_invoice,
    get_order_payment_summary,
)

router = APIRouter(tags=["Payments"])


@router.post(
    "/orders/{group_order_id}/payments/simulate",
    response_model=PaymentTransactionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Process simulated payment for customer household allocation",
)
def pay_order_share(
    group_order_id: str,
    payload: PaymentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return process_simulated_payment(
        db=db,
        group_order_id=group_order_id,
        user_id=current_user.id,
        payment_method=payload.payment_method,
        notes=payload.notes,
    )


@router.get(
    "/orders/{group_order_id}/invoice",
    response_model=HouseholdInvoiceRead,
    summary="Get itemized household invoice, savings breakdown, and receipt",
)
def get_user_invoice(
    group_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_household_invoice(
        db=db,
        group_order_id=group_order_id,
        user_id=current_user.id,
    )


@router.get(
    "/orders/{group_order_id}/payments/summary",
    response_model=GroupOrderPaymentSummaryRead,
    summary="Get collective payment collection status for a locked group order",
)
def get_payment_summary(
    group_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_order_payment_summary(
        db=db,
        group_order_id=group_order_id,
    )
