import pytest
import pytest_asyncio
from httpx import AsyncClient
from starlette.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import patch

import main
import database
from database import Base
from auth import hash_password, create_access_token
from models import User, Team, TeamMember


# Test database setup for WebSocket tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


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


async def create_test_user(session_maker, username: str, email: str, password: str) -> User:
    """Helper to create a test user."""
    async with session_maker() as db:
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password)
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


async def create_test_team(session_maker, name: str, owner_id: int) -> Team:
    """Helper to create a test team with owner as member."""
    async with session_maker() as db:
        team = Team(name=name)
        db.add(team)
        await db.commit()
        await db.refresh(team)

        member = TeamMember(user_id=owner_id, team_id=team.id)
        db.add(member)
        await db.commit()
        await db.refresh(team)
        return team


async def add_team_member(session_maker, user_id: int, team_id: int):
    """Helper to add user to team."""
    async with session_maker() as db:
        member = TeamMember(user_id=user_id, team_id=team_id)
        db.add(member)
        await db.commit()


class TestWebSocketConnect:
    async def test_websocket_connect(self, ws_test_db):
        """Test WebSocket connection with valid token."""
        # Create user and team
        user = await create_test_user(ws_test_db, "wsuser", "ws@test.com", "password")
        team = await create_test_team(ws_test_db, "WS Team", user.id)
        token = create_access_token(data={"sub": str(user.id)})

        # Test WebSocket connection
        with TestClient(main.app) as test_client:
            with test_client.websocket_connect(f"/ws/teams/{team.id}?token={token}") as websocket:
                # Should receive online_users event on connect
                data = websocket.receive_json()
                assert data["event"] == "online_users"
                assert "users" in data["data"]


class TestWebSocketInvalidToken:
    async def test_websocket_invalid_token(self, ws_test_db):
        """Test WebSocket closes with code 4001 for invalid token."""
        # Create user and team
        user = await create_test_user(ws_test_db, "badtokenuser", "badtoken@test.com", "password")
        team = await create_test_team(ws_test_db, "Token Test Team", user.id)

        # Try to connect with invalid token
        with TestClient(main.app) as test_client:
            with pytest.raises(Exception) as exc_info:
                with test_client.websocket_connect(f"/ws/teams/{team.id}?token=invalid_token"):
                    pass
            # The connection should be closed with code 4001
            assert "4001" in str(exc_info.value)


class TestWebSocketNotMember:
    async def test_websocket_not_member(self, ws_test_db):
        """Test WebSocket closes with code 4003 if user is not a team member."""
        # Create user1 (owner) and a team
        owner = await create_test_user(ws_test_db, "owner", "owner@test.com", "password")
        team = await create_test_team(ws_test_db, "Private Team", owner.id)

        # Create user2 who is NOT a member of the team
        nonmember = await create_test_user(ws_test_db, "nonmember", "nonmember@test.com", "password")
        token2 = create_access_token(data={"sub": str(nonmember.id)})

        # Try to connect with user2's valid token but to a team they're not a member of
        with TestClient(main.app) as test_client:
            with pytest.raises(Exception) as exc_info:
                with test_client.websocket_connect(f"/ws/teams/{team.id}?token={token2}"):
                    pass
            # The connection should be closed with code 4003
            assert "4003" in str(exc_info.value)


class TestWebSocketOnlineUsers:
    async def test_websocket_online_users(self, ws_test_db):
        """Test that connected user receives online_users list on connect."""
        # Create user and team
        user = await create_test_user(ws_test_db, "onlineuser", "online@test.com", "password")
        team = await create_test_team(ws_test_db, "Online Users Team", user.id)
        token = create_access_token(data={"sub": str(user.id)})

        with TestClient(main.app) as test_client:
            with test_client.websocket_connect(f"/ws/teams/{team.id}?token={token}") as websocket:
                # First message should be online_users
                data = websocket.receive_json()
                assert data["event"] == "online_users"
                assert "users" in data["data"]
                users = data["data"]["users"]
                # Should contain at least the connecting user
                assert len(users) >= 1
                usernames = [u["username"] for u in users]
                assert "onlineuser" in usernames


class TestWebSocketMemberOnline:
    async def test_websocket_member_online(self, ws_test_db):
        """Test that existing connections receive member_online broadcast when new user joins."""
        # Create owner and team
        member1 = await create_test_user(ws_test_db, "member1", "member1@test.com", "password")
        team = await create_test_team(ws_test_db, "Broadcast Team", member1.id)
        token1 = create_access_token(data={"sub": str(member1.id)})

        # Create second user and add them to the team
        member2 = await create_test_user(ws_test_db, "member2", "member2@test.com", "password")
        await add_team_member(ws_test_db, member2.id, team.id)
        token2 = create_access_token(data={"sub": str(member2.id)})

        with TestClient(main.app) as test_client:
            # First user connects
            with test_client.websocket_connect(f"/ws/teams/{team.id}?token={token1}") as ws1:
                # Receive initial online_users
                data = ws1.receive_json()
                assert data["event"] == "online_users"

                # Second user connects
                with test_client.websocket_connect(f"/ws/teams/{team.id}?token={token2}") as ws2:
                    # ws2 receives their online_users
                    ws2.receive_json()

                    # ws1 should receive member_online broadcast
                    data = ws1.receive_json()
                    assert data["event"] == "member_online"
                    assert data["data"]["username"] == "member2"


class TestWebSocketMemberOffline:
    async def test_websocket_member_offline(self, ws_test_db):
        """Test that remaining connections receive member_offline broadcast when user leaves."""
        # Create owner and team
        stayer = await create_test_user(ws_test_db, "stayer", "stayer@test.com", "password")
        team = await create_test_team(ws_test_db, "Offline Test Team", stayer.id)
        token1 = create_access_token(data={"sub": str(stayer.id)})

        # Create second user and add them to the team
        leaver = await create_test_user(ws_test_db, "leaver", "leaver@test.com", "password")
        await add_team_member(ws_test_db, leaver.id, team.id)
        token2 = create_access_token(data={"sub": str(leaver.id)})

        with TestClient(main.app) as test_client:
            # First user connects
            with test_client.websocket_connect(f"/ws/teams/{team.id}?token={token1}") as ws1:
                # Receive initial online_users
                ws1.receive_json()

                # Second user connects then disconnects
                with test_client.websocket_connect(f"/ws/teams/{team.id}?token={token2}") as ws2:
                    ws2.receive_json()  # ws2 receives online_users
                    ws1.receive_json()  # ws1 receives member_online
                # ws2 context exits here, triggering disconnect

                # ws1 should receive member_offline broadcast
                data = ws1.receive_json()
                assert data["event"] == "member_offline"
                assert data["data"]["username"] == "leaver"
