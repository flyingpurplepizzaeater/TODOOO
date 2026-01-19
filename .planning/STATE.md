# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 1 - Real-Time Infrastructure (COMPLETE)
**Plan:** 4 of 4 complete
**Status:** Phase Complete
**Last activity:** 2026-01-20 - Completed 01-04-PLAN.md (Board CRUD and Sharing APIs)

```
[##########] Plan 4/4 in Phase 1
[===============>..............] Phase 1 of 8
```

**Requirements completed this phase:**
- SYNC-03: Changes sync within 200ms (WebSocket + CRDT)
- SYNC-04: Shareable board links (Board sharing APIs)
- SYNC-05: Auto-reconnection (Full state sync on connect)

**Success criteria achieved:**
1. Two browser windows sync state changes within 200ms - CRDT protocol ready
2. Disconnect/reconnect restores sync without data loss - full state on connect
3. Board accessible via shareable URL with permissions - REST APIs complete
4. CRDT state persists and survives server restart - BoardPersistence implemented

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 1/8 |
| Requirements done | 3/27 |
| Current phase progress | 100% |
| Plans completed this phase | 4/4 |

## Accumulated Context

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| tldraw for canvas | Best-in-class, production-proven (ClickUp, Padlet) | 2026-01-19 |
| pycrdt over ypy | ypy archived April 2025, pycrdt actively maintained | 2026-01-19 |
| Capacitor for mobile | Web-first, preserves codebase, sufficient performance | 2026-01-19 |
| Yjs for CRDT | 900K+ weekly downloads, dominant in ecosystem | 2026-01-19 |
| UUID as String(36) | SQLite compatibility (no native UUID type) | 2026-01-20 |
| UniqueConstraint in create_table | SQLite doesn't support ALTER ADD CONSTRAINT | 2026-01-20 |
| get_update() for CRDT persistence | get_state() returns metadata only, get_update() returns full document | 2026-01-20 |
| Raw SQL for board_states | Simple key-value BLOB storage, no ORM needed | 2026-01-20 |
| 30 min room inactivity timeout | Balances memory usage with room reload cost | 2026-01-20 |
| Permission-aware WebSocket updates | View/comment receive but can't send; edit required for mutations | 2026-01-20 |
| Owner-only sharing | Only board owner can share/revoke permissions | 2026-01-20 |
| Audit all board operations | Log all CRUD and permission changes for compliance | 2026-01-20 |
| Public permission as null user_id | Reuses BoardPermission table for public access | 2026-01-20 |

### Research Flags

| Phase | Topic | Status |
|-------|-------|--------|
| 1 | pycrdt-websocket room lifecycle | Complete - custom RoomManager implemented |
| 2 | tldraw Yjs integration specifics | Pending |
| 8 | iOS canvas memory limits | Pending |

### TODOs

- [ ] Determine tldraw licensing approach ($6K/year, watermark, or Konva.js fallback)
- [ ] Design CRDT room persistence schema for PostgreSQL

### Blockers

None currently.

### Warnings

- **tldraw licensing:** Requires $6K/year startup license OR displays watermark OR use Konva.js instead
- **Do NOT use ypy:** Archived April 2025, use pycrdt instead

## Session Continuity

**Last session:** 2026-01-20 - Completed Plan 01-04 (Board CRUD and Sharing APIs)
**Next action:** Begin Phase 02 (Canvas Frontend with tldraw)

**Context for next session:**
- Phase 1 Real-Time Infrastructure complete
- Board, BoardPermission, AuditLog models in models.py
- Board schemas (BoardCreate, BoardResponse, etc.) in schemas.py
- All database tables exist via Alembic migrations 001-003
- Board CRUD endpoints: POST/GET/DELETE /boards, GET /boards/{id}
- Sharing endpoints: /boards/{id}/share, /boards/{id}/link, /boards/{id}/permissions
- WebSocket endpoint at /ws/canvas/{board_id} with JWT auth
- BoardPersistence for CRDT state in canvas/persistence.py
- RoomManager for lazy room loading in canvas/room_manager.py
- 17 integration tests in tests/test_boards.py
- Ready to build React frontend with tldraw canvas

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-20*
