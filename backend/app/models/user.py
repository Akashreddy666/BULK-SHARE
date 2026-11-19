import enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.neighborhood import Neighborhood


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    SUPPLIER = "SUPPLIER"
    ADMIN = "ADMIN"


class User(TimeStampedModel):
    """Application user profile linked to Supabase Auth user ID."""
    __tablename__ = "users"

    supabase_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    role: Mapped[str] = mapped_column(String(30), default=UserRole.CUSTOMER.value, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Neighborhood foreign key
    neighborhood_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("neighborhoods.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    neighborhood: Mapped[Optional["Neighborhood"]] = relationship("Neighborhood", back_populates="users")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
