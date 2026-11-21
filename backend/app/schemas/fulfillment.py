from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MemberFulfillmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    group_order_id: str
    user_id: str
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    fulfillment_type: str
    pickup_code: Optional[str] = None
    delivery_address: Optional[str] = None
    status: str
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    verified_by_user_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class VerifyPickupRequest(BaseModel):
    pickup_code: str


class UpdateFulfillmentStatusRequest(BaseModel):
    status: str
    notes: Optional[str] = None
