# Codebase Structure

**Analysis Date:** 2026-01-19

## Directory Layout

```
TODO/
├── main.py              # FastAPI application entry point
├── config.py            # Environment configuration
├── database.py          # SQLAlchemy async setup
├── models.py            # ORM entity definitions
├── schemas.py           # Pydantic request/response models
├── auth.py              # JWT and password utilities
├── websocket.py         # WebSocket connection manager
├── rate_limit.py        # Rate limiting setup
├── routers/             # API route handlers
│   ├── __init__.py
│   ├── auth.py          # /auth/* endpoints
│   ├── teams.py         # /teams/* endpoints
│   ├── lists.py         # /teams/{id}/lists/* endpoints
│   └── todos.py         # /lists/{id}/todos/* endpoints
├── templates/           # Jinja2 HTML templates
│   ├── base.html        # Layout template
│   ├── login.html       # Login page
│   ├── register.html    # Registration page
│   ├── dashboard.html   # User dashboard
│   └── team.html        # Team view page
├── static/              # Frontend assets
│   ├── app.js           # JavaScript utilities
│   └── style.css        # Styles
├── tests/               # Pytest test suite
│   ├── __init__.py
│   ├── conftest.py      # Fixtures and test setup
│   ├── test_auth.py     # Auth endpoint tests
│   ├── test_teams.py    # Teams endpoint tests
│   ├── test_lists.py    # Lists endpoint tests
│   ├── test_todos.py    # Todos endpoint tests
│   └── test_websocket.py # WebSocket tests
├── alembic/             # Database migrations
│   ├── env.py           # Migration environment config
│   ├── script.py.mako   # Migration template
│   └── versions/        # Migration scripts
│       └── 001_initial_schema.py
├── docs/                # Documentation
│   ├── ROADMAP.md       # Project roadmap
│   └── plans/           # Design documents
├── .planning/           # GSD planning documents
│   └── codebase/        # Codebase analysis
├── alembic.ini          # Alembic configuration
├── requirements.txt     # Python dependencies
├── pytest.ini           # Pytest configuration
├── Dockerfile           # Container image definition
├── docker-compose.yml   # Container orchestration
├── .env.example         # Environment variable template
├── .gitignore           # Git ignore patterns
├── LICENSE              # MIT license
├── README.md            # Project readme
├── SETUP.md             # Setup instructions
├── todo.db              # SQLite database (dev)
└── server.log           # Application log file
```

## Directory Purposes

**routers/:**
- Purpose: API endpoint handlers organized by resource
- Contains: FastAPI APIRouter instances with route decorators
- Key files: `auth.py` (authentication), `teams.py` (team management), `lists.py` (todo lists), `todos.py` (todo items)

**templates/:**
- Purpose: Server-rendered HTML pages
- Contains: Jinja2 templates extending `base.html`
- Key files: `base.html` (layout), `dashboard.html` (main UI), `team.html` (team view)

**static/:**
- Purpose: Client-side assets served at `/static/`
- Contains: JavaScript and CSS files
- Key files: `app.js` (API helper, auth utilities), `style.css` (application styles)

**tests/:**
- Purpose: Automated test suite
- Contains: Pytest test modules and fixtures
- Key files: `conftest.py` (shared fixtures), `test_*.py` (test cases per feature)

**alembic/:**
- Purpose: Database schema migrations
- Contains: Alembic environment and version scripts
- Key files: `env.py` (migration runner), `versions/*.py` (migration files)

**docs/:**
- Purpose: Project documentation
- Contains: Roadmap, design plans
- Key files: `ROADMAP.md`, `plans/*.md`

## Key File Locations

**Entry Points:**
- `main.py`: Application startup, route mounting, WebSocket handler
- `alembic/env.py`: Database migration entry point

**Configuration:**
- `config.py`: Runtime configuration (DATABASE_URL, SECRET_KEY, ALGORITHM)
- `alembic.ini`: Migration tool configuration
- `.env.example`: Environment variable template

**Core Logic:**
- `auth.py`: Password hashing, JWT creation/validation, user dependency
- `websocket.py`: Real-time connection management
- `routers/teams.py::verify_team_member()`: Authorization helper

**Data Models:**
- `models.py`: All SQLAlchemy ORM classes (User, Team, TeamMember, TodoList, TodoItem)
- `schemas.py`: All Pydantic schemas for API validation/serialization

**Testing:**
- `tests/conftest.py`: Test fixtures (test_db, client, auth_headers)
- `tests/test_*.py`: Feature-specific test modules

## Naming Conventions

**Files:**
- Python modules: lowercase_with_underscores (e.g., `rate_limit.py`)
- Router files: match resource name (e.g., `teams.py` for `/teams/*`)
- Test files: `test_<feature>.py` (e.g., `test_auth.py`)
- HTML templates: lowercase with dots (e.g., `base.html`, `dashboard.html`)

**Directories:**
- Lowercase, plural for collections (e.g., `routers/`, `templates/`, `tests/`)
- Alembic standard naming for migrations

**Classes:**
- ORM models: PascalCase, singular (e.g., `User`, `TodoItem`)
- Pydantic schemas: PascalCase with suffix (e.g., `UserCreate`, `TodoResponse`)

**Functions:**
- Route handlers: lowercase_with_underscores, verb-noun (e.g., `create_team`, `get_list_todos`)
- Helpers: lowercase_with_underscores (e.g., `verify_team_member`, `hash_password`)

**Variables:**
- Lowercase with underscores (e.g., `current_user`, `team_id`)
- Constants: UPPERCASE (e.g., `SECRET_KEY`, `ALGORITHM`)

## Where to Add New Code

**New API Endpoint:**
- For existing resource: Add to relevant `routers/<resource>.py`
- For new resource: Create `routers/<resource>.py`, add to `main.py` via `app.include_router()`
- Add corresponding Pydantic schemas to `schemas.py`
- Add tests to `tests/test_<resource>.py`

**New Database Model:**
- Add SQLAlchemy class to `models.py`
- Create migration: `alembic revision --autogenerate -m "description"`
- Add corresponding schemas to `schemas.py`

**New Page/View:**
- Create template in `templates/<page>.html` extending `base.html`
- Add route handler in `main.py` returning `templates.TemplateResponse()`

**New Frontend Feature:**
- Add JavaScript to `static/app.js` or create new JS file
- Add styles to `static/style.css`
- Reference in template via `{% block scripts %}`

**New Test:**
- Add to existing `tests/test_<feature>.py` or create new test file
- Use fixtures from `tests/conftest.py` (client, auth_headers, create_user)

**New Utility/Helper:**
- Authentication-related: `auth.py`
- Database-related: `database.py`
- Cross-cutting: Create new module at root level

## Special Directories

**alembic/versions/:**
- Purpose: Database migration scripts
- Generated: Yes (via `alembic revision`)
- Committed: Yes

**__pycache__/:**
- Purpose: Python bytecode cache
- Generated: Yes (by Python interpreter)
- Committed: No (in .gitignore)

**static/:**
- Purpose: Served directly by FastAPI at `/static/`
- Generated: No
- Committed: Yes

**.planning/:**
- Purpose: GSD planning and analysis documents
- Generated: By GSD mapping commands
- Committed: Yes

**tmpclaude-*-cwd (multiple):**
- Purpose: Temporary working directories from Claude sessions
- Generated: Yes (by Claude Code)
- Committed: Should be added to .gitignore

---

*Structure analysis: 2026-01-19*
