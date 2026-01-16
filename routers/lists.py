from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User, TodoList, TeamMember
from schemas import ListCreate, ListResponse, ListUpdate
from auth import get_current_user
from routers.teams import verify_team_member
from typing import List

router = APIRouter(tags=["lists"])

async def get_list_or_404(list_id: int, db: AsyncSession) -> TodoList:
    result = await db.execute(select(TodoList).where(TodoList.id == list_id))
    todo_list = result.scalar_one_or_none()
    if not todo_list:
        raise HTTPException(status_code=404, detail="List not found")
    return todo_list

@router.post("/teams/{team_id}/lists", response_model=ListResponse)
async def create_list(
    team_id: int,
    list_data: ListCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_team_member(current_user.id, team_id, db)

    todo_list = TodoList(name=list_data.name, team_id=team_id)
    db.add(todo_list)
    await db.commit()
    await db.refresh(todo_list)
    return todo_list

@router.get("/teams/{team_id}/lists", response_model=List[ListResponse])
async def get_team_lists(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_team_member(current_user.id, team_id, db)

    result = await db.execute(
        select(TodoList).where(TodoList.team_id == team_id)
    )
    return result.scalars().all()

@router.put("/lists/{list_id}", response_model=ListResponse)
async def update_list(
    list_id: int,
    list_data: ListUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    todo_list = await get_list_or_404(list_id, db)
    await verify_team_member(current_user.id, todo_list.team_id, db)

    todo_list.name = list_data.name
    await db.commit()
    await db.refresh(todo_list)
    return todo_list

@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    todo_list = await get_list_or_404(list_id, db)
    await verify_team_member(current_user.id, todo_list.team_id, db)

    await db.delete(todo_list)
    await db.commit()
