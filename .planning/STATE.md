# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 2 - Canvas Foundation (COMPLETE)
**Plan:** 4 of 4 complete
**Status:** Phase Complete
**Last activity:** 2026-01-20 - Completed Phase 2 execution and verification

```
[##########] Plan 4/4 in Phase 2
[=========================>.....] Phase 2 of 8
```

**Requirements completed this phase:**
- CANV-01: User can view infinite canvas with pan and zoom navigation
- CANV-02: User can select objects and move/resize/delete them
- CANV-04: User can undo/redo their own actions (per-user in collaborative mode)
- PLAT-01: Web app works responsively on any screen size

**Success criteria achieved:**
1. User can pan canvas by clicking and dragging, and zoom with scroll wheel - DONE
2. User can select, move, resize, and delete objects on the canvas - DONE
3. User can undo/redo their own changes without affecting other users' history - DONE
4. Canvas UI adapts properly from mobile (320px) to desktop (1920px+) viewports - DONE
5. Canvas state syncs to other connected clients in real-time - DONE

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 2/8 |
| Requirements done | 7/27 |
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
| Vite 7.x for frontend | Latest stable, best DX with HMR | 2026-01-20 |
| React 19.2 | Latest stable with concurrent features | 2026-01-20 |
| TypeScript strict mode | Maximum type safety | 2026-01-20 |
| Full-viewport container pattern | position:fixed inset:0 required by tldraw | 2026-01-20 |
| YKeyValue over Y.Map | Prevents unbounded memory growth for tldraw records | 2026-01-20 |
| mergeRemoteChanges() for sync | Required to prevent echo loops in bidirectional sync | 2026-01-20 |
| source:'user' filter | Store listener only processes user-originated changes | 2026-01-20 |
| zoomSteps [0.1...4] | Defines 10%-400% zoom range as user requested | 2026-01-20 |
| Custom wheel handler for Ctrl-only zoom | tldraw wheelBehavior doesn't support Ctrl-only natively | 2026-01-20 |
| isSnapMode in onMount | Grid+object snapping enabled by default per CONTEXT.md | 2026-01-20 |
| clientId as transaction origin | Enables UndoManager per-user tracking via trackedOrigins | 2026-01-20 |
| observeDeep for transaction access | Callback receives transaction param needed to check origin | 2026-01-20 |
| captureTimeout 500ms | Groups rapid changes into single undo operation for better UX | 2026-01-20 |

### Research Flags

| Phase | Topic | Status |
|-------|-------|--------|
| 1 | pycrdt-websocket room lifecycle | Complete - custom RoomManager implemented |
| 2 | tldraw Yjs integration specifics | Complete - useYjsStore hook implemented |
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

**Last session:** 2026-01-20 - Completed Phase 2 (Canvas Foundation)
**Next action:** Begin Phase 3 (Drawing Tools)

**Context for next session:**
- Phase 1 Real-Time Infrastructure complete
- Phase 2 Canvas Foundation complete
- Frontend application structure:
  - frontend/ directory with Vite + React + TypeScript
  - Canvas component at frontend/src/components/Canvas/
  - useYjsStore hook for bidirectional Yjs-tldraw sync
  - useUndoManager hook for per-user undo/redo
  - cameraOptions.ts: 10%-400% zoom, Ctrl+scroll handler
  - uiOverrides.ts: createUiOverrides() with custom undo/redo
  - WebSocket provider at frontend/src/lib/yjs/provider.ts
- Key files:
  - Canvas.tsx: tldraw wrapper with connection status indicator
  - useYjsStore.ts: Bidirectional sync with YKeyValue
  - useUndoManager.ts: Per-user undo via Y.UndoManager
  - cameraOptions.ts: Zoom limits and Ctrl-only scroll
  - uiOverrides.ts: Keyboard shortcut customizations
  - provider.ts: WebSocket connection to backend
- Ready for Phase 3 (Drawing Tools) - tldraw already provides draw/shape/eraser tools

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-20 after Phase 2 completion*
