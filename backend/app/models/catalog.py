import enum
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.grocery_list import GroceryListItem


class ProductCategory(str, enum.Enum):
    RICE = "RICE"
    OIL = "OIL"
    DAL = "DAL"
    SUGAR = "SUGAR"
    FLOUR = "FLOUR"


class Product(TimeStampedModel):
    """Catalog product category and base definition."""
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    base_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    variants: Mapped[List["ProductVariant"]] = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name} category={self.category}>"


class ProductVariant(TimeStampedModel):
    """Exact sellable SKU variant (brand, sealed pack quantity and unit)."""
    __tablename__ = "product_variants"

    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    pack_quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # e.g., 5 for 5kg/5L
    pack_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")  # kg, L
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    reference_retail_price: Mapped[float] = mapped_column(Float, nullable=False)  # Reference retail shop price in INR
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    list_items: Mapped[List["GroceryListItem"]] = relationship(
        "GroceryListItem",
        back_populates="variant",
        cascade="all, delete-orphan",
    )

    @property
    def display_name(self) -> str:
        return f"{self.brand} ({self.pack_quantity} {self.pack_unit})"

    def __repr__(self) -> str:
        return f"<ProductVariant id={self.id} sku={self.sku} brand={self.brand}>"
