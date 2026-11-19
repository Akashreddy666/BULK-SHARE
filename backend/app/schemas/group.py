from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.group import GroupVisibility, GroupStatus
from app.schemas.neighborhood import NeighborhoodRead
from app.schemas.user import UserRead


class GroupBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    neighborhood_id: str
    visibility: GroupVisibility = GroupVisibility.PUBLIC
    deadline: datetime
    close_rule: str = "DEADLINE_OR_TARGET"
    min_members: int = Field(default=5, ge=2)
    max_members: Optional[int] = Field(default=None, ge=2)


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[GroupStatus] = None
    min_members: Optional[int] = None


class GroupMemberRead(BaseModel):
    id: str
    user_id: str
    is_organizer: bool
    joined_at: datetime
    user: Optional[UserRead] = None

    model_config = ConfigDict(from_attributes=True)


class GroupRead(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    neighborhood_id: str
    organizer_id: str
    visibility: GroupVisibility
    status: GroupStatus
    deadline: datetime
    close_rule: str
    min_members: int
    max_members: Optional[int] = None
    version: int
    created_at: datetime
    updated_at: datetime
    neighborhood: Optional[NeighborhoodRead] = None
    organizer: Optional[UserRead] = None
    members_count: int = 0
    is_member: bool = False
    is_organizer: bool = False

    model_config = ConfigDict(from_attributes=True)


class GroupInvitationCreate(BaseModel):
    expires_in_days: int = Field(default=7, ge=1, le=30)
    max_uses: int = Field(default=10, ge=1, le=100)


class GroupInvitationRead(BaseModel):
    id: str
    group_id: str
    token: str
    expires_at: datetime
    max_uses: int
    uses_count: int
    is_valid: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvitationRedeemRequest(BaseModel):
    token: str = Field(..., min_length=10)
