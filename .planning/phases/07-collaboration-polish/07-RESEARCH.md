# Phase 7: Collaboration Polish - Research

**Researched:** 2026-01-22
**Domain:** Real-time collaboration UI (cursors, presence, viewport following)
**Confidence:** MEDIUM

## Summary

Phase 7 adds visual collaboration features to the existing Yjs-based sync infrastructure. The core technologies are already in place (y-websocket, pycrdt-websocket, tldraw), and this phase focuses on leveraging the **Yjs Awareness API** for transient presence data (cursor positions, user info, activity status) and tldraw's built-in **collaboration components** for rendering.

The key insight is that Yjs separates **document state** (CRDT, persisted) from **awareness state** (ephemeral, not persisted). Cursors and presence belong in awareness, not the document. The y-websocket provider already includes awareness support via `provider.awareness`, which syncs automatically with the server.

**Primary recommendation:** Use the existing y-websocket provider's awareness API for all presence data. Sync awareness state to tldraw's `TLInstancePresence` records via `store.mergeRemoteChanges()`. Leverage tldraw's built-in `CollaboratorCursor` component with custom styling for the dot shape requirement.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yjs | ^13.6.29 | CRDT foundation | Dominant collaborative editing library |
| y-websocket | ^3.0.0 | WebSocket sync + awareness | Built-in awareness protocol support |
| tldraw | ^4.2.3 | Canvas rendering + collaboration UI | Native collaboration component support |

### Supporting (New)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| y-protocols | ^1.x | Awareness protocol types | Already bundled with y-websocket |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| y-websocket awareness | Custom WebSocket for presence | More control but duplicates existing infrastructure |
| tldraw CollaboratorCursor | Custom cursor component | Less integration but full visual control |
| y-presence React hooks | Custom awareness hooks | Cleaner API but adds dependency |

**Installation:**
```bash
# No new packages needed - y-websocket already includes awareness
```

## Architecture Patterns

### Recommended Data Flow
```
[User moves cursor]
       |
       v
[Update local awareness state]
  provider.awareness.setLocalStateField('cursor', {x, y})
       |
       v
[y-websocket broadcasts to all peers]
       |
       v
[Remote clients receive awareness update]
  provider.awareness.on('change', handler)
       |
       v
[Create TLInstancePresence record]
  InstancePresenceRecordType.create({...})
       |
       v
[Merge into tldraw store]
  store.mergeRemoteChanges(() => store.put([presenceRecord]))
       |
       v
[tldraw renders CollaboratorCursor]
```

### Pattern 1: Awareness State Structure
**What:** Define consistent awareness state schema across clients
**When to use:** Always - ensures all clients interpret presence data correctly

```typescript
// Source: https://docs.yjs.dev/getting-started/adding-awareness
interface AwarenessState {
  user: {
    id: string
    name: string
    color: string  // Hex color for cursor/avatar
  }
  cursor: {
    x: number
    y: number
    type: 'default' | 'pointer' | 'grab'
    rotation: number
  } | null  // null when cursor leaves canvas
  selection: string[]  // Array of selected shape IDs
  viewport: {
    x: number
    y: number
    zoom: number
  }
  lastActivity: number  // Timestamp for idle detection
}
```

### Pattern 2: Throttled Cursor Updates
**What:** Throttle cursor position updates to reduce network traffic
**When to use:** Always for cursor position syncing

```typescript
// Source: Best practices from Yjs community
import { throttle } from 'lodash-es'  // Or implement custom

const CURSOR_UPDATE_INTERVAL = 50  // ms - balance smoothness vs bandwidth

const updateCursorPosition = throttle((x: number, y: number) => {
  provider.awareness.setLocalStateField('cursor', {
    x,
    y,
    type: 'default',
    rotation: 0
  })
}, CURSOR_UPDATE_INTERVAL)

// On pointer move
editor.on('pointer-move', (event) => {
  updateCursorPosition(event.point.x, event.point.y)
})
```

### Pattern 3: TLInstancePresence Integration
**What:** Convert Yjs awareness to tldraw presence records
**When to use:** When syncing remote cursors to tldraw

