---
phase: 02-canvas-foundation
plan: 04
subsystem: frontend/canvas
tags: [undo-redo, yjs, per-user-history, crdt]

dependency-graph:
  requires: ["02-02", "02-03"]
  provides: ["per-user-undo", "yjs-undomanager-integration"]
  affects: ["03-01", "04-01"]

tech-stack:
  added: []
  patterns:
    - "Yjs UndoManager with trackedOrigins for per-user history"
    - "clientId as transaction origin for change tracking"

key-files:
  created:
    - frontend/src/components/Canvas/useUndoManager.ts
  modified:
    - frontend/src/components/Canvas/useYjsStore.ts
    - frontend/src/components/Canvas/uiOverrides.ts
    - frontend/src/components/Canvas/Canvas.tsx

decisions:
  - key: "clientId as transaction origin"
    choice: "doc.transact(() => {}, clientId)"
    rationale: "Enables UndoManager to track per-user changes via trackedOrigins"
  - key: "observeDeep for transaction access"
    choice: "yArr.observeDeep() instead of yArr.observe()"
    rationale: "observeDeep callback receives transaction parameter needed to check origin"
  - key: "captureTimeout 500ms"
    choice: "Group rapid changes into single undo operation"
    rationale: "Better UX - multiple quick strokes become single undo step"

metrics:
  duration: "3 minutes"
  completed: "2026-01-20"
  tasks: 3/3
  deviations: 0
---

# Phase 02 Plan 04: Undo History Summary

**One-liner:** Per-user undo/redo via Yjs UndoManager with trackedOrigins scoped to clientId - User A's Ctrl+Z reverts only User A's changes.

## Requirements Completed

- **CANV-04:** Per-user undo/redo (User A's undo only reverts User A's changes)

## What Was Built

### 1. useUndoManager Hook (`useUndoManager.ts`)

New hook providing per-user undo/redo using Yjs UndoManager:

```typescript
export function useUndoManager(
  doc: Y.Doc | null,
  yArr: Y.Array<unknown> | null
): UndoManagerState
```

Key implementation:
- `trackedOrigins: new Set([clientId])` - Only tracks this client's changes
- `captureTimeout: 500` - Groups rapid changes into single undo operation
- Stack event handlers update React state (`canUndo`, `canRedo`) for UI feedback
- Returns `{ canUndo, canRedo, undo, redo }`

### 2. Updated useYjsStore (`useYjsStore.ts`)

Modified to enable per-user undo tracking:

```typescript
// Pass clientId as transaction origin
doc.transact(() => {
  // Apply changes...
}, clientId)  // <-- enables per-user undo
```

Changes:
- Added `YjsStoreResult` interface exposing `doc` and `yArr` for UndoManager
- Pass `clientId` as second argument to `doc.transact()`
- Skip `handleYjsChange` when `transaction.origin === clientId` (our own changes)
- Changed to `observeDeep` for transaction access in callback

### 3. Updated uiOverrides (`uiOverrides.ts`)

New factory function to inject custom undo/redo handlers:

```typescript
export function createUiOverrides(
  customUndo: () => void,
  customRedo: () => void
): TLUiOverrides
```

Overrides:
- `actions.undo.onSelect` - Calls Yjs UndoManager instead of tldraw undo
- `actions.redo.onSelect` - Calls Yjs UndoManager instead of tldraw redo

### 4. Updated Canvas Component (`Canvas.tsx`)

Wired all pieces together:

```typescript
const { store, status, doc, yArr } = useYjsStore(boardId, token)
const { canUndo, canRedo, undo, redo } = useUndoManager(doc, yArr)
const overrides = useMemo(
  () => createUiOverrides(undo, redo),
  [undo, redo]
)
```

Added `UndoRedoIndicator` component showing undo/redo availability in bottom-right corner.

## How Per-User Undo Works

1. **Each client gets unique clientId** from `Y.Doc.clientID`
2. **Local changes tagged with clientId** via `doc.transact(() => {...}, clientId)`
3. **UndoManager only tracks changes with matching origin** via `trackedOrigins: new Set([clientId])`
4. **When User A undoes** - Only changes with User A's clientId are reverted
5. **User B's changes remain untouched** - Their clientId is different

## Commits

| Hash | Message |
|------|---------|
| 844ba7a | feat(02-04): create useUndoManager hook for per-user undo/redo |
| 5777f31 | feat(02-04): update useYjsStore to pass clientId as transaction origin |
| fa05142 | feat(02-04): override Ctrl+Z/Y to use per-user Yjs UndoManager |

## Files Changed

```
frontend/src/components/Canvas/
  useUndoManager.ts (NEW)  - 85 lines - Per-user Yjs UndoManager hook
  useYjsStore.ts           - +44/-16 - clientId origin, expose doc/yArr
  uiOverrides.ts           - +40/-7  - createUiOverrides factory
  Canvas.tsx               - +41/-11 - Wire UndoManager, add indicator
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. Files exist: All 4 files present in `frontend/src/components/Canvas/`
2. TypeScript check: `npx tsc --noEmit` passes with no errors
3. Per-user undo isolation: Architecture ensures via trackedOrigins

## Next Phase Readiness

Ready for Plan 02-05 (Selection & Sharing):
- Per-user undo foundation complete
- Canvas component stable with all core functionality
- Ready to add selection visualization and presence indicators

## Known Limitations

- **No persistence of undo stack:** Undo history is in-memory only, cleared on page refresh
- **500ms capture window:** Very fast users might want this tunable
- **Visual indicator minimal:** Could enhance UndoRedoIndicator with stack depth
