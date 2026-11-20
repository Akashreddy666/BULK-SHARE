from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.group import BuyingGroup, GroupMember
from app.models.quotation import DemandSnapshot
from app.schemas.quotation import (
    DemandSummaryResponse,
    DemandSnapshotRead,
    HouseholdSavingsResponse,
)
from app.services.aggregation import calculate_group_demand, create_demand_snapshot
from app.services.savings import calculate_household_savings

router = APIRouter(tags=["Demand Aggregation & Savings"])


@router.get("/groups/{group_id}/demand-summary", response_model=DemandSummaryResponse)
def get_group_demand_summary(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get privacy-preserving aggregated grocery demand for a buying group.
    Shows total sealed packs per SKU and wholesale volume tier qualification.
    Zero individual member names or addresses are disclosed.
    """
    # Permission check: must be a member, organizer, or admin
    is_admin = current_user.role == UserRole.ADMIN.value
    if not is_admin:
        member = (
            db.execute(
                select(GroupMember).where(
                    GroupMember.group_id == group_id,
                    GroupMember.user_id == current_user.id,
                )
            )
            .scalar_one_or_none()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a member of this buying group to view aggregated demand",
            )

    return calculate_group_demand(group_id, db)


@router.post("/groups/{group_id}/demand-snapshot", response_model=DemandSnapshotRead, status_code=status.HTTP_201_CREATED)
def trigger_demand_snapshot(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates an immutable DemandSnapshot for quotation procurement and moves group to QUOTING status.
    Restricted to group organizer or admin.
    """
    group = db.execute(select(BuyingGroup).where(BuyingGroup.id == group_id)).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    is_admin = current_user.role == UserRole.ADMIN.value
    is_organizer = group.organizer_id == current_user.id

    if not (is_admin or is_organizer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group organizer or an admin can trigger a demand snapshot",
        )

    snapshot = create_demand_snapshot(group_id, db)
    return snapshot


@router.get("/groups/{group_id}/demand-snapshots", response_model=List[DemandSnapshotRead])
def list_demand_snapshots(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List historical and active demand snapshots for a buying group."""
    snapshots = (
        db.execute(
            select(DemandSnapshot)
            .where(DemandSnapshot.group_id == group_id)
            .order_by(DemandSnapshot.snapshot_version.desc())
        )
        .scalars()
        .all()
    )
    return snapshots


@router.get("/groups/{group_id}/savings", response_model=HouseholdSavingsResponse)
def get_my_household_savings(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate the current user's individual household cost and savings
    based on the group's unlocked wholesale tiers.
    """
    return calculate_household_savings(group_id, current_user.id, db)
