# backend/services/notification_service.py
import asyncio

from services.realtime_service import send_notification
from sqlalchemy.orm import Session
from models import Notification


def create_notification(
    db: Session,
    user_id,
    message: str,
    notification_type: str = "info",
    meta: dict | None = None
):

    notification = Notification(
        user_id=user_id,
        message=message,
        notification_type=notification_type,
        meta=meta
    )

    db.add(notification)
    db.commit()
    
    asyncio.create_task(
        send_notification(
            str(user_id),
            {
                "type": "notification",
                "data": {
                    "id": notification.id,
                    "message": message,
                    "meta": meta
                }
            }
        )
    )

    return notification