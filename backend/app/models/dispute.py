import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.order import GroupOrder
    from app.models.user import User


class DisputeStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class DisputeCategory(str, enum.Enum):
    DAMAGED_PACKS = "DAMAGED_PACKS"
    MISSING_ITEMS = "MISSING_ITEMS"
    WRONG_ITEM = "WRONG_ITEM"
    DELIVERY_ISSUE = "DELIVERY_ISSUE"
    OTHER = "OTHER"


class OrderDispute(TimeStampedModel):
    """Customer-reported dispute or quality complaint against an order or fulfillment."""
    __tablename__ = "order_disputes"

    group_order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("group_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(
        String(40),
        default=DisputeCategory.DAMAGED_PACKS.value,
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        default=DisputeStatus.OPEN.value,
        nullable=False,
        index=True,
    )
    refund_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    group_order: Mapped["GroupOrder"] = relationship("GroupOrder")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    resolved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[resolved_by_user_id])

    def __repr__(self) -> str:
        return f"<OrderDispute id={self.id} category={self.category} status={self.status}>"
