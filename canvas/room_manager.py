"""
Room manager for CRDT document lifecycle.

Manages Y.Doc instances per board with:
- Lazy loading from persistence
- Automatic persistence on changes (debounced)
- Cleanup after inactivity
- Client tracking per room
"""
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from pycrdt import Doc
from fastapi import WebSocket

from .persistence import BoardPersistence


class Room:
    """A single board room with its Y.Doc and connected clients."""

    def __init__(self, board_id: str, ydoc: Doc):
        self.board_id = board_id
        self.ydoc = ydoc
        self.clients: set[WebSocket] = set()
        self.last_activity = datetime.utcnow()

    def touch(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()


class RoomManager:
    """
    Manages Y.Doc rooms for canvas boards.

    Features:
    - Lazy load: Y.Doc created/loaded on first connection
    - Auto-persist: Changes saved to database (debounced)
    - Auto-cleanup: Rooms unloaded after inactivity
    - Reconnection support: New connections get full current state (SYNC-05)
    """

    INACTIVITY_TIMEOUT = timedelta(minutes=30)
    CLEANUP_INTERVAL = timedelta(minutes=5)

    def __init__(self, persistence: BoardPersistence):
        self._persistence = persistence
        self._rooms: dict[str, Room] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start(self):
        """Start the background cleanup task."""
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop(self):
        """Stop cleanup and flush pending persistence."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        await self._persistence.flush_pending()

    async def get_or_create_room(self, board_id: str) -> Room:
        """
        Get existing room or create new one.

        Loads persisted state if available. This is how reconnection works:
        - If room is in memory, returns it with current state
        - If room was unloaded, loads from database (persistence layer)
        - New connections always get full current state (SYNC-05 compliance)

        Args:
            board_id: The board UUID

        Returns:
            Room instance with Y.Doc
        """
        if board_id in self._rooms:
            room = self._rooms[board_id]
            room.touch()
            return room

        # Create new Y.Doc
        ydoc = Doc()

        # Load persisted state if exists (enables reconnection to get full state)
        state = await self._persistence.load(board_id)
        if state:
            ydoc.apply_update(state)

        room = Room(board_id, ydoc)
        self._rooms[board_id] = room
        return room

    async def add_client(self, board_id: str, websocket: WebSocket) -> Room:
        """
        Add a client to a room.

        Args:
            board_id: The board UUID
            websocket: The client's WebSocket connection

        Returns:
            The room the client joined
        """
        room = await self.get_or_create_room(board_id)
        room.clients.add(websocket)
        room.touch()
        return room

    def remove_client(self, board_id: str, websocket: WebSocket):
        """
        Remove a client from a room.

        Args:
            board_id: The board UUID
            websocket: The client's WebSocket connection
        """
        if board_id in self._rooms:
            room = self._rooms[board_id]
            room.clients.discard(websocket)

    async def broadcast(self, board_id: str, data: bytes, exclude: Optional[WebSocket] = None):
        """
        Broadcast binary data to all clients in a room.

        Args:
            board_id: The board UUID
            data: Binary data to send
            exclude: Optional WebSocket to exclude from broadcast
        """
        if board_id not in self._rooms:
            return

        room = self._rooms[board_id]
        dead_clients = set()

        for client in room.clients:
            if client != exclude:
                try:
                    await client.send_bytes(data)
                except Exception:
                    dead_clients.add(client)

        # Clean up dead connections
        room.clients -= dead_clients

    async def apply_update(self, board_id: str, update: bytes, source: WebSocket):
        """
        Apply a Y.Doc update and broadcast to other clients.

        Args:
            board_id: The board UUID
            update: Binary Yjs update
            source: The WebSocket that sent the update
        """
        if board_id not in self._rooms:
            return

        room = self._rooms[board_id]
        room.ydoc.apply_update(update)
        room.touch()

        # Broadcast to other clients
        await self.broadcast(board_id, update, exclude=source)

        # Debounced persistence
        await self._persistence.save_debounced(board_id, room.ydoc)

    def get_state(self, board_id: str) -> Optional[bytes]:
        """
        Get current Y.Doc state for a room.

        Args:
            board_id: The board UUID

        Returns:
            Binary state or None if room doesn't exist
        """
        if board_id not in self._rooms:
            return None
        return self._rooms[board_id].ydoc.get_state()

    async def _cleanup_loop(self):
        """Background task to unload inactive rooms."""
        while True:
            await asyncio.sleep(self.CLEANUP_INTERVAL.total_seconds())

            now = datetime.utcnow()
            to_unload = []

            for board_id, room in self._rooms.items():
                # Only unload if no clients and inactive
                if not room.clients and (now - room.last_activity) > self.INACTIVITY_TIMEOUT:
                    to_unload.append(board_id)

            for board_id in to_unload:
                room = self._rooms.pop(board_id)
                # Final save before unloading
                await self._persistence.save(board_id, room.ydoc)
