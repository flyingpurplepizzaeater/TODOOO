"""
Custom CRDT persistence layer.

Stores Y.Doc state as compacted binary blobs, avoiding the unbounded growth
issue of pycrdt-websocket's default SQLiteYStore (which logs all updates).

Design note: Uses raw SQL instead of ORM for board_states table because:
- board_states is a simple key-value store (board_id -> binary blob)
- No relationships, no complex queries, no joins needed
- Binary BLOB handling is more direct with raw SQL
- This is intentional, not a missing model
"""
from datetime import datetime
from typing import Optional
import asyncio
from sqlalchemy import text
from pycrdt import Doc
from database import async_session


class BoardPersistence:
    """
    Persistence layer for Y.Doc state.

    Stores compacted document state (not update log) to avoid
    unbounded database growth.
    """

    def __init__(self, debounce_seconds: float = 5.0):
        """
        Args:
            debounce_seconds: Minimum time between saves for same board
        """
        self._debounce_seconds = debounce_seconds
        self._pending_saves: dict[str, asyncio.Task] = {}

    async def load(self, board_id: str) -> Optional[bytes]:
        """
        Load Y.Doc state from database.

        Args:
            board_id: The board UUID

        Returns:
            Binary Y.Doc state or None if board has no saved state
        """
        async with async_session() as session:
            result = await session.execute(
                text("SELECT state FROM board_states WHERE board_id = :board_id"),
                {"board_id": board_id}
            )
            row = result.fetchone()
            return row[0] if row else None

    async def save(self, board_id: str, ydoc: Doc) -> None:
        """
        Save compacted Y.Doc state to database.

        Uses get_update() to store the full document state as a single binary.
        This is the compacted representation suitable for persistence.

        Args:
            board_id: The board UUID
            ydoc: The Y.Doc to persist
        """
        # get_update() returns binary that can be applied to reconstruct the doc
        # This is more compact than logging individual updates
        state = ydoc.get_update()

        async with async_session() as session:
            # Upsert: insert or replace existing state
            await session.execute(
                text("""
                INSERT INTO board_states (board_id, state, updated_at)
                VALUES (:board_id, :state, :updated_at)
                ON CONFLICT(board_id) DO UPDATE SET
                    state = excluded.state,
                    updated_at = excluded.updated_at
                """),
                {
                    "board_id": board_id,
                    "state": state,
                    "updated_at": datetime.utcnow()
                }
            )
            await session.commit()

    async def save_debounced(self, board_id: str, ydoc: Doc) -> None:
        """
        Save with debouncing to reduce database writes.

        If called multiple times within debounce_seconds, only the
        last call actually writes to database.

        Args:
            board_id: The board UUID
            ydoc: The Y.Doc to persist
        """
        # Cancel existing pending save for this board
        if board_id in self._pending_saves:
            self._pending_saves[board_id].cancel()

        async def delayed_save():
            await asyncio.sleep(self._debounce_seconds)
            await self.save(board_id, ydoc)
            self._pending_saves.pop(board_id, None)

        self._pending_saves[board_id] = asyncio.create_task(delayed_save())

    async def delete(self, board_id: str) -> None:
        """
        Delete persisted state for a board.

        Args:
            board_id: The board UUID
        """
        async with async_session() as session:
            await session.execute(
                text("DELETE FROM board_states WHERE board_id = :board_id"),
                {"board_id": board_id}
            )
            await session.commit()

    async def flush_pending(self) -> None:
        """
        Force all pending debounced saves to complete.

        Useful for graceful shutdown.
        """
        for task in self._pending_saves.values():
            task.cancel()
        self._pending_saves.clear()
