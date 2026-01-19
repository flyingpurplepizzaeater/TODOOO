# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 1 - Real-Time Infrastructure
**Plan:** 3 of 4 complete
**Status:** In Progress
**Last activity:** 2026-01-20 - Completed 01-03-PLAN.md (WebSocket Server)

```
[########..] Plan 3/4 in Phase 1
[============>.................] Phase 1 of 8
```

**Requirements in scope:**
- SYNC-03: Changes sync within 200ms
- SYNC-04: Shareable board links
- SYNC-05: Auto-reconnection

**Success criteria to achieve:**
1. Two browser windows sync state changes within 200ms
2. Disconnect/reconnect restores sync without data loss
3. Board accessible via shareable URL with permissions
4. CRDT state persists and survives server restart

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 0/8 |
| Requirements done | 0/27 |
| Current phase progress | 75% |
| Plans completed this phase | 3/4 |

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

**Last session:** 2026-01-20 - Completed Plan 01-03 (WebSocket Server)
**Next action:** Execute Plan 01-04 (Board CRUD and Sharing APIs)

**Context for next session:**
- Board, BoardPermission, AuditLog models exist in models.py
- Pydantic schemas for board operations exist in schemas.py
- Alembic migrations 001-003 applied - all tables exist
- BoardPersistence class available in canvas/persistence.py
- RoomManager class in canvas/room_manager.py with lazy loading and inactivity cleanup
- WebSocket handler in canvas/websocket_handler.py with JWT auth and permission checks
- Canvas WebSocket endpoint at /ws/canvas/{board_id} in main.py
- SYNC-05 auto-reconnection supported via full state sync on connection
- Ready to implement Board CRUD APIs and sharing functionality

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-20*
