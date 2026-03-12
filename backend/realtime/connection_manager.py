# backend/realtime/connection_manager.py
from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):

        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)

            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):

        if user_id not in self.active_connections:
            return

        for connection in self.active_connections[user_id]:
            await connection.send_json(message)

    async def broadcast(self, message: dict):

        for user_connections in self.active_connections.values():

            for connection in user_connections:
                await connection.send_json(message)


manager = ConnectionManager()