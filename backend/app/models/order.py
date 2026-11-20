import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, ForeignKey, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.group import BuyingGroup
    from app.models.user import User
    from app.models.quotation import SupplierQuotation


class RoundStatus(str, enum.Enum):
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RECALCULATED = "RECALCULATED"


class MemberConfirmationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class FulfillmentPreference(str, enum.Enum):
    PICKUP = "PICKUP"
    HOME_DELIVERY = "HOME_DELIVERY"


class OrderLockStatus(str, enum.Enum):
    LOCKED = "LOCKED"
    PROCUREMENT_PENDING = "PROCUREMENT_PENDING"
    PROCURED = "PROCURED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"


class ConfirmationRound(TimeStampedModel):
    """Member approval round for a selected wholesale quotation."""
    __tablename__ = "confirmation_rounds"

    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("buying_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    selected_quotation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("supplier_quotations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    round_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # 1 or 2 (max 1 retry round)
    status: Mapped[str] = mapped_column(
        String(30),
        default=RoundStatus.OPEN.value,
        nullable=False,
        index=True,
    )
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    group: Mapped["BuyingGroup"] = relationship("BuyingGroup")
    quotation: Mapped["SupplierQuotation"] = relationship("SupplierQuotation")
    confirmations: Mapped[List["MemberConfirmation"]] = relationship(
        "MemberConfirmation",
        back_populates="round",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<ConfirmationRound id={self.id} group_id={self.group_id} round={self.round_number} status={self.status}>"


class MemberConfirmation(TimeStampedModel):
    """Individual household approval record for a confirmation round."""
    __tablename__ = "member_confirmations"
    __table_args__ = (
        UniqueConstraint("confirmation_round_id", "user_id", name="uq_round_member_confirmation"),
    )

    confirmation_round_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("confirmation_rounds.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
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
    status: Mapped[str] = mapped_column(
        String(30),
        default=MemberConfirmationStatus.PENDING.value,
        nullable=False,
        index=True,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    total_household_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_household_savings: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fulfillment_preference: Mapped[str] = mapped_column(
        String(30),
        default=FulfillmentPreference.PICKUP.value,
        nullable=False,
    )
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Kept private to user

    # Relationships
    round: Mapped["ConfirmationRound"] = relationship("ConfirmationRound", back_populates="confirmations")
    user: Mapped["User"] = relationship("User")
    group: Mapped["BuyingGroup"] = relationship("BuyingGroup")

    def __repr__(self) -> str:
        return f"<MemberConfirmation id={self.id} user_id={self.user_id} status={self.status}>"


class GroupOrder(TimeStampedModel):
    """Immutable locked purchase order for wholesale procurement."""
    __tablename__ = "group_orders"

    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("buying_groups.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
        index=True,
    )
    selected_quotation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("supplier_quotations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    confirmation_round_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("confirmation_rounds.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default=OrderLockStatus.LOCKED.value,
        nullable=False,
        index=True,
    )
    total_retail_amount: Mapped[float] = mapped_column(Float, nullable=False)
    total_wholesale_amount: Mapped[float] = mapped_column(Float, nullable=False)
    total_savings_amount: Mapped[float] = mapped_column(Float, nullable=False)
    total_packs: Mapped[int] = mapped_column(Integer, nullable=False)
    locked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    locked_by_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    order_allocations_data: Mapped[str] = mapped_column(Text, nullable=False)  # Frozen JSON snapshot of allocations

    # Relationships
    group: Mapped["BuyingGroup"] = relationship("BuyingGroup")
    quotation: Mapped["SupplierQuotation"] = relationship("SupplierQuotation")
    confirmation_round: Mapped["ConfirmationRound"] = relationship("ConfirmationRound")
    locked_by: Mapped["User"] = relationship("User", foreign_keys=[locked_by_user_id])

    def __repr__(self) -> str:
        return f"<GroupOrder id={self.id} group_id={self.group_id} total={self.total_wholesale_amount} status={self.status}>"
