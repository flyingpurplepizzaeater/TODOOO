# Phase 1: Real-Time Infrastructure - Research

**Researched:** 2026-01-19
**Domain:** Real-time CRDT synchronization with pycrdt-websocket
**Confidence:** HIGH

## Summary

Phase 1 establishes the real-time synchronization foundation using Yjs CRDTs with pycrdt-websocket on the backend and y-websocket on the frontend. The research confirms the stack is production-ready (powers JupyterLab) but requires careful attention to persistence configuration, room lifecycle management, and reconnection handling.

Key findings:
- pycrdt-websocket v0.16.0 provides async WebSocket server with room-based document management
- y-websocket client has built-in exponential backoff reconnection (maxBackoffTime default: 2500ms)
- y-indexeddb enables offline editing with automatic merge on reconnection
- SQLiteYStore persistence requires proactive size management (can grow unbounded)

**Primary recommendation:** Use pycrdt-websocket with custom SQLite persistence (not default SQLiteYStore) to control document compaction, combined with y-indexeddb on client for offline support.

## Standard Stack

The established libraries for real-time CRDT synchronization:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pycrdt-websocket | 0.16.0 | Python WebSocket server for Yjs | Powers JupyterLab; async native; actively maintained |
| pycrdt | 0.10.x | Python Yjs bindings (Rust-based) | Replaced archived ypy; high performance |
| y-websocket | 2.x | Client WebSocket provider | Official Yjs provider; exponential backoff built-in |
| y-indexeddb | 9.x | Client offline persistence | Browser IndexedDB; automatic merge on reconnect |
| Yjs | 13.x | CRDT library | 900K+ weekly downloads; dominant ecosystem |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| y-protocols | 1.x | Yjs sync/awareness protocols | Included with y-websocket |
| aiosqlite | 0.20.x | Async SQLite | Custom persistence layer |
| jwt | any | Token validation | WebSocket authentication |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pycrdt-websocket | y-redis | Redis adds infrastructure; better for multi-instance |
| y-indexeddb | localStorage | IndexedDB handles larger documents; localStorage has 5MB limit |
| Custom persistence | SQLiteYStore | SQLiteYStore grows unbounded; custom allows compaction |

**Installation:**

```bash
# Backend (Python)
pip install pycrdt>=0.10.0 pycrdt-websocket>=0.16.0 aiosqlite>=0.20.0

# Frontend (npm)
npm install yjs y-websocket y-indexeddb
```

## Architecture Patterns

### Recommended Project Structure

```
backend/
  canvas/
    __init__.py
    room_manager.py      # Room lifecycle, document management
    persistence.py       # Custom SQLite persistence
    auth.py              # WebSocket token validation
  routers/
    canvas.py            # REST endpoints for rooms, permissions
  models.py              # CanvasRoom, CanvasPermission models

frontend/
  src/
    hooks/
      useYjs.ts          # Y.Doc and provider management
      useOffline.ts      # y-indexeddb integration
      useReconnect.ts    # Connection status tracking
    stores/
      canvasStore.ts     # Yjs document state
```

### Pattern 1: Room-Based Document Management

**What:** Each board is a "room" with its own Y.Doc instance managed server-side.

**When to use:** Always - this is the pycrdt-websocket architecture.

**Example:**

```python
# Source: pycrdt-websocket documentation
from pycrdt import Doc
from pycrdt_websocket import WebSocketServer

class RoomManager:
    def __init__(self):
        self.rooms: dict[str, Doc] = {}

    async def get_or_create_room(self, room_id: str) -> Doc:
        if room_id not in self.rooms:
            ydoc = Doc()
            # Load persisted state if exists
            state = await self.load_state(room_id)
            if state:
                ydoc.apply_update(state)
            self.rooms[room_id] = ydoc
        return self.rooms[room_id]

    async def persist_room(self, room_id: str):
        if room_id in self.rooms:
            state = self.rooms[room_id].get_state()
            await self.save_state(room_id, state)
```

### Pattern 2: Client-Side Offline Support with y-indexeddb

**What:** Persist Y.Doc to IndexedDB for offline editing; merge on reconnection.

**When to use:** Always - provides resilience against network drops.

**Example:**

```typescript
// Source: Yjs documentation - Offline Support
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

const ydoc = new Y.Doc()
const roomName = 'board-abc123'

// Offline persistence - loads instantly, persists locally
const persistence = new IndexeddbPersistence(roomName, ydoc)
persistence.on('synced', () => {
  console.log('Local state loaded from IndexedDB')
})

// Network sync - reconnects automatically with backoff
const wsProvider = new WebsocketProvider(
  'wss://api.example.com/ws/canvas',
  roomName,
  ydoc,
  {
    maxBackoffTime: 30000,  // Max 30s between reconnection attempts
    params: { token: getAuthToken() }
  }
)

wsProvider.on('status', ({ status }) => {
  // 'disconnected' | 'connecting' | 'connected'
  updateConnectionIndicator(status)
})

wsProvider.on('sync', (isSynced) => {
  if (isSynced) {
    highlightChangesWhileOffline()
  }
})
```

