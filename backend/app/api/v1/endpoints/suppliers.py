from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.wholesale import SupplierProfile, SupplierProductOffer
from app.models.catalog import ProductVariant
from app.schemas.wholesale import (
    SupplierProfileCreate,
    SupplierProfileUpdate,
    SupplierProfileRead,
    SupplierProductOfferCreate,
    SupplierProductOfferUpdate,
    SupplierProductOfferRead,
)

router = APIRouter(prefix="/suppliers", tags=["Suppliers & Offers"])
supplier_account = require_role(UserRole.SUPPLIER, UserRole.ADMIN)


@router.get("/me/profile", response_model=SupplierProfileRead)
def get_my_supplier_profile(
    current_user: User = Depends(supplier_account),
    db: Session = Depends(get_db),
):
    """Get the current authenticated supplier's company profile."""
    profile = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == current_user.id)
    ).scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier profile not found. Please create your profile first.",
        )
    return profile


@router.post("/me/profile", response_model=SupplierProfileRead, status_code=status.HTTP_201_CREATED)
def create_or_update_my_supplier_profile(
    payload: SupplierProfileCreate,
    current_user: User = Depends(supplier_account),
    db: Session = Depends(get_db),
):
    """Create or initialize supplier company profile."""
    existing = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == current_user.id)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier profile already exists. Use PATCH to update.",
        )

    profile = SupplierProfile(
        user_id=current_user.id,
        company_name=payload.company_name,
        gstin=payload.gstin,
        address=payload.address,
        city=payload.city,
        phone=payload.phone or current_user.phone,
        description=payload.description,
        is_verified=False,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/me/profile", response_model=SupplierProfileRead)
def update_my_supplier_profile(
    payload: SupplierProfileUpdate,
    current_user: User = Depends(supplier_account),
    db: Session = Depends(get_db),
):
    """Update current supplier's company profile."""
    profile = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == current_user.id)
    ).scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier profile not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# --- Supplier Product Offers ---

@router.get("/me/offers", response_model=List[SupplierProductOfferRead])
def list_my_product_offers(
    current_user: User = Depends(supplier_account),
    db: Session = Depends(get_db),
):
    """List product SKUs and wholesale prices offered by the logged-in supplier."""
    profile = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == current_user.id)
    ).scalar_one_or_none()

    if not profile:
        return []

    stmt = (
        select(SupplierProductOffer)
        .where(SupplierProductOffer.supplier_id == profile.id)
        .options(joinedload(SupplierProductOffer.variant))
    )
    offers = db.execute(stmt).scalars().all()

    results = []
    for o in offers:
        r = SupplierProductOfferRead.model_validate(o)
        if o.variant:
            r.variant_display_name = o.variant.display_name
        results.append(r)
    return results


@router.post("/me/offers", response_model=SupplierProductOfferRead, status_code=status.HTTP_201_CREATED)
def create_product_offer(
    payload: SupplierProductOfferCreate,
    current_user: User = Depends(supplier_account),
    db: Session = Depends(get_db),
):
    """Add a product offer with supplier pricing."""
    profile = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == current_user.id)
    ).scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must create a supplier profile before adding product offers",
        )

    if not profile.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier verification is required to publish offers")

    # Check variant exists
    variant = db.execute(
        select(ProductVariant).where(ProductVariant.id == payload.variant_id)
    ).scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product variant not found")

    # Check unique constraint
    existing = db.execute(
        select(SupplierProductOffer).where(
            SupplierProductOffer.supplier_id == profile.id,
            SupplierProductOffer.variant_id == payload.variant_id,
        )
    ).scalar_one_or_none()

    if existing:
        existing.offer_price_per_pack = payload.offer_price_per_pack
        existing.min_order_packs = payload.min_order_packs
        existing.max_order_packs = payload.max_order_packs
        existing.is_active = True
        db.add(existing)
        db.commit()
        db.refresh(existing)
        res = SupplierProductOfferRead.model_validate(existing)
        res.variant_display_name = variant.display_name
        return res

    offer = SupplierProductOffer(
        supplier_id=profile.id,
        variant_id=payload.variant_id,
        offer_price_per_pack=payload.offer_price_per_pack,
        min_order_packs=payload.min_order_packs,
        max_order_packs=payload.max_order_packs,
        is_active=True,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    res = SupplierProductOfferRead.model_validate(offer)
    res.variant_display_name = variant.display_name
    return res


@router.patch("/me/offers/{offer_id}", response_model=SupplierProductOfferRead)
def update_product_offer(
    offer_id: str,
    payload: SupplierProductOfferUpdate,
    current_user: User = Depends(supplier_account),
    db: Session = Depends(get_db),
):
    """Update pricing or quantity thresholds on an offer."""
    profile = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == current_user.id)
    ).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier profile not found")

    if not profile.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier verification is required to edit offers")

    offer = db.execute(
        select(SupplierProductOffer)
        .where(
            SupplierProductOffer.id == offer_id,
            SupplierProductOffer.supplier_id == profile.id,
        )
        .options(joinedload(SupplierProductOffer.variant))
    ).scalar_one_or_none()

    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(offer, field, val)

    db.add(offer)
    db.commit()
    db.refresh(offer)

    res = SupplierProductOfferRead.model_validate(offer)
    if offer.variant:
        res.variant_display_name = offer.variant.display_name
    return res


@router.delete("/me/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_offer(
    offer_id: str,
    current_user: User = Depends(supplier_account),
    db: Session = Depends(get_db),
):
    """Deactivate or delete an offered product."""
    profile = db.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == current_user.id)
    ).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier profile not found")

    offer = db.execute(
        select(SupplierProductOffer).where(
            SupplierProductOffer.id == offer_id,
            SupplierProductOffer.supplier_id == profile.id,
        )
    ).scalar_one_or_none()

    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    db.delete(offer)
    db.commit()
    return None


@router.get("", response_model=List[SupplierProfileRead])
def list_suppliers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List verified active suppliers."""
    suppliers = (
        db.execute(select(SupplierProfile).order_by(SupplierProfile.company_name.asc()))
        .scalars()
        .all()
    )
    return suppliers
