# Technology Stack

**Analysis Date:** 2026-01-19

## Languages

**Primary:**
- Python 3.12 - Backend API, business logic, database models

**Secondary:**
- JavaScript (Vanilla ES6+) - Frontend interactivity (`static/app.js`)
- HTML5/CSS3 - Templating and styling (`templates/`, `static/style.css`)

## Runtime

**Environment:**
- Python 3.12 (specified in `Dockerfile`)
- CPython interpreter

**Package Manager:**
- pip
- Lockfile: Not present (uses `requirements.txt` with pinned versions)

## Frameworks

**Core:**
- FastAPI 0.109.0 - Web framework, async REST API (`main.py`)
- SQLAlchemy 2.0.25 - Async ORM for database operations (`database.py`, `models.py`)
- Pydantic v2 - Data validation via `BaseModel` and `Field` (`schemas.py`)

**Testing:**
- pytest 8.0.0 - Test runner (`pytest.ini`)
- pytest-asyncio 0.23.3 - Async test support
- pytest-cov 4.1.0 - Coverage reporting
- httpx 0.26.0 - Async HTTP client for API testing (`tests/conftest.py`)

**Build/Dev:**
- uvicorn 0.27.0 - ASGI server with standard extras (`main.py`)
- Alembic 1.13.1 - Database migrations (`alembic/`, `alembic.ini`)
- Docker - Containerization (`Dockerfile`, `docker-compose.yml`)

## Key Dependencies

**Critical:**
- python-jose[cryptography] 3.3.0 - JWT token encoding/decoding for auth (`auth.py`)
- passlib[bcrypt] 1.7.4 - Password hashing with bcrypt scheme (`auth.py`)
- aiosqlite 0.19.0 - Async SQLite driver (`database.py`)

**Infrastructure:**
- slowapi 0.1.9 - Rate limiting middleware (`rate_limit.py`, `routers/auth.py`)
- python-multipart 0.0.6 - Form data parsing for OAuth2 login
- python-dotenv 1.0.0 - Environment variable loading from `.env` (`config.py`)
- Jinja2 3.1.3 - HTML templating (`main.py`, `templates/`)

## Configuration

**Environment:**
- Uses `python-dotenv` to load from `.env` file
- Key environment variables:
  - `SECRET_KEY` - JWT signing key (required for production)
  - `DATABASE_URL` - SQLAlchemy connection string (default: `sqlite+aiosqlite:///./todo.db`)
  - `ACCESS_TOKEN_EXPIRE_HOURS` - Token expiration (default: 24)
- Config loaded at module level in `config.py`

**Build:**
- `requirements.txt` - Dependency specification with pinned versions
- `Dockerfile` - Python 3.12-slim base, non-root user, port 8000
- `docker-compose.yml` - Single service with volume mount for data persistence
- `pytest.ini` - pytest configuration with `asyncio_mode = auto`
- `alembic.ini` - Migration configuration

## Platform Requirements

**Development:**
- Python 3.12+
- No external services required (SQLite is file-based)
- Install: `pip install -r requirements.txt`
- Run: `uvicorn main:app --reload` or `python main.py`

**Production:**
- Docker with docker-compose (recommended)
- Host port 8000
- Volume for database persistence (`./data:/app/data`)
- Persistent `SECRET_KEY` environment variable

**Commands:**
```bash
# Development
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Testing
pytest
pytest --cov=. --cov-report=html

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Docker
docker-compose up --build
```

---

*Stack analysis: 2026-01-19*
