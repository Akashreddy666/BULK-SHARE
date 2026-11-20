from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.group import BuyingGroup
from app.models.quotation import SupplierQuotation, QuotationItem
from app.models.order import (
    ConfirmationRound,
    MemberConfirmation,
    GroupOrder,
    RoundStatus,
)
from app.schemas.order import (
    SelectQuotationRequest,
    MemberConfirmRequest,
    MemberConfirmationRead,
    ConfirmationRoundRead,
    GroupOrderRead,
)
from app.services.confirmation import (
    start_confirmation_round,
    submit_member_confirmation,
    trigger_recalculation_round,
    lock_group_order,
)
from app.schemas.quotation import SupplierQuotationRead, QuotationItemRead

router = APIRouter(tags=["Confirmations & Order Locking"])


def _hydrate_round_read(round_record: ConfirmationRound, db: Session) -> ConfirmationRoundRead:
    """Helper to enrich ConfirmationRoundRead with member progress and quotation."""
    confirmations = (
        db.execute(
            select(MemberConfirmation)
            .where(MemberConfirmation.confirmation_round_id == round_record.id)
            .options(joinedload(MemberConfirmation.user))
        )
        .scalars()
        .all()
    )

    conf_reads: List[MemberConfirmationRead] = []
    confirmed_count = 0
    rejected_count = 0
    pending_count = 0

    for c in confirmations:
        cr = MemberConfirmationRead.model_validate(c)
        if c.user:
            cr.user_name = c.user.full_name
        conf_reads.append(cr)

        if c.status == "ACCEPTED":
            confirmed_count += 1
        elif c.status == "REJECTED":
            rejected_count += 1
        else:
            pending_count += 1

    res = ConfirmationRoundRead(
        id=round_record.id,
        group_id=round_record.group_id,
        selected_quotation_id=round_record.selected_quotation_id,
        round_number=round_record.round_number,
        status=round_record.status,
        deadline=round_record.deadline,
        notes=round_record.notes,
        total_members=len(confirmations),
        confirmed_count=confirmed_count,
        rejected_count=rejected_count,
        pending_count=pending_count,
        confirmations=conf_reads,
        created_at=round_record.created_at,
    )

    # Attach quotation read
    if round_record.quotation:
        q = round_record.quotation
        q_read = SupplierQuotationRead.model_validate(q)
        if q.supplier:
            q_read.supplier_name = q.supplier.company_name
        res.selected_quotation = q_read

    return res


@router.post("/groups/{group_id}/select-quotation", response_model=ConfirmationRoundRead, status_code=status.HTTP_201_CREATED)
def select_quotation_and_open_round(
    group_id: str,
    payload: SelectQuotationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Organizer selects a quotation. Starts member confirmation round 1 and moves group to CONFIRMING status.
    """
    round_record = start_confirmation_round(
        group_id=group_id,
        quotation_id=payload.quotation_id,
        organizer_user_id=current_user.id,
        db=db,
        deadline_hours=payload.deadline_hours,
        notes=payload.notes,
    )
    return _hydrate_round_read(round_record, db)


@router.get("/groups/{group_id}/confirmation-round", response_model=Optional[ConfirmationRoundRead])
def get_active_confirmation_round(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get latest confirmation round for a buying group."""
    round_record = (
        db.execute(
            select(ConfirmationRound)
            .where(ConfirmationRound.group_id == group_id)
            .options(
                joinedload(ConfirmationRound.quotation).joinedload(SupplierQuotation.supplier),
                joinedload(ConfirmationRound.quotation).joinedload(SupplierQuotation.items),
            )
            .order_by(ConfirmationRound.round_number.desc())
        )
        .scalars()
        .first()
    )

    if not round_record:
        return None

    return _hydrate_round_read(round_record, db)


@router.post("/groups/{group_id}/confirmation-round/confirm", response_model=MemberConfirmationRead)
def member_confirm(
    group_id: str,
    payload: MemberConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Individual member accepts or rejects their allocation in the active confirmation round.
    Selects Pickup or Home Delivery and optional delivery address.
    """
    confirmation = submit_member_confirmation(
        group_id=group_id,
        user_id=current_user.id,
        confirm_status=payload.status.value,
        fulfillment_pref=payload.fulfillment_preference.value,
        delivery_address=payload.delivery_address,
        rejection_reason=payload.rejection_reason,
        db=db,
    )
    res = MemberConfirmationRead.model_validate(confirmation)
    res.user_name = current_user.full_name
    return res


@router.post("/groups/{group_id}/recalculate", response_model=ConfirmationRoundRead)
def recalculate_order(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Organizer triggers recalculation if any member rejected in Round 1.
    Allows one final confirmation round (Round 2).
    """
    round_2 = trigger_recalculation_round(
        group_id=group_id,
        organizer_user_id=current_user.id,
        db=db,
    )
    return _hydrate_round_read(round_2, db)


@router.post("/groups/{group_id}/lock-order", response_model=GroupOrderRead)
def lock_order(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Organizer locks the group order once confirmations are concluded.
    Freezes allocations and moves group status to LOCKED.
    """
    order = lock_group_order(
        group_id=group_id,
        locked_by_user_id=current_user.id,
        db=db,
    )
    res = GroupOrderRead.model_validate(order)
    if order.quotation and order.quotation.supplier:
        res.supplier_name = order.quotation.supplier.company_name
    return res


@router.get("/groups/{group_id}/order", response_model=Optional[GroupOrderRead])
def get_group_order(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get locked purchase order for a group."""
    order = db.execute(
        select(GroupOrder)
        .where(GroupOrder.group_id == group_id)
        .options(
            joinedload(GroupOrder.quotation).joinedload(SupplierQuotation.supplier)
        )
    ).scalar_one_or_none()

    if not order:
        return None

    res = GroupOrderRead.model_validate(order)
    if order.quotation and order.quotation.supplier:
        res.supplier_name = order.quotation.supplier.company_name
    return res
