import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.group import BuyingGroup, GroupStatus, GroupMember
from app.models.grocery_list import GroceryListItem
from app.models.catalog import ProductVariant
from app.models.quotation import SupplierQuotation, QuotationItem, QuotationStatus
from app.models.order import (
    ConfirmationRound,
    MemberConfirmation,
    GroupOrder,
    RoundStatus,
    MemberConfirmationStatus,
    OrderLockStatus,
)
from app.services.audit import log_audit_event


def start_confirmation_round(
    group_id: str,
    quotation_id: str,
    organizer_user_id: str,
    db: Session,
    deadline_hours: int = 48,
    notes: Optional[str] = None,
) -> ConfirmationRound:
    """
    Organizer selects a quotation and begins Round 1 of member confirmations.
    Transitions group to CONFIRMING status.
    """
    group = db.execute(select(BuyingGroup).where(BuyingGroup.id == group_id)).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    if group.organizer_id != organizer_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the organizer can select a quotation")

    quotation = db.execute(
        select(SupplierQuotation)
        .where(SupplierQuotation.id == quotation_id)
        .options(joinedload(SupplierQuotation.items))
    ).unique().scalar_one_or_none()

    if not quotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier quotation not found")

    # Mark this quotation ACCEPTED, mark other submitted quotes as REJECTED
    quotation.status = QuotationStatus.ACCEPTED.value
    db.add(quotation)

    other_quotes = (
        db.execute(
            select(SupplierQuotation).where(
                SupplierQuotation.demand_snapshot_id == quotation.demand_snapshot_id,
                SupplierQuotation.id != quotation.id,
            )
        )
        .scalars()
        .all()
    )
    for oq in other_quotes:
        oq.status = QuotationStatus.REJECTED.value
        db.add(oq)

    # Transition Group status to CONFIRMING
    group.status = GroupStatus.CONFIRMING.value
    db.add(group)

    # Create ConfirmationRound (Round 1)
    deadline = datetime.now(timezone.utc) + timedelta(hours=deadline_hours)
    round_record = ConfirmationRound(
        group_id=group.id,
        selected_quotation_id=quotation.id,
        round_number=1,
        status=RoundStatus.OPEN.value,
        deadline=deadline,
        notes=notes,
    )
    db.add(round_record)
    db.flush()

    # Map variant rates from the selected quotation
    quote_rate_map = {item.variant_id: item.quoted_price_per_pack for item in quotation.items}

    # Query all active member grocery lists in this group
    member_items_stmt = (
        select(GroceryListItem)
        .where(GroceryListItem.group_id == group.id)
        .options(joinedload(GroceryListItem.variant))
    )
    all_items = db.execute(member_items_stmt).scalars().all()

    # Group items by user_id
    user_items_map = {}
    for it in all_items:
        user_items_map.setdefault(it.user_id, []).append(it)

    # For each member with items, calculate household cost & savings under this quote
    for u_id, items in user_items_map.items():
        household_cost = 0.0
        household_savings = 0.0

        for it in items:
            quoted_rate = quote_rate_map.get(it.variant_id, it.variant.reference_retail_price)
            retail_line = it.pack_quantity * it.variant.reference_retail_price
            quoted_line = it.pack_quantity * quoted_rate
            household_cost += quoted_line
            household_savings += max(0.0, retail_line - quoted_line)

        member_conf = MemberConfirmation(
            confirmation_round_id=round_record.id,
            group_id=group.id,
            user_id=u_id,
            status=MemberConfirmationStatus.PENDING.value,
            total_household_cost=round(household_cost, 2),
            total_household_savings=round(household_savings, 2),
            fulfillment_preference="PICKUP",
        )
        db.add(member_conf)

    db.commit()

    # Log audit event
    log_audit_event(
        entity_type="BUYING_GROUP",
        entity_id=group.id,
        action="QUOTATION_SELECTED",
        db=db,
        actor_user_id=organizer_user_id,
        actor_role="ORGANIZER",
        details={
            "quotation_id": quotation.id,
            "round_id": round_record.id,
            "round_number": 1,
            "deadline": deadline.isoformat(),
        },
    )

    db.refresh(round_record)
    return round_record


