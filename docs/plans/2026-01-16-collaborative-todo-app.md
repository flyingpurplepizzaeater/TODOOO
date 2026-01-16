# Collaborative TODO App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time collaborative TODO app with team workspaces, WebSocket sync, and secure access via Tailscale.

**Architecture:** FastAPI backend with SQLite database, JWT authentication, and WebSocket connections for real-time updates. Vanilla HTML/CSS/JS frontend served as static files with Jinja2 templates.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy, SQLite, python-jose (JWT), passlib (bcrypt), Jinja2, WebSockets

---

## Task 1: Project Setup

**Files:**
- Create: `requirements.txt`
- Create: `config.py`
- Create: `main.py`

**Step 1: Create requirements.txt**

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
jinja2==3.1.3
aiosqlite==0.19.0
```

**Step 2: Create config.py**

```python
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).parent

DATABASE_URL = f"sqlite+aiosqlite:///{BASE_DIR}/todo.db"

SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
```

**Step 3: Create main.py skeleton**

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Collaborative TODO")

# Will add routers here later

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Step 4: Install dependencies and test**

Run: `pip install -r requirements.txt`
Run: `python main.py`
Expected: Server starts on http://0.0.0.0:8000

**Step 5: Test health endpoint**

Run: `curl http://localhost:8000/health`
Expected: `{"status":"ok"}`

**Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: initial project setup with FastAPI"
```

---

## Task 2: Database Models

**Files:**
- Create: `database.py`
- Create: `models.py`

**Step 1: Create database.py**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with async_session() as session:
        yield session
```

**Step 2: Create models.py**

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import secrets

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("TeamMember", back_populates="user")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    invite_code = Column(String(20), unique=True, index=True, default=lambda: secrets.token_urlsafe(10))
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("TeamMember", back_populates="team")
    lists = relationship("TodoList", back_populates="team", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="memberships")
    team = relationship("Team", back_populates="members")

class TodoList(Base):
    __tablename__ = "todo_lists"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="lists")
    items = relationship("TodoItem", back_populates="list", cascade="all, delete-orphan")

class TodoItem(Base):
    __tablename__ = "todo_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("todo_lists.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    list = relationship("TodoList", back_populates="items")
    assignee = relationship("User", foreign_keys=[assigned_to])
```

**Step 3: Update main.py to init DB**

Add to `main.py`:
```python
from contextlib import asynccontextmanager
from database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Collaborative TODO", lifespan=lifespan)
```

**Step 4: Test database creation**

Run: `python main.py`
Expected: Server starts, `todo.db` file created

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add database models for users, teams, lists, todos"
```

---

## Task 3: Pydantic Schemas

**Files:**
- Create: `schemas.py`

**Step 1: Create schemas.py**

```python
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List

# Auth
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Teams
class TeamCreate(BaseModel):
    name: str

class TeamResponse(BaseModel):
    id: int
    name: str
    invite_code: str
    created_at: datetime

    class Config:
        from_attributes = True

class TeamWithMembers(TeamResponse):
    members: List["MemberResponse"] = []

class MemberResponse(BaseModel):
    id: int
    username: str
    joined_at: datetime

    class Config:
        from_attributes = True

class JoinTeam(BaseModel):
    invite_code: str

# Lists
class ListCreate(BaseModel):
    name: str

class ListResponse(BaseModel):
    id: int
    name: str
    team_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ListUpdate(BaseModel):
    name: str

# Todos
class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None

class TodoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool
    assigned_to: Optional[int]
    assignee_username: Optional[str] = None
    due_date: Optional[datetime]
    list_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# WebSocket events
class WSEvent(BaseModel):
    event: str
    data: dict
```

**Step 2: Commit**

```bash
git add schemas.py
git commit -m "feat: add Pydantic schemas for API validation"
```

---

## Task 4: Authentication

**Files:**
- Create: `auth.py`
- Create: `routers/auth.py`

