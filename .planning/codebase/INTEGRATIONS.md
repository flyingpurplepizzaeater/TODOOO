# External Integrations

**Analysis Date:** 2026-01-19

## APIs & External Services

**None detected.** This application is self-contained with no external API dependencies.

The application operates entirely locally with:
- Local SQLite database
- Local file-based storage
- No third-party service integrations

## Data Storage

**Databases:**
- SQLite via aiosqlite (async driver)
  - Connection: `DATABASE_URL` env var (default: `sqlite+aiosqlite:///./todo.db`)
  - Client: SQLAlchemy 2.0 async engine (`database.py`)
  - ORM models: `models.py` (User, Team, TeamMember, TodoList, TodoItem)

**File Storage:**
- Local filesystem only
- Database file stored at project root: `todo.db`
- Docker volume mount: `./data:/app/data`

**Caching:**
- None - no caching layer implemented

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `auth.py`
  - Token generation: python-jose with HS256 algorithm
  - Password hashing: passlib with bcrypt scheme
  - Token storage: Client-side localStorage
  - Token endpoint: `POST /auth/login` (OAuth2PasswordRequestForm)

**Flow:**
1. User registers at `POST /auth/register`
2. User logs in at `POST /auth/login`, receives JWT
3. Client stores token in localStorage (`static/app.js`)
4. Subsequent requests include `Authorization: Bearer {token}` header
5. `get_current_user` dependency validates token and returns User

**Security Features:**
- Password strength validation (8+ chars, uppercase, lowercase, digit) in `schemas.py`
- Username validation (alphanumeric + underscore only)
- Rate limiting on auth endpoints: 3/min register, 5/min login (`routers/auth.py`)
- Token expiration configurable via `ACCESS_TOKEN_EXPIRE_HOURS`

## Monitoring & Observability

**Error Tracking:**
- None - no external error tracking service

**Logs:**
- Server logs written to `server.log` (inferred from file presence)
- Alembic logging configured in `alembic.ini` (console handler)
- SQLAlchemy echo disabled (`echo=False` in `database.py`)

## CI/CD & Deployment

**Hosting:**
- Docker-based deployment (`Dockerfile`, `docker-compose.yml`)
- No cloud-specific configuration detected
- Port 8000 exposed

**CI Pipeline:**
- None detected - no GitHub Actions, CircleCI, or other CI config files

## Environment Configuration

**Required env vars:**
- `SECRET_KEY` - JWT signing key (CRITICAL for production)

**Optional env vars:**
- `DATABASE_URL` - Database connection (default: `sqlite+aiosqlite:///./todo.db`)
- `ACCESS_TOKEN_EXPIRE_HOURS` - Token lifetime (default: 24)

**Secrets location:**
- `.env` file (local development)
- Docker environment variables (production)
- Warning issued at startup if `SECRET_KEY` not set (`config.py`)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Real-Time Communication

**WebSocket:**
- Endpoint: `/ws/teams/{team_id}` (`main.py`)
- Purpose: Real-time team collaboration updates
- Auth: JWT token passed as query parameter
- Events: `member_online`, `member_offline`, `online_users`
- Implementation: `websocket.py` (ConnectionManager class)
- In-memory connection tracking per team

**WebSocket Protocol:**
```
1. Client connects: /ws/teams/{team_id}?token={jwt}
2. Server validates JWT and team membership
3. Server broadcasts member_online to team
4. Server sends online_users list to new connection
5. On disconnect, server broadcasts member_offline
```

## Internal Service Communication

**API Routers:**
- `routers/auth.py` - Authentication endpoints (`/auth/*`)
- `routers/teams.py` - Team management (`/teams/*`)
- `routers/lists.py` - Todo list CRUD (`/teams/{id}/lists/*`)
- `routers/todos.py` - Todo item CRUD (`/lists/{id}/todos/*`, `/todos/*`)

**Page Routes:**
- `/` - Redirect to login
- `/login` - Login page (Jinja2 template)
- `/register` - Registration page
- `/dashboard` - User dashboard
- `/team/{team_id}` - Team view
- `/health` - Health check endpoint (returns `{"status": "ok"}`)

## Dependencies Graph

```
External World
     |
     v
[FastAPI + Uvicorn] (port 8000)
     |
     +-- [Jinja2 Templates] -> HTML responses
     |
     +-- [Static Files] -> CSS/JS assets
     |
     +-- [WebSocket] -> Real-time updates
     |
     v
[SQLAlchemy Async]
     |
     v
[aiosqlite] -> todo.db (SQLite file)
```

---

*Integration audit: 2026-01-19*