def submit_member_confirmation(
    group_id: str,
    user_id: str,
    confirm_status: str,  # ACCEPTED or REJECTED
    fulfillment_pref: str,
    delivery_address: Optional[str],
    rejection_reason: Optional[str],
    db: Session,
) -> MemberConfirmation:
    """Submit approval or rejection for the active confirmation round."""
    # Find latest open confirmation round for group
    round_record = (
        db.execute(
            select(ConfirmationRound)
            .where(
                ConfirmationRound.group_id == group_id,
                ConfirmationRound.status == RoundStatus.OPEN.value,
            )
            .order_by(ConfirmationRound.round_number.desc())
        )
        .scalars()
        .first()
    )

    if not round_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No open confirmation round found for this group",
        )

    # Find member confirmation record
    confirmation = db.execute(
        select(MemberConfirmation).where(
            MemberConfirmation.confirmation_round_id == round_record.id,
            MemberConfirmation.user_id == user_id,
        )
    ).scalar_one_or_none()

    if not confirmation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You do not have a pending allocation in this confirmation round",
        )

    confirmation.status = confirm_status
    confirmation.fulfillment_preference = fulfillment_pref
    confirmation.delivery_address = delivery_address
    confirmation.rejection_reason = rejection_reason
    confirmation.confirmed_at = datetime.now(timezone.utc)

    db.add(confirmation)
    db.commit()

    # Log audit event
    log_audit_event(
        entity_type="CONFIRMATION_ROUND",
        entity_id=round_record.id,
        action=f"MEMBER_{confirm_status}",
        db=db,
        actor_user_id=user_id,
        actor_role="CUSTOMER",
        details={
            "group_id": group_id,
            "status": confirm_status,
            "fulfillment_preference": fulfillment_pref,
            "rejection_reason": rejection_reason,
        },
    )

    db.refresh(confirmation)
    return confirmation


