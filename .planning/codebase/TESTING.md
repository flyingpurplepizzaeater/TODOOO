# Testing Patterns

**Analysis Date:** 2026-01-19

## Test Framework

**Runner:**
- pytest 8.0.0
- Config: `pytest.ini`

**Async Support:**
- pytest-asyncio 0.23.3
- Mode: `asyncio_mode = auto` (no need for `@pytest.mark.asyncio` decorator)

**HTTP Client:**
- httpx 0.26.0 (AsyncClient for API testing)
- starlette.testclient.TestClient (for WebSocket tests)

**Coverage:**
- pytest-cov 4.1.0

**Run Commands:**
```bash
pytest                           # Run all tests
pytest tests/test_auth.py        # Run specific test file
pytest -v                        # Verbose output
pytest --cov=.                   # Run with coverage
pytest --cov=. --cov-report=html # Coverage with HTML report
pytest -x                        # Stop on first failure
pytest -k "test_login"           # Run tests matching pattern
```

## Test File Organization

**Location:**
- All tests in `tests/` directory (separate from source)

**Naming:**
- Test files: `test_<module>.py`
- Test functions: `test_<description>`
- Test classes: `Test<Feature>`

**Structure:**
```
tests/
├── __init__.py
├── conftest.py          # Shared fixtures
├── test_auth.py         # Auth endpoint tests
├── test_teams.py        # Team endpoint tests
├── test_lists.py        # List endpoint tests
├── test_todos.py        # Todo endpoint tests
└── test_websocket.py    # WebSocket tests
```

## Test Structure

**Suite Organization:**
```python
import pytest
from httpx import AsyncClient

class TestCreateTeam:
    async def test_create_team(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        response = await client.post("/teams", json={"name": "My Team"}, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "My Team"
        assert "invite_code" in data

    async def test_create_team_unauthenticated(self, client: AsyncClient):
        response = await client.post("/teams", json={"name": "My Team"})
        assert response.status_code == 401
```

**Patterns:**
- Group related tests in classes by feature (e.g., `TestCreateTeam`, `TestLogin`)
- Each test method is `async` and uses fixtures via parameters
- Arrange-Act-Assert pattern within each test
- No explicit setup/teardown - use fixtures

**Assertion Style:**
- Use plain `assert` statements
- Check status codes first, then response body
- Use `in` for substring checks in error messages

```python
assert response.status_code == 422
assert "uppercase" in str(response.json()).lower()
```

## Mocking

**Framework:** unittest.mock (standard library)

**Patterns:**
```python
from unittest.mock import patch

@pytest_asyncio.fixture
async def ws_test_db():
    """Create fresh database for WebSocket tests with patched async_session."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    test_async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Patch both the database module and main module's async_session
    with patch.object(database, 'async_session', test_async_session):
        with patch.object(main, 'async_session', test_async_session):
            yield test_async_session

    await engine.dispose()
```

**What to Mock:**
- Database session (override via FastAPI dependency injection)
- Module-level singletons for WebSocket tests

**What NOT to Mock:**
- HTTP client interactions (use real test client)
- Authentication flow (test the actual flow)
- Pydantic validation

## Fixtures and Factories

**Core Fixtures (from `tests/conftest.py`):**

```python
@pytest_asyncio.fixture
async def test_db():
    """Create fresh database for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    yield async_session

    app.dependency_overrides.clear()
    await engine.dispose()

@pytest_asyncio.fixture
async def client(test_db):
    """Async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def create_user(test_db):
    """Factory fixture to create users."""
    async def _create_user(username: str, email: str, password: str) -> User:
        async with test_db() as db:
            user = User(
                username=username,
                email=email,
                password_hash=hash_password(password)
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            return user
    return _create_user

@pytest_asyncio.fixture
async def auth_headers(create_user):
    """Factory fixture to get auth headers for a user."""
    async def _auth_headers(username: str = "testuser", email: str = "test@test.com", password: str = "password123") -> dict:
        user = await create_user(username, email, password)
        token = create_access_token(data={"sub": str(user.id)})
        return {"Authorization": f"Bearer {token}"}
    return _auth_headers
```

**Test-specific Fixtures:**
```python
# From test_todos.py
@pytest.fixture
async def list_with_user(client: AsyncClient, auth_headers):
    """Create a team, list, and return (headers, list_id, user_id)."""
    headers = await auth_headers("todouser", "todouser@test.com", "password")

    me_response = await client.get("/auth/me", headers=headers)
    user_id = me_response.json()["id"]

    team_response = await client.post("/teams", json={"name": "Todo Team"}, headers=headers)
    team_id = team_response.json()["id"]
    list_response = await client.post(f"/teams/{team_id}/lists", json={"name": "Todo List"}, headers=headers)
    list_id = list_response.json()["id"]

    return headers, list_id, user_id

# From test_lists.py
@pytest.fixture
async def team_with_user(client: AsyncClient, auth_headers):
    """Create a team and return (headers, team_id)."""
    headers = await auth_headers("listuser", "listuser@test.com", "password")
    response = await client.post("/teams", json={"name": "List Team"}, headers=headers)
    return headers, response.json()["id"]
```