```typescript
// Source: https://tldraw.dev/examples/editor-api/user-presence
import { InstancePresenceRecordType } from 'tldraw'

function awarenessToPresence(
  clientId: number,
  state: AwarenessState,
  currentPageId: string
): TLInstancePresence {
  return InstancePresenceRecordType.create({
    id: InstancePresenceRecordType.createId(String(clientId)),
    currentPageId,
    userId: state.user.id,
    userName: state.user.name,
    color: state.user.color,
    cursor: state.cursor ? {
      x: state.cursor.x,
      y: state.cursor.y,
      type: state.cursor.type,
      rotation: state.cursor.rotation
    } : { x: 0, y: 0, type: 'default', rotation: 0 },
    lastActivityTimestamp: state.lastActivity,
    // Optional fields
    chatMessage: '',
  })
}
```

### Pattern 4: Presence List Sidebar
**What:** React component for presence panel
**When to use:** For the sidebar showing online collaborators

```typescript
// Source: https://tldraw.dev/docs/collaboration
import { useValue } from 'tldraw'

function PresenceSidebar({ editor }: { editor: Editor }) {
  // Reactive - updates when collaborators change
  const collaborators = useValue(
    'collaborators',
    () => editor.getCollaborators(),
    [editor]
  )

  return (
    <aside className="presence-sidebar">
      {collaborators.map(collab => (
        <CollaboratorItem
          key={collab.id}
          collaborator={collab}
          onFollow={() => editor.startFollowingUser(collab.userId)}
        />
      ))}
    </aside>
  )
}
```

### Anti-Patterns to Avoid
- **Storing cursors in Y.Doc:** Cursor positions are ephemeral - use Awareness, not the CRDT document
- **Unthrottled cursor updates:** Can flood network with 60+ updates/second per user
- **Missing lastActivityTimestamp:** Without this, tldraw hides cursors (defaults to 0 = always hidden)
- **Forgetting to clear awareness on unmount:** Causes "ghost cursors" that persist after user leaves

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cursor rendering | Custom SVG cursor | `TLComponents.CollaboratorCursor` | Handles rotation, z-index, animations |
| Selection outlines | Custom selection box | `TLComponents.CollaboratorShapeIndicator` | Integrates with tldraw selection system |
| Presence sync | Custom WebSocket messages | y-websocket awareness | Already handles encoding, heartbeats, offline detection |
| Color assignment | Manual color picking | Auto-assign from palette | Prevents conflicts, maximizes contrast |
| Idle detection | Manual timers | Awareness timeout (30s default) | Built into y-websocket protocol |
| Viewport following | Manual camera sync | `editor.startFollowingUser()` | Handles smooth interpolation |

**Key insight:** tldraw and y-websocket both have mature collaboration systems. The work is integration, not implementation.

## Common Pitfalls

### Pitfall 1: Ghost Cursors After Disconnect
**What goes wrong:** Cursors remain visible after user disconnects
**Why it happens:** Awareness state not cleared on unmount or disconnect
**How to avoid:**
```typescript
useEffect(() => {
  return () => {
    provider.awareness.setLocalState(null)  // Mark offline
  }
}, [])
```
**Warning signs:** Stale cursors after browser close, duplicate cursors

### Pitfall 2: Cursor Hidden Due to Missing Timestamp
**What goes wrong:** Remote cursors never appear or always hidden
**Why it happens:** `lastActivityTimestamp` defaults to 0, which tldraw interprets as "inactive"
**How to avoid:** Always include `Date.now()` in presence records
**Warning signs:** Cursor position syncing works (via logs) but nothing renders

### Pitfall 3: Echo Loop with Cursor Updates
**What goes wrong:** Cursor positions bounce between clients infinitely
**Why it happens:** Not filtering own updates when processing awareness changes
**How to avoid:**
```typescript
provider.awareness.on('change', ({ added, updated, removed }) => {
  const localClientId = provider.awareness.clientID
  const remoteChanges = [...added, ...updated].filter(id => id !== localClientId)
  // Only process remoteChanges
})
```
**Warning signs:** High CPU, network saturation, cursor jitter

### Pitfall 4: Color Conflicts Between Users
**What goes wrong:** Multiple users have same cursor color
**Why it happens:** Random color selection without coordination
**How to avoid:**
- Server assigns colors on room join (stored per-room)
- Or use deterministic hash: `userColorFromId(userId)`
- Pre-defined palette with automatic cycling
**Warning signs:** Confusion about "whose cursor is whose"

