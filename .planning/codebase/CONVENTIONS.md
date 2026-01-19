# Coding Conventions

**Analysis Date:** 2026-01-19

## Naming Patterns

**Files:**
- snake_case for Python modules: `auth.py`, `rate_limit.py`, `websocket.py`
- Router files named by resource: `routers/auth.py`, `routers/teams.py`, `routers/lists.py`, `routers/todos.py`
- Test files prefixed with `test_`: `tests/test_auth.py`, `tests/test_todos.py`

**Functions:**
- snake_case for all functions: `get_current_user()`, `create_access_token()`, `hash_password()`
- Async functions prefixed with action verb: `get_team_or_404()`, `verify_team_member()`, `create_todo()`
- Helper conversion functions: `todo_to_response()`

**Variables:**
- snake_case for all variables: `user_id`, `team_id`, `todo_list`
- Descriptive names: `credentials_exception`, `update_data`, `invite_code`
- Constants in UPPER_SNAKE_CASE: `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_HOURS`

**Classes:**
- PascalCase for all classes: `User`, `Team`, `TeamMember`, `TodoItem`, `TodoList`
- Pydantic models suffixed by purpose: `UserCreate`, `UserResponse`, `TodoUpdate`, `ListResponse`
- SQLAlchemy models are singular nouns: `User`, `Team` (not `Users`, `Teams`)

**Database Tables:**
- Plural snake_case: `users`, `teams`, `team_members`, `todo_lists`, `todo_items`

## Code Style

**Formatting:**
- No explicit formatter configured (no .prettierrc or pyproject.toml formatting section)
- Implicit 4-space indentation (Python default)
- Single blank line between functions
- Two blank lines between classes

**Linting:**
- No explicit linter configured
- Follow PEP 8 conventions implicitly

**Line Length:**
- Lines generally kept under 100 characters
- Long imports split across lines when necessary

## Import Organization

**Order:**
1. Standard library imports (`datetime`, `re`, `secrets`, `json`, `typing`)
2. Third-party imports (`fastapi`, `sqlalchemy`, `pydantic`, `jose`, `passlib`)
3. Local imports (`database`, `models`, `schemas`, `auth`, `config`)

**Examples from `routers/auth.py`:**
```python
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User
from schemas import UserCreate, UserResponse, Token
from auth import hash_password, verify_password, create_access_token, get_current_user
from rate_limit import limiter
```

**Path Aliases:**
- None configured - use relative imports from project root

## Error Handling

**Patterns:**
- Use `HTTPException` with appropriate status codes for API errors
- Use specific status codes: `400` (bad request), `401` (unauthorized), `403` (forbidden), `404` (not found)
- Include descriptive `detail` messages for debugging

**Standard error responses:**
```python
# 404 - Resource not found
raise HTTPException(status_code=404, detail="Team not found")
raise HTTPException(status_code=404, detail="List not found")
raise HTTPException(status_code=404, detail="Todo not found")

# 403 - Authorization failed
raise HTTPException(status_code=403, detail="Not a team member")

# 400 - Validation/business logic errors
raise HTTPException(status_code=400, detail="Username already taken")
raise HTTPException(status_code=400, detail="Already a member")

# 401 - Authentication errors (include WWW-Authenticate header)
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
```

**Helper functions for common lookups:**
```python
async def get_team_or_404(team_id: int, db: AsyncSession) -> Team:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team
```

## Logging

**Framework:** Not explicitly configured - no logging statements in codebase

**Current State:**
- `server.log` exists but appears unused in code
- No logging import or configuration
- Consider adding structured logging for production

## Comments

**When to Comment:**
- Inline comments used sparingly
- Comments explain "why" not "what"
- Factory fixture docstrings in tests

**Docstrings:**
- Minimal docstring usage in application code
- Test fixtures have brief docstrings explaining purpose

**Examples:**
```python
# From conftest.py
@pytest_asyncio.fixture
async def create_user(test_db):
    """Factory fixture to create users."""
    ...

# From config.py
# SECRET_KEY must be persistent across restarts to maintain user sessions
# Generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Function Design

**Size:**
- Functions are small and focused (typically 5-20 lines)
- Single responsibility per function

**Parameters:**
- Use FastAPI dependency injection for `db: AsyncSession = Depends(get_db)`
- Use `current_user: User = Depends(get_current_user)` for authenticated endpoints
- Pydantic models for request bodies: `todo_data: TodoCreate`

**Return Values:**
- Return Pydantic models for API responses
- Use `response_model=` decorator parameter for type hints
- Return `status.HTTP_204_NO_CONTENT` for delete operations

**Async Pattern:**
- All database operations are async
- Use `await` for all SQLAlchemy operations
- Use `async with` for database sessions

**Example endpoint structure:**
```python
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
```

## Module Design

**Exports:**
- No explicit `__all__` definitions
- Import directly from modules

**Barrel Files:**
- `routers/__init__.py` is empty (modules imported directly in `main.py`)
- `tests/__init__.py` is empty

**Singleton Patterns:**
```python
# websocket.py - singleton manager instance
manager = ConnectionManager()

# rate_limit.py - singleton limiter instance
limiter = Limiter(key_func=get_remote_address)
```

## Pydantic Model Patterns

**Create vs Response vs Update:**
```python
# Create - required fields for creation
class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None

# Response - all fields including generated ones
class TodoResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    class Config:
        from_attributes = True

# Update - all optional for partial updates
class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
```

**Validation:**
- Use `field_validator` for custom validation
- Use `Field(...)` for constraints: `Field(..., min_length=3, max_length=50)`
- Use `EmailStr` for email validation

## SQLAlchemy Model Patterns

**Relationships:**
```python
# One-to-many with cascade delete
lists = relationship("TodoList", back_populates="team", cascade="all, delete-orphan")

# Many-to-one
team = relationship("Team", back_populates="members")
```

**Column Definitions:**
```python
id = Column(Integer, primary_key=True, index=True)
username = Column(String(50), unique=True, index=True, nullable=False)
created_at = Column(DateTime, default=datetime.utcnow)
```

## Authentication Pattern

**JWT Token Flow:**
1. Login returns JWT token with `sub` claim containing user ID as string
2. Token passed in `Authorization: Bearer <token>` header
3. `get_current_user` dependency extracts and validates token
4. Returns `User` model for use in endpoint

**Protected Endpoint:**
```python
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

## Rate Limiting Pattern

**Usage:**
```python
from rate_limit import limiter

@router.post("/register", response_model=UserResponse)
@limiter.limit("3/minute")
async def register(request: Request, ...):
    ...
```

---

*Convention analysis: 2026-01-19*