**Test Data Constants:**
```python
# From test_auth.py
VALID_PASSWORD = "Password123"  # 8+ chars, uppercase, lowercase, digit
```

**Location:**
- Shared fixtures: `tests/conftest.py`
- Test-specific fixtures: In the test file that uses them

## Coverage

**Requirements:** Not enforced (no coverage threshold configured)

**View Coverage:**
```bash
pytest --cov=. --cov-report=html
# Open htmlcov/index.html in browser
```

**Current Test Coverage Areas:**
- Authentication (register, login, token validation, rate limiting)
- Teams (CRUD, membership, invite codes)
- Lists (CRUD within teams)
- Todos (CRUD, toggle, assignment)
- WebSocket (connect, auth, online/offline events)

## Test Types

**Unit Tests:**
- Not present - all tests are integration/API tests

**Integration Tests:**
- All tests are API integration tests
- Test full request/response cycle
- Use real (in-memory) database
- Test authentication flow end-to-end

**E2E Tests:**
- WebSocket tests in `test_websocket.py`
- Use Starlette TestClient for WebSocket connections

## Common Patterns

**Async Testing:**
```python
class TestCreateTodo:
    async def test_create_todo(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        response = await client.post(f"/lists/{list_id}/todos", json={"title": "My Todo"}, headers=headers)
        assert response.status_code == 200
```

**Error Testing:**
```python
async def test_get_team_not_found(self, client: AsyncClient, auth_headers):
    headers = await auth_headers()
    response = await client.get("/teams/99999", headers=headers)
    assert response.status_code == 404
```

**Authorization Testing:**
```python
async def test_todo_unauthorized(self, client: AsyncClient, list_with_user, auth_headers):
    headers, list_id, _ = list_with_user
    create_response = await client.post(f"/lists/{list_id}/todos", json={"title": "Private"}, headers=headers)
    todo_id = create_response.json()["id"]

    other_headers = await auth_headers("othertodouser", "othertodo@test.com", "password")
    response = await client.delete(f"/todos/{todo_id}", headers=other_headers)
    assert response.status_code == 403
```

**Rate Limit Testing:**
```python
async def test_login_rate_limit(self, client: AsyncClient):
    """Test that login is rate limited to 5 attempts per minute"""
    for i in range(5):
        await client.post("/auth/login", data={
            "username": f"nonexistent{i}",
            "password": VALID_PASSWORD
        })
    response = await client.post("/auth/login", data={
        "username": "nonexistent6",
        "password": VALID_PASSWORD
    })
    assert response.status_code == 429
```

**Validation Testing:**
```python
async def test_password_no_uppercase(self, client: AsyncClient):
    response = await client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@test.com",
        "password": "password123"
    })
    assert response.status_code == 422
    assert "uppercase" in str(response.json()).lower()
```

**WebSocket Testing:**
```python
class TestWebSocketConnect:
    async def test_websocket_connect(self, ws_test_db):
        user = await create_test_user(ws_test_db, "wsuser", "ws@test.com", "password")
        team = await create_test_team(ws_test_db, "WS Team", user.id)
        token = create_access_token(data={"sub": str(user.id)})

        with TestClient(main.app) as test_client:
            with test_client.websocket_connect(f"/ws/teams/{team.id}?token={token}") as websocket:
                data = websocket.receive_json()
                assert data["event"] == "online_users"
```

## Database Test Strategy

**In-Memory SQLite:**
```python
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
```

**Fresh Database Per Test:**
- Each test gets a clean database via `test_db` fixture
- Uses `StaticPool` to keep in-memory database alive during test
- `check_same_thread=False` required for SQLite async

**Dependency Override Pattern:**
```python
app.dependency_overrides[get_db] = override_get_db
yield async_session
app.dependency_overrides.clear()
```

## Writing New Tests

**For a new API endpoint:**
1. Create test class named `Test<EndpointName>`
2. Use existing fixtures: `client`, `auth_headers`, domain-specific fixtures
3. Test success case, error cases, and authorization

**For a new feature:**
1. Add fixtures to `conftest.py` if they'll be reused
2. Add test-specific fixtures at top of test file if local
3. Group tests logically in classes

**Test File Template:**
```python
import pytest
from httpx import AsyncClient


class TestNewFeature:
    async def test_success_case(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        response = await client.post("/endpoint", json={"data": "value"}, headers=headers)
        assert response.status_code == 200
        assert response.json()["key"] == "expected"

    async def test_error_case(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        response = await client.post("/endpoint", json={})
        assert response.status_code == 422

    async def test_unauthorized(self, client: AsyncClient):
        response = await client.post("/endpoint", json={"data": "value"})
        assert response.status_code == 401
```

---

*Testing analysis: 2026-01-19*
