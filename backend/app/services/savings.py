from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.group import BuyingGroup
from app.models.grocery_list import GroceryListItem
from app.models.catalog import ProductVariant
from app.models.wholesale import WholesalePriceTier
from app.schemas.quotation import HouseholdSavingsItem, HouseholdSavingsResponse
from app.services.aggregation import calculate_group_demand


def calculate_household_savings(group_id: str, user_id: str, db: Session) -> HouseholdSavingsResponse:
    """
    Calculates estimated cost and savings for an individual household in a buying group
    based on the group's current unlocked wholesale tiers.
    """
    # 1. Verify group
    group = db.execute(select(BuyingGroup).where(BuyingGroup.id == group_id)).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    # 2. Get user's items for this group
    stmt = (
        select(GroceryListItem)
        .where(
            GroceryListItem.group_id == group_id,
            GroceryListItem.user_id == user_id,
        )
        .options(joinedload(GroceryListItem.variant).joinedload(ProductVariant.product))
    )
    user_items = db.execute(stmt).scalars().all()

    if not user_items:
        return HouseholdSavingsResponse(
            group_id=group_id,
            user_id=user_id,
            total_packs=0,
            total_retail_cost=0.0,
            total_wholesale_cost=0.0,
            total_savings=0.0,
            savings_percentage=0.0,
            items=[],
        )

    # 3. Get the group's current demand summary to identify unlocked wholesale prices per variant
    group_demand = calculate_group_demand(group_id, db)
    # Map variant_id -> best_wholesale_price
    unlocked_price_map = {item.variant_id: item.best_wholesale_price for item in group_demand.items}

    household_items: List[HouseholdSavingsItem] = []
    total_retail = 0.0
    total_wholesale = 0.0
    total_packs = 0

    for item in user_items:
        variant = item.variant
        packs = item.pack_quantity
        unit_retail = variant.reference_retail_price
        line_retail = round(packs * unit_retail, 2)
        total_retail += line_retail
        total_packs += packs

        unlocked_wholesale_price = unlocked_price_map.get(variant.id)
        if unlocked_wholesale_price is not None:
            unit_wholesale = unlocked_wholesale_price
            line_wholesale = round(packs * unit_wholesale, 2)
            line_savings = round(line_retail - line_wholesale, 2)
            pct = round((line_savings / line_retail * 100.0), 1) if line_retail > 0 else 0.0
        else:
            unit_wholesale = None
            line_wholesale = line_retail
            line_savings = 0.0
            pct = 0.0

        total_wholesale += line_wholesale

        household_items.append(
            HouseholdSavingsItem(
                variant_id=variant.id,
                variant_display_name=variant.display_name,
                brand_preference=item.brand_preference,
                pack_quantity=packs,
                reference_retail_price=unit_retail,
                retail_total=line_retail,
                wholesale_price_per_pack=unit_wholesale,
                wholesale_total=line_wholesale,
                savings_amount=line_savings,
                savings_percentage=pct,
            )
        )

    overall_savings = round(max(0.0, total_retail - total_wholesale), 2)
    overall_pct = round((overall_savings / total_retail * 100.0), 1) if total_retail > 0 else 0.0

    return HouseholdSavingsResponse(
        group_id=group_id,
        user_id=user_id,
        total_packs=total_packs,
        total_retail_cost=round(total_retail, 2),
        total_wholesale_cost=round(total_wholesale, 2),
        total_savings=overall_savings,
        savings_percentage=overall_pct,
        items=household_items,
    )