### Pattern 3: WebSocket Authentication with JWT

**What:** Validate JWT before accepting WebSocket connection.

**When to use:** Always - authentication required for room access.

**Example:**

```python
# Source: FastAPI WebSocket documentation + pycrdt-websocket
from fastapi import WebSocket, Query
from fastapi.websockets import WebSocketDisconnect

@app.websocket("/ws/canvas/{room_id}")
async def canvas_websocket(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...)
):
    # Validate token before accepting connection
    try:
        user = await verify_token(token)
    except InvalidTokenError:
        await websocket.close(code=4001)  # Custom code: unauthorized
        return

    # Check room access permissions
    permission = await get_room_permission(user.id, room_id)
    if not permission:
        await websocket.close(code=4003)  # Custom code: forbidden
        return

    # Accept connection and hand off to pycrdt-websocket
    await websocket.accept()
    room = await room_manager.get_or_create_room(room_id)

    # Log access for audit trail
    await log_room_access(user.id, room_id, permission.level)

    # Handle Yjs sync protocol
    await handle_yjs_sync(websocket, room, user)
```

### Pattern 4: Permission-Based Sharing

**What:** Three-level permissions (View, Comment, Edit) with team and public access.

**When to use:** For SYNC-04 (shareable links with permissions).

**Example:**

```python
# models.py
from enum import Enum

class PermissionLevel(str, Enum):
    VIEW = "view"
    COMMENT = "comment"
    EDIT = "edit"

class BoardPermission(Base):
    __tablename__ = "board_permissions"

    id = Column(Integer, primary_key=True)
    board_id = Column(String, ForeignKey("boards.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for public
    level = Column(Enum(PermissionLevel))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Sharing URL patterns:
# Team board: /board/{board_id}?token={jwt}
# Public view: /board/{board_id}/public
# Public edit: /board/{board_id}/public?edit=true
```

### Anti-Patterns to Avoid

- **Storing canvas elements in SQL rows:** Defeats CRDT benefits; store Y.Doc binary state instead
- **Full state sync on every change:** Use Yjs incremental updates (deltas only)
- **Single WebSocket for JSON and CRDT:** Keep separate routes for different protocols
- **Custom conflict resolution:** Let Yjs handle it; don't reinvent CRDTs
- **Synchronous persistence:** Always persist asynchronously to avoid blocking sync

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conflict resolution | Custom merge logic | Yjs CRDT | 5+ years of edge case handling |
| Reconnection backoff | setTimeout loops | y-websocket built-in | Handles all edge cases correctly |
| Offline queue | localStorage queue | y-indexeddb | Automatic merge, no manual queue |
| Cursor presence | Custom WebSocket events | Yjs awareness protocol | Built into y-websocket |
| Document persistence | Per-field database rows | Y.Doc binary state | Preserves CRDT integrity |
| Cross-tab sync | Custom BroadcastChannel | y-websocket built-in | Automatic tab synchronization |

**Key insight:** Yjs and its ecosystem have solved these problems over years of production use. Custom solutions will have bugs that take months to discover.

## Common Pitfalls

### Pitfall 1: SQLiteYStore Unbounded Growth

**What goes wrong:** Default SQLiteYStore stores every update forever. JupyterLab users report databases growing to 100MB+ in weeks.

**Why it happens:** pycrdt-websocket's SQLiteYStore logs all updates for replay; no built-in compaction.

**How to avoid:**
1. Implement custom persistence that stores only current state (not update log)
2. Periodically compact: save full state, clear update history
3. Set maximum document age or size thresholds

**Warning signs:** `.ystore.db` file growing larger than expected, slow room loading.

```python
# Custom compacted persistence
async def persist_compacted(room_id: str, ydoc: Doc):
    """Store only current state, not update history."""
    state = ydoc.get_state()  # Full state vector
    await db.execute(
        "INSERT OR REPLACE INTO board_state (room_id, state, updated_at) VALUES (?, ?, ?)",
        (room_id, state, datetime.utcnow())
    )
```

### Pitfall 2: Infinite Event Loops

**What goes wrong:** Canvas change triggers Yjs update, which triggers canvas update, infinite loop.

**Why it happens:** Not tracking whether change originated locally or remotely.

**How to avoid:** Use Yjs transaction origin tracking.

