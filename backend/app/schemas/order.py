from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict
from app.models.order import RoundStatus, MemberConfirmationStatus, FulfillmentPreference, OrderLockStatus
from app.schemas.quotation import SupplierQuotationRead


class SelectQuotationRequest(BaseModel):
    quotation_id: str
    deadline_hours: int = 48
    notes: Optional[str] = None


class MemberConfirmRequest(BaseModel):
    status: MemberConfirmationStatus  # ACCEPTED or REJECTED
    rejection_reason: Optional[str] = None
    fulfillment_preference: FulfillmentPreference = FulfillmentPreference.PICKUP
    delivery_address: Optional[str] = None


class MemberConfirmationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    confirmation_round_id: str
    group_id: str
    user_id: str
    user_name: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    total_household_cost: float
    total_household_savings: float
    confirmed_at: Optional[datetime] = None
    fulfillment_preference: str
    delivery_address: Optional[str] = None
    created_at: datetime


class HouseholdProposalItem(BaseModel):
    variant_id: str
    variant_name: str
    pack_count: int
    price_per_pack: float
    reference_retail_per_pack: float
    line_total: float


class ConfirmationRoundRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    selected_quotation_id: str
    round_number: int
    status: str
    deadline: datetime
    notes: Optional[str] = None
    total_members: int = 0
    confirmed_count: int = 0
    rejected_count: int = 0
    pending_count: int = 0
    home_delivery_surcharge: float = 0
    household_items: List[HouseholdProposalItem] = []
    confirmations: List[MemberConfirmationRead] = []
    selected_quotation: Optional[SupplierQuotationRead] = None
    created_at: datetime


class GroupOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_id: str
    selected_quotation_id: str
    confirmation_round_id: str
    status: str
    total_retail_amount: float
    total_wholesale_amount: float
    total_savings_amount: float
    total_packs: int
    locked_at: datetime
    locked_by_user_id: str
    order_allocations_data: Optional[str] = None
    created_at: datetime
    supplier_name: Optional[str] = None
