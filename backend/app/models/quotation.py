import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.group import BuyingGroup
    from app.models.wholesale import SupplierProfile
    from app.models.catalog import ProductVariant


class QuotationStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    EXPIRED = "EXPIRED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class DemandSnapshot(TimeStampedModel):
    """Immutable aggregate demand snapshot for supplier quotation requests."""
    __tablename__ = "demand_snapshots"

    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("buying_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    snapshot_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    snapshot_data: Mapped[str] = mapped_column(Text, nullable=False)  # JSON-serialized aggregate items
    total_retail_value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_packs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    group: Mapped["BuyingGroup"] = relationship("BuyingGroup")
    quotations: Mapped[List["SupplierQuotation"]] = relationship(
        "SupplierQuotation",
        back_populates="demand_snapshot",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<DemandSnapshot id={self.id} group_id={self.group_id} version={self.snapshot_version}>"


class SupplierQuotation(TimeStampedModel):
    """Supplier wholesale quotation submitted against a group demand snapshot."""
    __tablename__ = "supplier_quotations"

    demand_snapshot_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("demand_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("supplier_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default=QuotationStatus.SUBMITTED.value,
        nullable=False,
        index=True,
    )
    total_quoted_price: Mapped[float] = mapped_column(Float, nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    demand_snapshot: Mapped["DemandSnapshot"] = relationship("DemandSnapshot", back_populates="quotations")
    supplier: Mapped["SupplierProfile"] = relationship("SupplierProfile", back_populates="quotations")
    items: Mapped[List["QuotationItem"]] = relationship(
        "QuotationItem",
        back_populates="quotation",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<SupplierQuotation id={self.id} supplier_id={self.supplier_id} total={self.total_quoted_price} status={self.status}>"


class QuotationItem(TimeStampedModel):
    """Specific line item within a supplier quotation."""
    __tablename__ = "quotation_items"

    quotation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("supplier_quotations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quoted_packs: Mapped[int] = mapped_column(Integer, nullable=False)
    quoted_price_per_pack: Mapped[float] = mapped_column(Float, nullable=False)
    line_total: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    quotation: Mapped["SupplierQuotation"] = relationship("SupplierQuotation", back_populates="items")
    variant: Mapped["ProductVariant"] = relationship("ProductVariant")

    def __repr__(self) -> str:
        return f"<QuotationItem id={self.id} variant_id={self.variant_id} packs={self.quoted_packs} price={self.quoted_price_per_pack}>"
