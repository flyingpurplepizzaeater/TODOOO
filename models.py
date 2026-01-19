from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import secrets


class PermissionLevel(str, PyEnum):
    """Permission levels for board access."""
    VIEW = "view"
    COMMENT = "comment"
    EDIT = "edit"

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

    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
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


class Board(Base):
    __tablename__ = "boards"

    id = Column(String(36), primary_key=True)  # UUID stored as string for SQLite compatibility
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False, default="Untitled Board")
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")
    permissions = relationship("BoardPermission", back_populates="board", cascade="all, delete-orphan")


class BoardPermission(Base):
    __tablename__ = "board_permissions"
    __table_args__ = (
        UniqueConstraint('board_id', 'user_id', name='uq_board_user_permission'),
    )

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(String(36), ForeignKey("boards.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for public access
    level = Column(Enum(PermissionLevel), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    board = relationship("Board", back_populates="permissions")
    user = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for anonymous
    board_id = Column(String(36), ForeignKey("boards.id"), nullable=False)
    action = Column(String(50), nullable=False)  # "access", "permission_change", "create", "delete"
    permission_level = Column(String(20), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 length
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User")
    board = relationship("Board")
