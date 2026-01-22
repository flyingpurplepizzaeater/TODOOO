import { config } from '../config'

/**
 * Backend TODO item response from API.
 */
export interface BackendTodoItem {
  id: number
  title: string
  description: string | null
  completed: boolean
  assigned_to: number | null
  assignee_username: string | null
  due_date: string | null  // ISO date string
  list_id: number
  created_at: string
}

/**
 * Request body for creating a new TODO item.
 */
export interface CreateTodoRequest {
  title: string
  description?: string
  assigned_to?: number
  due_date?: string
}

/**
 * Request body for updating an existing TODO item.
 */
export interface UpdateTodoRequest {
  title?: string
  description?: string
  completed?: boolean
  assigned_to?: number
  due_date?: string
}

/**
 * Error thrown when API request fails.
 */
export class TodoApiError extends Error {
  status: number
  details?: unknown

  constructor(
    message: string,
    status: number,
    details?: unknown
  ) {
    super(message)
    this.name = 'TodoApiError'
    this.status = status
    this.details = details
  }
}

/**
 * Helper to make authenticated API requests.
 */
async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.detail || errorBody.message || errorMessage
    } catch {
      // Response body not JSON
    }
    throw new TodoApiError(errorMessage, response.status)
  }

  // Handle 204 No Content (e.g., DELETE)
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

/**
 * Create a new TODO item in a list.
 *
 * @param listId - ID of the list to add the TODO to
 * @param data - TODO item data
 * @param token - JWT authentication token
 * @returns Created TODO item
 */
export async function createTodo(
  listId: number,
  data: CreateTodoRequest,
  token: string
): Promise<BackendTodoItem> {
  return apiRequest<BackendTodoItem>(
    `/lists/${listId}/todos`,
    token,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

/**
 * Update an existing TODO item.
 *
 * @param todoId - ID of the TODO to update
 * @param data - Fields to update
 * @param token - JWT authentication token
 * @returns Updated TODO item
 */
export async function updateTodo(
  todoId: number,
  data: UpdateTodoRequest,
  token: string
): Promise<BackendTodoItem> {
  return apiRequest<BackendTodoItem>(
    `/todos/${todoId}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

/**
 * Delete a TODO item.
 *
 * @param todoId - ID of the TODO to delete
 * @param token - JWT authentication token
 */
export async function deleteTodo(
  todoId: number,
  token: string
): Promise<void> {
  await apiRequest<void>(
    `/todos/${todoId}`,
    token,
    { method: 'DELETE' }
  )
}

/**
 * Toggle a TODO item's completed status.
 *
 * @param todoId - ID of the TODO to toggle
 * @param token - JWT authentication token
 * @returns Updated TODO item
 */
export async function toggleTodo(
  todoId: number,
  token: string
): Promise<BackendTodoItem> {
  return apiRequest<BackendTodoItem>(
    `/todos/${todoId}/toggle`,
    token,
    { method: 'PATCH' }
  )
}

/**
 * Fetch all TODO items in a list.
 *
 * @param listId - ID of the list to fetch TODOs from
 * @param token - JWT authentication token
 * @returns Array of TODO items
 */
export async function fetchListTodos(
  listId: number,
  token: string
): Promise<BackendTodoItem[]> {
  return apiRequest<BackendTodoItem[]>(
    `/lists/${listId}/todos`,
    token,
    { method: 'GET' }
  )
}

/**
 * Fetch a single TODO item by ID.
 *
 * Note: Backend doesn't have a direct GET /todos/{id} endpoint,
 * so this fetches from the list and filters. For better performance,
 * consider adding the endpoint to the backend.
 *
 * @param todoId - ID of the TODO to fetch
 * @param listId - ID of the list containing the TODO
 * @param token - JWT authentication token
 * @returns TODO item or null if not found
 */
export async function fetchTodo(
  todoId: number,
  listId: number,
  token: string
): Promise<BackendTodoItem | null> {
  const todos = await fetchListTodos(listId, token)
  return todos.find(t => t.id === todoId) || null
}
