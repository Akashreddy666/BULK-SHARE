import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.neighborhood import Neighborhood
from app.models.user import User, UserRole
from app.models.group import (
    BuyingGroup,
    GroupVisibility,
    GroupStatus,
    GroupMember,
    GroupInvitation,
)
from app.models.grocery_list import GroceryListItem
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupRead,
    GroupInvitationCreate,
    GroupInvitationRead,
    InvitationRedeemRequest,
)

router = APIRouter(prefix="/groups", tags=["Buying Groups"])


def _to_group_read(group: BuyingGroup, current_user_id: Optional[str] = None) -> GroupRead:
    is_member = False
    is_organizer = False
    members_count = len(group.members) if group.members else 0

    if current_user_id:
        if group.organizer_id == current_user_id:
            is_organizer = True
        if any(m.user_id == current_user_id for m in group.members):
            is_member = True

    return GroupRead(
        id=group.id,
        name=group.name,
        description=group.description,
        neighborhood_id=group.neighborhood_id,
        organizer_id=group.organizer_id,
        visibility=GroupVisibility(group.visibility),
        status=GroupStatus(group.status),
        deadline=group.deadline,
        close_rule=group.close_rule,
        min_members=group.min_members,
        max_members=group.max_members,
        version=group.version,
        created_at=group.created_at,
        updated_at=group.updated_at,
        neighborhood=group.neighborhood,
        organizer=group.organizer,
        members_count=members_count,
        is_member=is_member,
        is_organizer=is_organizer,
    )


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_buying_group(
    payload: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupRead:
    """
    Create a new neighborhood buying group.
    The creator automatically becomes the group organizer and first member.
    """
    # 1. Validate neighborhood exists
    stmt = select(Neighborhood).where(Neighborhood.id == payload.neighborhood_id)
    neighborhood = db.execute(stmt).scalar_one_or_none()
    if not neighborhood or not neighborhood.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified neighborhood is invalid or inactive",
        )

    # 2. Validate deadline is in the future
    now = datetime.now(timezone.utc)
    # Ensure payload.deadline is timezone aware
    deadline = payload.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if deadline <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group order deadline must be in the future",
        )

    # 3. Create buying group
    group = BuyingGroup(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        neighborhood_id=payload.neighborhood_id,
        organizer_id=current_user.id,
        visibility=payload.visibility.value,
        status=GroupStatus.OPEN.value,
        deadline=deadline,
        close_rule=payload.close_rule,
        min_members=payload.min_members,
        max_members=payload.max_members,
        version=1,
    )
    db.add(group)
    db.flush()

    # 4. Add creator as organizer member (FR-GRP-02)
    organizer_membership = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        is_organizer=True,
    )
    db.add(organizer_membership)
    db.commit()

    # Re-fetch with relationships loaded
    stmt = (
        select(BuyingGroup)
        .where(BuyingGroup.id == group.id)
        .options(
            joinedload(BuyingGroup.neighborhood),
            joinedload(BuyingGroup.organizer),
            joinedload(BuyingGroup.members),
        )
    )
    loaded_group = db.execute(stmt).unique().scalar_one()
    return _to_group_read(loaded_group, current_user.id)