**Step 1: Create auth.py (utilities)**

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS
from database import get_db
from models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
```

**Step 2: Create routers directory and auth router**

```bash
mkdir routers
```

Create `routers/__init__.py` (empty file)

Create `routers/auth.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User
from schemas import UserCreate, UserResponse, Token
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if username exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

**Step 3: Register router in main.py**

Add to `main.py`:
```python
from routers import auth

app.include_router(auth.router)
```

**Step 4: Test auth endpoints**

Run: `python main.py`

Test register:
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","password":"secret123"}'
```
Expected: User JSON returned

Test login:
```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=alice&password=secret123"
```
Expected: `{"access_token":"...","token_type":"bearer"}`

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add authentication with JWT tokens"
```

---

## Task 5: Teams Router

**Files:**
- Create: `routers/teams.py`

**Step 1: Create routers/teams.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models import User, Team, TeamMember
from schemas import TeamCreate, TeamResponse, TeamWithMembers, JoinTeam, MemberResponse
from auth import get_current_user
from typing import List

router = APIRouter(prefix="/teams", tags=["teams"])

async def get_team_or_404(team_id: int, db: AsyncSession) -> Team:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

async def verify_team_member(user_id: int, team_id: int, db: AsyncSession):
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.user_id == user_id,
            TeamMember.team_id == team_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a team member")

@router.post("", response_model=TeamResponse)
async def create_team(
    team_data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = Team(name=team_data.name)
    db.add(team)
    await db.flush()

    # Add creator as member
    member = TeamMember(user_id=current_user.id, team_id=team.id)
    db.add(member)
    await db.commit()
    await db.refresh(team)
    return team

@router.get("", response_model=List[TeamResponse])
async def list_my_teams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Team)
        .join(TeamMember)
        .where(TeamMember.user_id == current_user.id)
    )
    return result.scalars().all()

@router.get("/{team_id}", response_model=TeamWithMembers)
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_team_member(current_user.id, team_id, db)

    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members).selectinload(TeamMember.user))
        .where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Transform to response
    members = [
        MemberResponse(
            id=m.user.id,
            username=m.user.username,
            joined_at=m.joined_at
        ) for m in team.members
    ]

    return TeamWithMembers(
        id=team.id,
        name=team.name,
        invite_code=team.invite_code,
        created_at=team.created_at,
        members=members
    )

@router.post("/join", response_model=TeamResponse)
async def join_team(
    join_data: JoinTeam,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Team).where(Team.invite_code == join_data.invite_code)
    )
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check if already member
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.user_id == current_user.id,
            TeamMember.team_id == team.id
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member")

    member = TeamMember(user_id=current_user.id, team_id=team.id)
    db.add(member)
    await db.commit()
    return team

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_team_member(current_user.id, team_id, db)
    team = await get_team_or_404(team_id, db)
    await db.delete(team)
    await db.commit()
```

**Step 2: Register router in main.py**

Add to `main.py`:
```python
from routers import auth, teams

app.include_router(teams.router)
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add teams router with create, join, list, delete"
```

---

## Task 6: Lists Router

**Files:**
- Create: `routers/lists.py`

**Step 1: Create routers/lists.py**

```python
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
```

**Step 2: Register router in main.py**

Add to `main.py`:
```python
from routers import auth, teams, lists

app.include_router(lists.router)
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add lists router with CRUD operations"
```

---

## Task 7: Todos Router

**Files:**
- Create: `routers/todos.py`

**Step 1: Create routers/todos.py**

```python
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
```

**Step 2: Register router in main.py**

Add to `main.py`:
```python
from routers import auth, teams, lists, todos

app.include_router(todos.router)
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add todos router with CRUD and toggle"
```

---

## Task 8: WebSocket Manager

**Files:**
- Create: `websocket.py`

**Step 1: Create websocket.py**

```python
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

manager = ConnectionManager()
```

**Step 2: Add WebSocket endpoint to main.py**

Add to `main.py`:
```python
from fastapi import WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from config import SECRET_KEY, ALGORITHM
from database import async_session
from sqlalchemy import select
from models import User, TeamMember
from websocket import manager