### Pitfall 5: Performance with Many Collaborators
**What goes wrong:** Lag and high memory with 10+ simultaneous users
**Why it happens:** Too many awareness updates, unbatched store updates
**How to avoid:**
- Batch presence record updates
- Consider hiding cursors for users on different pages
- Throttle awareness propagation more aggressively for high user counts
**Warning signs:** FPS drop, memory growth, update lag

## Code Examples

Verified patterns from official sources:

### Awareness Hook Setup
```typescript
// Source: https://docs.yjs.dev/getting-started/adding-awareness
import { useEffect, useRef, useState } from 'react'
import { WebsocketProvider } from 'y-websocket'

interface UseAwarenessOptions {
  provider: WebsocketProvider
  initialState: Partial<AwarenessState>
}

export function useAwareness({ provider, initialState }: UseAwarenessOptions) {
  const [others, setOthers] = useState<Map<number, AwarenessState>>(new Map())
  const localClientId = useRef(provider.awareness.clientID)

  useEffect(() => {
    const awareness = provider.awareness

    // Set initial local state
    awareness.setLocalState({
      user: initialState.user,
      cursor: null,
      selection: [],
      viewport: null,
      lastActivity: Date.now()
    })

    // Subscribe to changes
    const handleChange = () => {
      const states = new Map<number, AwarenessState>()
      awareness.getStates().forEach((state, clientId) => {
        if (clientId !== localClientId.current && state) {
          states.set(clientId, state as AwarenessState)
        }
      })
      setOthers(states)
    }

    awareness.on('change', handleChange)
    handleChange()  // Initial population

    return () => {
      awareness.off('change', handleChange)
      awareness.setLocalState(null)  // Mark offline
    }
  }, [provider, initialState])

  const setLocalField = <K extends keyof AwarenessState>(
    field: K,
    value: AwarenessState[K]
  ) => {
    provider.awareness.setLocalStateField(field, value)
    // Also update lastActivity
    provider.awareness.setLocalStateField('lastActivity', Date.now())
  }

  return { others, localClientId: localClientId.current, setLocalField }
}
```

### Presence Sync to Tldraw Store
```typescript
// Source: https://tldraw.dev/examples/editor-api/user-presence
import { Editor, InstancePresenceRecordType, TLInstancePresence } from 'tldraw'

export function syncAwarenessToTldraw(
  editor: Editor,
  others: Map<number, AwarenessState>
) {
  const currentPageId = editor.getCurrentPageId()

  editor.store.mergeRemoteChanges(() => {
    // Get existing collaborator presence records
    const existingIds = new Set(
      editor.getCollaborators().map(c => c.id)
    )

    // Create/update presence records for all remote users
    const presenceRecords: TLInstancePresence[] = []
    others.forEach((state, clientId) => {
      if (state.cursor) {  // Only show users with active cursors
        presenceRecords.push(
          InstancePresenceRecordType.create({
            id: InstancePresenceRecordType.createId(String(clientId)),
            currentPageId,
            userId: state.user.id,
            userName: state.user.name,
            color: state.user.color,
            cursor: {
              x: state.cursor.x,
              y: state.cursor.y,
              type: state.cursor.type,
              rotation: state.cursor.rotation
            },
            lastActivityTimestamp: state.lastActivity,
          })
        )
      }
    })

    if (presenceRecords.length > 0) {
      editor.store.put(presenceRecords)
    }

    // Remove presence for disconnected users
    const currentIds = new Set(
      presenceRecords.map(r => r.id)
    )
    const toRemove = [...existingIds].filter(id => !currentIds.has(id))
    if (toRemove.length > 0) {
      editor.store.remove(toRemove as TLInstancePresence['id'][])
    }
  })
}
```

### Custom Dot Cursor Component
```typescript
// Source: https://tldraw.dev/reference/editor/TLEditorComponents
import { TLCursorProps } from 'tldraw'

// Per CONTEXT.md: dot/circle shape, 16-20px, username on hover
export function DotCursor({ color, name, zoom }: TLCursorProps) {
  const [showName, setShowName] = useState(false)
  const size = 18 / zoom  // Maintain consistent screen size

  return (
    <div
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={() => setShowName(true)}
      onMouseLeave={() => setShowName(false)}
    >
      {/* Dot cursor */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
      {/* Username label - shown on hover */}
      {showName && name && (
        <div
          style={{
            position: 'absolute',
            top: size + 4,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: color,
            color: 'white',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          {name}
        </div>
      )}
    </div>
  )
}
```

