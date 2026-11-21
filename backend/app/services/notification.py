from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.order import GroupOrder


def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    type: str = NotificationType.ORDER_LOCKED.value,
    link: Optional[str] = None,
) -> Notification:
    """Create and persist an in-app notification for a user."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        link=link,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def broadcast_group_order_notification(
    db: Session,
    group_order: GroupOrder,
    title: str,
    message: str,
    type: str = NotificationType.ORDER_LOCKED.value,
    link: Optional[str] = None,
) -> List[Notification]:
    """Broadcast an in-app notification to all active confirmed members of a group order."""
    import json
    notifications = []
    try:
        alloc_data = json.loads(group_order.order_allocations_data)
        members = alloc_data.get("members", [])
        for m in members:
            uid = m.get("user_id")
            if uid:
                notif = Notification(
                    user_id=uid,
                    title=title,
                    message=message,
                    type=type,
                    link=link,
                    is_read=False,
                )
                db.add(notif)
                notifications.append(notif)
        db.commit()
    except Exception:
        db.rollback()
    return notifications