def trigger_recalculation_round(
    group_id: str,
    organizer_user_id: str,
    db: Session,
    deadline_hours: int = 24,
) -> ConfirmationRound:
    """
    Per business rule 5: If a member rejects a quotation, recalculate the order
    and allow exactly one additional confirmation round (Round 2).
    """
    group = db.execute(select(BuyingGroup).where(BuyingGroup.id == group_id)).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    if group.organizer_id != organizer_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organizer can trigger recalculation")

    # Get round 1
    round_1 = (
        db.execute(
            select(ConfirmationRound)
            .where(
                ConfirmationRound.group_id == group_id,
                ConfirmationRound.round_number == 1,
            )
        )
        .scalars()
        .first()
    )

    if not round_1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Round 1 not found")

    # Check if Round 2 already exists (only 1 recalculation round allowed)
    round_2_exists = db.execute(
        select(ConfirmationRound).where(
            ConfirmationRound.group_id == group_id,
            ConfirmationRound.round_number == 2,
        )
    ).scalar_one_or_none()

    if round_2_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum recalculation limit reached (1 retry allowed). If rejections persist, group order must be cancelled.",
        )

    # Identify rejecting members
    rejections = (
        db.execute(
            select(MemberConfirmation).where(
                MemberConfirmation.confirmation_round_id == round_1.id,
                MemberConfirmation.status == MemberConfirmationStatus.REJECTED.value,
            )
        )
        .scalars()
        .all()
    )
    rejecting_user_ids = {r.user_id for r in rejections}

    # Delete grocery list items of rejecting members so pooled demand recalculates cleanly
    if rejecting_user_ids:
        rejecting_items = (
            db.execute(
                select(GroceryListItem).where(
                    GroceryListItem.group_id == group_id,
                    GroceryListItem.user_id.in_(rejecting_user_ids),
                )
            )
            .scalars()
            .all()
        )
        for it in rejecting_items:
            db.delete(it)

    # Mark round 1 as RECALCULATED
    round_1.status = RoundStatus.RECALCULATED.value
    db.add(round_1)

    # Create Round 2
    deadline = datetime.now(timezone.utc) + timedelta(hours=deadline_hours)
    round_2 = ConfirmationRound(
        group_id=group_id,
        selected_quotation_id=round_1.selected_quotation_id,
        round_number=2,
        status=RoundStatus.OPEN.value,
        deadline=deadline,
        notes="Recalculated Round 2 following member rejection/adjustments. Final confirmation opportunity.",
    )
    db.add(round_2)
    db.flush()

    # Re-calculate remaining confirming members' allocations
    quotation = db.execute(
        select(SupplierQuotation)
        .where(SupplierQuotation.id == round_1.selected_quotation_id)
        .options(joinedload(SupplierQuotation.items))
    ).unique().scalar_one()

    quote_rate_map = {item.variant_id: item.quoted_price_per_pack for item in quotation.items}

    remaining_items = (
        db.execute(
            select(GroceryListItem)
            .where(GroceryListItem.group_id == group.id)
            .options(joinedload(GroceryListItem.variant))
        )
        .scalars()
        .all()
    )

    remaining_user_items = {}
    for it in remaining_items:
        remaining_user_items.setdefault(it.user_id, []).append(it)

    for u_id, items in remaining_user_items.items():
        household_cost = 0.0
        household_savings = 0.0
        for it in items:
            quoted_rate = quote_rate_map.get(it.variant_id, it.variant.reference_retail_price)
            retail_line = it.pack_quantity * it.variant.reference_retail_price
            quoted_line = it.pack_quantity * quoted_rate
            household_cost += quoted_line
            household_savings += max(0.0, retail_line - quoted_line)

        member_conf = MemberConfirmation(
            confirmation_round_id=round_2.id,
            group_id=group.id,
            user_id=u_id,
            status=MemberConfirmationStatus.PENDING.value,
            total_household_cost=round(household_cost, 2),
            total_household_savings=round(household_savings, 2),
            fulfillment_preference="PICKUP",
        )
        db.add(member_conf)

    db.commit()

    log_audit_event(
        entity_type="BUYING_GROUP",
        entity_id=group.id,
        action="ORDER_RECALCULATED",
        db=db,
        actor_user_id=organizer_user_id,
        actor_role="ORGANIZER",
        details={
            "old_round_id": round_1.id,
            "new_round_id": round_2.id,
            "removed_users_count": len(rejecting_user_ids),
        },
    )

    db.refresh(round_2)
    return round_2