**Warning signs:** CPU spike to 100%, WebSocket message explosion, "Maximum call stack" errors.

```typescript
// Track change origin
ydoc.transact(() => {
  ymap.set('shape', data)
}, 'local')  // Mark as local

ydoc.on('update', (update, origin) => {
  if (origin === 'local') return  // Don't re-apply local changes
  applyToCanvas(update)
})
```

### Pitfall 3: Missing Reconnection Handling

**What goes wrong:** Connection drops silently; user continues editing unaware they're offline.

**Why it happens:** No UI feedback for connection status.

**How to avoid:**
1. Monitor `wsProvider.on('status')` events
2. Show subtle indicator when disconnected
3. Inform user when reconnected and synced

**Warning signs:** Users report "changes disappeared" after network issues.

### Pitfall 4: Room Memory Leaks

**What goes wrong:** Rooms stay in memory forever even when no clients connected.

**Why it happens:** No cleanup mechanism for inactive rooms.

**How to avoid:**
1. Track last activity time per room
2. Persist and unload rooms after inactivity timeout
3. Reload on-demand when clients reconnect

**Decision from CONTEXT.md:** "Rooms kept in memory when inactive" - implement with reasonable timeout (e.g., 30 minutes).

### Pitfall 5: Blocking Persistence Operations

**What goes wrong:** Synchronous database writes block WebSocket message processing.

**Why it happens:** Using sync database calls instead of async.

**How to avoid:**
1. Use async database operations (aiosqlite)
2. Debounce persistence (save every 5 seconds, not every change)
3. Background persistence task

## Code Examples

### Complete WebSocket Handler with Auth and Sync

```python
# Source: Combination of FastAPI docs + pycrdt-websocket patterns
from fastapi import WebSocket, Query, WebSocketDisconnect
from pycrdt import Doc
import asyncio

class CanvasWebSocketHandler:
    def __init__(self, room_manager, persistence):
        self.room_manager = room_manager
        self.persistence = persistence
        self.save_debounce: dict[str, asyncio.Task] = {}

    async def handle(self, websocket: WebSocket, room_id: str, user: User, permission: PermissionLevel):
        room = await self.room_manager.get_or_create_room(room_id)

        try:
            while True:
                # Receive Yjs sync message (binary)
                data = await websocket.receive_bytes()

                # Apply update to room document
                room.apply_update(data)

                # Broadcast to other clients in room
                await self.room_manager.broadcast(room_id, data, exclude=websocket)

                # Debounced persistence
                await self.schedule_persist(room_id)

        except WebSocketDisconnect:
            await self.room_manager.remove_client(room_id, websocket)

    async def schedule_persist(self, room_id: str):
        """Debounce persistence to every 5 seconds."""
        if room_id in self.save_debounce:
            self.save_debounce[room_id].cancel()

        async def persist_later():
            await asyncio.sleep(5)
            await self.persistence.save(room_id, self.room_manager.rooms[room_id])

        self.save_debounce[room_id] = asyncio.create_task(persist_later())
```

### Client-Side Connection Management with Status Tracking

```typescript
// Source: y-websocket documentation + Yjs offline support
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected'
  synced: boolean
  lastDisconnect: Date | null
}

export function createCanvasSync(roomId: string, token: string) {
  const ydoc = new Y.Doc()
  const state: ConnectionState = {
    status: 'disconnected',
    synced: false,
    lastDisconnect: null
  }

  // Offline persistence
  const idb = new IndexeddbPersistence(roomId, ydoc)

  // Network sync with configured reconnection
  const ws = new WebsocketProvider(
    `wss://${window.location.host}/ws/canvas`,
    roomId,
    ydoc,
    {
      maxBackoffTime: 30000,  // 30 second max backoff (per CONTEXT.md)
      params: { token }
    }
  )

  // Connection status tracking
  ws.on('status', ({ status }) => {
    const wasConnected = state.status === 'connected'
    state.status = status

    if (wasConnected && status === 'disconnected') {
      state.lastDisconnect = new Date()
    }

    onConnectionStatusChange(state)
  })

  // Sync status tracking
  ws.on('sync', (isSynced) => {
    state.synced = isSynced

    if (isSynced && state.lastDisconnect) {
      // Highlight changes made while offline
      highlightRecentChanges(state.lastDisconnect)
      state.lastDisconnect = null
    }
  })

  return { ydoc, ws, idb, state }
}
```

### Audit Log Implementation

```python
# Source: Custom implementation for CONTEXT.md requirement
from datetime import datetime
from enum import Enum

