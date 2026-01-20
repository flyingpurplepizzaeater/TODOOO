# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 2 - Canvas Foundation (IN PROGRESS)
**Plan:** 1 of 6 complete
**Status:** In Progress
**Last activity:** 2026-01-20 - Completed 02-01-PLAN.md (React Frontend Setup)

```
[##--------] Plan 1/6 in Phase 2
[==================>...........] Phase 2 of 8
```

**Requirements completed this phase:**
- (Plan 02-01 establishes frontend foundation - no requirements directly completed yet)

**Success criteria progress:**
1. React frontend running at localhost:5173 - DONE
2. TypeScript strict mode enabled - DONE
3. Full-viewport container ready for tldraw - DONE
4. Environment config for backend connection - DONE

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 1/8 |
| Requirements done | 3/27 |
| Current phase progress | 17% (1/6 plans) |
| Plans completed this phase | 1/6 |

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
| Vite 7.x for frontend | Latest stable, best DX with HMR | 2026-01-20 |
| React 19.2 | Latest stable with concurrent features | 2026-01-20 |
| TypeScript strict mode | Maximum type safety | 2026-01-20 |
| Full-viewport container pattern | position:fixed inset:0 required by tldraw | 2026-01-20 |

### Research Flags

| Phase | Topic | Status |
|-------|-------|--------|
| 1 | pycrdt-websocket room lifecycle | Complete - custom RoomManager implemented |
| 2 | tldraw Yjs integration specifics | Pending - Plan 02-02 |
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

**Last session:** 2026-01-20 - Completed Plan 02-01 (React Frontend Setup)
**Next action:** Execute Plan 02-02 (tldraw Integration)
**Resume file:** None

**Context for next session:**
- Phase 1 Real-Time Infrastructure complete
- Phase 2 Plan 01 complete - React frontend foundation
- Frontend at frontend/ directory with:
  - React 19.2 + Vite 7.3.1 + TypeScript 5.9
  - Full-viewport container ready for tldraw (position:fixed inset:0)
  - Config at frontend/src/config.ts with apiUrl and wsUrl
  - Dev server at localhost:5173 (or next available port)
- Backend WebSocket endpoint at /ws/canvas/{board_id} with JWT auth
- Ready to install tldraw and integrate with Yjs

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-20*
