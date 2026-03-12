# backend/routes/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

connections = {}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):

    await websocket.accept()

    if user_id not in connections:
        connections[user_id] = []

    connections[user_id].append(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        connections[user_id].remove(websocket)


async def send_realtime_update(user_id: str, payload: dict):

    if user_id not in connections:
        return

    for ws in connections[user_id]:
        await ws.send_json(payload)
        
        

from realtime.connection_manager import manager



@router.websocket("/ws/{user_id}")

async def websocket_endpoint(websocket: WebSocket, user_id: str):

    await manager.connect(websocket, user_id)

    try:

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect(websocket, user_id)