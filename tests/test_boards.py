"""
Integration tests for board endpoints.

Tests CRUD operations, permission sharing, and access control.
"""
import pytest
from httpx import AsyncClient


class TestBoardCRUD:
    """Tests for board create, read, update, delete."""

    async def test_create_board(self, client: AsyncClient, auth_headers):
        """User can create a board."""
        headers = await auth_headers()
        response = await client.post(
            "/boards",
            json={"title": "Test Board", "is_public": False},
            headers=headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Board"
        assert data["is_public"] is False
        assert "id" in data

    async def test_create_board_default_title(self, client: AsyncClient, auth_headers):
        """Board gets default title if not provided."""
        headers = await auth_headers()
        response = await client.post(
            "/boards",
            json={},
            headers=headers
        )
        assert response.status_code == 201
        assert response.json()["title"] == "Untitled Board"

    async def test_list_boards(self, client: AsyncClient, auth_headers):
        """User can list their boards."""
        headers = await auth_headers()
        # Create a board first
        await client.post(
            "/boards",
            json={"title": "My Board"},
            headers=headers
        )

        response = await client.get("/boards", headers=headers)
        assert response.status_code == 200
        boards = response.json()
        assert len(boards) >= 1
        assert any(b["title"] == "My Board" for b in boards)

    async def test_get_board(self, client: AsyncClient, auth_headers):
        """User can get a specific board."""
        headers = await auth_headers()
        # Create board
        create_response = await client.post(
            "/boards",
            json={"title": "Specific Board"},
            headers=headers
        )
        board_id = create_response.json()["id"]

        response = await client.get(f"/boards/{board_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Specific Board"

    async def test_get_nonexistent_board(self, client: AsyncClient, auth_headers):
        """Getting nonexistent board returns 404."""
        headers = await auth_headers()
        response = await client.get(
            "/boards/00000000-0000-0000-0000-000000000000",
            headers=headers
        )
        assert response.status_code == 404

    async def test_delete_board(self, client: AsyncClient, auth_headers):
        """Owner can delete board."""
        headers = await auth_headers()
        # Create board
        create_response = await client.post(
            "/boards",
            json={"title": "To Delete"},
            headers=headers
        )
        board_id = create_response.json()["id"]

        response = await client.delete(f"/boards/{board_id}", headers=headers)
        assert response.status_code == 204

        # Verify deleted
        get_response = await client.get(f"/boards/{board_id}", headers=headers)
        assert get_response.status_code == 404


class TestBoardSharing:
    """Tests for board permission sharing."""

    async def test_share_board_with_user(self, client: AsyncClient, auth_headers, create_user):
        """Owner can share board with another user."""
        # Create owner and board
        headers = await auth_headers("owner", "owner@test.com", "Password1")
        create_response = await client.post(
            "/boards",
            json={"title": "Shared Board"},
            headers=headers
        )
        board_id = create_response.json()["id"]

        # Create second user
        second_user = await create_user("sharee", "sharee@test.com", "Password1")

        # Share with second user
        response = await client.post(
            f"/boards/{board_id}/share",
            json={"user_id": second_user.id, "level": "edit"},
            headers=headers
        )
        assert response.status_code == 201
        assert response.json()["level"] == "edit"
        assert response.json()["user_id"] == second_user.id

    async def test_share_board_public(self, client: AsyncClient, auth_headers):
        """Owner can make board public."""
        headers = await auth_headers()
        # Create board
        create_response = await client.post(
            "/boards",
            json={"title": "Public Board"},
            headers=headers
        )
        board_id = create_response.json()["id"]

        # Make public with view permission
        response = await client.post(
            f"/boards/{board_id}/share",
            json={"user_id": None, "level": "view"},
            headers=headers
        )
        assert response.status_code == 201
        assert response.json()["user_id"] is None
        assert response.json()["level"] == "view"

    async def test_revoke_permission(self, client: AsyncClient, auth_headers, create_user):
        """Owner can revoke user permission."""
        # Create owner and board
        headers = await auth_headers("revoker", "revoker@test.com", "Password1")
        create_response = await client.post(
            "/boards",
            json={"title": "Revoke Test"},
            headers=headers
        )
        board_id = create_response.json()["id"]

        # Create second user
        second_user = await create_user("revokee", "revokee@test.com", "Password1")

        # Share with second user
        await client.post(
            f"/boards/{board_id}/share",
            json={"user_id": second_user.id, "level": "edit"},
            headers=headers
        )

        # Revoke
        response = await client.delete(
            f"/boards/{board_id}/share/{second_user.id}",
            headers=headers
        )
        assert response.status_code == 204

    async def test_get_share_link(self, client: AsyncClient, auth_headers):
        """Owner can get shareable link."""
        headers = await auth_headers()
        # Create board
        create_response = await client.post(
            "/boards",
            json={"title": "Link Board"},
            headers=headers
        )
        board_id = create_response.json()["id"]

        response = await client.get(
            f"/boards/{board_id}/link",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["board_id"] == board_id
        assert board_id in data["url"]

    async def test_list_permissions(self, client: AsyncClient, auth_headers):
        """Owner can list all permissions."""
        headers = await auth_headers()
        # Create board and add permissions
        create_response = await client.post(
            "/boards",
            json={"title": "Permissions Board"},
            headers=headers
        )
        board_id = create_response.json()["id"]

        # Add public permission
        await client.post(
            f"/boards/{board_id}/share",
            json={"user_id": None, "level": "view"},
            headers=headers
        )

        response = await client.get(
            f"/boards/{board_id}/permissions",
            headers=headers
        )
        assert response.status_code == 200
        perms = response.json()
        assert len(perms) >= 1


class TestBoardAccessControl:
    """Tests for board access control."""

    async def test_non_owner_cannot_delete(self, client: AsyncClient, auth_headers):
        """Non-owner cannot delete board."""
        # Create board as first user
        headers1 = await auth_headers("delowner1", "delowner1@test.com", "Password1")
        create_response = await client.post(
            "/boards",
            json={"title": "Protected Board"},
            headers=headers1
        )
        board_id = create_response.json()["id"]

        # Try to delete as second user
        headers2 = await auth_headers("delother1", "delother1@test.com", "Password1")
        response = await client.delete(
            f"/boards/{board_id}",
            headers=headers2
        )
        assert response.status_code == 403

    async def test_non_owner_cannot_share(self, client: AsyncClient, auth_headers):
        """Non-owner cannot share board."""
        # Create board as first user
        headers1 = await auth_headers("shareowner", "shareowner@test.com", "Password1")
        create_response = await client.post(
            "/boards",
            json={"title": "Owner Only Share"},
            headers=headers1
        )
        board_id = create_response.json()["id"]

        # Try to share as second user
        headers2 = await auth_headers("shareother", "shareother@test.com", "Password1")
        response = await client.post(
            f"/boards/{board_id}/share",
            json={"user_id": None, "level": "view"},
            headers=headers2
        )
        assert response.status_code == 403

    async def test_unauthenticated_cannot_access(self, client: AsyncClient):
        """Unauthenticated user cannot access boards."""
        response = await client.get("/boards")
        assert response.status_code == 401

    async def test_shared_user_can_access_board(self, client: AsyncClient, auth_headers, create_user):
        """User with permission can access shared board."""
        # Create owner and board
        headers1 = await auth_headers("accessowner", "accessowner@test.com", "Password1")
        create_response = await client.post(
            "/boards",
            json={"title": "Accessible Board"},
            headers=headers1
        )
        board_id = create_response.json()["id"]

        # Create and share with second user
        from auth import create_access_token
        second_user = await create_user("accessor", "accessor@test.com", "Password1")
        await client.post(
            f"/boards/{board_id}/share",
            json={"user_id": second_user.id, "level": "view"},
            headers=headers1
        )

        # Second user accesses board
        token = create_access_token(data={"sub": str(second_user.id)})
        headers2 = {"Authorization": f"Bearer {token}"}
        response = await client.get(f"/boards/{board_id}", headers=headers2)
        assert response.status_code == 200
        assert response.json()["title"] == "Accessible Board"

    async def test_shared_board_appears_in_list(self, client: AsyncClient, auth_headers, create_user):
        """Shared boards appear in user's board list."""
        # Create owner and board
        headers1 = await auth_headers("listowner", "listowner@test.com", "Password1")
        create_response = await client.post(
            "/boards",
            json={"title": "Listed Shared Board"},
            headers=headers1
        )
        board_id = create_response.json()["id"]

        # Create and share with second user
        from auth import create_access_token
        second_user = await create_user("lister", "lister@test.com", "Password1")
        await client.post(
            f"/boards/{board_id}/share",
            json={"user_id": second_user.id, "level": "edit"},
            headers=headers1
        )

        # Second user lists boards
        token = create_access_token(data={"sub": str(second_user.id)})
        headers2 = {"Authorization": f"Bearer {token}"}
        response = await client.get("/boards", headers=headers2)
        assert response.status_code == 200
        boards = response.json()
        assert any(b["id"] == board_id for b in boards)


class TestPublicBoards:
    """Tests for public board access."""

    async def test_revoke_public_access(self, client: AsyncClient, auth_headers):
        """Owner can revoke public access."""
        headers = await auth_headers()
        # Create board
        create_response = await client.post(
            "/boards",
            json={"title": "Public Then Private"},
            headers=headers
        )
        board_id = create_response.json()["id"]

        # Make public
        await client.post(
            f"/boards/{board_id}/share",
            json={"user_id": None, "level": "view"},
            headers=headers
        )

        # Revoke public access
        response = await client.delete(
            f"/boards/{board_id}/share/public",
            headers=headers
        )
        assert response.status_code == 204

        # Verify board is no longer public
        link_response = await client.get(f"/boards/{board_id}/link", headers=headers)
        assert link_response.json()["is_public"] is False