@app.websocket("/ws/teams/{team_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    team_id: int,
    token: str = Query(...)
):
    # Verify token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        await websocket.close(code=4001)
        return

    # Verify team membership
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=4001)
            return

        result = await db.execute(
            select(TeamMember).where(
                TeamMember.user_id == user_id,
                TeamMember.team_id == team_id
            )
        )
        if not result.scalar_one_or_none():
            await websocket.close(code=4003)
            return

    await manager.connect(websocket, team_id, user_id, user.username)

    try:
        while True:
            data = await websocket.receive_text()
            # Could handle client messages here if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, team_id, user_id, user.username)
        await manager.broadcast_offline(team_id, user_id, user.username)
```

**Step 3: Add broadcast calls to routers**

Update `routers/todos.py` - add after each mutation:
```python
from websocket import manager

# In create_todo, after db.commit():
await manager.broadcast(todo_list.team_id, {
    "event": "todo_created",
    "data": todo_to_response(todo).model_dump(mode='json')
})

# In update_todo and toggle_todo, after db.commit():
await manager.broadcast(todo_list.team_id, {
    "event": "todo_updated",
    "data": todo_to_response(todo).model_dump(mode='json')
})

# In delete_todo, before db.delete():
await manager.broadcast(todo_list.team_id, {
    "event": "todo_deleted",
    "data": {"id": todo_id, "list_id": todo.list_id}
})
```

Update `routers/lists.py` similarly for list events.

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add WebSocket manager for real-time updates"
```

---

## Task 9: Frontend Templates

**Files:**
- Create: `templates/base.html`
- Create: `templates/login.html`
- Create: `templates/register.html`
- Create: `templates/dashboard.html`
- Create: `templates/team.html`

**Step 1: Create templates directory**

```bash
mkdir templates
```

**Step 2: Create templates/base.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}TODO App{% endblock %}</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <nav class="navbar">
        <a href="/dashboard" class="logo">TODO App</a>
        <div class="nav-links">
            {% if user %}
            <span>{{ user.username }}</span>
            <a href="#" onclick="logout()">Logout</a>
            {% endif %}
        </div>
    </nav>
    <main class="container">
        {% block content %}{% endblock %}
    </main>
    <script src="/static/app.js"></script>
    {% block scripts %}{% endblock %}
</body>
</html>
```

**Step 3: Create templates/login.html**

```html
{% extends "base.html" %}
{% block title %}Login - TODO App{% endblock %}
{% block content %}
<div class="auth-container">
    <h1>Login</h1>
    <form id="login-form" class="auth-form">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
        </div>
        <div class="error-message" id="error"></div>
        <button type="submit" class="btn btn-primary">Login</button>
    </form>
    <p>Don't have an account? <a href="/register">Register</a></p>
</div>
{% endblock %}
{% block scripts %}
<script>
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const params = new URLSearchParams();
    params.append('username', formData.get('username'));
    params.append('password', formData.get('password'));

    try {
        const res = await fetch('/auth/login', {
            method: 'POST',
            body: params
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.access_token);
            window.location.href = '/dashboard';
        } else {
            document.getElementById('error').textContent = data.detail;
        }
    } catch (err) {
        document.getElementById('error').textContent = 'Connection error';
    }
});
</script>
{% endblock %}
```

**Step 4: Create templates/register.html**

```html
{% extends "base.html" %}
{% block title %}Register - TODO App{% endblock %}
{% block content %}
<div class="auth-container">
    <h1>Register</h1>
    <form id="register-form" class="auth-form">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="6">
        </div>
        <div class="error-message" id="error"></div>
        <button type="submit" class="btn btn-primary">Register</button>
    </form>
    <p>Already have an account? <a href="/login">Login</a></p>
