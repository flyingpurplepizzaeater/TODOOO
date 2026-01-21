import { useEffect, useRef, useCallback } from 'react'
import { Editor, TLShapeId } from 'tldraw'
import { TodoShape } from './shapes/todo/types'
import {
  createTodo,
  updateTodo,
  deleteTodo,
  BackendTodoItem,
} from '../../services/todoApi'

/**
 * WebSocket event types for TODO synchronization.
 */
export interface TodoWebSocketEvent {
  type: 'todo_created' | 'todo_updated' | 'todo_deleted'
  data: {
    id: number
    title: string
    completed: boolean
    due_date: string | null
    assigned_to: number | null
    assignee_username: string | null
    list_id: number
  }
}

/**
 * Debounce helper for update calls.
 * Groups rapid changes to prevent excessive API calls.
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): { (...args: Parameters<T>): void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}

/**
 * Hook for bidirectional sync between canvas TODO shapes and backend API.
 *
 * Features:
 * - Canvas -> Backend: Creates/updates/deletes TODOs in backend when shapes change
 * - Backend -> Canvas: Updates shapes when receiving WebSocket events
 * - Echo loop prevention: Uses source:'user' filter and mergeRemoteChanges()
 *
 * CRITICAL: This hook MUST use { source: 'user' } on store.listen to prevent
 * echo loops per RESEARCH.md pitfall #1.
 *
 * @param editor - tldraw editor instance (null if not yet mounted)
 * @param token - JWT token for API authentication
 * @param defaultListId - Backend list ID for creating new TODOs (null to disable sync)
 */
