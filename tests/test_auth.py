import pytest
from httpx import AsyncClient


class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        response = await client.post("/auth/register", json={
            "username": "newuser",
            "email": "new@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@test.com"
        assert "id" in data

    async def test_register_duplicate_username(self, client: AsyncClient, create_user):
        await create_user("existinguser", "existing@test.com", "password123")
        response = await client.post("/auth/register", json={
            "username": "existinguser",
            "email": "different@test.com",
            "password": "password123"
        })
        assert response.status_code == 400
        assert "Username already taken" in response.json()["detail"]

    async def test_register_duplicate_email(self, client: AsyncClient, create_user):
        await create_user("user1", "same@test.com", "password123")
        response = await client.post("/auth/register", json={
            "username": "user2",
            "email": "same@test.com",
            "password": "password123"
        })
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]


class TestLogin:
    async def test_login_success(self, client: AsyncClient, create_user):
        await create_user("loginuser", "login@test.com", "password123")
        response = await client.post("/auth/login", data={
            "username": "loginuser",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_username(self, client: AsyncClient):
        response = await client.post("/auth/login", data={
            "username": "nonexistent",
            "password": "password123"
        })
        assert response.status_code == 401

    async def test_login_invalid_password(self, client: AsyncClient, create_user):
        await create_user("wrongpw", "wrongpw@test.com", "correctpassword")
        response = await client.post("/auth/login", data={
            "username": "wrongpw",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestMe:
    async def test_me_authenticated(self, client: AsyncClient, auth_headers):
        headers = await auth_headers("meuser", "me@test.com", "password123")
        response = await client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "meuser"
        assert data["email"] == "me@test.com"

    async def test_me_unauthenticated(self, client: AsyncClient):
        response = await client.get("/auth/me")
        assert response.status_code == 401

    async def test_me_invalid_token(self, client: AsyncClient):
        response = await client.get("/auth/me", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        assert response.status_code == 401
