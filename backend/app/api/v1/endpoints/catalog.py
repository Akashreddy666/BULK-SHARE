from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.catalog import Product, ProductVariant, ProductCategory
from app.schemas.catalog import (
    ProductCreate,
    ProductRead,
    ProductVariantCreate,
    ProductVariantRead,
)

router = APIRouter(prefix="/products", tags=["Product Catalog"])


@router.get("", response_model=List[ProductRead])
def list_products(
    category: Optional[ProductCategory] = Query(None, description="Filter by staple category"),
    db: Session = Depends(get_db),
) -> List[ProductRead]:
    """Retrieve catalog products and active sealed-pack variants."""
    query = (
        select(Product)
        .where(Product.is_active == True)  # noqa: E712
        .options(joinedload(Product.variants))
    )

    if category:
        query = query.where(Product.category == category.value)

    query = query.order_by(Product.name)
    products = db.execute(query).unique().scalars().all()

    # Filter active variants
    result = []
    for p in products:
        active_variants = [v for v in p.variants if v.is_active]
        result.append(
            ProductRead(
                id=p.id,
                name=p.name,
                category=ProductCategory(p.category),
                base_unit=p.base_unit,
                description=p.description,
                is_active=p.is_active,
                created_at=p.created_at,
                updated_at=p.updated_at,
                variants=[ProductVariantRead.model_validate(v) for v in active_variants],
            )
        )
    return result


@router.get("/{product_id}/variants", response_model=List[ProductVariantRead])
def list_product_variants(
    product_id: str,
    db: Session = Depends(get_db),
) -> List[ProductVariantRead]:
    """Retrieve sellable sealed-pack variants for a specific product."""
    stmt = (
        select(ProductVariant)
        .where(
            ProductVariant.product_id == product_id,
            ProductVariant.is_active == True,  # noqa: E712
        )
        .order_by(ProductVariant.pack_quantity)
    )
    variants = db.execute(stmt).scalars().all()
    return [ProductVariantRead.model_validate(v) for v in variants]


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductRead:
    """Create a new catalog product with initial sealed SKU variants (Admin or Supplier only)."""
    if current_user.role not in [UserRole.ADMIN.value, UserRole.SUPPLIER.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and registered suppliers can manage catalog entries",
        )

    product = Product(
        name=payload.name.strip(),
        category=payload.category.value,
        base_unit=payload.base_unit.strip(),
        description=payload.description.strip() if payload.description else None,
        is_active=payload.is_active,
    )
    db.add(product)
    db.flush()

    for v_data in payload.variants:
        variant = ProductVariant(
            product_id=product.id,
            brand=v_data.brand.strip(),
            pack_quantity=v_data.pack_quantity,
            pack_unit=v_data.pack_unit.strip(),
            sku=v_data.sku.strip(),
            reference_retail_price=v_data.reference_retail_price,
            is_active=v_data.is_active,
        )
        db.add(variant)

    db.commit()

    # Re-fetch
    stmt = (
        select(Product)
        .where(Product.id == product.id)
        .options(joinedload(Product.variants))
    )
    created = db.execute(stmt).unique().scalar_one()
    return ProductRead(
        id=created.id,
        name=created.name,
        category=ProductCategory(created.category),
        base_unit=created.base_unit,
        description=created.description,
        is_active=created.is_active,
        created_at=created.created_at,
        updated_at=created.updated_at,
        variants=[ProductVariantRead.model_validate(v) for v in created.variants],
    )