### Color Palette for Cursor Assignment
```typescript
// Source: Claude's discretion per CONTEXT.md

// 12-color palette optimized for distinguishability
export const COLLABORATOR_COLORS = [
  '#FF6B6B',  // Red
  '#4ECDC4',  // Teal
  '#FFE66D',  // Yellow
  '#95E1D3',  // Mint
  '#F38181',  // Coral
  '#6C5CE7',  // Purple
  '#00B894',  // Green
  '#FDCB6E',  // Gold
  '#74B9FF',  // Blue
  '#E17055',  // Orange
  '#A29BFE',  // Lavender
  '#55A3FF',  // Sky
]

export function assignUserColor(userIndex: number): string {
  return COLLABORATOR_COLORS[userIndex % COLLABORATOR_COLORS.length]
}

// Or deterministic from user ID
export function colorFromUserId(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash  // Convert to 32-bit int
  }
  return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom WebSocket for presence | Yjs Awareness protocol | 2020+ | Standardized, less code |
| Manual cursor interpolation | tldraw built-in components | tldraw v4 | Smoother rendering |
| ypy Python bindings | pycrdt | April 2025 | ypy archived, pycrdt maintained |
| Y.Map for all data | Awareness for transient data | Original Yjs design | Prevents document bloat |

**Deprecated/outdated:**
- ypy: Archived April 2025, replaced by pycrdt (already using pycrdt)
- Manual cursor rendering: tldraw provides `CollaboratorCursor` component
- Storing cursors in CRDT document: Use Awareness protocol instead

## Open Questions

Things that couldn't be fully resolved:

1. **pycrdt Awareness API specifics**
   - What we know: pycrdt-websocket includes awareness.py module, compatible with y-websocket
   - What's unclear: Exact Python API for configuring awareness on server side
   - Recommendation: The y-websocket client handles awareness automatically; server likely just relays. Test with existing setup first.

2. **Backend color assignment**
   - What we know: User colors should be consistent and distinct
   - What's unclear: Whether server should assign colors (persisted) or client should derive from userId
   - Recommendation: Start with client-side deterministic coloring (from userId hash), add server assignment later if conflicts arise

3. **Idle detection implementation**
   - What we know: Awareness has 30s heartbeat; CONTEXT.md specifies 30s cursor fade, 2min idle status
   - What's unclear: Whether to use awareness timeout or custom timer
   - Recommendation: Use custom `lastActivity` timestamp in awareness state for fine-grained control (30s fade, 2min idle status)

## Sources

### Primary (HIGH confidence)
- [Yjs Awareness & Presence Docs](https://docs.yjs.dev/getting-started/adding-awareness) - Official getting started
- [Yjs Awareness API Reference](https://docs.yjs.dev/api/about-awareness) - API methods
- [tldraw Collaboration Docs](https://tldraw.dev/docs/collaboration) - Official collaboration guide
- [tldraw TLEditorComponents](https://tldraw.dev/reference/editor/TLEditorComponents) - Component customization
- [tldraw User Presence Example](https://tldraw.dev/examples/editor-api/user-presence) - Presence record creation

### Secondary (MEDIUM confidence)
- [y-websocket GitHub](https://github.com/yjs/y-websocket) - Provider with awareness support
- [Tag1 Yjs Deep Dive Part 3](https://www.tag1.com/blog/yjs-deep-dive-part-3) - Awareness best practices
- [DEV.to Yjs React Tutorial](https://dev.to/route06/tutorial-building-a-collaborative-editing-app-with-yjs-valtio-and-react-1mcl) - React awareness hook pattern

### Tertiary (LOW confidence)
- [tlsync-yjs GitHub](https://github.com/shahriar-shojib/tlsync-yjs) - WIP tldraw v2 + Yjs example
- [Liveblocks tldraw-yjs example](https://github.com/liveblocks/liveblocks/blob/main/examples/nextjs-tldraw-whiteboard-yjs) - Alternative integration approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing installed libraries with documented features
- Architecture: MEDIUM - Pattern synthesis from multiple sources; core APIs well-documented
- Pitfalls: MEDIUM - Based on community experience and API documentation

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable libraries with mature APIs)
