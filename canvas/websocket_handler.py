"""
WebSocket handler for canvas CRDT synchronization.

Implements Yjs sync protocol with SYNC-05 (auto-reconnection) support:
1. Client connects with JWT token
2. Server validates token and permissions
3. Server sends current Y.Doc state (sync step 1) - THIS IS THE RECONNECTION MECHANISM
4. Client sends its state (sync step 2)
5. Bidirectional updates flow until disconnect

On reconnection:
- Client disconnects (network issue, tab close, etc.)
- Client reconnects with same token
- Server sends FULL current state (from memory or loaded from DB)
- Client merges with its local state via CRDT
- No data loss due to CRDT merge semantics
"""
from fastapi import WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy import select
from typing import Optional

from config import SECRET_KEY, ALGORITHM
from database import async_session
from models import User, Board, BoardPermission, PermissionLevel, AuditLog

from .room_manager import RoomManager


async def verify_canvas_access(
    token: str,
    board_id: str,
    request_ip: Optional[str] = None,
    user_agent: Optional[str] = None
) -> tuple[Optional[User], Optional[str]]:
    """
    Verify JWT token and board access permission.

    Args:
        token: JWT token from query params
        board_id: The board UUID
        request_ip: Client IP for audit log
        user_agent: Client user agent for audit log

    Returns:
        Tuple of (User or None, permission level or None)
    """
    # Decode token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None, None
        user_id = int(user_id)
    except (JWTError, ValueError):
        return None, None

    async with async_session() as db:
        # Get user
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None, None

        # Get board
        result = await db.execute(select(Board).where(Board.id == board_id))
        board = result.scalar_one_or_none()
        if not board:
            return None, None

        # Check permissions
        permission_level = None

        # Owner has full edit access
        if board.owner_id == user_id:
            permission_level = PermissionLevel.EDIT.value
        else:
            # Check explicit permission
            result = await db.execute(
                select(BoardPermission).where(
                    BoardPermission.board_id == board_id,
                    BoardPermission.user_id == user_id
                )
            )
            perm = result.scalar_one_or_none()
            if perm:
                permission_level = perm.level.value

            # Check public access if no explicit permission
            if not permission_level and board.is_public:
                result = await db.execute(
                    select(BoardPermission).where(
                        BoardPermission.board_id == board_id,
                        BoardPermission.user_id == None  # noqa: E711
                    )
                )
                public_perm = result.scalar_one_or_none()
                if public_perm:
                    permission_level = public_perm.level.value

        if not permission_level:
            return user, None

        # Log access for audit trail
        audit = AuditLog(
            user_id=user_id,
            board_id=board_id,
            action="access",
            permission_level=permission_level,
            ip_address=request_ip,
            user_agent=user_agent
        )
        db.add(audit)
        await db.commit()

        return user, permission_level


async def handle_canvas_websocket(
    websocket: WebSocket,
    board_id: str,
    token: str,
    room_manager: RoomManager
):
    """
    Handle WebSocket connection for canvas sync.

    Supports SYNC-05 (auto-reconnection):
    - On every connection (new or reconnect), sends full current state
    - Client CRDT merges server state with local state
    - Result: seamless reconnection with no data loss

    Args:
        websocket: FastAPI WebSocket
        board_id: The board UUID
        token: JWT token for authentication
        room_manager: The room manager instance
    """
    # Get client info for audit
    request_ip = None
    user_agent = None
    if hasattr(websocket, 'client') and websocket.client:
        request_ip = websocket.client.host
    if hasattr(websocket, 'headers'):
        user_agent = websocket.headers.get('user-agent')

    # Verify access
    user, permission = await verify_canvas_access(token, board_id, request_ip, user_agent)

    if not user:
        await websocket.close(code=4001)  # Unauthorized
        return

    if not permission:
        await websocket.close(code=4003)  # Forbidden
        return

    # Accept connection
    await websocket.accept()

    # Join room (loads state from DB if room was unloaded)
    room = await room_manager.add_client(board_id, websocket)

    # Send current state (sync step 1) - THIS IS THE RECONNECTION MECHANISM
    # Every connection (new or reconnect) receives full Y.Doc state
    # Client CRDT library merges with local state automatically
    state = room.ydoc.get_state()
    if state:
        await websocket.send_bytes(state)

    try:
        while True:
            # Receive Yjs update (binary)
            data = await websocket.receive_bytes()

            # Only apply updates if user has edit permission
            if permission == PermissionLevel.EDIT.value:
                await room_manager.apply_update(board_id, data, websocket)
            # View/comment users receive updates but can't send

    except WebSocketDisconnect:
        room_manager.remove_client(board_id, websocket)