</div>
{% endblock %}
{% block scripts %}
<script>
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const res = await fetch('/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            })
        });
        const data = await res.json();
        if (res.ok) {
            window.location.href = '/login';
        } else {
            document.getElementById('error').textContent = data.detail;
        }
    } catch (err) {
        document.getElementById('error').textContent = 'Connection error';
    }
});
</script>
{% endblock %}
```

**Step 5: Create templates/dashboard.html**

```html
{% extends "base.html" %}
{% block title %}Dashboard - TODO App{% endblock %}
{% block content %}
<div class="dashboard">
    <div class="dashboard-header">
        <h1>My Teams</h1>
        <div class="dashboard-actions">
            <button class="btn btn-primary" onclick="showCreateTeamModal()">+ Create Team</button>
            <button class="btn btn-secondary" onclick="showJoinTeamModal()">Join Team</button>
        </div>
    </div>
    <div class="teams-grid" id="teams-container">
        <!-- Teams loaded dynamically -->
    </div>
</div>

<!-- Create Team Modal -->
<div class="modal" id="create-team-modal">
    <div class="modal-content">
        <h2>Create Team</h2>
        <form id="create-team-form">
            <div class="form-group">
                <label for="team-name">Team Name</label>
                <input type="text" id="team-name" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModals()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create</button>
            </div>
        </form>
    </div>
</div>

<!-- Join Team Modal -->
<div class="modal" id="join-team-modal">
    <div class="modal-content">
        <h2>Join Team</h2>
        <form id="join-team-form">
            <div class="form-group">
                <label for="invite-code">Invite Code</label>
                <input type="text" id="invite-code" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModals()">Cancel</button>
                <button type="submit" class="btn btn-primary">Join</button>
            </div>
        </form>
    </div>
</div>
{% endblock %}
{% block scripts %}
<script>
const token = localStorage.getItem('token');
if (!token) window.location.href = '/login';

async function loadTeams() {
    const res = await fetch('/teams', {
        headers: {'Authorization': `Bearer ${token}`}
    });
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
    }
    const teams = await res.json();
    const container = document.getElementById('teams-container');
    container.innerHTML = teams.map(team => `
        <div class="team-card" onclick="window.location.href='/team/${team.id}'">
            <h3>${team.name}</h3>
            <p class="invite-code">Code: ${team.invite_code}</p>
        </div>
    `).join('') || '<p class="empty">No teams yet. Create or join one!</p>';
}

function showCreateTeamModal() {
    document.getElementById('create-team-modal').classList.add('active');
}

function showJoinTeamModal() {
    document.getElementById('join-team-modal').classList.add('active');
}

function hideModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

document.getElementById('create-team-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('team-name').value;
    await fetch('/teams', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({name})
    });
    hideModals();
    loadTeams();
});

document.getElementById('join-team-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const invite_code = document.getElementById('invite-code').value;
    const res = await fetch('/teams/join', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({invite_code})
    });
    if (res.ok) {
        hideModals();
        loadTeams();
    } else {
        alert('Invalid invite code');
    }
});

loadTeams();
</script>
{% endblock %}
```

**Step 6: Create templates/team.html**

```html
{% extends "base.html" %}
{% block title %}Team - TODO App{% endblock %}
{% block content %}
<div class="team-view">
    <div class="team-header">
        <h1 id="team-name">Loading...</h1>
        <div class="team-actions">
            <button class="btn btn-secondary" onclick="showInviteModal()">Invite</button>
            <a href="/dashboard" class="btn btn-secondary">Back</a>
        </div>
    </div>
    <div class="team-content">
        <aside class="lists-sidebar">
            <h2>Lists</h2>
            <ul id="lists-container"></ul>
            <button class="btn btn-sm" onclick="createList()">+ New List</button>
        </aside>
        <section class="todos-section">
            <div class="todos-header">
                <h2 id="current-list-name">Select a list</h2>
                <button class="btn btn-primary btn-sm" id="add-todo-btn" onclick="showAddTodoModal()" style="display:none">+ Add TODO</button>
            </div>
            <ul class="todos-list" id="todos-container"></ul>
        </section>
    </div>
    <footer class="online-bar">
        <span>Online: </span><span id="online-users">-</span>
    </footer>
</div>

<!-- Invite Modal -->
<div class="modal" id="invite-modal">
    <div class="modal-content">
        <h2>Invite Members</h2>
        <p>Share this code:</p>
        <code id="invite-code-display" class="invite-code-large">-</code>
        <button class="btn btn-secondary" onclick="hideModals()">Close</button>
    </div>
