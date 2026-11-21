import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.order import GroupOrder
    from app.models.user import User


class FulfillmentStatus(str, enum.Enum):
    PENDING_PROCUREMENT = "PENDING_PROCUREMENT"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"


class MemberFulfillment(TimeStampedModel):
    """Tracking record for customer pickup (via verification code) or home delivery."""
    __tablename__ = "member_fulfillments"
    __table_args__ = (
        UniqueConstraint("group_order_id", "user_id", name="uq_order_member_fulfillment"),
    )

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
    fulfillment_type: Mapped[str] = mapped_column(
        String(30),
        default="PICKUP",
        nullable=False,
    )  # PICKUP or HOME_DELIVERY
    pickup_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(40),
        default=FulfillmentStatus.PENDING_PROCUREMENT.value,
        nullable=False,
        index=True,
    )
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    group_order: Mapped["GroupOrder"] = relationship("GroupOrder")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    verified_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by_user_id])

    def __repr__(self) -> str:
        return f"<MemberFulfillment user={self.user_id} type={self.fulfillment_type} status={self.status}>"
