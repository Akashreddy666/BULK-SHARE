import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.group import BuyingGroup
from app.models.wholesale import SupplierProfile
from app.models.catalog import ProductVariant
from app.models.quotation import (
    DemandSnapshot,
    SupplierQuotation,
    QuotationItem,
    QuotationStatus,
)
from app.schemas.quotation import (
    SupplierQuotationCreate,
    SupplierQuotationRead,
    QuotationItemRead,
    DemandSnapshotRead,
)

router = APIRouter(tags=["Wholesale Quotations"])


def _hydrate_quotation_read(quote: SupplierQuotation, snapshot: DemandSnapshot) -> SupplierQuotationRead:
    """Helper to enrich SupplierQuotationRead with items, retail value, and savings."""
    res = SupplierQuotationRead.model_validate(quote)
    if quote.supplier:
        res.supplier_name = quote.supplier.company_name

    items_read = []
    total_quoted = 0.0

    for it in quote.items:
        it_read = QuotationItemRead.model_validate(it)
        if it.variant:
            it_read.variant_display_name = it.variant.display_name
            it_read.reference_retail_price = it.variant.reference_retail_price
        items_read.append(it_read)
        total_quoted += it.line_total

    res.items = items_read
    res.total_quoted_price = round(quote.total_quoted_price or total_quoted, 2)
    res.total_retail_value = round(snapshot.total_retail_value, 2)

    savings = max(0.0, res.total_retail_value - res.total_quoted_price)
    pct = (savings / res.total_retail_value * 100.0) if res.total_retail_value > 0 else 0.0
    res.savings_amount = round(savings, 2)
    res.savings_percentage = round(pct, 1)

    return res


@router.get("/groups/{group_id}/quotations", response_model=List[SupplierQuotationRead])
def list_group_quotations(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all quotations submitted by wholesalers for this buying group's demand snapshots.
    Includes itemized breakdown and calculated savings vs retail reference prices.
    """
    # Fetch snapshots for this group
    snapshots = (
        db.execute(select(DemandSnapshot).where(DemandSnapshot.group_id == group_id))
        .scalars()
        .all()
    )
    if not snapshots:
        return []

    snapshot_ids = [s.id for s in snapshots]
    snapshot_map = {s.id: s for s in snapshots}

    quotes = (
        db.execute(
            select(SupplierQuotation)
            .where(SupplierQuotation.demand_snapshot_id.in_(snapshot_ids))
            .options(
                joinedload(SupplierQuotation.supplier),
                joinedload(SupplierQuotation.items).joinedload(QuotationItem.variant),
            )
            .order_by(SupplierQuotation.created_at.desc())
        )
        .scalars()
        .unique()
        .all()
    )

    results = []
    for q in quotes:
        snap = snapshot_map.get(q.demand_snapshot_id)
        if snap:
            results.append(_hydrate_quotation_read(q, snap))

    return results


@router.post("/quotations", response_model=SupplierQuotationRead, status_code=status.HTTP_201_CREATED)
def submit_quotation(
    payload: SupplierQuotationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a wholesale quotation against a group's demand snapshot.
    Wholesalers specify their bid per pack for each requested variant SKU.
    """
    # 1. Verify supplier profile
    supplier = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == current_user.id)
    ).scalar_one_or_none()

    if current_user.role not in (UserRole.SUPPLIER.value, UserRole.ADMIN.value) or not supplier or not supplier.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only verified suppliers can submit quotations")

    # 2. Verify snapshot exists
    snapshot = db.execute(
        select(DemandSnapshot).where(DemandSnapshot.id == payload.demand_snapshot_id)
    ).scalar_one_or_none()

    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demand snapshot not found",
        )

    # Parse demand snapshot data to get pack requirements per variant
    try:
        snapshot_items = json.loads(snapshot.snapshot_data).get("items", [])
    except Exception:
        snapshot_items = []

    demand_packs_map = {it["variant_id"]: it["total_packs"] for it in snapshot_items}

    # 3. Create Quotation and Line Items
    quotation = SupplierQuotation(
        demand_snapshot_id=snapshot.id,
        supplier_id=supplier.id,
        status=QuotationStatus.SUBMITTED.value,
        total_quoted_price=0.0,
        valid_until=payload.valid_until,
        notes=payload.notes,
    )
    db.add(quotation)
    db.flush()

    total_price = 0.0
    for it_create in payload.items:
        variant = db.execute(
            select(ProductVariant).where(ProductVariant.id == it_create.variant_id)
        ).scalar_one_or_none()

        if not variant:
            continue

        packs = demand_packs_map.get(it_create.variant_id, 1)
        line_total = round(packs * it_create.quoted_price_per_pack, 2)
        total_price += line_total

        item = QuotationItem(
            quotation_id=quotation.id,
            variant_id=it_create.variant_id,
            quoted_packs=packs,
            quoted_price_per_pack=it_create.quoted_price_per_pack,
            line_total=line_total,
        )
        db.add(item)

    quotation.total_quoted_price = round(total_price, 2)
    db.add(quotation)
    db.commit()

    # Re-fetch with relationships
    created_quote = db.execute(
        select(SupplierQuotation)
        .where(SupplierQuotation.id == quotation.id)
        .options(
            joinedload(SupplierQuotation.supplier),
            joinedload(SupplierQuotation.items).joinedload(QuotationItem.variant),
        )
    ).unique().scalar_one()

    return _hydrate_quotation_read(created_quote, snapshot)


@router.get("/quotations/{quotation_id}", response_model=SupplierQuotationRead)
def get_quotation_detail(
    quotation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full quotation details including line items, comparison, and validity."""
    quote = db.execute(
        select(SupplierQuotation)
        .where(SupplierQuotation.id == quotation_id)
        .options(
            joinedload(SupplierQuotation.supplier),
            joinedload(SupplierQuotation.items).joinedload(QuotationItem.variant),
            joinedload(SupplierQuotation.demand_snapshot),
        )
    ).unique().scalar_one_or_none()

    if not quote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")

    return _hydrate_quotation_read(quote, quote.demand_snapshot)


@router.get("/quotations/snapshots/{snapshot_id}", response_model=DemandSnapshotRead)
def get_snapshot_detail(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch demand snapshot details."""
    snapshot = db.execute(
        select(DemandSnapshot).where(DemandSnapshot.id == snapshot_id)
    ).scalar_one_or_none()

    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")

    return snapshot