</div>

<!-- Add TODO Modal -->
<div class="modal" id="add-todo-modal">
    <div class="modal-content">
        <h2>Add TODO</h2>
        <form id="add-todo-form">
            <div class="form-group">
                <label for="todo-title">Title</label>
                <input type="text" id="todo-title" required>
            </div>
            <div class="form-group">
                <label for="todo-due">Due Date (optional)</label>
                <input type="date" id="todo-due">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="hideModals()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add</button>
            </div>
        </form>
    </div>
</div>
{% endblock %}
{% block scripts %}
<script>
const token = localStorage.getItem('token');
if (!token) window.location.href = '/login';

const teamId = window.location.pathname.split('/').pop();
let currentListId = null;
let ws = null;

async function loadTeam() {
    const res = await fetch(`/teams/${teamId}`, {
        headers: {'Authorization': `Bearer ${token}`}
    });
    if (!res.ok) {
        window.location.href = '/dashboard';
        return;
    }
    const team = await res.json();
    document.getElementById('team-name').textContent = team.name;
    document.getElementById('invite-code-display').textContent = team.invite_code;
}

async function loadLists() {
    const res = await fetch(`/teams/${teamId}/lists`, {
        headers: {'Authorization': `Bearer ${token}`}
    });
    const lists = await res.json();
    const container = document.getElementById('lists-container');
    container.innerHTML = lists.map(list => `
        <li class="list-item ${list.id === currentListId ? 'active' : ''}"
            onclick="selectList(${list.id}, '${list.name}')">
            ${list.name}
            <button class="btn-delete" onclick="event.stopPropagation(); deleteList(${list.id})">×</button>
        </li>
    `).join('') || '<li class="empty">No lists</li>';
}

async function loadTodos() {
    if (!currentListId) return;
    const res = await fetch(`/lists/${currentListId}/todos`, {
        headers: {'Authorization': `Bearer ${token}`}
    });
    const todos = await res.json();
    const container = document.getElementById('todos-container');
    container.innerHTML = todos.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}">
            <input type="checkbox" ${todo.completed ? 'checked' : ''}
                   onchange="toggleTodo(${todo.id})">
            <span class="todo-title">${todo.title}</span>
            ${todo.assignee_username ? `<span class="assignee">@${todo.assignee_username}</span>` : ''}
            ${todo.due_date ? `<span class="due-date">${new Date(todo.due_date).toLocaleDateString()}</span>` : ''}
            <button class="btn-delete" onclick="deleteTodo(${todo.id})">×</button>
        </li>
    `).join('') || '<li class="empty">No todos in this list</li>';
}

function selectList(listId, listName) {
    currentListId = listId;
    document.getElementById('current-list-name').textContent = listName;
    document.getElementById('add-todo-btn').style.display = 'block';
    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
    event.target.closest('.list-item')?.classList.add('active');
    loadTodos();
}

async function createList() {
    const name = prompt('List name:');
    if (!name) return;
    await fetch(`/teams/${teamId}/lists`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({name})
    });
    loadLists();
}

async function deleteList(listId) {
    if (!confirm('Delete this list?')) return;
    await fetch(`/lists/${listId}`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${token}`}
    });
    if (currentListId === listId) {
        currentListId = null;
        document.getElementById('current-list-name').textContent = 'Select a list';
        document.getElementById('add-todo-btn').style.display = 'none';
        document.getElementById('todos-container').innerHTML = '';
    }
    loadLists();
}

async function toggleTodo(todoId) {
    await fetch(`/todos/${todoId}/toggle`, {
        method: 'PATCH',
        headers: {'Authorization': `Bearer ${token}`}
    });
}

