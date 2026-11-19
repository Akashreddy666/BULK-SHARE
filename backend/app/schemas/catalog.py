from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.catalog import ProductCategory


class ProductVariantBase(BaseModel):
    brand: str = Field(..., min_length=2, max_length=100)
    pack_quantity: int = Field(..., gt=0)  # Sealed packs (e.g. 5 for 5kg or 5L)
    pack_unit: str = Field(default="kg", max_length=20)
    sku: str = Field(..., min_length=3, max_length=100)
    reference_retail_price: float = Field(..., gt=0)
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantRead(ProductVariantBase):
    id: str
    product_id: str
    created_at: datetime
    updated_at: datetime

    @property
    def display_name(self) -> str:
        return f"{self.brand} ({self.pack_quantity} {self.pack_unit})"

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: ProductCategory
    base_unit: str = Field(default="kg", max_length=20)
    description: Optional[str] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    variants: List[ProductVariantCreate] = []


class ProductRead(ProductBase):
    id: str
    created_at: datetime
    updated_at: datetime
    variants: List[ProductVariantRead] = []

    model_config = ConfigDict(from_attributes=True)
