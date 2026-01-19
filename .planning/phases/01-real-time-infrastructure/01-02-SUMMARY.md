---
phase: 01-real-time-infrastructure
plan: 02
subsystem: canvas
tags: [crdt, persistence, pycrdt, sqlite]

dependency_graph:
  requires: [01-01]
  provides: [BoardPersistence, board_states_table, pycrdt_dependencies]
  affects: [01-03, 01-04]

tech_stack:
  added:
    - pycrdt>=0.10.0 (Python Yjs bindings, Rust-based)
    - pycrdt-websocket>=0.16.0 (WebSocket server for Yjs sync)
  patterns:
    - Compacted state storage (get_update, not update log)
    - Debounced persistence to reduce DB writes
    - Raw SQL for key-value BLOB storage

key_files:
  created:
    - canvas/__init__.py
    - canvas/persistence.py
    - alembic/versions/003_board_states.py
  modified:
    - requirements.txt

decisions:
  - id: get_update_vs_get_state
    choice: "Use Doc.get_update() for persistence, not get_state()"
    rationale: "get_state() returns state vector (metadata), get_update() returns full document state that can be applied to reconstruct"
  - id: raw_sql_for_blobs
    choice: "Raw SQL for board_states, not ORM model"
    rationale: "Simple key-value BLOB storage, no relationships/joins needed, more direct binary handling"

metrics:
  duration: 8 minutes
  completed: 2026-01-20
---

# Phase 01 Plan 02: CRDT Persistence Layer Summary

Custom CRDT persistence using pycrdt's get_update() for compacted binary storage, avoiding SQLiteYStore's unbounded growth problem.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add pycrdt dependencies | 7223ff9 | requirements.txt |
| 2 | Create BoardPersistence | 417bf61 | canvas/__init__.py, canvas/persistence.py |
| 3 | Create board_states migration | 208c0a2 | alembic/versions/003_board_states.py |

## What Was Built

### BoardPersistence Class

Async persistence layer with five methods:

- `load(board_id)` - Retrieve binary state from database
- `save(board_id, ydoc)` - Store compacted Y.Doc state
- `save_debounced(board_id, ydoc)` - Debounced save (5s default)
- `delete(board_id)` - Remove persisted state
- `flush_pending()` - Cancel pending saves (for shutdown)

### Storage Architecture

```
board_states table:
  board_id  VARCHAR(36) PK -> boards.id (CASCADE delete)
  state     BLOB            Y.Doc binary (get_update output)
  updated_at DATETIME       Last persistence time
```

Uses upsert (INSERT ON CONFLICT UPDATE) for atomic saves.

### Why get_update() Not get_state()

| Method | Returns | Size | Use Case |
|--------|---------|------|----------|
| get_state() | State vector (metadata) | ~7 bytes | Sync comparison |
| get_update() | Full document state | ~30+ bytes | Persistence/reconstruction |

Discovery: Initial implementation used get_state() which only stores metadata. Fixed to use get_update() which stores actual document content that can be applied via apply_update().

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed get_state() vs get_update() API usage**

- **Found during:** Task 2 verification
- **Issue:** Plan specified Doc.get_state() but this only returns state vector (metadata), not document content
- **Fix:** Changed to Doc.get_update() which returns binary that can reconstruct document via apply_update()
- **Files modified:** canvas/persistence.py
- **Commit:** 41f5059

## Verification Results

```
1. pycrdt.Doc imports successfully
2. BoardPersistence imports successfully
3. BoardPersistence has async methods: load, save, save_debounced, delete, flush_pending
4. Doc.get_update() returns bytes
5. BoardPersistence.save() stores binary to database
6. BoardPersistence.load() retrieves binary (37 bytes for test doc)
7. Loaded state reconstructs correctly via apply_update()
8. BoardPersistence.delete() removes state
```

## Integration Points

### Uses (from Plan 01)

- `database.async_session` for async DB access
- `boards` table (foreign key reference)

### Provides (for Plan 03)

- `BoardPersistence` class for WebSocket room persistence hooks
- `board_states` table for CRDT binary storage

## Notes for Future Plans

1. **Room lifecycle integration:** Plan 03 will use BoardPersistence.save_debounced() on document changes
2. **Shutdown handling:** Call flush_pending() during graceful shutdown to cancel pending writes
3. **State reconstruction:** To restore a board, create Doc, register types, then apply_update(loaded_state)

## Technical Details

### Migration Chain

```
001 (users) -> 002 (boards, permissions, audit_logs) -> 003 (board_states)
```

### Dependency Versions

- pycrdt: >=0.10.0 (Rust-based Yjs bindings, replaces archived ypy)
- pycrdt-websocket: >=0.16.0 (WebSocket sync server)
- aiosqlite: 0.19.0 (already present)

---

*Completed: 2026-01-20*
