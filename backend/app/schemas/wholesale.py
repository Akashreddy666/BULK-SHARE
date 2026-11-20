from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# --- Wholesale Price Tiers ---

class WholesalePriceTierBase(BaseModel):
    variant_id: str
    min_quantity: int
    price_per_pack: float
    tier_label: str = "Tier 1"
    is_active: bool = True


class WholesalePriceTierCreate(WholesalePriceTierBase):
    pass


class WholesalePriceTierRead(WholesalePriceTierBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime


# --- Supplier Profile ---

class SupplierProfileBase(BaseModel):
    company_name: str
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: str = "Bengaluru"
    phone: Optional[str] = None
    description: Optional[str] = None


class SupplierProfileCreate(SupplierProfileBase):
    pass


class SupplierProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None


class SupplierProfileRead(SupplierProfileBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime


# --- Supplier Product Offers ---

class SupplierProductOfferBase(BaseModel):
    variant_id: str
    offer_price_per_pack: float
    min_order_packs: int = 1
    max_order_packs: Optional[int] = None


class SupplierProductOfferCreate(SupplierProductOfferBase):
    pass


class SupplierProductOfferUpdate(BaseModel):
    offer_price_per_pack: Optional[float] = None
    min_order_packs: Optional[int] = None
    max_order_packs: Optional[int] = None
    is_active: Optional[bool] = None


class SupplierProductOfferRead(SupplierProductOfferBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    supplier_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    variant_display_name: Optional[str] = None
