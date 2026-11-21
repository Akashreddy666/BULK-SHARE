import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.order import GroupOrder
    from app.models.user import User


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, enum.Enum):
    UPI = "UPI"
    CARD = "CARD"
    NET_BANKING = "NET_BANKING"
    SIMULATED_WALLET = "SIMULATED_WALLET"


class PaymentTransaction(TimeStampedModel):
    """Simulated payment record for a household's group purchase allocation."""
    __tablename__ = "payment_transactions"

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
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    payment_method: Mapped[str] = mapped_column(
        String(30),
        default=PaymentMethod.UPI.value,
        nullable=False,
    )
    transaction_ref: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    receipt_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30),
        default=PaymentStatus.COMPLETED.value,
        nullable=False,
        index=True,
    )
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    group_order: Mapped["GroupOrder"] = relationship("GroupOrder")
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<PaymentTransaction ref={self.transaction_ref} user={self.user_id} amount={self.amount} status={self.status}>"
