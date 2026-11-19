from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.neighborhood import Neighborhood
from app.schemas.neighborhood import NeighborhoodRead

router = APIRouter(prefix="/neighborhoods", tags=["Neighborhoods"])


@router.get("", response_model=List[NeighborhoodRead])
def list_active_neighborhoods(
    db: Session = Depends(get_db),
) -> List[Neighborhood]:
    """Retrieve all active neighborhoods for group buying."""
    stmt = (
        select(Neighborhood)
        .where(Neighborhood.is_active == True)  # noqa: E712
        .order_by(Neighborhood.name)
    )
    result = db.execute(stmt)
    return list(result.scalars().all())
