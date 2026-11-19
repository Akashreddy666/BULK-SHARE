from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.group import BuyingGroup, GroupStatus, GroupMember
from app.models.catalog import ProductVariant
from app.models.grocery_list import GroceryListItem, BrandPreference
from app.schemas.grocery_list import (
    GroceryListItemCreate,
    GroceryListItemUpdate,
    GroceryListItemRead,
    MyGroceryListSummary,
)

router = APIRouter(prefix="/groups/{group_id}/my-items", tags=["Household Grocery Lists"])


@router.get("", response_model=MyGroceryListSummary)
def get_my_grocery_items(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MyGroceryListSummary:
    """
    Retrieve current household's private grocery requirements for a specific buying group.
    Enforces FR-LIST-04: Items are visible only to the household owner and authorized admins.
    """
    # 1. Verify group exists
    group_stmt = select(BuyingGroup).where(BuyingGroup.id == group_id)
    group = db.execute(group_stmt).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    # 2. Fetch only items belonging to current_user
    stmt = (
        select(GroceryListItem)
        .where(
            and_(
                GroceryListItem.group_id == group_id,
                GroceryListItem.user_id == current_user.id,
            )
        )
        .options(joinedload(GroceryListItem.variant))
        .order_by(GroceryListItem.created_at)
    )
    items = db.execute(stmt).scalars().all()

    total_packs = sum(i.pack_quantity for i in items)
    total_retail = sum(
        (i.variant.reference_retail_price * i.pack_quantity)
        for i in items
        if i.variant
    )

    return MyGroceryListSummary(
        group_id=group_id,
        items=[GroceryListItemRead.model_validate(i) for i in items],
        total_packs=total_packs,
        total_reference_retail_price=round(total_retail, 2),
    )


@router.post("", response_model=GroceryListItemRead, status_code=status.HTTP_201_CREATED)
def add_grocery_item(
    group_id: str,
    payload: GroceryListItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroceryListItemRead:
    """
    Add a sealed-pack grocery item to current household's list.
    Enforces positive integer pack quantities (FR-LIST-03) and OPEN group phase (FR-LIST-01).
    """
    # 1. Verify group exists and is in OPEN state
    group_stmt = select(BuyingGroup).where(BuyingGroup.id == group_id)
    group = db.execute(group_stmt).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    if group.status != GroupStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot add groceries when group is in '{group.status}' state. Additions are permitted only while OPEN.",
        )

    # 2. Verify user is a member of the group
    member_stmt = select(GroupMember).where(
        and_(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id)
    )
    membership = db.execute(member_stmt).scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must join this buying group before adding grocery requirements",
        )

    # 3. Verify variant exists and is active
    variant_stmt = select(ProductVariant).where(
        and_(ProductVariant.id == payload.variant_id, ProductVariant.is_active == True)  # noqa: E712
    )
    variant = db.execute(variant_stmt).scalar_one_or_none()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified grocery product variant does not exist or is inactive",
        )

    # 4. Check if item already exists; if so, update pack count
    existing_stmt = select(GroceryListItem).where(
        and_(
            GroceryListItem.group_id == group_id,
            GroceryListItem.user_id == current_user.id,
            GroceryListItem.variant_id == payload.variant_id,
        )
    )
    existing_item = db.execute(existing_stmt).scalar_one_or_none()

    if existing_item:
        existing_item.pack_quantity += payload.pack_quantity
        existing_item.brand_preference = payload.brand_preference.value
        item = existing_item
    else:
        item = GroceryListItem(
            group_id=group_id,
            user_id=current_user.id,
            variant_id=payload.variant_id,
            pack_quantity=payload.pack_quantity,
            brand_preference=payload.brand_preference.value,
        )
        db.add(item)

    group.version += 1
    db.commit()

    # Re-fetch with variant loaded
    res_stmt = (
        select(GroceryListItem)
        .where(GroceryListItem.id == item.id)
        .options(joinedload(GroceryListItem.variant))
    )
    loaded_item = db.execute(res_stmt).scalar_one()
    return GroceryListItemRead.model_validate(loaded_item)


@router.patch("/{item_id}", response_model=GroceryListItemRead)
def update_grocery_item(
    group_id: str,
    item_id: str,
    payload: GroceryListItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroceryListItemRead:
    """Update pack quantity or exact/flexible brand preference on an existing list item."""
    stmt = (
        select(GroceryListItem)
        .where(
            and_(
                GroceryListItem.id == item_id,
                GroceryListItem.group_id == group_id,
                GroceryListItem.user_id == current_user.id,
            )
        )
        .options(joinedload(GroceryListItem.variant), joinedload(GroceryListItem.group))
    )
    item = db.execute(stmt).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery item not found in your list")

    if item.group.status != GroupStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit items when group is in '{item.group.status}' state",
        )

    if payload.pack_quantity is not None:
        item.pack_quantity = payload.pack_quantity
    if payload.brand_preference is not None:
        item.brand_preference = payload.brand_preference.value

    item.group.version += 1
    db.commit()
    db.refresh(item)
    return GroceryListItemRead.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grocery_item(
    group_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Remove a grocery item from current household's list."""
    stmt = (
        select(GroceryListItem)
        .where(
            and_(
                GroceryListItem.id == item_id,
                GroceryListItem.group_id == group_id,
                GroceryListItem.user_id == current_user.id,
            )
        )
        .options(joinedload(GroceryListItem.group))
    )
    item = db.execute(stmt).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery item not found in your list")

    if item.group.status != GroupStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot remove items when group is in '{item.group.status}' state",
        )

    item.group.version += 1
    db.delete(item)
    db.commit()
