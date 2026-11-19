from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NeighborhoodBase(BaseModel):
    name: str
    city: str = "Bengaluru"
    postal_code: str
    is_active: bool = True


class NeighborhoodCreate(NeighborhoodBase):
    pass


class NeighborhoodRead(NeighborhoodBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
