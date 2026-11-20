from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogRead

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/groups/{group_id}", response_model=List[AuditLogRead])
def get_group_audit_logs(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve event audit history for a buying group."""
    logs = (
        db.execute(
            select(AuditLog)
            .where(AuditLog.entity_id == group_id)
            .order_by(AuditLog.created_at.desc())
        )
        .scalars()
        .all()
    )
    return logs
