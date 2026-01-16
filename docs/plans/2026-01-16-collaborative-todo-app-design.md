# Collaborative TODO App - Design Document

**Date:** 2026-01-16
**Status:** Approved

## Overview

Multi-user collaborative TODO list application with real-time synchronization, team-based collaboration, and secure access via Tailscale.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python 3.11+) |
| Database | SQLite + SQLAlchemy ORM |
| Authentication | JWT tokens + bcrypt password hashing |
| Real-time | WebSockets (FastAPI native) |
| Frontend | Vanilla HTML/CSS/JavaScript |
| Network | Tailscale (secure private network) |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Tailscale Network              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  User A  │  │  User B  │  │  User C  │      │
│  │ (Browser)│  │ (Browser)│  │ (Browser)│      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │
│       └─────────────┼─────────────┘             │
│                     ▼                           │
│            ┌───────────────┐                    │
│            │  FastAPI App  │                    │
│            │  (Host PC)    │                    │
│            ├───────────────┤                    │
│            │   WebSocket   │ ← Real-time sync   │
│            │   REST API    │ ← CRUD operations  │
│            │   SQLite DB   │ ← Data storage     │
│            └───────────────┘                    │
└─────────────────────────────────────────────────┘
```

## Data Model

### User
- `id` (PK)
- `username` (unique)
- `email` (unique)
- `password` (hashed)
- `created_at`

### Team
- `id` (PK)
- `name`
- `invite_code` (unique, for joining)
- `created_at`

### TeamMember
- `id` (PK)
- `user_id` (FK → User)
- `team_id` (FK → Team)
- `joined_at`

### TodoList
- `id` (PK)
- `team_id` (FK → Team)
- `name`
- `created_at`

### TodoItem
- `id` (PK)
- `list_id` (FK → TodoList)
- `title`
- `completed` (boolean)
- `assigned_to` (FK → User, optional)
- `due_date` (optional)
- `created_at`

**Note:** No roles - all team members have equal access.

## API Endpoints

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login, returns JWT token
- `GET /auth/me` - Get current user info

### Teams
- `POST /teams` - Create new team
- `GET /teams` - List my teams
- `GET /teams/{id}` - Get team details + members
- `POST /teams/{id}/join` - Join team via invite code
- `DELETE /teams/{id}` - Delete team

### Lists
- `POST /teams/{id}/lists` - Create list
- `GET /teams/{id}/lists` - Get all lists in team
- `PUT /lists/{id}` - Rename list
- `DELETE /lists/{id}` - Delete list

### TODOs
- `POST /lists/{id}/todos` - Create TODO
- `GET /lists/{id}/todos` - Get all TODOs in list
- `PUT /todos/{id}` - Update TODO
- `DELETE /todos/{id}` - Delete TODO
- `PATCH /todos/{id}/toggle` - Toggle complete

### WebSocket
- `WS /ws/teams/{team_id}` - Real-time updates for team

**Events:** `todo_created`, `todo_updated`, `todo_deleted`, `list_created`, `list_deleted`, `member_joined`

## Frontend Pages

- `/` - Landing → redirect to /login or /dashboard
- `/login` - Login form
- `/register` - Registration form
- `/dashboard` - List of user's teams
- `/team/{id}` - Team view with lists and TODOs

## UI Layout (Team View)

```
┌────────────────────────────────────────────────────────┐
│  Team: Project Alpha                    [Invite] [⚙️]  │
├──────────────┬─────────────────────────────────────────┤
│  LISTS       │  📋 Sprint Tasks                        │
│  ──────────  │  ─────────────────────────────────────  │
│  Sprint Tasks│  ☐ Build login page          @alice    │
│  Backlog     │  ☑ Setup database            @bob      │
│  Ideas       │  ☐ Design landing page       due: 1/20 │
│              │  ☐ Write API docs                       │
│  [+ New List]│  ────────────────────────────────────── │
│              │  [+ Add TODO]                           │
├──────────────┴─────────────────────────────────────────┤
│  Online: alice, bob                                    │
└────────────────────────────────────────────────────────┘
```

## Project Structure

```
todo-app/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Dependencies
├── config.py              # Settings (JWT secret, DB path)
├── database.py            # SQLAlchemy setup
├── models.py              # Database models
├── schemas.py             # Pydantic request/response models
├── auth.py                # JWT & password utilities
├── routers/
│   ├── auth.py            # Auth endpoints
│   ├── teams.py           # Team endpoints
│   ├── lists.py           # List endpoints
│   └── todos.py           # TODO endpoints
├── websocket.py           # WebSocket manager
├── static/
│   ├── style.css
│   └── app.js             # Frontend logic
└── templates/
    ├── base.html
    ├── login.html
    ├── register.html
    ├── dashboard.html
    └── team.html
```

## Security

- Passwords hashed with bcrypt (never stored plain)
- JWT tokens expire after 24 hours
- All endpoints require authentication (except login/register)
- Team membership verified on every request
- SQLAlchemy ORM prevents SQL injection
- Tailscale provides encrypted transport with no public exposure

## Deployment

1. Install Tailscale on host PC and all client devices
2. Run FastAPI app on host: `uvicorn main:app --host 0.0.0.0 --port 8000`
3. Access from any Tailscale device via `http://<tailscale-ip>:8000`
