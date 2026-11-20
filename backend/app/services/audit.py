import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_audit_event(
    entity_type: str,
    entity_id: str,
    action: str,
    db: Session,
    actor_user_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    details: Optional[Any] = None,
) -> AuditLog:
    """Helper to record audit log events."""
    details_str = json.dumps(details) if isinstance(details, (dict, list)) else (str(details) if details else None)
    log_entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor_user_id=actor_user_id,
        actor_role=actor_role,
        details=details_str,
    )
    db.add(log_entry)
    db.commit()
    return log_entry