@router.get("", response_model=List[GroupRead])
def list_buying_groups(
    neighborhood_id: Optional[str] = Query(None, description="Filter by neighborhood"),
    status: Optional[GroupStatus] = Query(None, description="Filter by status (e.g. OPEN)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[GroupRead]:
    """
    Discover neighborhood buying groups.
    Public groups in the neighborhood or any group where the user is a member are returned.
    """
    query = (
        select(BuyingGroup)
        .options(
            joinedload(BuyingGroup.neighborhood),
            joinedload(BuyingGroup.organizer),
            joinedload(BuyingGroup.members),
        )
    )

    filters = []

    # Visibility rule: Public groups OR groups where user is member/organizer OR admin
    if current_user.role != UserRole.ADMIN.value:
        member_subquery = (
            select(GroupMember.group_id)
            .where(GroupMember.user_id == current_user.id)
            .scalar_subquery()
        )
        visibility_filter = or_(
            BuyingGroup.visibility == GroupVisibility.PUBLIC.value,
            BuyingGroup.organizer_id == current_user.id,
            BuyingGroup.id.in_(member_subquery),
        )
        filters.append(visibility_filter)

    if neighborhood_id:
        filters.append(BuyingGroup.neighborhood_id == neighborhood_id)
    elif current_user.neighborhood_id and current_user.role != UserRole.ADMIN.value:
        # Default to user's neighborhood if set
        filters.append(BuyingGroup.neighborhood_id == current_user.neighborhood_id)

    if status:
        filters.append(BuyingGroup.status == status.value)

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(BuyingGroup.created_at.desc())
    results = db.execute(query).unique().scalars().all()

    return [_to_group_read(g, current_user.id) for g in results]


@router.get("/{group_id}", response_model=GroupRead)
def get_buying_group_details(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupRead:
    """Retrieve details for a single buying group."""
    stmt = (
        select(BuyingGroup)
        .where(BuyingGroup.id == group_id)
        .options(
            joinedload(BuyingGroup.neighborhood),
            joinedload(BuyingGroup.organizer),
            joinedload(BuyingGroup.members),
        )
    )
    group = db.execute(stmt).unique().scalar_one_or_none()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buying group not found",
        )

    # Privacy check for private groups
    is_member = any(m.user_id == current_user.id for m in group.members)
    is_organizer = group.organizer_id == current_user.id
    if group.visibility == GroupVisibility.PRIVATE.value:
        if not (is_member or is_organizer or current_user.role == UserRole.ADMIN.value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This is a private buying group. An invitation token is required to view and join.",
            )

    return _to_group_read(group, current_user.id)


@router.patch("/{group_id}", response_model=GroupRead)
def update_buying_group(
    group_id: str,
    payload: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupRead:
    """Update buying group details (organizer or admin only)."""
    stmt = (
        select(BuyingGroup)
        .where(BuyingGroup.id == group_id)
        .options(
            joinedload(BuyingGroup.neighborhood),
            joinedload(BuyingGroup.organizer),
            joinedload(BuyingGroup.members),
        )
    )
    group = db.execute(stmt).unique().scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    is_organizer = group.organizer_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN.value
    if not (is_organizer or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group organizer or platform admin can edit group settings",
        )

    if payload.name is not None:
        group.name = payload.name.strip()
    if payload.description is not None:
        group.description = payload.description.strip()
    if payload.deadline is not None:
        dl = payload.deadline
        if dl.tzinfo is None:
            dl = dl.replace(tzinfo=timezone.utc)
        group.deadline = dl
    if payload.status is not None:
        group.status = payload.status.value
    if payload.min_members is not None:
        group.min_members = payload.min_members

    group.version += 1
    db.commit()
    db.refresh(group)

    return _to_group_read(group, current_user.id)


@router.post("/{group_id}/join", response_model=GroupRead)
def join_public_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupRead:
    """Join an eligible public buying group."""
    stmt = (
        select(BuyingGroup)
        .where(BuyingGroup.id == group_id)
        .options(
            joinedload(BuyingGroup.neighborhood),
            joinedload(BuyingGroup.organizer),
            joinedload(BuyingGroup.members),
        )
    )
    group = db.execute(stmt).unique().scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    if group.status != GroupStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot join group in '{group.status}' state. Only OPEN groups accept new members.",
        )

    if group.visibility != GroupVisibility.PUBLIC.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This group is private. Please join via invitation token.",
        )

    # Check already member
    if any(m.user_id == current_user.id for m in group.members):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this buying group",
        )

    # Check capacity limit
    if group.max_members and len(group.members) >= group.max_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group has reached maximum member capacity",
        )

    membership = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        is_organizer=False,
    )
    db.add(membership)
    db.commit()
    db.expire_all()

    # Re-fetch
    loaded_group = db.execute(stmt).unique().scalar_one()
    return _to_group_read(loaded_group, current_user.id)


