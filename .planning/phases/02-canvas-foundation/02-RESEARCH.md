# Phase 2: Canvas Foundation - Research

**Researched:** 2026-01-20
**Focus:** tldraw + Yjs integration, customization, per-user undo, responsive behavior, licensing
**Confidence:** MEDIUM (tldraw docs HIGH, Yjs integration patterns MEDIUM, per-user undo LOW)

## Summary

Phase 2 requires integrating tldraw v4.2.x as the canvas foundation with Yjs CRDT synchronization to the existing pycrdt-websocket backend. tldraw is a production-proven infinite canvas SDK used by major products (ClickUp, Padlet). The primary challenge is that tldraw has its own sync system (`@tldraw/sync`) but officially supports Yjs integration through public store APIs.

**Critical finding:** tldraw does NOT have built-in per-user undo/redo in collaborative mode. This is a known limitation with an open (now closed as "not planned") feature request. Workarounds exist using `mergeRemoteChanges()` to separate local vs remote changes, but achieving true per-user undo will require custom history management.

**Primary recommendation:** Use tldraw v4.2.x with a custom `useYjsStore` hook that bridges tldraw's store to Yjs. Sync local changes via `store.listen()` to Yjs, and apply remote Yjs changes via `store.mergeRemoteChanges()`. Accept watermark for hobby/trial license or plan for commercial license.

## Key Findings

### 1. tldraw + Yjs Integration Architecture

**Pattern established by Liveblocks and community implementations:**

The integration uses a bidirectional sync pattern:

1. **Local changes (tldraw -> Yjs):**
   - Listen to tldraw store via `editor.store.listen(callback, { source: 'user', scope: 'document' })`
   - Apply changes to Yjs document within a transaction
   - Changes flow: tldraw store -> Yjs Y.Map/YKeyValue -> y-websocket -> server

2. **Remote changes (Yjs -> tldraw):**
   - Listen to Yjs document `observe` events
   - Filter for remote transactions only (not self-originated)
   - Apply to tldraw via `editor.store.mergeRemoteChanges(() => { store.put(...) })`
   - The `mergeRemoteChanges` wrapper tags changes as 'remote' to prevent echo loops

**Key insight:** Use `YKeyValue` from `y-utility` instead of `Y.Map` for the tldraw record store. Y.Map retains all historical key values for conflict resolution, causing unbounded growth. YKeyValue optimizes for key-value patterns where only current state matters.

**Confidence: MEDIUM** - Pattern verified across Liveblocks example, tlsync-yjs, and secsync implementations, but no official tldraw documentation for Yjs specifically.

### 2. tldraw Customization Capabilities

**Toolbar and UI customization (HIGH confidence):**

tldraw provides extensive UI customization through the `overrides` prop:

```typescript
const overrides: TLUiOverrides = {
  actions(_editor, actions): TLUiActionsContextType {
    // Modify keyboard shortcuts
    return {
      ...actions,
      'toggle-grid': { ...actions['toggle-grid'], kbd: 'x' },
    }
  },
  tools(_editor, tools): TLUiToolsContextType {
    // Modify tool shortcuts
    return { ...tools, draw: { ...tools.draw, kbd: 'p' } }
  },
}

<Tldraw overrides={overrides} />
```

**Keyboard shortcut syntax:**
- Standard keys: 'a', 'x', '1'
- Modifiers: `$` = Ctrl/Cmd, `!` = Shift, `?` = Alt
- Combos: 'cmd+1,ctrl+1' (supports both platforms)

**Can be customized:**
- All toolbar tools and their shortcuts
- All menu actions (undo, redo, delete, etc.)
- Can add entirely new tools and actions
- Can hide entire UI with `hideUi` prop
- Can replace components with custom implementations

### 3. Camera and Zoom Controls

**Camera options (HIGH confidence):**

```typescript
const cameraOptions: TLCameraOptions = {
  wheelBehavior: 'zoom',        // 'pan' | 'zoom' | 'none'
  panSpeed: 1,                  // 0-2 multiplier
  zoomSpeed: 1,                 // 0-2 multiplier
  zoomSteps: [0.1, 0.25, 0.5, 1, 2, 4],  // First = min, last = max
  isLocked: false,              // Lock camera movement
  constraints: {...}            // Optional bounds constraints
}

<Tldraw cameraOptions={cameraOptions} />
```

