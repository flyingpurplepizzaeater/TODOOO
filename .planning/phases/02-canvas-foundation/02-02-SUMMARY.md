---
phase: 02-canvas-foundation
plan: 02
subsystem: ui
tags: [tldraw, yjs, y-websocket, react, crdt, canvas, real-time]

# Dependency graph
requires:
  - phase: 01-realtime-infrastructure
    provides: WebSocket backend at /ws/canvas/{board_id} with Yjs CRDT sync
  - phase: 02-01
    provides: React frontend foundation with Vite and TypeScript
provides:
  - tldraw canvas component with full-viewport rendering
  - Bidirectional Yjs-tldraw sync hook (useYjsStore)
  - WebSocket provider for Yjs connection to backend
  - Connection status indicator component
affects: [02-03, 02-04, 02-05, 02-06, 03-custom-shapes]

# Tech tracking
tech-stack:
  added: [tldraw@4.2.3, yjs@13.6.29, y-websocket@3.0.0, y-utility@0.1.4]
  patterns: [yjs-tldraw-bidirectional-sync, ykeyvalue-for-records, merge-remote-changes]

key-files:
  created:
    - frontend/src/components/Canvas/Canvas.tsx
    - frontend/src/components/Canvas/useYjsStore.ts
    - frontend/src/components/Canvas/index.ts
    - frontend/src/lib/yjs/provider.ts
  modified:
    - frontend/package.json
    - frontend/src/App.tsx

key-decisions:
  - "YKeyValue over Y.Map for tldraw records (prevents unbounded memory growth)"
  - "mergeRemoteChanges() to prevent echo loops in sync"
  - "source:'user' filter on store.listen to ignore remote changes"
  - "Connection status indicator for real-time feedback"

patterns-established:
  - "Bidirectional sync: store.listen for local -> Yjs, yArr.observe for Yjs -> store"
  - "YKeyValue wrapper on Y.Array for efficient key-value tldraw record storage"
  - "Connection indicator overlay pattern (absolute positioned z-1000)"

# Metrics
duration: 8min
completed: 2026-01-20
---

# Phase 2 Plan 02: tldraw Integration Summary

**tldraw canvas with Yjs CRDT synchronization via custom useYjsStore hook connecting to pycrdt-websocket backend**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-20T15:50:00Z
- **Completed:** 2026-01-20T15:58:00Z
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 2

## Accomplishments
- tldraw@4.2.3 canvas renders in full-viewport container
- Bidirectional Yjs-tldraw sync with echo loop prevention
- WebSocket connection to backend with JWT authentication
- Connection status indicator (connecting/connected/disconnected/error)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install tldraw and Yjs dependencies** - `cc61ba9` (feat)
2. **Task 2: Create Yjs WebSocket provider and sync hook** - `7fd2150` (feat)
3. **Task 3: Create Canvas component with tldraw** - `a3414c1` (feat)

## Files Created/Modified
- `frontend/package.json` - Added tldraw, yjs, y-websocket, y-utility dependencies
- `frontend/src/lib/yjs/provider.ts` - Creates Y.Doc and WebsocketProvider for board
- `frontend/src/components/Canvas/useYjsStore.ts` - Bidirectional sync hook (172 lines)
- `frontend/src/components/Canvas/Canvas.tsx` - Tldraw wrapper with status indicator
- `frontend/src/components/Canvas/index.ts` - Barrel exports
- `frontend/src/App.tsx` - Updated with Canvas integration and setup instructions

## Decisions Made
- **YKeyValue over Y.Map:** Y.Map retains all historical key values causing unbounded growth. YKeyValue (from y-utility) optimizes for key-value patterns.
- **mergeRemoteChanges() wrapper:** Required to prevent echo loops - tags changes as remote so they don't re-trigger the store listener.
- **source:'user' filter:** Store listener only processes user-originated changes, ignoring remote merges.
- **Connection indicator overlay:** Positioned absolute z-1000 in top-right corner for always-visible status.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Ports 5173 and 5174 were in use during dev server tests; Vite auto-selected 5175 - no action required

## User Setup Required

To test real-time sync, users must:
1. Start backend: `uvicorn main:app --reload`
2. Create a user and get JWT token via `POST /auth/register`
3. Create a board via `POST /boards`
4. Set `TEST_TOKEN` and `TEST_BOARD_ID` in `frontend/src/App.tsx`
5. Refresh the page

The Canvas component will render tldraw once valid authentication is configured.

## Next Phase Readiness
- tldraw canvas foundation complete
- Ready for custom shape definitions (Plan 02-03)
- Backend WebSocket integration point at `/ws/canvas/{board_id}` confirmed
- Yjs document structure: Y.Array with YKeyValue wrapper under key 'tldraw'

**Note:** tldraw watermark ("Made with tldraw") will appear in hobby/trial mode. Commercial license ($6K/year) required to remove.

---
*Phase: 02-canvas-foundation*
*Completed: 2026-01-20*
