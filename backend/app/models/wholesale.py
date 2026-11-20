import enum
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.catalog import ProductVariant
    from app.models.quotation import SupplierQuotation


class SupplierProfile(TimeStampedModel):
    """Wholesale supplier company profile linked to a User account."""
    __tablename__ = "supplier_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    company_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Bengaluru")
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    offers: Mapped[List["SupplierProductOffer"]] = relationship(
        "SupplierProductOffer",
        back_populates="supplier",
        cascade="all, delete-orphan",
    )
    quotations: Mapped[List["SupplierQuotation"]] = relationship(
        "SupplierQuotation",
        back_populates="supplier",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<SupplierProfile id={self.id} company={self.company_name} verified={self.is_verified}>"


class WholesalePriceTier(TimeStampedModel):
    """Pre-negotiated wholesale volume discount tiers for product variants."""
    __tablename__ = "wholesale_price_tiers"

    variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    min_quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # Min cumulative sealed packs
    price_per_pack: Mapped[float] = mapped_column(Float, nullable=False)  # Discounted unit price in INR
    tier_label: Mapped[str] = mapped_column(String(50), nullable=False, default="Tier 1")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship
    variant: Mapped["ProductVariant"] = relationship("ProductVariant")

    def __repr__(self) -> str:
        return f"<WholesalePriceTier id={self.id} variant_id={self.variant_id} min={self.min_quantity} price={self.price_per_pack}>"


class SupplierProductOffer(TimeStampedModel):
    """Products and rates offered by verified suppliers."""
    __tablename__ = "supplier_product_offers"
    __table_args__ = (
        UniqueConstraint("supplier_id", "variant_id", name="uq_supplier_variant_offer"),
    )

    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("supplier_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    offer_price_per_pack: Mapped[float] = mapped_column(Float, nullable=False)
    min_order_packs: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_order_packs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    supplier: Mapped["SupplierProfile"] = relationship("SupplierProfile", back_populates="offers")
    variant: Mapped["ProductVariant"] = relationship("ProductVariant")

    def __repr__(self) -> str:
        return f"<SupplierProductOffer id={self.id} supplier_id={self.supplier_id} price={self.offer_price_per_pack}>"
