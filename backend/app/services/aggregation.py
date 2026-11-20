import json
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.group import BuyingGroup, GroupStatus
from app.models.grocery_list import GroceryListItem
from app.models.catalog import ProductVariant, Product
from app.models.wholesale import WholesalePriceTier
from app.models.quotation import DemandSnapshot
from app.schemas.wholesale import WholesalePriceTierRead
from app.schemas.quotation import DemandLineItem, DemandSummaryResponse


def calculate_group_demand(group_id: str, db: Session) -> DemandSummaryResponse:
    """
    Aggregates grocery demand for a buying group across all members.
    Strictly privacy-preserving: exposes zero member IDs or individual household lists.
    Evaluates cumulative sealed pack quantities against wholesale price tiers.
    """
    # 1. Verify group exists
    group = db.execute(select(BuyingGroup).where(BuyingGroup.id == group_id)).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    # 2. Query aggregated pack quantities per variant for this group
    agg_stmt = (
        select(
            GroceryListItem.variant_id,
            func.sum(GroceryListItem.pack_quantity).label("total_packs"),
        )
        .where(GroceryListItem.group_id == group_id)
        .group_by(GroceryListItem.variant_id)
    )
    agg_results = db.execute(agg_stmt).all()

    if not agg_results:
        return DemandSummaryResponse(
            group_id=group.id,
            group_name=group.name,
            total_variants=0,
            total_packs=0,
            total_retail_value=0.0,
            estimated_wholesale_value=0.0,
            estimated_savings=0.0,
            savings_percentage=0.0,
            items=[],
        )

    # 3. For each variant in demand, load details & evaluate against wholesale tiers
    variant_ids = [row.variant_id for row in agg_results]
    packs_map = {row.variant_id: int(row.total_packs) for row in agg_results}

    variants = (
        db.execute(
            select(ProductVariant)
            .where(ProductVariant.id.in_(variant_ids))
            .options(joinedload(ProductVariant.product))
        )
        .scalars()
        .all()
    )

    demand_items: List[DemandLineItem] = []
    total_group_retail = 0.0
    total_group_wholesale = 0.0
    total_all_packs = 0

    for variant in variants:
        packs = packs_map.get(variant.id, 0)
        retail_val = packs * variant.reference_retail_price
        total_units = packs * variant.pack_quantity

        total_group_retail += retail_val
        total_all_packs += packs

        # Fetch active wholesale tiers for this variant, ordered by min_quantity ascending
        tiers = (
            db.execute(
                select(WholesalePriceTier)
                .where(
                    WholesalePriceTier.variant_id == variant.id,
                    WholesalePriceTier.is_active == True,
                )
                .order_by(WholesalePriceTier.min_quantity.asc())
            )
            .scalars()
            .all()
        )

        qualified_tier_model: Optional[WholesalePriceTier] = None
        next_tier_model: Optional[WholesalePriceTier] = None

        for tier in tiers:
            if packs >= tier.min_quantity:
                qualified_tier_model = tier
            elif next_tier_model is None:
                next_tier_model = tier

        qualified_tier = WholesalePriceTierRead.model_validate(qualified_tier_model) if qualified_tier_model else None
        next_tier = WholesalePriceTierRead.model_validate(next_tier_model) if next_tier_model else None

        packs_to_next = None
        if next_tier_model:
            packs_to_next = max(0, next_tier_model.min_quantity - packs)

        # Calculate estimated wholesale cost and savings
        if qualified_tier:
            unit_wholesale = qualified_tier.price_per_pack
            est_wholesale = packs * unit_wholesale
            est_savings = retail_val - est_wholesale
            savings_pct = (est_savings / retail_val * 100.0) if retail_val > 0 else 0.0
        else:
            unit_wholesale = None
            est_wholesale = retail_val  # Default to retail if no tier unlocked yet
            est_savings = 0.0
            savings_pct = 0.0

        total_group_wholesale += est_wholesale

        demand_items.append(
            DemandLineItem(
                variant_id=variant.id,
                product_name=variant.product.name if variant.product else "Unknown Product",
                category=variant.product.category if variant.product else "GENERAL",
                brand=variant.brand,
                pack_quantity=variant.pack_quantity,
                pack_unit=variant.pack_unit,
                variant_display_name=variant.display_name,
                reference_retail_price=variant.reference_retail_price,
                total_packs=packs,
                total_quantity_units=total_units,
                total_retail_value=round(retail_val, 2),
                qualified_tier=qualified_tier,
                next_tier=next_tier,
                packs_to_next_tier=packs_to_next,
                best_wholesale_price=unit_wholesale,
                estimated_wholesale_cost=round(est_wholesale, 2),
                estimated_savings=round(est_savings, 2),
                savings_percentage=round(savings_pct, 1),
            )
        )

    # Sort items by category, then product name
    demand_items.sort(key=lambda x: (x.category, x.product_name, x.brand))

    overall_savings = max(0.0, total_group_retail - total_group_wholesale)
    overall_pct = (overall_savings / total_group_retail * 100.0) if total_group_retail > 0 else 0.0

    return DemandSummaryResponse(
        group_id=group.id,
        group_name=group.name,
        total_variants=len(demand_items),
        total_packs=total_all_packs,
        total_retail_value=round(total_group_retail, 2),
        estimated_wholesale_value=round(total_group_wholesale, 2),
        estimated_savings=round(overall_savings, 2),
        savings_percentage=round(overall_pct, 1),
        items=demand_items,
    )


def create_demand_snapshot(group_id: str, db: Session) -> DemandSnapshot:
    """
    Creates an immutable DemandSnapshot from the current aggregated group demand
    and updates the BuyingGroup status to QUOTING.
    """
    group = db.execute(select(BuyingGroup).where(BuyingGroup.id == group_id)).scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buying group not found")

    demand_summary = calculate_group_demand(group_id, db)
    if demand_summary.total_packs == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create quotation snapshot: no grocery items have been added to this group yet",
        )

    # Count existing snapshots to determine version
    count_stmt = select(func.count(DemandSnapshot.id)).where(DemandSnapshot.group_id == group_id)
    existing_count = db.execute(count_stmt).scalar() or 0
    new_version = existing_count + 1

    snapshot = DemandSnapshot(
        group_id=group_id,
        snapshot_version=new_version,
        snapshot_data=demand_summary.model_dump_json(),
        total_retail_value=demand_summary.total_retail_value,
        total_packs=demand_summary.total_packs,
    )
    db.add(snapshot)

    # Advance group status to QUOTING if currently OPEN
    if group.status == GroupStatus.OPEN.value:
        group.status = GroupStatus.QUOTING.value
        db.add(group)

    db.commit()
    db.refresh(snapshot)
    return snapshot
