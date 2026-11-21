import enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, enum.Enum):
    ORDER_LOCKED = "ORDER_LOCKED"
    PAYMENT_DUE = "PAYMENT_DUE"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
    PO_PLACED = "PO_PLACED"
    PO_DISPATCHED = "PO_DISPATCHED"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    DELIVERED = "DELIVERED"
    DISPUTE_RAISED = "DISPUTE_RAISED"
    DISPUTE_RESOLVED = "DISPUTE_RESOLVED"


class Notification(TimeStampedModel):
    """In-app alert notification delivered to users upon critical order/fulfillment state changes."""
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        String(40),
        default=NotificationType.ORDER_LOCKED.value,
        nullable=False,
        index=True,
    )
    link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<Notification user={self.user_id} title={self.title} read={self.is_read}>"