async function deleteTodo(todoId) {
    await fetch(`/todos/${todoId}`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${token}`}
    });
}

function showInviteModal() {
    document.getElementById('invite-modal').classList.add('active');
}

function showAddTodoModal() {
    document.getElementById('add-todo-modal').classList.add('active');
}

function hideModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

document.getElementById('add-todo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('todo-title').value;
    const due = document.getElementById('todo-due').value;

    await fetch(`/lists/${currentListId}/todos`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            due_date: due || null
        })
    });

    document.getElementById('todo-title').value = '';
    document.getElementById('todo-due').value = '';
    hideModals();
});

// WebSocket connection
function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws/teams/${teamId}?token=${token}`);

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        switch (msg.event) {
            case 'online_users':
                document.getElementById('online-users').textContent =
                    msg.data.users.map(u => u.username).join(', ');
                break;
            case 'member_online':
                document.getElementById('online-users').textContent += `, ${msg.data.username}`;
                break;
            case 'member_offline':
                const online = document.getElementById('online-users').textContent;
                document.getElementById('online-users').textContent =
                    online.split(', ').filter(u => u !== msg.data.username).join(', ');
                break;
            case 'todo_created':
            case 'todo_updated':
            case 'todo_deleted':
                if (currentListId === msg.data.list_id) loadTodos();
                break;
            case 'list_created':
            case 'list_deleted':
                loadLists();
                break;
        }
    };

    ws.onclose = () => setTimeout(connectWebSocket, 3000);
}

loadTeam();
loadLists();
connectWebSocket();
</script>
{% endblock %}
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add HTML templates for all pages"
```

---

## Task 10: Static Files (CSS & JS)

**Files:**
- Create: `static/style.css`
- Create: `static/app.js`

**Step 1: Create static directory**

```bash
mkdir static
```

**Step 2: Create static/style.css**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    min-height: 100vh;
}

.navbar {
    background: #1a1a2e;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    color: white;
    text-decoration: none;
    font-size: 1.25rem;
    font-weight: bold;
}

.nav-links {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.nav-links a {
    color: #aaa;
    text-decoration: none;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

/* Auth pages */
.auth-container {
    max-width: 400px;
    margin: 4rem auto;
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.auth-form .form-group {
    margin-bottom: 1rem;
}

.auth-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.auth-form input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.error-message {
    color: #e74c3c;
    margin-bottom: 1rem;
    min-height: 1.5rem;
}

/* Buttons */
.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    text-decoration: none;
    display: inline-block;
}

.btn-primary {
    background: #3498db;
    color: white;
}

.btn-primary:hover {
    background: #2980b9;
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

.btn-delete {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0 0.5rem;
}

/* Dashboard */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.dashboard-actions {
    display: flex;
    gap: 1rem;
}

.teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.team-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}

.team-card:hover {
    transform: translateY(-2px);
}

.invite-code {
    color: #888;
    font-size: 0.875rem;
    margin-top: 0.5rem;
}

.invite-code-large {
    display: block;
    font-size: 1.5rem;
    background: #f0f0f0;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
    text-align: center;
}

/* Team view */
.team-view {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
}

.team-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: white;
    border-bottom: 1px solid #ddd;
}

.team-actions {
    display: flex;
    gap: 0.5rem;
}

.team-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.lists-sidebar {
    width: 250px;
    background: white;
    border-right: 1px solid #ddd;
    padding: 1rem;
    overflow-y: auto;
}

.lists-sidebar h2 {
    font-size: 1rem;
    margin-bottom: 1rem;
    color: #666;
}

.lists-sidebar ul {
    list-style: none;
}

.list-item {
    padding: 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.list-item:hover {
    background: #f0f0f0;
}

.list-item.active {
    background: #3498db;
    color: white;
}

.todos-section {
    flex: 1;
    padding: 1rem 2rem;
    overflow-y: auto;
}

.todos-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.todos-list {
    list-style: none;
}

.todo-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.todo-item.completed .todo-title {
    text-decoration: line-through;
    color: #888;
}

.todo-title {
    flex: 1;
}

.assignee {
    color: #3498db;
    font-size: 0.875rem;
}

.due-date {
    color: #e67e22;
    font-size: 0.875rem;
}

.online-bar {
    background: #1a1a2e;
    color: #aaa;
    padding: 0.5rem 2rem;
    font-size: 0.875rem;
}

/* Modals */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    justify-content: center;
    align-items: center;
}

.modal.active {
    display: flex;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    min-width: 400px;
}

.modal-content h2 {
    margin-bottom: 1rem;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.empty {
    color: #888;
    text-align: center;
    padding: 2rem;
}
```

