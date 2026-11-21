import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.order import GroupOrder
    from app.models.wholesale import SupplierProfile


class ProcurementStatus(str, enum.Enum):
    PLACED = "PLACED"
    CONFIRMED_BY_SUPPLIER = "CONFIRMED_BY_SUPPLIER"
    DISPATCHED_TO_HUB = "DISPATCHED_TO_HUB"
    DELIVERED_TO_HUB = "DELIVERED_TO_HUB"
    CANCELLED = "CANCELLED"


class ProcurementOrder(TimeStampedModel):
    """Admin-placed wholesale purchase order with a verified supplier."""
    __tablename__ = "procurement_orders"

    group_order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("group_orders.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("supplier_profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    po_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(40),
        default=ProcurementStatus.PLACED.value,
        nullable=False,
        index=True,
    )
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_delivery_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_to_hub_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    group_order: Mapped["GroupOrder"] = relationship("GroupOrder")
    supplier: Mapped["SupplierProfile"] = relationship("SupplierProfile")

    def __repr__(self) -> str:
        return f"<ProcurementOrder po={self.po_number} status={self.status} supplier_id={self.supplier_id}>"
