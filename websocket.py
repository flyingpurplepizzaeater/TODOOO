from fastapi import WebSocket
from typing import Dict, Set
import json

class ConnectionManager:
    def __init__(self):
        # team_id -> set of (websocket, user_id, username)
        self.active_connections: Dict[int, Set[tuple]] = {}

    async def connect(self, websocket: WebSocket, team_id: int, user_id: int, username: str):
        await websocket.accept()
        if team_id not in self.active_connections:
            self.active_connections[team_id] = set()
        self.active_connections[team_id].add((websocket, user_id, username))

        # Broadcast user joined
        await self.broadcast(team_id, {
            "event": "member_online",
            "data": {"user_id": user_id, "username": username}
        }, exclude_ws=websocket)

        # Send current online users to new connection
        online_users = [
            {"user_id": uid, "username": uname}
            for ws, uid, uname in self.active_connections[team_id]
        ]
        await websocket.send_json({
            "event": "online_users",
            "data": {"users": online_users}
        })

    def disconnect(self, websocket: WebSocket, team_id: int, user_id: int, username: str):
        if team_id in self.active_connections:
            self.active_connections[team_id].discard((websocket, user_id, username))
            if not self.active_connections[team_id]:
                del self.active_connections[team_id]

    async def broadcast(self, team_id: int, message: dict, exclude_ws: WebSocket = None):
        if team_id not in self.active_connections:
            return

        for ws, user_id, username in self.active_connections[team_id].copy():
            if ws != exclude_ws:
                try:
                    await ws.send_json(message)
                except:
                    self.active_connections[team_id].discard((ws, user_id, username))

    async def broadcast_offline(self, team_id: int, user_id: int, username: str):
        await self.broadcast(team_id, {
            "event": "member_offline",
            "data": {"user_id": user_id, "username": username}
        })

    async def broadcast_todo_event(
        self,
        team_id: int,
        event_type: str,
        todo_data: dict,
        exclude_ws: WebSocket = None
    ):
        """
        Broadcast TODO changes to all connected clients in a team.

        This enables real-time sync between canvas TODO shapes and backend.
        Frontend listens for these events and updates shapes via mergeRemoteChanges().

        Args:
            team_id: Team ID to broadcast to
            event_type: One of 'todo_created', 'todo_updated', 'todo_deleted'
            todo_data: TODO item data (id, title, completed, due_date, etc.)
            exclude_ws: Optional WebSocket to exclude from broadcast
        """
        await self.broadcast(team_id, {
            "event": event_type,
            "data": todo_data
        }, exclude_ws=exclude_ws)

manager = ConnectionManager()
