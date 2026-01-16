import pytest
from httpx import AsyncClient

# Valid password meeting all requirements: 8+ chars, uppercase, lowercase, digit
VALID_PASSWORD = "Password123"


class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        response = await client.post("/auth/register", json={
            "username": "newuser",
            "email": "new@test.com",
            "password": VALID_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@test.com"
        assert "id" in data

    async def test_register_duplicate_username(self, client: AsyncClient, create_user):
        await create_user("existinguser", "existing@test.com", VALID_PASSWORD)
        response = await client.post("/auth/register", json={
            "username": "existinguser",
            "email": "different@test.com",
            "password": VALID_PASSWORD
        })
        assert response.status_code == 400
        assert "Username already taken" in response.json()["detail"]

    async def test_register_duplicate_email(self, client: AsyncClient, create_user):
        await create_user("user1", "same@test.com", VALID_PASSWORD)
        response = await client.post("/auth/register", json={
            "username": "user2",
            "email": "same@test.com",
            "password": VALID_PASSWORD
        })
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]


class TestPasswordValidation:
    async def test_password_too_short(self, client: AsyncClient):
        response = await client.post("/auth/register", json={
            "username": "testuser",
            "email": "test@test.com",
            "password": "Short1"
        })
        assert response.status_code == 422
        assert "at least 8 characters" in str(response.json()).lower()

    async def test_password_no_uppercase(self, client: AsyncClient):
        response = await client.post("/auth/register", json={
            "username": "testuser",
            "email": "test@test.com",
            "password": "password123"
        })
        assert response.status_code == 422
        assert "uppercase" in str(response.json()).lower()

    async def test_password_no_lowercase(self, client: AsyncClient):
        response = await client.post("/auth/register", json={
            "username": "testuser",
            "email": "test@test.com",
            "password": "PASSWORD123"
        })
        assert response.status_code == 422
        assert "lowercase" in str(response.json()).lower()

    async def test_password_no_digit(self, client: AsyncClient):
        response = await client.post("/auth/register", json={
            "username": "testuser",
            "email": "test@test.com",
            "password": "PasswordABC"
        })
        assert response.status_code == 422
        assert "digit" in str(response.json()).lower()

    async def test_username_too_short(self, client: AsyncClient):
        response = await client.post("/auth/register", json={
            "username": "ab",
            "email": "test@test.com",
            "password": VALID_PASSWORD
        })
        assert response.status_code == 422

    async def test_username_invalid_characters(self, client: AsyncClient):
        response = await client.post("/auth/register", json={
            "username": "user@name",
            "email": "test@test.com",
            "password": VALID_PASSWORD
        })
        assert response.status_code == 422
        assert "letters, numbers, and underscores" in str(response.json()).lower()


class TestLogin:
    async def test_login_success(self, client: AsyncClient, create_user):
        await create_user("loginuser", "login@test.com", VALID_PASSWORD)
        response = await client.post("/auth/login", data={
            "username": "loginuser",
            "password": VALID_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_username(self, client: AsyncClient):
        response = await client.post("/auth/login", data={
            "username": "nonexistent",
            "password": VALID_PASSWORD
        })
        assert response.status_code == 401

    async def test_login_invalid_password(self, client: AsyncClient, create_user):
        await create_user("wrongpw", "wrongpw@test.com", VALID_PASSWORD)
        response = await client.post("/auth/login", data={
            "username": "wrongpw",
            "password": "WrongPassword123"
        })
        assert response.status_code == 401


class TestMe:
    async def test_me_authenticated(self, client: AsyncClient, auth_headers):
        headers = await auth_headers("meuser", "me@test.com", VALID_PASSWORD)
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
