# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 5 - TODO Integration (COMPLETE)
**Plan:** 4 of 4 complete
**Status:** Phase Complete
**Last activity:** 2026-01-22 - Completed Phase 5 execution (manual verification deferred)

```
[##########] Plan 4/4 in Phase 5
[======================================================>.] Phase 5 of 8
```

**Phase 5 progress:**
- 05-01: TODO Card Shape - COMPLETE (TodoShapeUtil, TodoCard, toolbar integration)
- 05-02: Backend Sync - COMPLETE (todoApi, useTodoSync, WebSocket broadcast)
- 05-03: Frame Presets - COMPLETE (Kanban, Eisenhower, Weekly, Custom)
- 05-04: Manual Verification - COMPLETE (deferred to project completion)

**Requirements completed this phase:**
- TODO-01: User can add TODO cards with title/status/due date/assignee - DONE (via TODO shape)
- TODO-02: User can mark tasks complete with visual feedback - DONE (checkbox, green tint, strikethrough)
- TODO-03: User can organize TODOs into visual sections (frames) - DONE (4 frame presets)
- TODO-04: TODO changes sync bidirectionally with backend - DONE (useTodoSync)

**Deferred verification:**
- Manual testing deferred per user request (Phases 3, 4, and 5 need visual verification)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 5/8 |
| Requirements done | 19/27 |
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
| TLComponents for toolbar | Custom toolbar via components prop, not UI overrides | 2026-01-21 |
| z-index 300 for toolbar | Below connection indicator (1000), above canvas | 2026-01-21 |
| editor.inputs.isPointing | Correct property for pointer state detection in auto-hide | 2026-01-21 |
| Stroke widths 2/6/12/18px | CONTEXT.md requested thin/medium/thick, added extra-thick bonus | 2026-01-21 |
| 13-color palette | Professional (6) + vibrant saturated (7) for comprehensive options | 2026-01-21 |
| Dark mode palette brighter | Slightly brighter values for visibility on dark backgrounds | 2026-01-21 |
| configureStyles() at top of main.tsx | Must mutate tldraw constants before React/tldraw loads | 2026-01-21 |
| Number keys 1-6 for core tools | select/draw/eraser/arrow/geo/highlight mapping | 2026-01-21 |
| Default tool is select | Safe canvas opening, prevents accidental drawing | 2026-01-21 |
| 8 sticky note colors | yellow, pink, sky blue, mint, orange, purple, lavender, white | 2026-01-21 |
| Note text color #1a1a2e | Dark navy for readability on all pastel backgrounds | 2026-01-21 |
| localStorage note color persistence | collabboard:note-color key with yellow default | 2026-01-21 |
| resizeMode='scale' for notes | Aspect-locked resize for square Post-it shape | 2026-01-21 |
| Dropdown for frame presets | Space-efficient UI, keeps toolbar compact | 2026-01-21 |
| Viewport-center frame placement | Presets visible immediately after creation | 2026-01-21 |
| T.literalEnum for TODO priority | Type-safe enum validator for high/medium/low | 2026-01-21 |
| Free resize for TODO cards | Per CONTEXT.md, not aspect-locked like notes | 2026-01-21 |
| isPast + isToday for overdue | Overdue = past due date AND not today | 2026-01-21 |
| Shape utils outside component | Const arrays prevent recreation on render | 2026-01-21 |
| source:'user' + mergeRemoteChanges | Combined pattern prevents bidirectional sync echo loops | 2026-01-21 |
| 500ms debounce on TODO updates | Prevents excessive API calls during rapid edits | 2026-01-21 |
| CustomEvent 'todo-sync' | Bridge WebSocket events to React component tree | 2026-01-21 |
| defaultListId optional prop | Sync disabled if not provided, graceful degradation | 2026-01-21 |

### Research Flags

