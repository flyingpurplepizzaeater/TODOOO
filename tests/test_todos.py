import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta

@pytest.fixture
async def list_with_user(client: AsyncClient, auth_headers):
    """Create a team, list, and return (headers, list_id, user_id)."""
    headers = await auth_headers("todouser", "todouser@test.com", "password")

    # Get user id from /auth/me
    me_response = await client.get("/auth/me", headers=headers)
    user_id = me_response.json()["id"]

    # Create team and list
    team_response = await client.post("/teams", json={"name": "Todo Team"}, headers=headers)
    team_id = team_response.json()["id"]
    list_response = await client.post(f"/teams/{team_id}/lists", json={"name": "Todo List"}, headers=headers)
    list_id = list_response.json()["id"]

    return headers, list_id, user_id


class TestCreateTodo:
    async def test_create_todo(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        response = await client.post(f"/lists/{list_id}/todos", json={"title": "My Todo"}, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "My Todo"
        assert data["completed"] == False
        assert data["list_id"] == list_id

    async def test_create_todo_with_assignment(self, client: AsyncClient, list_with_user):
        headers, list_id, user_id = list_with_user
        response = await client.post(f"/lists/{list_id}/todos", json={
            "title": "Assigned Todo",
            "assigned_to": user_id
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["assigned_to"] == user_id
        assert data["assignee_username"] == "todouser"

    async def test_create_todo_with_due_date(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        due_date = (datetime.now() + timedelta(days=7)).isoformat()
        response = await client.post(f"/lists/{list_id}/todos", json={
            "title": "Due Todo",
            "due_date": due_date
        }, headers=headers)
        assert response.status_code == 200
        assert response.json()["due_date"] is not None


class TestGetTodos:
    async def test_get_todos(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        await client.post(f"/lists/{list_id}/todos", json={"title": "Todo 1"}, headers=headers)
        await client.post(f"/lists/{list_id}/todos", json={"title": "Todo 2"}, headers=headers)

        response = await client.get(f"/lists/{list_id}/todos", headers=headers)
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 2

    async def test_get_todos_empty(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        response = await client.get(f"/lists/{list_id}/todos", headers=headers)
        assert response.status_code == 200
        assert response.json() == []


class TestUpdateTodo:
    async def test_update_todo_title(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        create_response = await client.post(f"/lists/{list_id}/todos", json={"title": "Old Title"}, headers=headers)
        todo_id = create_response.json()["id"]

        response = await client.put(f"/todos/{todo_id}", json={"title": "New Title"}, headers=headers)
        assert response.status_code == 200
        assert response.json()["title"] == "New Title"

    async def test_update_todo_partial(self, client: AsyncClient, list_with_user):
        headers, list_id, user_id = list_with_user
        create_response = await client.post(f"/lists/{list_id}/todos", json={"title": "Partial"}, headers=headers)
        todo_id = create_response.json()["id"]

        # Update multiple fields
        response = await client.put(f"/todos/{todo_id}", json={
            "completed": True,
            "assigned_to": user_id
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] == True
        assert data["assigned_to"] == user_id
        assert data["title"] == "Partial"  # Unchanged


class TestToggleTodo:
    async def test_toggle_todo(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        create_response = await client.post(f"/lists/{list_id}/todos", json={"title": "Toggle Me"}, headers=headers)
        todo_id = create_response.json()["id"]
        assert create_response.json()["completed"] == False

        response = await client.patch(f"/todos/{todo_id}/toggle", headers=headers)
        assert response.status_code == 200
        assert response.json()["completed"] == True

    async def test_toggle_todo_twice(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        create_response = await client.post(f"/lists/{list_id}/todos", json={"title": "Toggle Twice"}, headers=headers)
        todo_id = create_response.json()["id"]

        # Toggle to True
        await client.patch(f"/todos/{todo_id}/toggle", headers=headers)
        # Toggle back to False
        response = await client.patch(f"/todos/{todo_id}/toggle", headers=headers)
        assert response.json()["completed"] == False


class TestDeleteTodo:
    async def test_delete_todo(self, client: AsyncClient, list_with_user):
        headers, list_id, _ = list_with_user
        create_response = await client.post(f"/lists/{list_id}/todos", json={"title": "Delete Me"}, headers=headers)
        todo_id = create_response.json()["id"]

        response = await client.delete(f"/todos/{todo_id}", headers=headers)
        assert response.status_code == 204

    async def test_todo_not_found(self, client: AsyncClient, list_with_user):
        headers, _, _ = list_with_user
        response = await client.get("/todos/99999", headers=headers)
        # Note: there's no GET /todos/{id} endpoint, so test delete
        response = await client.delete("/todos/99999", headers=headers)
        assert response.status_code == 404

    async def test_todo_unauthorized(self, client: AsyncClient, list_with_user, auth_headers):
        headers, list_id, _ = list_with_user
        create_response = await client.post(f"/lists/{list_id}/todos", json={"title": "Private"}, headers=headers)
        todo_id = create_response.json()["id"]

        other_headers = await auth_headers("othertodouser", "othertodo@test.com", "password")
        response = await client.delete(f"/todos/{todo_id}", headers=other_headers)
        assert response.status_code == 403