**For user requirements (Ctrl+scroll zoom only, 10%-400% range):**
- Set `wheelBehavior: 'zoom'`
- Set `zoomSteps: [0.1, 0.25, 0.5, 1, 2, 4]` (10% to 400%)
- Note: tldraw doesn't natively support "Ctrl+scroll only" - wheel behavior is global. May need custom event handling to intercept non-Ctrl scroll.

**Minimap:** Built-in, appears in navigation panel (bottom-left at larger breakpoints). Can be toggled.

### 4. Per-User Undo/Redo (CRITICAL LIMITATION)

**Current state (LOW confidence for solutions):**

tldraw's undo/redo is document-global, not per-user. Issue #5438 requested "parallel undo/redo histories" but was closed as "not planned" (November 2025).

**How tldraw history works:**
- History stack contains "diffs" (changes) and "marks" (stopping points)
- `editor.undo()` undoes diffs until reaching a mark
- `editor.redo()` redoes diffs until reaching a mark
- Changes from `mergeRemoteChanges()` are NOT added to undo stack

**Potential workaround approach:**

Since `mergeRemoteChanges()` changes don't enter undo stack, a per-user undo could theoretically:
1. Track local changes separately before applying to shared state
2. Keep a local-only history stack of user's own changes
3. On undo, compute inverse operations and apply as new changes
4. Apply to both local tldraw store AND broadcast to Yjs

**Risk:** This is complex, not battle-tested, and may have edge cases with concurrent edits. The requirement CANV-04 may need to be descoped to "undo affects last editor" or similar.

**Recommendation:** Implement standard tldraw undo/redo first (global), then evaluate if per-user is feasible in Phase 2 or should be deferred.

### 5. Responsive Behavior

**Built-in breakpoints (HIGH confidence):**

tldraw automatically adapts UI based on viewport:
- Mobile breakpoint: Simplified toolbar, different touch handling
- Desktop breakpoint: Full toolbar, navigation panel with minimap

**Force mobile mode:**
```typescript
<Tldraw persistenceKey="example" forceMobile />
```

**Viewport requirements:**
- tldraw requires a full-viewport container: `position: fixed; inset: 0`
- Automatically handles resize events
- Touch gestures work on mobile (pinch zoom, touch draw)

**For PLAT-01 (320px to 1920px+):** tldraw handles this natively. May need minor CSS adjustments for very small screens.

### 6. Licensing Reality

**Current licensing model (HIGH confidence, verified Jan 2026):**

| License Type | Cost | Watermark | Data Collection | Requirements |
|--------------|------|-----------|-----------------|--------------|
| Development | Free | N/A | None | Only for dev environment |
| Trial | Free (100 days) | No | Analytics ping | One per commercial unit |
| Hobby | Free | **Yes - "Made with tldraw"** | None | Non-commercial only |
| Commercial | $6,000/year (startups) | No | None | Contact sales |

**Key points:**
- SDK will not work in production without a license key
- Watermark cannot be hidden, removed, or altered
- License key validation is built into SDK
- Hobby license explicitly requires watermark display
- Trial is 100 days, then must choose hobby (watermark) or commercial ($6K)

**Options for this project:**
1. **Accept watermark** - Use hobby license, display "Made with tldraw"
2. **Pay $6K/year** - Commercial license removes watermark
3. **Alternative library** - Konva.js (canvas lib, no whiteboard features built-in)

## Standard Stack

### Core Packages

| Package | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tldraw | ^4.2.3 | Canvas SDK | Production-proven, best-in-class |
| @tldraw/sync | ^4.1.2 | Sync primitives | Official, though we'll use Yjs |
| yjs | ^13.6.x | CRDT sync | Already chosen in Phase 1, matches pycrdt |
| y-websocket | ^2.0.x | WebSocket provider | Standard Yjs transport |
| y-utility | ^0.2.x | YKeyValue helper | Efficient key-value for tldraw records |

### Installation

```bash
npm install tldraw yjs y-websocket y-utility
```

Note: `@tldraw/sync` is optional if using Yjs directly.

## Architecture Patterns

### Recommended Project Structure

```
frontend/
├── src/
│   ├── App.tsx                 # Root with Tldraw
│   ├── components/
│   │   └── Canvas/
│   │       ├── Canvas.tsx      # Tldraw wrapper component
│   │       ├── useYjsStore.ts  # Yjs <-> tldraw sync hook
│   │       └── cameraOptions.ts
│   ├── hooks/
│   │   └── useBoard.ts         # Board loading, permissions
│   └── lib/
│       └── yjs/
│           ├── provider.ts     # y-websocket setup
│           └── types.ts        # Yjs document structure
```

