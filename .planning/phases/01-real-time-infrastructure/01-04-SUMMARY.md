---
phase: 01
plan: 04
subsystem: api
tags: [fastapi, rest, crud, permissions, boards, sharing]

dependency-graph:
  requires: ["01-01", "01-03"]
  provides:
    - "Board CRUD REST endpoints"
    - "Permission sharing endpoints"
    - "Shareable board links"
    - "Board integration tests"
  affects: ["02-01", "03-01"]

tech-stack:
  added: []
  patterns:
    - "APIRouter with prefix and tags"
    - "Depends for auth and database injection"
    - "Owner-only permission validation pattern"
    - "Audit logging for all board operations"

key-files:
  created:
    - routers/boards.py
    - tests/test_boards.py
  modified:
    - routers/__init__.py
    - main.py

decisions:
  - key: "owner-only-share"
    choice: "Only board owner can share/revoke"
    rationale: "Prevents permission escalation, simplifies authorization"
  - key: "audit-all-operations"
    choice: "Log all board CRUD and permission changes"
    rationale: "Enables compliance and debugging; SYNC-04 security"
  - key: "public-permission-as-null-user"
    choice: "user_id=NULL represents public access permission"
    rationale: "Reuses BoardPermission table, consistent with model design"

metrics:
  tasks: 4
  commits: 4
  tests-added: 17
  duration: "~4 minutes"
  completed: "2026-01-20"
---

# Phase 01 Plan 04: Board CRUD and Sharing APIs Summary

REST endpoints for board management with permission-based sharing (SYNC-04).

## What Was Built

### Board CRUD Endpoints (routers/boards.py)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/boards` | POST | Create board with UUID |
| `/boards` | GET | List owned and shared boards |
| `/boards/{id}` | GET | Get board (requires access) |
| `/boards/{id}` | DELETE | Delete board (owner only) |

### Permission Sharing Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/boards/{id}/share` | POST | Grant permission (owner only) |
| `/boards/{id}/share/{user_id}` | DELETE | Revoke user permission |
| `/boards/{id}/share/public` | DELETE | Revoke public access |
| `/boards/{id}/link` | GET | Get shareable URL |
| `/boards/{id}/permissions` | GET | List all permissions (owner only) |

### Access Control

- **Owner:** Full control (CRUD, share, revoke)
- **Edit permission:** Read + write via WebSocket
- **View permission:** Read-only access
- **Public access:** Controlled via null user_id permission

### Integration Tests (tests/test_boards.py)

- 17 tests covering:
  - Board CRUD operations
  - Permission sharing with users
  - Public access grant/revoke
  - Owner-only authorization
  - Unauthenticated rejection

## Key Implementation Details

### Board Creation
```python
board = Board(
    id=str(uuid.uuid4()),  # UUID as string for SQLite
    owner_id=user.id,
    title=board_data.title,
    is_public=board_data.is_public
)
```

### Permission Validation
```python
if board.owner_id != user.id:
    raise HTTPException(status_code=403, detail="Only owner can share board")
```

### Audit Logging
All operations create AuditLog entries with:
- user_id, board_id, action
- permission_level (for permission changes)
- ip_address, user_agent (for share operations)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| c5a56bd | feat | Create boards router with CRUD endpoints |
| d98ea33 | feat | Add sharing and permission endpoints |
| 409420d | chore | Register boards router in main.py |
| 1bb7f19 | test | Add integration tests for board endpoints |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `from routers.boards import router` succeeds
- `from main import app` includes boards router
- 17 tests collected, sample tests pass
- All 9 endpoints accessible

## SYNC-04 Compliance

| Requirement | Status |
|-------------|--------|
| Shareable board links | GET /boards/{id}/link returns URL |
| Team-based access | POST /boards/{id}/share grants permission |
| Public access | share with user_id=null sets is_public |
| Permission levels | view/comment/edit via PermissionLevel enum |

## Next Steps

- Phase 02: Canvas frontend with tldraw integration
- Phase 03: TODO integration and positioning on canvas
