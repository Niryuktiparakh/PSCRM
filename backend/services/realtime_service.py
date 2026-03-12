# backend/services/realtime_service.py
from realtime.connection_manager import manager
import asyncio


async def send_notification(user_id: str, payload: dict):

    await manager.send_to_user(user_id, payload)


async def broadcast_event(payload: dict):

    await manager.broadcast(payload)