### Pattern 1: Bidirectional Sync Hook

**What:** Custom hook that syncs tldraw store with Yjs document
**When to use:** Always - this is the core integration pattern

```typescript
// Source: Liveblocks example pattern, adapted for y-websocket
import { useEffect, useMemo, useState } from 'react'
import { createTLStore, defaultShapeUtils, TLRecord } from 'tldraw'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { YKeyValue } from 'y-utility/y-keyvalue'

export function useYjsStore(roomId: string) {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }))
  const [status, setStatus] = useState<'loading' | 'synced' | 'error'>('loading')

  useEffect(() => {
    const yDoc = new Y.Doc()
    const yArr = yDoc.getArray<{ key: string; val: TLRecord }>('tldraw')
    const yStore = new YKeyValue(yArr)

    const provider = new WebsocketProvider(
      'ws://localhost:8000/ws/canvas',
      roomId,
      yDoc
    )

    // Sync Yjs -> tldraw
    const handleYjsChange = () => {
      yDoc.transact(() => {
        store.mergeRemoteChanges(() => {
          const records = [...yStore.ypiValues()]
          store.clear()
          store.put(records)
        })
      })
    }

    yStore.on('change', handleYjsChange)

    // Sync tldraw -> Yjs
    const unsub = store.listen(
      ({ changes }) => {
        yDoc.transact(() => {
          Object.values(changes.added).forEach(record => {
            yStore.set(record.id, record)
          })
          Object.values(changes.updated).forEach(([, record]) => {
            yStore.set(record.id, record)
          })
          Object.values(changes.removed).forEach(record => {
            yStore.delete(record.id)
          })
        })
      },
      { source: 'user', scope: 'document' }
    )

    provider.on('status', ({ status }: { status: string }) => {
      setStatus(status === 'connected' ? 'synced' : 'loading')
    })

    return () => {
      unsub()
      provider.destroy()
      yDoc.destroy()
    }
  }, [roomId, store])

  return { store, status }
}
```

### Pattern 2: Camera Configuration

**What:** Configure zoom/pan behavior per user requirements
**When to use:** Initial Tldraw setup

```typescript
// Source: tldraw docs TLCameraOptions
const cameraOptions: TLCameraOptions = {
  wheelBehavior: 'zoom',
  zoomSteps: [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4], // 10% to 400%
  panSpeed: 1,
  zoomSpeed: 1,
  isLocked: false,
}
```

### Pattern 3: Keyboard Shortcut Overrides

**What:** Customize shortcuts per user requirements
**When to use:** When default shortcuts don't match requirements

```typescript
// Source: tldraw docs keyboard-shortcuts
const overrides: TLUiOverrides = {
  actions(editor, actions) {
    return {
      ...actions,
      // Bracket keys for zoom
      'zoom-in': { ...actions['zoom-in'], kbd: ']' },
      'zoom-out': { ...actions['zoom-out'], kbd: '[' },
    }
  },
  tools(editor, tools) {
    return {
      ...tools,
      // Number keys for tools (1=select, 2=draw, etc.)
      select: { ...tools.select, kbd: '1' },
      draw: { ...tools.draw, kbd: '2' },
      eraser: { ...tools.eraser, kbd: '3' },
    }
  },
}
```

### Anti-Patterns to Avoid

- **Using Y.Map directly:** Use YKeyValue instead - Y.Map grows unbounded with alternating key writes
- **Syncing session state:** Only sync document scope, not session (camera position, selection)
- **Forgetting mergeRemoteChanges:** Without it, remote changes trigger local listeners causing infinite loops
- **Blocking initial render:** Load tldraw immediately, sync state asynchronously

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas rendering | Custom canvas lib | tldraw | Years of optimization, touch handling, accessibility |
| Shape selection UI | Custom handles | tldraw built-in | Resize, rotate, multi-select all handled |
| Zoom/pan | Custom transforms | tldraw camera | Smooth, performant, pinch-zoom support |
| Snap guides | Custom alignment | tldraw snapping | Grid snap + object snap built-in |
| Keyboard shortcuts | Manual event handlers | tldraw overrides | Conflict resolution, menu sync handled |
| Minimap | Custom thumbnail | tldraw navigation panel | Automatic viewport indicator |

## Common Pitfalls

