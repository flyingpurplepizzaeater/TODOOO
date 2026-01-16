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
        assert "id" in data

    async def test_create_team_unauthenticated(self, client: AsyncClient):
        response = await client.post("/teams", json={"name": "My Team"})
        assert response.status_code == 401


class TestListTeams:
    async def test_list_teams(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        # Create a team first
        await client.post("/teams", json={"name": "Team 1"}, headers=headers)
        await client.post("/teams", json={"name": "Team 2"}, headers=headers)

        response = await client.get("/teams", headers=headers)
        assert response.status_code == 200
        teams = response.json()
        assert len(teams) == 2
        assert teams[0]["name"] == "Team 1"
        assert teams[1]["name"] == "Team 2"


class TestGetTeam:
    async def test_get_team(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        create_response = await client.post("/teams", json={"name": "Get Team"}, headers=headers)
        team_id = create_response.json()["id"]

        response = await client.get(f"/teams/{team_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Get Team"
        assert "members" in data
        assert len(data["members"]) == 1

    async def test_get_team_not_member(self, client: AsyncClient, auth_headers):
        # Create team with user1
        headers1 = await auth_headers("user1", "user1@test.com", "password")
        create_response = await client.post("/teams", json={"name": "Private Team"}, headers=headers1)
        team_id = create_response.json()["id"]

        # Try to access with user2
        headers2 = await auth_headers("user2", "user2@test.com", "password")
        response = await client.get(f"/teams/{team_id}", headers=headers2)
        assert response.status_code == 403

    async def test_get_team_not_found(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        response = await client.get("/teams/99999", headers=headers)
        assert response.status_code == 404


class TestJoinTeam:
    async def test_join_team_success(self, client: AsyncClient, auth_headers):
        # Create team with user1
        headers1 = await auth_headers("owner", "owner@test.com", "password")
        create_response = await client.post("/teams", json={"name": "Join Team"}, headers=headers1)
        invite_code = create_response.json()["invite_code"]

        # Join with user2
        headers2 = await auth_headers("joiner", "joiner@test.com", "password")
        response = await client.post("/teams/join", json={"invite_code": invite_code}, headers=headers2)
        assert response.status_code == 200
        assert response.json()["name"] == "Join Team"

    async def test_join_team_invalid_code(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        response = await client.post("/teams/join", json={"invite_code": "invalid_code"}, headers=headers)
        assert response.status_code == 404

    async def test_join_team_already_member(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        create_response = await client.post("/teams", json={"name": "Already In"}, headers=headers)
        invite_code = create_response.json()["invite_code"]

        response = await client.post("/teams/join", json={"invite_code": invite_code}, headers=headers)
        assert response.status_code == 400


class TestDeleteTeam:
    async def test_delete_team(self, client: AsyncClient, auth_headers):
        headers = await auth_headers()
        create_response = await client.post("/teams", json={"name": "Delete Me"}, headers=headers)
        team_id = create_response.json()["id"]

        response = await client.delete(f"/teams/{team_id}", headers=headers)
        assert response.status_code == 204

        # Verify deleted
        get_response = await client.get(f"/teams/{team_id}", headers=headers)
        assert get_response.status_code == 404

    async def test_delete_team_not_member(self, client: AsyncClient, auth_headers):
        headers1 = await auth_headers("delowner", "delowner@test.com", "password")
        create_response = await client.post("/teams", json={"name": "Not Yours"}, headers=headers1)
        team_id = create_response.json()["id"]

        headers2 = await auth_headers("delother", "delother@test.com", "password")
        response = await client.delete(f"/teams/{team_id}", headers=headers2)
        assert response.status_code == 403
