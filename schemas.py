import re
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Optional, List

# Auth
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must contain only letters, numbers, and underscores')
        return v

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
