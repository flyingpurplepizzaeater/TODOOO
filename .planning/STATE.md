# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 3 - Drawing Tools (COMPLETE)
**Plan:** 3 of 3 complete
**Status:** Phase Complete
**Last activity:** 2026-01-21 - Completed Phase 3 execution and verification

```
[##########] Plan 3/3 in Phase 3
[====================================>.] Phase 3 of 8
```

**Requirements completed this phase:**
- CANV-03: User can add basic shapes (rectangle, circle, line, arrow)
- DRAW-01: User can draw freehand strokes with pen/marker tool
- DRAW-02: User can erase strokes with eraser tool
- DRAW-03: User can select from 8-12 preset colors for drawing
- DRAW-04: User can select stroke width (thin, medium, thick)

**Success criteria achieved:**
1. User can draw smooth freehand lines that appear instantly on canvas - DONE
2. User can add rectangle, circle, line, and arrow shapes via toolbar - DONE
3. User can erase specific strokes with eraser tool - DONE
4. User can select from at least 8 distinct colors before drawing - DONE (13 colors)
5. User can choose between at least 3 stroke widths that are visibly different - DONE (4 widths)

**Deferred verification:**
- Manual testing deferred per user request (toolbar, shortcuts, styles need visual verification)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 3/8 |
| Requirements done | 12/27 |
| Current phase progress | 100% |
| Plans completed this phase | 3/3 |

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
| TLComponents for toolbar | Custom toolbar via components prop, not UI overrides | 2026-01-21 |
| z-index 300 for toolbar | Below connection indicator (1000), above canvas | 2026-01-21 |
| editor.inputs.isPointing | Correct property for pointer state detection in auto-hide | 2026-01-21 |
| Stroke widths 2/6/12/18px | CONTEXT.md requested thin/medium/thick, added extra-thick bonus | 2026-01-21 |
| 13-color palette | Professional (6) + vibrant saturated (7) for comprehensive options | 2026-01-21 |
| Dark mode palette brighter | Slightly brighter values for visibility on dark backgrounds | 2026-01-21 |
| configureStyles() at top of main.tsx | Must mutate tldraw constants before React/tldraw loads | 2026-01-21 |
| Number keys 1-6 for core tools | select/draw/eraser/arrow/geo/highlight mapping | 2026-01-21 |
| Default tool is select | Safe canvas opening, prevents accidental drawing | 2026-01-21 |

### Research Flags

| Phase | Topic | Status |
|-------|-------|--------|
| 1 | pycrdt-websocket room lifecycle | Complete - custom RoomManager implemented |
| 2 | tldraw Yjs integration specifics | Complete - useYjsStore hook implemented |
| 3 | tldraw style customization | Complete - styleConfig.ts with STROKE_SIZES and color palette |
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

**Last session:** 2026-01-21 - Completed Phase 3 (Drawing Tools)
**Next action:** Begin Phase 4 (Notes & Text)

**Context for next session:**
- Phase 1 Real-Time Infrastructure complete
- Phase 2 Canvas Foundation complete
- Phase 3 Drawing Tools complete
- Frontend Canvas component structure:
  - Canvas.tsx: tldraw wrapper with connection status indicator, default select tool
  - CustomToolbar.tsx: Bottom-center toolbar with auto-hide and pin toggle
  - styleConfig.ts: Custom stroke widths and 13-color palette
  - useYjsStore.ts: Bidirectional sync with YKeyValue
  - useUndoManager.ts: Per-user undo via Y.UndoManager
  - cameraOptions.ts: Zoom limits and Ctrl-only scroll
  - uiOverrides.ts: Complete keyboard shortcuts for all tools
- Key patterns established:
  - TLComponents for toolbar replacement
  - store.listen with source:'user' for reactive state detection
  - Global style mutation via configureStyles() before React mount
  - uiOverrides tools() for keyboard shortcut customization
- Phase 3 features complete:
  - Stroke widths: 2/6/12/18px for s/m/l/xl
  - Colors: 13 colors (professional + vibrant) for light and dark modes
  - Keyboard shortcuts: 1-6 number keys, letter shortcuts (p,e,a,r,m,l,o,v)
  - Default tool: select (safe canvas opening)
- Manual testing deferred: toolbar position, auto-hide, shortcuts, styles need visual verification
- Ready for Phase 4 (Notes & Text) - sticky notes, text objects, inline editing

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-21 after Phase 3 completion*