| Phase | Topic | Status |
|-------|-------|--------|
| 1 | pycrdt-websocket room lifecycle | Complete - custom RoomManager implemented |
| 2 | tldraw Yjs integration specifics | Complete - useYjsStore hook implemented |
| 3 | tldraw style customization | Complete - styleConfig.ts with STROKE_SIZES and color palette |
| 4 | tldraw note/text shapes | Complete - built-in shapes with customization |
| 5 | tldraw custom shapes & bidirectional sync | Complete - BaseBoxShapeUtil, store.listen, mergeRemoteChanges patterns |
| 8 | iOS canvas memory limits | Pending |

### TODOs

- [ ] Determine tldraw licensing approach ($6K/year, watermark, or Konva.js fallback)
- [ ] Design CRDT room persistence schema for PostgreSQL
- [ ] Fix Y.js generic type issues in useYjsStore.ts for production build

### Blockers

None currently.

### Warnings

- **tldraw licensing:** Requires $6K/year startup license OR displays watermark OR use Konva.js instead
- **Do NOT use ypy:** Archived April 2025, use pycrdt instead
- **Build issue:** Vite production build has Y.js generic type errors in useYjsStore.ts (Phase 2 issue)

## Session Continuity

**Last session:** 2026-01-22 - Completed Phase 5 (TODO Integration)
**Next action:** Begin Phase 6 (File Handling)

**Context for next session:**
- Phase 1 Real-Time Infrastructure complete
- Phase 2 Canvas Foundation complete
- Phase 3 Drawing Tools complete
- Phase 4 Notes & Text complete
- Phase 5 TODO Integration complete
- Frontend Canvas component structure:
  - Canvas.tsx: tldraw wrapper with note config, resize mode, color persistence, TODO shape/tool, useTodoSync
  - CustomToolbar.tsx: Bottom-center toolbar with auto-hide, pin toggle, Frames dropdown, TODO button
  - styleConfig.ts: Custom stroke widths, 13-color palette, 8 note colors
  - framePresets.ts: Kanban, Eisenhower, Weekly, Custom frame creators
  - noteColorPersistence.ts: localStorage persistence for note color
  - useYjsStore.ts: Bidirectional sync with YKeyValue
  - useUndoManager.ts: Per-user undo via Y.UndoManager
  - useTodoSync.ts: Bidirectional TODO sync with backend API
  - cameraOptions.ts: Zoom limits and Ctrl-only scroll
  - uiOverrides.ts: Complete keyboard shortcuts for all tools including T/7 for TODO
  - shapes/todo/: TodoShapeUtil, TodoTool, TodoCard, types
- Services layer:
  - services/todoApi.ts: Backend API client (createTodo, updateTodo, deleteTodo, toggleTodo)
- Key patterns established:
  - TLComponents for toolbar replacement
  - store.listen with source:'user' for reactive state detection
  - Global style mutation via configureStyles() before React mount
  - uiOverrides tools() for keyboard shortcut customization
  - localStorage persistence for user style preferences
  - Frame presets via editor.createShape({ type: 'frame' })
  - Dropdown menus with click-outside dismiss pattern
  - Custom shape: types.ts -> Component.tsx -> ShapeUtil.tsx -> Tool.ts -> index.ts
  - Shape/tool registration outside component (const customShapeUtils = [...])
  - Bidirectional sync: store.listen + mergeRemoteChanges combo for echo prevention
  - WebSocket-to-React: CustomEvent dispatch pattern
- Phase 5 features complete:
  - TODO cards with title, checkbox, due date, assignee, priority
  - Completion styling (green tint, checkmark, strikethrough)
  - Overdue styling (red border, red date text)
  - Priority borders (red/yellow/blue for high/medium/low)
  - Frame presets: Kanban (3 columns), Eisenhower (2x2), Weekly (Mon-Fri), Custom
  - Bidirectional backend sync with 500ms debounce and echo prevention
- Manual testing deferred: Phases 3, 4, and 5 need visual verification
- Ready for Phase 6 (File Handling) - image upload/paste, PNG/PDF export

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-22 after Phase 5 completion*
