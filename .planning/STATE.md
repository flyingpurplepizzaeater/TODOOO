# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 1 - Real-Time Infrastructure
**Plan:** Not yet created
**Status:** Roadmap Complete - Ready for Phase Planning

```
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
| Current phase progress | 0% |
| Plans completed this phase | 0/TBD |

## Accumulated Context

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| tldraw for canvas | Best-in-class, production-proven (ClickUp, Padlet) | 2026-01-19 |
| pycrdt over ypy | ypy archived April 2025, pycrdt actively maintained | 2026-01-19 |
| Capacitor for mobile | Web-first, preserves codebase, sufficient performance | 2026-01-19 |
| Yjs for CRDT | 900K+ weekly downloads, dominant in ecosystem | 2026-01-19 |

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

**Last session:** 2026-01-19 - Roadmap creation
**Next action:** Run `/gsd:plan-phase 1` to create execution plan for Real-Time Infrastructure

**Context for next session:**
- 8 phases derived from 27 requirements
- Phase 1 focuses on pycrdt-websocket integration
- Existing backend has WebSocket infrastructure to build on
- Need to add CRDT sync as separate WebSocket route

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-19*