@router.post("/{group_id}/leave", response_model=GroupRead)
def leave_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupRead:
    """Leave a buying group before lock and remove personal grocery list items."""
    stmt = (
        select(BuyingGroup)
        .where(BuyingGroup.id == group_id)
        .options(
            joinedload(BuyingGroup.neighborhood),
            joinedload(BuyingGroup.organizer),
            joinedload(BuyingGroup.members),
        )
    )
    group = db.execute(stmt).unique().scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    if group.status in [GroupStatus.LOCKED.value, GroupStatus.PROCUREMENT.value, GroupStatus.COMPLETED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot leave group in '{group.status}' state. Changes after locking require admin intervention.",
        )

    membership = next((m for m in group.members if m.user_id == current_user.id), None)
    if not membership:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are not a member of this group")

    if membership.is_organizer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The group organizer cannot leave the group directly. Please transfer organizer role or cancel group.",
        )

    # Remove user's grocery items in this group
    item_stmt = select(GroceryListItem).where(
        and_(GroceryListItem.group_id == group_id, GroceryListItem.user_id == current_user.id)
    )
    items = db.execute(item_stmt).scalars().all()
    for item in items:
        db.delete(item)

    db.delete(membership)
    group.version += 1
    db.commit()
    db.expire_all()

    loaded_group = db.execute(stmt).unique().scalar_one()
    return _to_group_read(loaded_group, current_user.id)


@router.post("/{group_id}/invitations", response_model=GroupInvitationRead, status_code=status.HTTP_201_CREATED)
def create_group_invitation(
    group_id: str,
    payload: GroupInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupInvitationRead:
    """Generate an authorized invitation token for a private group (organizer or admin only)."""
    stmt = select(BuyingGroup).where(BuyingGroup.id == group_id)
    group = db.execute(stmt).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    is_organizer = group.organizer_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN.value
    if not (is_organizer or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group organizer or platform admin can generate invitations",
        )

    expires_at = datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days)
    token = f"BS-{uuid.uuid4().hex[:12].upper()}"

    invitation = GroupInvitation(
        group_id=group.id,
        token=token,
        expires_at=expires_at,
        max_uses=payload.max_uses,
        uses_count=0,
        is_revoked=False,
        created_by_id=current_user.id,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return GroupInvitationRead(
        id=invitation.id,
        group_id=invitation.group_id,
        token=invitation.token,
        expires_at=invitation.expires_at,
        max_uses=invitation.max_uses,
        uses_count=invitation.uses_count,
        is_valid=invitation.is_valid,
        created_at=invitation.created_at,
    )


@router.post("/invitations/redeem", response_model=GroupRead)
def redeem_invitation_token(
    payload: InvitationRedeemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupRead:
    """Redeem an invitation token and join a private buying group."""
    clean_token = payload.token.strip().upper()
    stmt = select(GroupInvitation).where(GroupInvitation.token == clean_token)
    invitation = db.execute(stmt).scalar_one_or_none()

    if not invitation or not invitation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or fully utilized invitation token",
        )

    # Fetch group
    group_stmt = (
        select(BuyingGroup)
        .where(BuyingGroup.id == invitation.group_id)
        .options(
            joinedload(BuyingGroup.neighborhood),
            joinedload(BuyingGroup.organizer),
            joinedload(BuyingGroup.members),
        )
    )
    group = db.execute(group_stmt).unique().scalar_one()

    if group.status != GroupStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot join group in '{group.status}' state.",
        )

    # Check already member
    if any(m.user_id == current_user.id for m in group.members):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this buying group",
        )

    # Add member and update token usage
    membership = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        is_organizer=False,
    )
    db.add(membership)
    invitation.uses_count += 1
    db.commit()
    db.expire_all()

    loaded_group = db.execute(group_stmt).unique().scalar_one()
    return _to_group_read(loaded_group, current_user.id)
