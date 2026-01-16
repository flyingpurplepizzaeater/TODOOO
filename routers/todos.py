from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models import User, TodoItem, TodoList
from schemas import TodoCreate, TodoResponse, TodoUpdate
from auth import get_current_user
from routers.teams import verify_team_member
from routers.lists import get_list_or_404
from typing import List

router = APIRouter(tags=["todos"])

async def get_todo_or_404(todo_id: int, db: AsyncSession) -> TodoItem:
    result = await db.execute(
        select(TodoItem)
        .options(selectinload(TodoItem.assignee))
        .where(TodoItem.id == todo_id)
    )
    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

def todo_to_response(todo: TodoItem) -> TodoResponse:
    return TodoResponse(
        id=todo.id,
        title=todo.title,
        description=todo.description,
        completed=todo.completed,
        assigned_to=todo.assigned_to,
        assignee_username=todo.assignee.username if todo.assignee else None,
        due_date=todo.due_date,
        list_id=todo.list_id,
        created_at=todo.created_at
    )

@router.post("/lists/{list_id}/todos", response_model=TodoResponse)
async def create_todo(
    list_id: int,
    todo_data: TodoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    todo_list = await get_list_or_404(list_id, db)
    await verify_team_member(current_user.id, todo_list.team_id, db)

    todo = TodoItem(
        list_id=list_id,
        title=todo_data.title,
        description=todo_data.description,
        assigned_to=todo_data.assigned_to,
        due_date=todo_data.due_date
    )
    db.add(todo)
    await db.commit()

    # Reload with relationships
    todo = await get_todo_or_404(todo.id, db)
    return todo_to_response(todo)

@router.get("/lists/{list_id}/todos", response_model=List[TodoResponse])
async def get_list_todos(
    list_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    todo_list = await get_list_or_404(list_id, db)
    await verify_team_member(current_user.id, todo_list.team_id, db)

    result = await db.execute(
        select(TodoItem)
        .options(selectinload(TodoItem.assignee))
        .where(TodoItem.list_id == list_id)
        .order_by(TodoItem.created_at.desc())
    )
    todos = result.scalars().all()
    return [todo_to_response(t) for t in todos]

@router.put("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: int,
    todo_data: TodoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    todo = await get_todo_or_404(todo_id, db)
    todo_list = await get_list_or_404(todo.list_id, db)
    await verify_team_member(current_user.id, todo_list.team_id, db)

    update_data = todo_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(todo, field, value)

    await db.commit()
    todo = await get_todo_or_404(todo_id, db)
    return todo_to_response(todo)

@router.patch("/todos/{todo_id}/toggle", response_model=TodoResponse)
async def toggle_todo(
    todo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    todo = await get_todo_or_404(todo_id, db)
    todo_list = await get_list_or_404(todo.list_id, db)
    await verify_team_member(current_user.id, todo_list.team_id, db)

    todo.completed = not todo.completed
    await db.commit()
    todo = await get_todo_or_404(todo_id, db)
    return todo_to_response(todo)

@router.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    todo = await get_todo_or_404(todo_id, db)
    todo_list = await get_list_or_404(todo.list_id, db)
    await verify_team_member(current_user.id, todo_list.team_id, db)

    await db.delete(todo)
    await db.commit()
