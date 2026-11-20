from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.wholesale import WholesalePriceTierRead


# --- Aggregation / Demand Line Item & Summary ---

class DemandLineItem(BaseModel):
    variant_id: str
    product_name: str
    category: str
    brand: str
    pack_quantity: int  # unit weight/vol per pack e.g. 5 (kg)
    pack_unit: str  # kg, L
    variant_display_name: str
    reference_retail_price: float
    total_packs: int  # Cumulative count of sealed packs ordered
    total_quantity_units: int  # e.g., 20 packs * 5kg = 100 kg
    total_retail_value: float
    qualified_tier: Optional[WholesalePriceTierRead] = None
    next_tier: Optional[WholesalePriceTierRead] = None
    packs_to_next_tier: Optional[int] = None
    best_wholesale_price: Optional[float] = None
    estimated_wholesale_cost: Optional[float] = None
    estimated_savings: Optional[float] = None
    savings_percentage: Optional[float] = None


class DemandSummaryResponse(BaseModel):
    group_id: str
    group_name: str
    snapshot_version: Optional[int] = None
    total_variants: int
    total_packs: int
    total_retail_value: float
    estimated_wholesale_value: float
    estimated_savings: float
    savings_percentage: float
    items: List[DemandLineItem]


# --- Demand Snapshot ---

class DemandSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    group_id: str
    snapshot_version: int
    snapshot_data: str
    total_retail_value: float
    total_packs: int
    created_at: datetime


# --- Quotation Items ---

class QuotationItemBase(BaseModel):
    variant_id: str
    quoted_packs: int
    quoted_price_per_pack: float
    line_total: float


class QuotationItemCreate(BaseModel):
    variant_id: str
    quoted_price_per_pack: float


class QuotationItemRead(QuotationItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    quotation_id: str
    variant_display_name: Optional[str] = None
    reference_retail_price: Optional[float] = None


# --- Supplier Quotation ---

class SupplierQuotationCreate(BaseModel):
    demand_snapshot_id: str
    items: List[QuotationItemCreate]
    valid_until: datetime
    notes: Optional[str] = None


class SupplierQuotationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    demand_snapshot_id: str
    supplier_id: str
    supplier_name: Optional[str] = None
    status: str
    total_quoted_price: float
    total_retail_value: Optional[float] = None
    savings_amount: Optional[float] = None
    savings_percentage: Optional[float] = None
    valid_until: datetime
    notes: Optional[str] = None
    items: List[QuotationItemRead] = []
    created_at: datetime
    updated_at: datetime


# --- Household Savings Calculation ---

class HouseholdSavingsItem(BaseModel):
    variant_id: str
    variant_display_name: str
    brand_preference: str
    pack_quantity: int
    reference_retail_price: float
    retail_total: float
    wholesale_price_per_pack: Optional[float] = None
    wholesale_total: Optional[float] = None
    savings_amount: Optional[float] = None
    savings_percentage: Optional[float] = None


class HouseholdSavingsResponse(BaseModel):
    group_id: str
    user_id: str
    total_packs: int
    total_retail_cost: float
    total_wholesale_cost: float
    total_savings: float
    savings_percentage: float
    items: List[HouseholdSavingsItem]
