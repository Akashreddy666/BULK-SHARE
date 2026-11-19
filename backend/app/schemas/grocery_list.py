from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.grocery_list import BrandPreference
from app.schemas.catalog import ProductVariantRead


class GroceryListItemCreate(BaseModel):
    variant_id: str
    pack_quantity: int = Field(default=1, gt=0, description="Positive integer number of sealed packs")
    brand_preference: BrandPreference = BrandPreference.EXACT


class GroceryListItemUpdate(BaseModel):
    pack_quantity: Optional[int] = Field(default=None, gt=0)
    brand_preference: Optional[BrandPreference] = None


class GroceryListItemRead(BaseModel):
    id: str
    group_id: str
    user_id: str
    variant_id: str
    pack_quantity: int
    brand_preference: BrandPreference
    created_at: datetime
    updated_at: datetime
    variant: Optional[ProductVariantRead] = None

    @property
    def estimated_retail_total(self) -> float:
        if self.variant and self.variant.reference_retail_price:
            return round(self.variant.reference_retail_price * self.pack_quantity, 2)
        return 0.0

    model_config = ConfigDict(from_attributes=True)


class MyGroceryListSummary(BaseModel):
    group_id: str
    items: List[GroceryListItemRead]
    total_packs: int
    total_reference_retail_price: float
