"""
Board management endpoints.

Provides CRUD operations for boards and permission sharing.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import get_current_user
from models import User, Board, BoardPermission, PermissionLevel, AuditLog
from schemas import (
    BoardCreate, BoardResponse,
    BoardPermissionCreate, BoardPermissionResponse,
    ShareLinkResponse
)

router = APIRouter(prefix="/boards", tags=["boards"])


@router.post("", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(
    board_data: BoardCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new board."""
    board = Board(
        id=str(uuid.uuid4()),
        owner_id=user.id,
        title=board_data.title,
        is_public=board_data.is_public
    )
    db.add(board)

    # Log creation
    audit = AuditLog(
        user_id=user.id,
        board_id=board.id,
        action="create"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(board)
    return board


@router.get("", response_model=list[BoardResponse])
async def list_boards(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List boards user owns or has access to."""
    # Get owned boards
    result = await db.execute(
        select(Board).where(Board.owner_id == user.id)
    )
    owned = result.scalars().all()

    # Get boards with explicit permission
    result = await db.execute(
        select(Board)
        .join(BoardPermission)
        .where(BoardPermission.user_id == user.id)
    )
    shared = result.scalars().all()

    # Combine and deduplicate
    board_ids = set()
    boards = []
    for board in list(owned) + list(shared):
        if board.id not in board_ids:
            boards.append(board)
            board_ids.add(board.id)

    return boards


@router.get("/{board_id}", response_model=BoardResponse)
async def get_board(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific board."""
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    # Check access
    if board.owner_id != user.id:
        result = await db.execute(
            select(BoardPermission).where(
                BoardPermission.board_id == board_id,
                BoardPermission.user_id == user.id
            )
        )
        if not result.scalar_one_or_none():
            # Check public access
            if not board.is_public:
                raise HTTPException(status_code=403, detail="Access denied")

    return board


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a board. Only owner can delete."""
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete board")

    # Log deletion
    audit = AuditLog(
        user_id=user.id,
        board_id=board_id,
        action="delete"
    )
    db.add(audit)

    await db.delete(board)
    await db.commit()


@router.post("/{board_id}/share", response_model=BoardPermissionResponse, status_code=status.HTTP_201_CREATED)
async def share_board(
    board_id: str,
    perm_data: BoardPermissionCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Share board with a user or set public access."""
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can share board")

    # Validate permission level
    try:
        level = PermissionLevel(perm_data.level)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid permission level")

    # Check if permission already exists
    if perm_data.user_id:
        result = await db.execute(
            select(BoardPermission).where(
                BoardPermission.board_id == board_id,
                BoardPermission.user_id == perm_data.user_id
            )
        )
    else:
        # Public permission
        result = await db.execute(
            select(BoardPermission).where(
                BoardPermission.board_id == board_id,
                BoardPermission.user_id == None  # noqa: E711
            )
        )

    existing = result.scalar_one_or_none()

    if existing:
        # Update existing permission
        existing.level = level
        perm = existing
    else:
        # Create new permission
        perm = BoardPermission(
            board_id=board_id,
            user_id=perm_data.user_id,
            level=level
        )
        db.add(perm)

    # Update is_public flag if this is public permission
    if perm_data.user_id is None:
        board.is_public = True

    # Log permission change
    audit = AuditLog(
        user_id=user.id,
        board_id=board_id,
        action="permission_change",
        permission_level=level.value,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit)

    await db.commit()
    await db.refresh(perm)
    return perm


@router.delete("/{board_id}/share/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_permission(
    board_id: str,
    target_user_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke a user's permission."""
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can revoke permissions")

    result = await db.execute(
        select(BoardPermission).where(
            BoardPermission.board_id == board_id,
            BoardPermission.user_id == target_user_id
        )
    )
    perm = result.scalar_one_or_none()

    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    # Log revocation
    audit = AuditLog(
        user_id=user.id,
        board_id=board_id,
        action="permission_change",
        permission_level="revoked",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit)

    await db.delete(perm)
    await db.commit()


@router.delete("/{board_id}/share/public", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_public_access(
    board_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke public access to a board."""
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can revoke permissions")

    result = await db.execute(
        select(BoardPermission).where(
            BoardPermission.board_id == board_id,
            BoardPermission.user_id == None  # noqa: E711
        )
    )
    perm = result.scalar_one_or_none()

    if perm:
        await db.delete(perm)

    board.is_public = False

    # Log revocation
    audit = AuditLog(
        user_id=user.id,
        board_id=board_id,
        action="permission_change",
        permission_level="public_revoked",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit)

    await db.commit()


@router.get("/{board_id}/link", response_model=ShareLinkResponse)
async def get_share_link(
    board_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get shareable link for a board."""
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    # Only owner can get share link
    if board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can get share link")

    # Get public permission level if exists
    result = await db.execute(
        select(BoardPermission).where(
            BoardPermission.board_id == board_id,
            BoardPermission.user_id == None  # noqa: E711
        )
    )
    public_perm = result.scalar_one_or_none()

    # Construct base URL
    host = request.headers.get("host", "localhost:8000")
    scheme = request.headers.get("x-forwarded-proto", "http")
    base_url = f"{scheme}://{host}"

    return ShareLinkResponse(
        board_id=board_id,
        url=f"{base_url}/board/{board_id}",
        permission_level=public_perm.level.value if public_perm else "none",
        is_public=board.is_public
    )


@router.get("/{board_id}/permissions", response_model=list[BoardPermissionResponse])
async def list_permissions(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all permissions for a board. Only owner can view."""
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can view permissions")

    result = await db.execute(
        select(BoardPermission).where(BoardPermission.board_id == board_id)
    )
    return result.scalars().all()
