import enum
import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel, get_utc_now

if TYPE_CHECKING:
    from app.models.neighborhood import Neighborhood
    from app.models.user import User
    from app.models.grocery_list import GroceryListItem


class GroupVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"


class GroupStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    QUOTING = "QUOTING"
    CONFIRMING = "CONFIRMING"
    LOCKED = "LOCKED"
    PROCUREMENT = "PROCUREMENT"
    FULFILLMENT = "FULFILLMENT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class BuyingGroup(TimeStampedModel):
    """Neighborhood buying group for pooled grocery purchasing."""
    __tablename__ = "buying_groups"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    neighborhood_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("neighborhoods.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    organizer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    visibility: Mapped[str] = mapped_column(
        String(20),
        default=GroupVisibility.PUBLIC.value,
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default=GroupStatus.OPEN.value,
        nullable=False,
        index=True,
    )
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    close_rule: Mapped[str] = mapped_column(String(50), default="DEADLINE_OR_TARGET", nullable=False)
    min_members: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    max_members: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    neighborhood: Mapped["Neighborhood"] = relationship("Neighborhood")
    organizer: Mapped["User"] = relationship("User", foreign_keys=[organizer_id])
    members: Mapped[List["GroupMember"]] = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan",
    )
    invitations: Mapped[List["GroupInvitation"]] = relationship(
        "GroupInvitation",
        back_populates="group",
        cascade="all, delete-orphan",
    )
    list_items: Mapped[List["GroceryListItem"]] = relationship(
        "GroceryListItem",
        back_populates="group",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<BuyingGroup id={self.id} name={self.name} status={self.status}>"


class GroupMember(TimeStampedModel):
    """Membership of a user within a specific buying group."""
    __tablename__ = "group_members"
    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_member"),
    )

    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("buying_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_organizer: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        nullable=False,
    )

    # Relationships
    group: Mapped["BuyingGroup"] = relationship("BuyingGroup", back_populates="members")
    user: Mapped["User"] = relationship("User")


class GroupInvitation(TimeStampedModel):
    """Authorized invite token for private neighborhood buying groups."""
    __tablename__ = "group_invitations"

    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("buying_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        default=lambda: uuid.uuid4().hex,
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_uses: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    uses_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Relationships
    group: Mapped["BuyingGroup"] = relationship("BuyingGroup", back_populates="invitations")
    created_by: Mapped["User"] = relationship("User")

    @property
    def is_valid(self) -> bool:
        if self.is_revoked:
            return False
        if self.uses_count >= self.max_uses:
            return False
        expires_at = self.expires_at
        if expires_at is not None:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_at:
                return False
        return True
