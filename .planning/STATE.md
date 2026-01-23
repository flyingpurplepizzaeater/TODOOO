# Project State: CollabBoard

## Project Reference

**Core Value:** TODO management that works reliably - creating, assigning, and tracking tasks is the foundation everything else builds on.

**Current Focus:** Real-time collaborative whiteboard with TODO integration across web and mobile platforms.

**Tech Stack:** FastAPI + pycrdt-websocket | React + tldraw | Yjs CRDT | MinIO | Capacitor

## Current Position

**Phase:** 8 - Mobile Platform (IN PROGRESS)
**Plan:** 3 of 4 complete
**Status:** In Progress
**Last activity:** 2026-01-23 - Completed 08-03 App Lifecycle & Offline Caching

```
[#######---] Plan 3/4 in Phase 8
[===================================================================================] Phase 8 of 8
```

**Phase 8 progress:**
- 08-01: Capacitor Setup - COMPLETE (platforms, splash screen, platform detection)
- 08-02: Touch Optimization - IN PROGRESS (parallel execution)
- 08-03: App Lifecycle & Offline Caching - COMPLETE (lifecycle handlers, offline caching, ConnectionBanner)
- 08-04: Platform Services - IN PROGRESS (parallel execution)

**Phase 7 (COMPLETE):**
- 07-01: Awareness Foundation - COMPLETE
- 07-02: Cursor Rendering - COMPLETE
- 07-03: Presence Panel - COMPLETE

**Deferred verification:**
- Manual testing deferred per user request (Phases 3, 4, 5, 6, 7, and 8 need visual verification)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 7/8 |
| Requirements done | 25/27 |
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
| Lazy boto3 import | Backend doesn't fail on startup if boto3 not installed | 2026-01-22 |
| assetStore via createTLStore | tldraw v4 requires assets in store options, not Tldraw prop | 2026-01-22 |
| Key format: boards/{id}/{uuid}/{file} | Prevents filename collisions in MinIO | 2026-01-22 |
| 1-hour presigned URL expiry | Balances usability with security for uploads | 2026-01-22 |
| CASCADE_OFFSET 40px for batch uploads | Stacked cards effect when uploading multiple images | 2026-01-22 |
| Toolbar-only upload code | tldraw handles drag-drop/paste natively with TLAssetStore | 2026-01-22 |
| jspdf for PDF generation | 15M+ weekly downloads, mature, well-documented | 2026-01-22 |
| Scale 2 for PDF image quality | Higher resolution for print-quality PDFs | 2026-01-22 |
| 20pt PDF page margins | Clean presentation with breathing room | 2026-01-22 |
| Viewport as default export scope | Most common use case is export what you see | 2026-01-22 |
| Landscape as default PDF orientation | Better fit for typical whiteboard content | 2026-01-22 |
| Null-safe options pattern for useAwareness | Hook accepts null and returns empty result, allowing unconditional calls | 2026-01-22 |
| requestAnimationFrame for pointer tracking | More reliable than store listeners for continuous cursor updates | 2026-01-22 |
| 12-color palette with djb2 hash | Deterministic color from userId ensures consistency across clients | 2026-01-22 |
| 50ms throttle for cursor updates | Balances smoothness (20 fps) with network efficiency | 2026-01-22 |
| 18px base cursor size | Middle of CONTEXT.md's 16-20px range with zoom compensation | 2026-01-22 |
| Username label on hover only | Keeps canvas clean, reveals on hover per CONTEXT.md | 2026-01-22 |
| TLComponents override for cursor | CollaboratorCursor -> DotCursor for custom dot shape | 2026-01-22 |
| selectedShapeIds in presence | Enables tldraw CollaboratorShapeIndicator rendering | 2026-01-22 |
| useRef for wasMobile tracking | Avoids unused state variable TypeScript error in resize handler | 2026-01-22 |
| editor.getInstanceState().followingUserId | tldraw doesn't expose getIsFollowingUser method | 2026-01-22 |
| 30s cursor fade, 2min idle threshold | Per CONTEXT.md inactivity indicators | 2026-01-22 |
| 768px mobile breakpoint | Standard responsive sidebar collapse threshold | 2026-01-22 |
| appStateChange + resume events | Both events for reliable WebSocket reconnection across devices | 2026-01-23 |
| 10-board cache limit | Balance offline utility with storage constraints | 2026-01-23 |
| Base64 Y.Doc encoding | Store Uint8Array as base64 in Capacitor Filesystem | 2026-01-23 |
| 2.5s banner auto-dismiss | Brief success indicator per CONTEXT.md | 2026-01-23 |
| wasDisconnectedRef pattern | Distinguish reconnection from initial connection | 2026-01-23 |

### Research Flags

| Phase | Topic | Status |
|-------|-------|--------|
| 1 | pycrdt-websocket room lifecycle | Complete - custom RoomManager implemented |
| 2 | tldraw Yjs integration specifics | Complete - useYjsStore hook implemented |
| 3 | tldraw style customization | Complete - styleConfig.ts with STROKE_SIZES and color palette |
| 4 | tldraw note/text shapes | Complete - built-in shapes with customization |
| 5 | tldraw custom shapes & bidirectional sync | Complete - BaseBoxShapeUtil, store.listen, mergeRemoteChanges patterns |
| 6 | tldraw image upload & TLAssetStore | Complete - presigned URLs, createAssetStore pattern |
| 7 | Yjs Awareness + tldraw presence | Complete - useAwareness hook, TLInstancePresence sync |
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

**Last session:** 2026-01-23 - Completed 08-03 App Lifecycle & Offline Caching
**Next action:** Complete Phase 8 plans 02 and 04 (parallel execution)

**Context for next session:**
- Phase 8 in progress (3/4 plans complete for 08-03)
- 08-03 App Lifecycle & Offline Caching complete:
  - lifecycle.ts: App state change and resume listeners for WebSocket reconnection
  - offline.ts: Board caching service with 10-board LRU limit
  - ConnectionBanner.tsx: Warning/success banners for connection status
  - Canvas.tsx integration: Lifecycle init/cleanup, banner rendering
- Key patterns established:
  - initAppLifecycle(provider) in useEffect with cleanupAppLifecycle cleanup
  - Base64 encoding for Uint8Array Y.Doc state storage
  - wasDisconnectedRef pattern for reconnection detection
- Plans 08-02 and 08-04 executing in parallel
- Manual testing deferred: Phases 3-8 need visual verification

---

*State initialized: 2026-01-19*
*Last updated: 2026-01-23 after 08-03 completion*
