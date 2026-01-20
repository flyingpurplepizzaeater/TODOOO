# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 2 - Canvas Foundation (IN PROGRESS)
**Plan:** 4 of 6 complete
**Status:** In Progress
**Last activity:** 2026-01-20 - Completed 02-04-PLAN.md (Undo History)

```
[######----] Plan 4/6 in Phase 2
[===================>..........] Phase 2 of 8
```

**Requirements completed this phase:**
- (Plan 02-01 establishes frontend foundation - no requirements directly completed yet)
- CANV-01: tldraw canvas renders in browser (Plan 02-02)
- Pan/zoom: Ctrl+scroll zoom 10%-400%, bracket keys, number keys (Plan 02-03)
- CANV-04: Per-user undo/redo via Yjs UndoManager (Plan 02-04)

**Success criteria progress:**
1. React frontend running at localhost:5173 - DONE
2. TypeScript strict mode enabled - DONE
3. Full-viewport container ready for tldraw - DONE
4. Environment config for backend connection - DONE
5. tldraw canvas renders in browser - DONE
6. Yjs sync hook connects to backend WebSocket - DONE
7. Connection status indicator shows state - DONE
8. Camera options configured (10%-400% zoom) - DONE
9. Keyboard shortcuts extended (bracket/number keys) - DONE
10. Snap mode enabled by default - DONE
11. Per-user undo/redo with Yjs UndoManager - DONE

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 1/8 |
| Requirements done | 6/27 |
| Current phase progress | 67% (4/6 plans) |
| Plans completed this phase | 4/6 |

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

**Last session:** 2026-01-20 - Completed Plan 02-04 (Undo History)
**Next action:** Execute Plan 02-05 (Selection & Sharing)
**Resume file:** None

**Context for next session:**
- Phase 1 Real-Time Infrastructure complete
- Phase 2 Plans 01-04 complete:
  - Plan 02-01: React frontend foundation (Vite + TypeScript)
  - Plan 02-02: tldraw canvas with Yjs sync
  - Plan 02-03: Camera options, keyboard shortcuts, snap mode
  - Plan 02-04: Per-user undo/redo with Yjs UndoManager
- Frontend components:
  - Canvas component at frontend/src/components/Canvas/
  - useYjsStore hook for bidirectional Yjs-tldraw sync (exports doc, yArr)
  - useUndoManager hook for per-user undo/redo via clientId origin
  - cameraOptions.ts: 10%-400% zoom, Ctrl+scroll handler
  - uiOverrides.ts: createUiOverrides() with custom undo/redo
  - WebSocket provider at frontend/src/lib/yjs/provider.ts
- Per-user undo architecture:
  - clientId as transaction origin for all local changes
  - trackedOrigins in UndoManager scoped to client's own clientId
  - Ctrl+Z/Ctrl+Shift+Z override tldraw's global undo/redo
- Ready for selection visualization and presence indicators

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-20*
