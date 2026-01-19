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
