import enum
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.group import BuyingGroup
    from app.models.user import User
    from app.models.catalog import ProductVariant


class BrandPreference(str, enum.Enum):
    EXACT = "EXACT"
    FLEXIBLE = "FLEXIBLE"


class GroceryListItem(TimeStampedModel):
    """Individual household grocery commitment for a group purchase."""
    __tablename__ = "grocery_list_items"
    __table_args__ = (
        UniqueConstraint("group_id", "user_id", "variant_id", name="uq_user_group_variant"),
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
    variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pack_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )  # Positive integer number of sealed packs
    brand_preference: Mapped[str] = mapped_column(
        String(20),
        default=BrandPreference.EXACT.value,
        nullable=False,
    )

    # Relationships
    group: Mapped["BuyingGroup"] = relationship("BuyingGroup", back_populates="list_items")
    user: Mapped["User"] = relationship("User")
    variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="list_items")

    def __repr__(self) -> str:
        return f"<GroceryListItem id={self.id} user_id={self.user_id} packs={self.pack_quantity}>"
