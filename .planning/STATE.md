# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 1 - Real-Time Infrastructure
**Plan:** 2 of 4 complete
**Status:** In Progress
**Last activity:** 2026-01-20 - Completed 01-02-PLAN.md (CRDT Persistence)

```
[######....] Plan 2/4 in Phase 1
[=========>....................] Phase 1 of 8
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
| Current phase progress | 50% |
| Plans completed this phase | 2/4 |

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

### Research Flags

| Phase | Topic | Status |
|-------|-------|--------|
| 1 | pycrdt-websocket room lifecycle | Pending |
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

**Last session:** 2026-01-20 - Completed Plan 01-02 (CRDT Persistence)
**Next action:** Execute Plan 01-03 (WebSocket Server)

**Context for next session:**
- Board, BoardPermission, AuditLog models exist in models.py
- Pydantic schemas for board operations exist in schemas.py
- Alembic migrations 001-003 applied - all tables exist
- BoardPersistence class available in canvas/persistence.py
- pycrdt and pycrdt-websocket dependencies installed
- Ready to implement WebSocket server with room lifecycle

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-20*