class AuditAction(str, Enum):
    ROOM_ACCESS = "room_access"
    PERMISSION_CHANGE = "permission_change"
    ROOM_CREATE = "room_create"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(String, ForeignKey("boards.id"))
    action = Column(Enum(AuditAction))
    permission_level = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

async def log_room_access(user_id: int, room_id: str, permission: str, request: Request):
    log = AuditLog(
        user_id=user_id,
        room_id=room_id,
        action=AuditAction.ROOM_ACCESS,
        permission_level=permission,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    async with async_session() as session:
        session.add(log)
        await session.commit()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ypy | pycrdt | April 2025 | ypy archived; must use pycrdt |
| pycrdt_websocket | pycrdt.websocket | June 2025 | Package renamed; import paths changed |
| Manual reconnect | y-websocket built-in | Always | Use maxBackoffTime option |
| Cookie auth for WS | Query param token | Current best practice | Browser WS limitations |

**Deprecated/outdated:**
- **ypy:** Archived April 2025; use pycrdt
- **ypy-websocket:** Use pycrdt-websocket instead
- **Full state sync:** Use incremental Yjs updates only

## Open Questions

Things that couldn't be fully resolved:

1. **Conflict Duplicate Detection**
   - What we know: Yjs uses last-write-wins for Y.Map scalar values
   - What's unclear: How to detect when two users moved same object to different positions
   - Recommendation: Use y-lwwmap for position tracking or implement custom conflict detection layer on top of Y.Map by comparing previous/current values

2. **"Compatible" vs "Incompatible" Edit Detection**
   - What we know: CONTEXT.md requires: "Compatible edits merge silently, incompatible create duplicates"
   - What's unclear: Yjs doesn't distinguish these natively; all edits merge
   - Recommendation: Implement application-level conflict detection:
     - Track `lastModifiedBy` and `lastModifiedAt` per element
     - If same element modified by different users within time window, flag as potential conflict
     - Let users resolve visually (not automatic duplicate creation)

3. **Room Memory Retention Duration**
   - What we know: CONTEXT.md says "rooms kept in memory when inactive"
   - What's unclear: How long to keep before persisting and unloading
   - Recommendation: Keep rooms in memory for 30 minutes after last client disconnects; persist and unload after

4. **Audit Log Retention**
   - What we know: Audit log required for "who accessed, when, what permission"
   - What's unclear: Retention period not specified
   - Recommendation: 90 days retention with configurable setting

## Sources

### Primary (HIGH confidence)

- [pycrdt-websocket GitHub](https://github.com/y-crdt/pycrdt-websocket) - v0.16.0, room architecture
- [pycrdt-websocket Documentation](https://y-crdt.github.io/pycrdt-websocket/) - API reference
- [Yjs Documentation - Offline Support](https://docs.yjs.dev/getting-started/allowing-offline-editing) - y-indexeddb integration
- [y-websocket GitHub](https://github.com/yjs/y-websocket) - WebsocketProvider API, reconnection options
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/) - WebSocket endpoint patterns

### Secondary (MEDIUM confidence)

- [Yjs Fundamentals - Sync & Awareness](https://medium.com/dovetail-engineering/yjs-fundamentals-part-2-sync-awareness-73b8fabc2233) - Sync protocol details
- [Y-Sweet 0.7.0 Offline Support](https://jamsocket.com/blog/y-sweet-offline-support) - Reconnection patterns
- [JupyterLab Collaboration Architecture](https://jupyterlab-realtime-collaboration.readthedocs.io/en/latest/developer/architecture.html) - SQLiteYStore usage patterns
- [y-lwwmap](https://github.com/rozek/y-lwwmap) - Last-write-wins conflict resolution
- [FastAPI WebSocket Authentication](https://hexshift.medium.com/securing-websocket-connections-in-fastapi-fe4c0ea59c59) - Auth patterns

### Tertiary (LOW confidence)

- [JupyterLab YStore Issue](https://github.com/jupyterlab/jupyter-collaboration/issues/430) - SQLiteYStore growth concerns (needs validation)
- [WebSocket Exponential Backoff](https://dev.to/hexshift/robust-websocket-reconnection-strategies-in-javascript-with-exponential-backoff-40n1) - General patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - pycrdt-websocket and y-websocket are well-documented, production-tested
- Architecture: HIGH - Patterns verified from Yjs docs and JupyterLab usage
- Pitfalls: HIGH - SQLiteYStore growth issues documented in JupyterLab issues
- Conflict detection: MEDIUM - Yjs handles basic conflicts; custom layer needed for CONTEXT.md requirements

**Research date:** 2026-01-19
**Valid until:** ~30 days (stable ecosystem; pycrdt-websocket recently renamed package)

---

*Phase: 01-real-time-infrastructure*
*Research complete: 2026-01-19*