def lock_group_order(
    group_id: str,
    locked_by_user_id: str,
    db: Session,
) -> GroupOrder:
    """
    Freezes allocations, locks the group purchase, and creates the immutable GroupOrder.
    Transitions group status to LOCKED.
    """
    group = db.execute(select(BuyingGroup).where(BuyingGroup.id == group_id)).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    # Get latest confirmation round
    round_record = (
        db.execute(
            select(ConfirmationRound)
            .where(ConfirmationRound.group_id == group_id)
            .order_by(ConfirmationRound.round_number.desc())
        )
        .scalars()
        .first()
    )

    if not round_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No confirmation round found")

    # Fetch all member confirmations for this round
    confirmations = (
        db.execute(
            select(MemberConfirmation)
            .where(MemberConfirmation.confirmation_round_id == round_record.id)
            .options(joinedload(MemberConfirmation.user))
        )
        .scalars()
        .all()
    )

    # Check if there are any rejections in the final round
    rejections = [c for c in confirmations if c.status == MemberConfirmationStatus.REJECTED.value]
    if rejections and round_record.round_number >= 2:
        # Business rule: If final confirmation round fails, cancel group purchase
        group.status = GroupStatus.CANCELLED.value
        round_record.status = RoundStatus.FAILED.value
        db.add(group)
        db.add(round_record)
        db.commit()

        log_audit_event(
            entity_type="BUYING_GROUP",
            entity_id=group.id,
            action="GROUP_PURCHASE_CANCELLED",
            db=db,
            actor_user_id=locked_by_user_id,
            actor_role="ORGANIZER",
            details={"reason": "Final confirmation round failed due to member rejections"},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Final confirmation round failed. Group purchase has been cancelled per business rules.",
        )

    # Calculate final totals
    total_wholesale = sum(c.total_household_cost for c in confirmations if c.status == MemberConfirmationStatus.ACCEPTED.value)
    total_savings = sum(c.total_household_savings for c in confirmations if c.status == MemberConfirmationStatus.ACCEPTED.value)
    total_retail = total_wholesale + total_savings

    # Get total packs
    confirmed_user_ids = [c.user_id for c in confirmations if c.status == MemberConfirmationStatus.ACCEPTED.value]
    items = (
        db.execute(
            select(GroceryListItem)
            .where(
                GroceryListItem.group_id == group_id,
                GroceryListItem.user_id.in_(confirmed_user_ids),
            )
            .options(joinedload(GroceryListItem.variant))
        )
        .scalars()
        .all()
    )
    total_packs = sum(it.pack_quantity for it in items)

    # Freeze allocations as immutable JSON snapshot
    allocations_snapshot = {
        "group_id": group_id,
        "group_name": group.name,
        "locked_at": datetime.now(timezone.utc).isoformat(),
        "selected_quotation_id": round_record.selected_quotation_id,
        "members": [
            {
                "user_id": c.user_id,
                "user_name": c.user.full_name if c.user else "Member",
                "household_cost": c.total_household_cost,
                "household_savings": c.total_household_savings,
                "fulfillment_preference": c.fulfillment_preference,
                "delivery_address": c.delivery_address,
            }
            for c in confirmations
            if c.status == MemberConfirmationStatus.ACCEPTED.value
        ],
        "items": [
            {
                "user_id": it.user_id,
                "variant_id": it.variant_id,
                "brand": it.variant.brand,
                "sku": it.variant.sku,
                "pack_quantity": it.pack_quantity,
                "brand_preference": it.brand_preference,
            }
            for it in items
        ],
    }

    # Create or update GroupOrder
    order = db.execute(select(GroupOrder).where(GroupOrder.group_id == group_id)).scalar_one_or_none()
    if order:
        order.selected_quotation_id = round_record.selected_quotation_id
        order.confirmation_round_id = round_record.id
        order.status = OrderLockStatus.LOCKED.value
        order.total_retail_amount = round(total_retail, 2)
        order.total_wholesale_amount = round(total_wholesale, 2)
        order.total_savings_amount = round(total_savings, 2)
        order.total_packs = total_packs
        order.locked_at = datetime.now(timezone.utc)
        order.locked_by_user_id = locked_by_user_id
        order.order_allocations_data = json.dumps(allocations_snapshot)
    else:
        order = GroupOrder(
            group_id=group_id,
            selected_quotation_id=round_record.selected_quotation_id,
            confirmation_round_id=round_record.id,
            status=OrderLockStatus.LOCKED.value,
            total_retail_amount=round(total_retail, 2),
            total_wholesale_amount=round(total_wholesale, 2),
            total_savings_amount=round(total_savings, 2),
            total_packs=total_packs,
            locked_at=datetime.now(timezone.utc),
            locked_by_user_id=locked_by_user_id,
            order_allocations_data=json.dumps(allocations_snapshot),
        )
    db.add(order)

    # Update Group & Round status
    group.status = GroupStatus.LOCKED.value
    round_record.status = RoundStatus.COMPLETED.value
    db.add(group)
    db.add(round_record)
    db.commit()

    log_audit_event(
        entity_type="BUYING_GROUP",
        entity_id=group.id,
        action="ORDER_LOCKED",
        db=db,
        actor_user_id=locked_by_user_id,
        actor_role="ORGANIZER",
        details={
            "order_id": order.id,
            "group_id": group_id,
            "total_packs": total_packs,
            "total_wholesale": total_wholesale,
            "confirmed_members_count": len(confirmed_user_ids),
        },
    )

    db.refresh(order)
    return order
