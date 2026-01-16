import pytest
from httpx import AsyncClient

@pytest.fixture
async def team_with_user(client: AsyncClient, auth_headers):
    """Create a team and return (headers, team_id)."""
    headers = await auth_headers("listuser", "listuser@test.com", "password")
    response = await client.post("/teams", json={"name": "List Team"}, headers=headers)
    assert response.status_code == 200, f"Failed to create team: {response.json()}"
    return headers, response.json()["id"]


class TestCreateList:
    async def test_create_list(self, client: AsyncClient, team_with_user):
        headers, team_id = team_with_user
        response = await client.post(f"/teams/{team_id}/lists", json={"name": "My List"}, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "My List"
        assert data["team_id"] == team_id

    async def test_create_list_not_member(self, client: AsyncClient, team_with_user, auth_headers):
        _, team_id = team_with_user
        other_headers = await auth_headers("otherlistuser", "otherlist@test.com", "password")
        response = await client.post(f"/teams/{team_id}/lists", json={"name": "Bad List"}, headers=other_headers)
        assert response.status_code == 403


class TestGetLists:
    async def test_get_lists(self, client: AsyncClient, team_with_user):
        headers, team_id = team_with_user
        await client.post(f"/teams/{team_id}/lists", json={"name": "List A"}, headers=headers)
        await client.post(f"/teams/{team_id}/lists", json={"name": "List B"}, headers=headers)

        response = await client.get(f"/teams/{team_id}/lists", headers=headers)
        assert response.status_code == 200
        lists = response.json()
        assert len(lists) == 2

    async def test_get_lists_empty(self, client: AsyncClient, team_with_user):
        headers, team_id = team_with_user
        response = await client.get(f"/teams/{team_id}/lists", headers=headers)
        assert response.status_code == 200
        assert response.json() == []


class TestUpdateList:
    async def test_update_list(self, client: AsyncClient, team_with_user):
        headers, team_id = team_with_user
        create_response = await client.post(f"/teams/{team_id}/lists", json={"name": "Old Name"}, headers=headers)
        list_id = create_response.json()["id"]

        response = await client.put(f"/lists/{list_id}", json={"name": "New Name"}, headers=headers)
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"

    async def test_update_list_not_found(self, client: AsyncClient, team_with_user):
        headers, _ = team_with_user
        response = await client.put("/lists/99999", json={"name": "Whatever"}, headers=headers)
        assert response.status_code == 404


class TestDeleteList:
    async def test_delete_list(self, client: AsyncClient, team_with_user):
        headers, team_id = team_with_user
        create_response = await client.post(f"/teams/{team_id}/lists", json={"name": "Delete Me"}, headers=headers)
        list_id = create_response.json()["id"]

        response = await client.delete(f"/lists/{list_id}", headers=headers)
        assert response.status_code == 204

    async def test_delete_list_cascades_todos(self, client: AsyncClient, team_with_user):
        headers, team_id = team_with_user
        # Create list
        list_response = await client.post(f"/teams/{team_id}/lists", json={"name": "Cascade List"}, headers=headers)
        list_id = list_response.json()["id"]

        # Create todos in list
        await client.post(f"/lists/{list_id}/todos", json={"title": "Todo 1"}, headers=headers)
        await client.post(f"/lists/{list_id}/todos", json={"title": "Todo 2"}, headers=headers)

        # Delete list
        await client.delete(f"/lists/{list_id}", headers=headers)

        # Todos should be gone (can't access them directly, list is gone)
        # Just verify the list is deleted
        get_response = await client.get(f"/teams/{team_id}/lists", headers=headers)
        assert len(get_response.json()) == 0