### Pitfall 1: Echo Loop in Sync

**What goes wrong:** Changes bounce between tldraw and Yjs infinitely
**Why it happens:** Applying Yjs changes triggers tldraw listener which updates Yjs
**How to avoid:**
- Always use `mergeRemoteChanges()` for remote updates
- Filter store listener with `{ source: 'user' }` to ignore remote changes
**Warning signs:** Browser freezes, stack overflow, rapid network traffic

### Pitfall 2: Missing License Key in Production

**What goes wrong:** tldraw doesn't render, shows error
**Why it happens:** Production build requires valid license key
**How to avoid:**
- Add license key to environment config
- Test production build early
**Warning signs:** Works in dev, fails in production

### Pitfall 3: Full-Page Container Required

**What goes wrong:** Canvas doesn't render or renders tiny
**Why it happens:** tldraw needs explicit dimensions from container
**How to avoid:** Always use `position: fixed; inset: 0` or equivalent full-screen container
**Warning signs:** Canvas shows but is 0x0 pixels

### Pitfall 4: YKeyValue vs Y.Map Memory Growth

**What goes wrong:** Yjs document grows unbounded over time
**Why it happens:** Y.Map retains history of all key changes for conflict resolution
**How to avoid:** Use YKeyValue from y-utility for tldraw records
**Warning signs:** Slow sync, large document size, memory issues

### Pitfall 5: Ctrl+Scroll Zoom Assumption

**What goes wrong:** Regular scroll causes zoom instead of page scroll
**Why it happens:** tldraw's wheelBehavior is binary (zoom or pan), not modifier-aware
**How to avoid:** May need custom event interception or accept current behavior
**Warning signs:** User scroll zooms unexpectedly

## Code Examples

### Basic tldraw Setup

```typescript
// Source: tldraw.dev/quick-start
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw />
    </div>
  )
}
```

### With Yjs Store Integration

```typescript
// Source: Pattern derived from Liveblocks + tldraw persistence docs
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useYjsStore } from './useYjsStore'

export function CollaborativeCanvas({ boardId }: { boardId: string }) {
  const { store, status } = useYjsStore(boardId)

  if (status === 'loading') {
    return <div>Connecting...</div>
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        store={store}
        cameraOptions={{
          wheelBehavior: 'zoom',
          zoomSteps: [0.1, 0.25, 0.5, 1, 2, 4],
        }}
      />
    </div>
  )
}
```

### Programmatic Camera Control

```typescript
// Source: tldraw.dev/docs/editor
function handleZoomIn(editor: Editor) {
  editor.zoomIn()
}

function handleZoomToFit(editor: Editor) {
  editor.zoomToFit({ animation: { duration: 300 } })
}

function handleSetZoom(editor: Editor, level: number) {
  const camera = editor.getCamera()
  editor.setCamera({ x: camera.x, y: camera.y, z: level })
}
```

### Enable Snap Mode

