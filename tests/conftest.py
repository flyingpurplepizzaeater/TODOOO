import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import Base, get_db
from auth import hash_password, create_access_token
from models import User

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

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
        token = create_access_token(data={"sub": user.id})
        return {"Authorization": f"Bearer {token}"}
    return _auth_headers