**Step 3: Create static/app.js**

```javascript
// Global utilities
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// Auth check on protected pages
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// API helper
async function api(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    const res = await fetch(path, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
    }

    return res;
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add CSS styles and JS utilities"
```

---

## Task 11: Page Routes & Final main.py

**Files:**
- Modify: `main.py`

**Step 1: Update main.py with page routes**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from config import SECRET_KEY, ALGORITHM
from database import init_db, async_session
from sqlalchemy import select
from models import User, TeamMember
from websocket import manager
from routers import auth, teams, lists, todos

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Collaborative TODO", lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Include API routers
app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(lists.router)
app.include_router(todos.router)

# Page routes
@app.get("/")
async def index():
    return RedirectResponse(url="/login")

@app.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register")
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/dashboard")
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": None})

@app.get("/team/{team_id}")
async def team_page(request: Request, team_id: int):
    return templates.TemplateResponse("team.html", {"request": request, "user": None})

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}

# WebSocket endpoint
@app.websocket("/ws/teams/{team_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    team_id: int,
    token: str = Query(...)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        await websocket.close(code=4001)
        return

    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=4001)
            return

        result = await db.execute(
            select(TeamMember).where(
                TeamMember.user_id == user_id,
                TeamMember.team_id == team_id
            )
        )
        if not result.scalar_one_or_none():
            await websocket.close(code=4003)
            return

    await manager.connect(websocket, team_id, user_id, user.username)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, team_id, user_id, user.username)
        await manager.broadcast_offline(team_id, user_id, user.username)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Step 2: Test the complete application**

Run: `python main.py`

1. Open http://localhost:8000/register - create an account
2. Login at http://localhost:8000/login
3. Create a team at /dashboard
4. Create lists and TODOs in the team view
5. Open in another browser/incognito to test real-time sync

**Step 3: Commit**

```bash
git add .
git commit -m "feat: complete app with page routes and WebSocket"
```

---

## Task 12: Tailscale Setup Guide

**Files:**
- Create: `SETUP.md`

**Step 1: Create SETUP.md**

```markdown
# Collaborative TODO App - Setup Guide

## Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   python main.py
   ```

3. Open http://localhost:8000

## Multi-User Access with Tailscale

### Step 1: Install Tailscale

**Host PC (server):**
1. Download from https://tailscale.com/download
2. Install and sign in
3. Note your Tailscale IP (e.g., 100.x.x.x)

**Each user's device:**
1. Download Tailscale
2. Sign in with same account OR accept invite to your Tailnet

### Step 2: Run Server

On the host PC:
```bash
python main.py
```

Server runs on `0.0.0.0:8000` - accessible to all Tailscale devices.

### Step 3: Connect from Other Devices

Other users open: `http://<host-tailscale-ip>:8000`

Example: `http://100.64.0.1:8000`

## Security Notes

- Tailscale encrypts all traffic (WireGuard)
- No ports exposed to public internet
- Only Tailscale network members can access
- JWT tokens expire after 24 hours
- Passwords are bcrypt hashed
```

**Step 2: Final commit**

```bash
git add .
git commit -m "docs: add Tailscale setup guide"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Project setup | requirements.txt, config.py, main.py |
| 2 | Database models | database.py, models.py |
| 3 | Pydantic schemas | schemas.py |
| 4 | Authentication | auth.py, routers/auth.py |
| 5 | Teams router | routers/teams.py |
| 6 | Lists router | routers/lists.py |
| 7 | TODOs router | routers/todos.py |
| 8 | WebSocket manager | websocket.py |
| 9 | HTML templates | templates/*.html |
| 10 | Static files | static/style.css, static/app.js |
| 11 | Final integration | main.py (updated) |
| 12 | Setup guide | SETUP.md |
