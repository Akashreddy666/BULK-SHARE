from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole
from app.schemas.neighborhood import NeighborhoodRead


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    neighborhood_id: Optional[str] = None


class UserCreate(UserBase):
    supabase_uid: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    neighborhood_id: Optional[str] = None


class UserRead(UserBase):
    id: str
    supabase_uid: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    neighborhood: Optional[NeighborhoodRead] = None

    model_config = ConfigDict(from_attributes=True)


class DemoLoginRequest(BaseModel):
    role: UserRole = UserRole.CUSTOMER
    email: Optional[EmailStr] = None


class DemoTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    demo_mode: bool = True