export function useTodoSync(
  editor: Editor | null,
  token: string,
  defaultListId: number | null
): void {
  // Track pending backend operations to handle async timing
  const pendingCreates = useRef<Map<TLShapeId, boolean>>(new Map())

  /**
   * Handle creating a new TODO in backend.
   * Updates shape with backendId after successful creation.
   */
  const handleCreate = useCallback(
    async (todo: TodoShape, listId: number) => {
      // Prevent duplicate creates
      if (pendingCreates.current.has(todo.id)) {
        return
      }
      pendingCreates.current.set(todo.id, true)

      try {
        const backendTodo = await createTodo(
          listId,
          {
            title: todo.props.title,
            description: undefined, // Shape doesn't have description field
            assigned_to: todo.props.assigneeId ?? undefined,
            due_date: todo.props.dueDate ?? undefined,
          },
          token
        )

        // Update shape with backendId and listId
        // Check if shape still exists (could have been deleted while waiting)
        if (editor && editor.getShape(todo.id)) {
          editor.updateShape<TodoShape>({
            id: todo.id,
            type: 'todo',
            props: {
              backendId: backendTodo.id,
              listId: backendTodo.list_id,
              // Also sync any fields backend may have modified
              assigneeName: backendTodo.assignee_username,
            },
          })
        }
      } catch (error) {
        console.error('Failed to create TODO in backend:', error)
        // Don't crash - user can retry or shape remains local-only
      } finally {
        pendingCreates.current.delete(todo.id)
      }
    },
    [editor, token]
  )

  /**
   * Handle updating a TODO in backend.
   * Debounced to prevent excessive calls during rapid edits.
   */
  const debouncedUpdate = useRef(
    debounce(
      async (backendId: number, data: TodoShape['props'], authToken: string) => {
        try {
          await updateTodo(
            backendId,
            {
              title: data.title,
              completed: data.completed,
              assigned_to: data.assigneeId ?? undefined,
              due_date: data.dueDate ?? undefined,
            },
            authToken
          )
        } catch (error) {
          console.error('Failed to update TODO in backend:', error)
        }
      },
      500
    )
  )

  const handleUpdate = useCallback(
    (todo: TodoShape) => {
      if (!todo.props.backendId) return
      debouncedUpdate.current(todo.props.backendId, todo.props, token)
    },
    [token]
  )

  /**
   * Handle deleting a TODO from backend.
   */
  const handleDelete = useCallback(
    async (backendId: number) => {
      try {
        await deleteTodo(backendId, token)
      } catch (error) {
        console.error('Failed to delete TODO from backend:', error)
        // Shape is already gone from canvas, backend may have been deleted already
      }
    },
    [token]
  )

  /**
   * Canvas -> Backend sync via store.listen.
   *
   * CRITICAL: Uses { source: 'user' } to only process user-originated changes.
   * This prevents echo loops when remote changes are applied.
   */
  useEffect(() => {
    if (!editor || !defaultListId) return

    const unsub = editor.store.listen(
      ({ changes }) => {
        // Handle added TODO shapes
        Object.values(changes.added).forEach((record) => {
          if (record.typeName === 'shape' && (record as TodoShape).type === 'todo') {
            const todo = record as TodoShape
            // Only create in backend if no backendId (new TODO)
            if (!todo.props.backendId) {
              handleCreate(todo, defaultListId)
            }
          }
        })

        // Handle updated TODO shapes
        Object.values(changes.updated).forEach(([, to]) => {
          if (to.typeName === 'shape' && (to as TodoShape).type === 'todo') {
            const todo = to as TodoShape
            // Only update in backend if has backendId (linked to backend)
            if (todo.props.backendId) {
              handleUpdate(todo)
            }
          }
        })

        // Handle removed TODO shapes
        Object.values(changes.removed).forEach((record) => {
          if (record.typeName === 'shape' && (record as TodoShape).type === 'todo') {
            const todo = record as TodoShape
            // Only delete from backend if has backendId (was linked)
            if (todo.props.backendId) {
              handleDelete(todo.props.backendId)
            }
          }
        })
      },
      { source: 'user', scope: 'document' } // CRITICAL: source:'user' prevents echo loop
    )

    return () => {
      unsub()
      debouncedUpdate.current.cancel()
    }
  }, [editor, defaultListId, handleCreate, handleUpdate, handleDelete])

  /**
   * Backend -> Canvas sync via CustomEvent.
   *
   * Listens for 'todo-sync' events dispatched when WebSocket receives TODO updates.
   * All updates are wrapped in mergeRemoteChanges() to mark as remote and prevent
   * triggering the store.listen callback.
   */
  useEffect(() => {
    if (!editor) return

    const handleTodoEvent = (event: CustomEvent<TodoWebSocketEvent>) => {
      const { type, data } = event.detail

      editor.store.mergeRemoteChanges(() => {
        switch (type) {
          case 'todo_updated': {
            // Find shape with matching backendId and update
            const shapes = editor.getCurrentPageShapes()
            const todoShape = shapes.find(
              (s) => s.type === 'todo' && (s as TodoShape).props.backendId === data.id
            ) as TodoShape | undefined

            if (todoShape) {
              editor.updateShape<TodoShape>({
                id: todoShape.id,
                type: 'todo',
                props: {
                  title: data.title,
                  completed: data.completed,
                  dueDate: data.due_date,
                  assigneeId: data.assigned_to,
                  assigneeName: data.assignee_username,
                },
              })
            }
            break
          }

          case 'todo_deleted': {
            // Find and remove shape with matching backendId
            const shapes = editor.getCurrentPageShapes()
            const todoShape = shapes.find(
              (s) => s.type === 'todo' && (s as TodoShape).props.backendId === data.id
            ) as TodoShape | undefined

            if (todoShape) {
              editor.deleteShape(todoShape.id)
            }
            break
          }

          case 'todo_created': {
            // Don't auto-create shapes for backend-created TODOs
            // User may not want them on this specific canvas
            break
          }
        }
      }) // mergeRemoteChanges marks updates as remote
    }

    // Cast to EventListener since CustomEvent extends Event
    window.addEventListener('todo-sync', handleTodoEvent as EventListener)
    return () => {
      window.removeEventListener('todo-sync', handleTodoEvent as EventListener)
    }
  }, [editor])
}
