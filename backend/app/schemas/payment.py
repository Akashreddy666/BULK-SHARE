from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class PaymentCreateRequest(BaseModel):
    payment_method: str = "UPI"
    notes: Optional[str] = None


class PaymentTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_order_id: str
    user_id: str
    amount: float
    currency: str
    payment_method: str
    transaction_ref: str
    receipt_number: str
    status: str
    paid_at: datetime
    notes: Optional[str] = None
    created_at: datetime


class HouseholdInvoiceItemRead(BaseModel):
    product_name: str
    variant_brand: str
    package_size: float
    unit: str
    quantity: int
    retail_rate: float
    wholesale_rate: float
    retail_total: float
    wholesale_total: float
    savings: float


class HouseholdInvoiceRead(BaseModel):
    group_order_id: str
    group_name: str
    user_id: str
    user_name: str
    user_email: str
    items: List[HouseholdInvoiceItemRead]
    subtotal_retail: float
    subtotal_wholesale: float
    total_savings: float
    fulfillment_type: str
    delivery_surcharge: float
    final_payable: float
    payment_status: str
    receipt_number: Optional[str] = None
    transaction_ref: Optional[str] = None
    paid_at: Optional[datetime] = None


class GroupOrderPaymentSummaryRead(BaseModel):
    group_order_id: str
    total_wholesale_amount: float
    total_collected: float
    total_members: int
    paid_members_count: int
    all_paid: bool
