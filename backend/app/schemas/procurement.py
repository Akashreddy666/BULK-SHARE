from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProcurementCreateRequest(BaseModel):
    estimated_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None


class ProcurementStatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None


class ProcurementOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_order_id: str
    supplier_id: str
    po_number: str
    status: str
    total_amount: float
    estimated_delivery_date: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    delivered_to_hub_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
