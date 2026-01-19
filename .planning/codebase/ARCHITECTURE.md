# Architecture

**Analysis Date:** 2026-01-19

## Pattern Overview

**Overall:** Layered MVC with async API backend and server-rendered frontend

**Key Characteristics:**
- FastAPI backend with async SQLAlchemy ORM
- REST API with JWT authentication
- WebSocket support for real-time collaboration
- Jinja2 server-rendered templates with vanilla JS frontend
- SQLite database (async via aiosqlite)

## Layers

**Presentation Layer (API + Views):**
- Purpose: Handle HTTP requests, render templates, serialize responses
- Location: `main.py`, `routers/`, `templates/`, `static/`
- Contains: Route handlers, HTML templates, CSS/JS assets
- Depends on: Service layer (schemas), Data layer (models, db)
- Used by: External HTTP clients, browsers

**Service Layer (Schemas + Auth):**
- Purpose: Validate input, business logic, authentication
- Location: `schemas.py`, `auth.py`, `websocket.py`, `rate_limit.py`
- Contains: Pydantic models, JWT handling, password hashing, WebSocket manager
- Depends on: Data layer (models), config
- Used by: Presentation layer (routers)

**Data Layer (Models + Database):**
- Purpose: ORM entities, database connection management
- Location: `models.py`, `database.py`
- Contains: SQLAlchemy models, async session factory, Base class
- Depends on: Config
- Used by: Service layer, Presentation layer

**Configuration Layer:**
- Purpose: Environment configuration, secrets
- Location: `config.py`, `.env` (optional)
- Contains: Database URL, JWT settings, environment variables
- Depends on: Environment
- Used by: All layers

**Migration Layer:**
- Purpose: Database schema versioning
- Location: `alembic/`, `alembic.ini`
- Contains: Migration scripts, Alembic configuration
- Depends on: Models, database
- Used by: DevOps/deployment

## Data Flow

**API Request Flow:**

1. Request hits FastAPI endpoint in `main.py` or `routers/*.py`
2. Rate limiter middleware checks request limits (auth endpoints only)
3. Pydantic schema validates request body (`schemas.py`)
4. `get_current_user` dependency extracts and validates JWT (`auth.py`)
5. Route handler queries database via async SQLAlchemy (`models.py`, `database.py`)
6. Response serialized via Pydantic `response_model`
7. JSON response returned to client

**WebSocket Flow:**

1. Client connects to `/ws/teams/{team_id}?token=...`
2. JWT validated inline in `main.py` websocket handler
3. Team membership verified via database query
4. `ConnectionManager` (`websocket.py`) manages active connections
5. Events broadcast to all team members via `manager.broadcast()`

**Authentication Flow:**

1. User POSTs credentials to `/auth/login`
2. Password verified via bcrypt (`auth.py`)
3. JWT token returned with user ID in `sub` claim
4. Client stores token in localStorage
5. Subsequent requests include `Authorization: Bearer <token>`
6. `get_current_user` dependency validates token on protected routes

**State Management:**
- Server-side: SQLite database via SQLAlchemy async sessions
- Client-side: JWT in localStorage, UI state in vanilla JS

## Key Abstractions

**User Authentication:**
- Purpose: Secure user identity and session management
- Examples: `auth.py`, `routers/auth.py`
- Pattern: OAuth2 password flow with JWT bearer tokens

**Team Authorization:**
- Purpose: Resource access control based on team membership
- Examples: `routers/teams.py::verify_team_member()`
- Pattern: Reusable async function checking TeamMember join table

**Database Sessions:**
- Purpose: Async database connection lifecycle
- Examples: `database.py::get_db()`, `database.py::async_session`
- Pattern: FastAPI dependency with async context manager

**WebSocket Manager:**
- Purpose: Real-time bidirectional communication
- Examples: `websocket.py::ConnectionManager`
- Pattern: Singleton manager tracking connections per team

**Pydantic Schemas:**
- Purpose: Request validation, response serialization
- Examples: `schemas.py` (UserCreate, TodoResponse, etc.)
- Pattern: Separate Create/Update/Response schemas per resource

## Entry Points

**HTTP Server:**
- Location: `main.py`
- Triggers: `uvicorn main:app` or `python main.py`
- Responsibilities: Initialize FastAPI app, mount routers, serve static files, handle WebSocket

**Database Initialization:**
- Location: `main.py::lifespan()`, `database.py::init_db()`
- Triggers: Application startup
- Responsibilities: Create tables via SQLAlchemy metadata

**Database Migrations:**
- Location: `alembic/env.py`
- Triggers: `alembic upgrade head`
- Responsibilities: Apply schema migrations to database

## Error Handling

**Strategy:** HTTP exceptions with appropriate status codes

**Patterns:**
- `HTTPException(status_code=404, detail="Resource not found")` for missing resources
- `HTTPException(status_code=403, detail="Not a team member")` for authorization failures
- `HTTPException(status_code=401, ...)` with WWW-Authenticate header for auth failures
- Pydantic validation errors auto-converted to 422 responses
- Rate limit exceeded returns 429 via slowapi handler

## Cross-Cutting Concerns

**Logging:** Not implemented; basic server.log file exists but appears unused

**Validation:**
- Pydantic schemas for request bodies
- Custom validators for password strength and username format in `schemas.py`
- SQLAlchemy column constraints (nullable, unique, max_length)

**Authentication:**
- JWT tokens via python-jose
- Bcrypt password hashing via passlib
- OAuth2PasswordBearer for token extraction
- Rate limiting on auth endpoints (3/min register, 5/min login)

**Rate Limiting:**
- slowapi library in `rate_limit.py`
- Applied to `/auth/register` (3/minute) and `/auth/login` (5/minute)
- Key function: client IP address

---

*Architecture analysis: 2026-01-19*