```typescript
// Source: tldraw.dev/examples/bounds-snapping-shape
function handleMount(editor: Editor) {
  editor.user.updateUserPreferences({ isSnapMode: true })
}

<Tldraw onMount={handleMount} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tldraw v2.x | tldraw v4.2.x | Nov 2025 | New licensing, better API |
| Y.Map for records | YKeyValue | 2024 | Better memory efficiency |
| ypy (Python) | pycrdt | Apr 2025 | ypy archived, pycrdt maintained |
| Manual Yjs setup | @tldraw/sync | 2024 | But Yjs still supported |

**Deprecated/outdated:**
- **tldraw v2.x:** v4.x has breaking changes, new licensing model
- **ypy:** Archived April 2025, use pycrdt
- **Direct Y.Map for stores:** Use YKeyValue for better performance

## Open Questions

1. **Ctrl+scroll only zoom**
   - What we know: tldraw `wheelBehavior` is global, not modifier-aware
   - What's unclear: Best approach to intercept scroll events
   - Recommendation: Accept zoom-on-scroll as default behavior, or implement custom wheel event handler

2. **Per-user undo/redo**
   - What we know: Not supported, feature request closed as "not planned"
   - What's unclear: Whether custom implementation is feasible without significant effort
   - Recommendation: Implement global undo/redo first, scope per-user to future phase if needed

3. **pycrdt + tldraw document structure**
   - What we know: pycrdt is compatible with Yjs wire protocol
   - What's unclear: Exact Y.Doc structure needed on Python side
   - Recommendation: Match frontend Yjs structure exactly (Y.Array with YKeyValue wrapper)

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Per-user undo not achievable | Requirement descope | HIGH | Implement global undo, discuss with stakeholders |
| License watermark unacceptable | Cost or different lib | MEDIUM | Budget for $6K or accept watermark |
| Yjs sync instability | User experience | LOW | Follow established patterns, test extensively |
| tldraw v4 breaking changes | Rework needed | LOW | Pin version, follow release notes |

## Sources

### Primary (HIGH confidence)
- [tldraw Official Docs](https://tldraw.dev/) - Quick start, persistence, editor API
- [tldraw Camera Options](https://tldraw.dev/reference/editor/TLCameraOptions) - Zoom/pan configuration
- [tldraw Keyboard Shortcuts](https://tldraw.dev/examples/keyboard-shortcuts) - Override patterns
- [tldraw License](https://tldraw.dev/community/license) - Current licensing model

### Secondary (MEDIUM confidence)
- [Liveblocks tldraw Yjs Example](https://github.com/liveblocks/liveblocks/blob/main/examples/nextjs-tldraw-whiteboard-yjs/) - useYjsStore pattern
- [tlsync-yjs](https://github.com/shahriar-shojib/tlsync-yjs) - Community Yjs integration
- [tldraw Issue #5438](https://github.com/tldraw/tldraw/issues/5438) - Per-user undo feature request (closed)
- [y-utility YKeyValue](https://github.com/yjs/y-utility) - Efficient key-value for Yjs

### Tertiary (LOW confidence)
- [secsync tldraw example](https://www.secsync.com/docs/integration-examples/yjs-tldraw) - Early prototype, noted as unstable
- Yjs Community Forum discussions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official tldraw + established Yjs patterns
- Architecture patterns: MEDIUM - Derived from multiple sources, not official
- Pitfalls: MEDIUM - Community experience + official docs
- Per-user undo: LOW - No proven solution exists

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - tldraw releases monthly, may have breaking changes)

---

## RESEARCH COMPLETE

**Phase:** 2 - Canvas Foundation
**Confidence:** MEDIUM

### Key Findings

1. **tldraw v4.2.x** is current, production-ready, requires license for production
2. **Yjs integration** works via store.listen() + mergeRemoteChanges() bidirectional sync
3. **Per-user undo not supported** - feature request closed, will need workaround or scope change
4. **UI customization** is comprehensive via overrides prop
5. **Responsive behavior** is built-in with automatic breakpoints
6. **License options:** Free with watermark, $6K/year without

### File Created

`C:\Users\Workshop\Desktop\AI-2\Claude RW+skills\TODO\.planning\phases\02-canvas-foundation\02-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Official docs, npm verified |
| Architecture | MEDIUM | Community patterns, not official tldraw Yjs guide |
| Pitfalls | MEDIUM | Mix of official warnings and community experience |
| Per-user undo | LOW | No solution exists, feature request rejected |

### Open Questions

1. Ctrl+scroll-only zoom may need custom event handling
2. ~~Per-user undo requires stakeholder discussion~~ **RESOLVED: Use Yjs UndoManager**
3. pycrdt document structure needs validation with actual testing

### Per-User Undo Solution (Follow-up Research)

**Decision:** Use Yjs UndoManager with `trackedOrigins` scoped to client ID.

**Approach:**
```typescript
const clientId = doc.clientID // Unique per client

const undoManager = new Y.UndoManager(yShapes, {
  trackedOrigins: new Set([clientId]),
  captureTimeout: 500
})

// Making tracked changes
doc.transact(() => {
  yShapes.push([shapeData])
}, clientId)

// Override keyboard shortcuts to use Yjs UndoManager
// Ctrl+Z → undoManager.undo()
// Ctrl+Shift+Z → undoManager.redo()
```

**Key points:**
- Each client instantiates its own UndoManager scoped to their clientId
- Must override tldraw's Ctrl+Z/Y shortcuts to call Yjs UndoManager instead
- All local mutations must include clientId as transaction origin
- This is the pattern used by y-excalidraw and recommended by Yjs docs

**Confidence:** MEDIUM-HIGH (proven pattern, but requires careful integration with tldraw store)

### Ready for Planning

Research complete. Planner can now create PLAN.md files with awareness of:
- Yjs integration pattern is established but not trivial
- Per-user undo is a significant risk requiring discussion
- License decision needed before production deployment
