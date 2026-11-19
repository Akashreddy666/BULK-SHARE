from typing import List, TYPE_CHECKING
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.user import User


class Neighborhood(TimeStampedModel):
    """Neighborhood boundary for local group purchasing."""
    __tablename__ = "neighborhoods"

    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Bengaluru")
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="neighborhood")

    def __repr__(self) -> str:
        return f"<Neighborhood id={self.id} name={self.name} postal_code={self.postal_code}>"
