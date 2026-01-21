---
phase: 05-todo-integration
plan: 02
subsystem: sync
tags: [api, websocket, bidirectional-sync, tldraw]

# Dependency graph
requires:
  - phase: 05-todo-integration
    plan: 01
    provides: TodoShape with backendId/listId props
provides:
  - todoApi service for backend CRUD operations
  - useTodoSync hook for bidirectional sync
  - WebSocket event broadcasting for TODO changes
  - Canvas integration with sync hook
affects: [05-04 task status visualization]

# Tech tracking
tech-stack:
  added: []
  patterns: [store.listen with source filter, mergeRemoteChanges for remote updates, debounced API calls]

key-files:
  created:
    - frontend/src/services/todoApi.ts
    - frontend/src/components/Canvas/useTodoSync.ts
  modified:
    - websocket.py
    - frontend/src/components/Canvas/Canvas.tsx

key-decisions:
  - "source:'user' filter on store.listen prevents echo loops"
  - "mergeRemoteChanges() wrapper marks backend updates as remote"
  - "500ms debounce on update calls prevents excessive API traffic"
  - "pendingCreates map prevents duplicate backend create calls"
  - "CustomEvent 'todo-sync' for WebSocket event dispatch to React"
  - "defaultListId prop optional - sync disabled if not provided"

patterns-established:
  - "Canvas-to-backend sync: store.listen -> API call -> update shape with backendId"
  - "Backend-to-canvas sync: WebSocket -> CustomEvent -> mergeRemoteChanges"
  - "Echo loop prevention: source filter + mergeRemoteChanges combination"

# Metrics
duration: 5min
completed: 2026-01-21
---

# Phase 5 Plan 2: Backend Sync Summary

**Bidirectional TODO sync between tldraw canvas shapes and backend API with echo loop prevention**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-21T04:14:38Z
- **Completed:** 2026-01-21T04:19:15Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- todoApi service with typed interfaces (BackendTodoItem, CreateTodoRequest, UpdateTodoRequest)
- CRUD functions: createTodo, updateTodo, deleteTodo, toggleTodo, fetchListTodos
- useTodoSync hook with bidirectional sync via store.listen and mergeRemoteChanges
- WebSocket broadcast_todo_event function for real-time updates
- Canvas component integration with editor state management

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TODO API service** - `be299ba` (feat)
2. **Task 2: Create useTodoSync hook for canvas-to-backend sync** - `07a3070` (feat)
3. **Task 3: Add backend-to-canvas sync via WebSocket events** - `c6d0538` (feat)
4. **Task 4: Integrate useTodoSync in Canvas component** - `2d08f33` (feat)

## Files Created/Modified

**Created:**
- `frontend/src/services/todoApi.ts` - API client with typed interfaces and error handling
- `frontend/src/components/Canvas/useTodoSync.ts` - Bidirectional sync hook

**Modified:**
- `websocket.py` - Added broadcast_todo_event to ConnectionManager
- `frontend/src/components/Canvas/Canvas.tsx` - Added useTodoSync integration and defaultListId prop

## Decisions Made

- **source:'user' filter:** Critical for preventing echo loops - only processes user-originated changes
- **mergeRemoteChanges wrapper:** Marks backend updates as remote so store.listen ignores them
- **500ms debounce:** Prevents excessive API calls during rapid edits (typing, etc.)
- **pendingCreates tracking:** Map prevents duplicate create calls for same shape
- **CustomEvent pattern:** 'todo-sync' event bridges WebSocket to React component tree
- **Optional defaultListId:** Sync gracefully disabled if no list ID provided

## Sync Architecture

```
Canvas -> Backend:
  store.listen({ source: 'user' })
    -> detect TODO shape changes (add/update/remove)
    -> call todoApi functions
    -> update shape with backendId on create

Backend -> Canvas:
  WebSocket receives TODO event
    -> dispatch CustomEvent 'todo-sync'
    -> useTodoSync handler
    -> editor.store.mergeRemoteChanges()
    -> find/update/delete shape by backendId

Echo Loop Prevention:
  - Canvas changes: source:'user' ignores remote updates
  - Backend changes: mergeRemoteChanges() marks as non-user source
  - No API calls inside mergeRemoteChanges block
```

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TODO shapes sync to backend on create/update/delete
- Backend changes push to canvas via WebSocket events
- Ready for Phase 5 Plan 4: Task Status Visualization
- defaultListId must be provided by parent component for sync to activate

---
*Phase: 05-todo-integration*
*Completed: 2026-01-21*
