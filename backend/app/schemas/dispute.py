from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DisputeCreateRequest(BaseModel):
    category: str = "DAMAGED_PACKS"
    description: str


class DisputeResolveRequest(BaseModel):
    status: str  # RESOLVED or REJECTED
    resolution_notes: str
    refund_amount: Optional[float] = 0.0


class OrderDisputeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_order_id: str
    user_id: str
    user_name: Optional[str] = None
    category: str
    description: str
    status: str
    refund_amount: float
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by_user_id: Optional[str] = None
    created_at: datetime
