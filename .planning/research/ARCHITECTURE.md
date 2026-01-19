# Architecture Patterns: Collaborative Whiteboard

**Domain:** Real-time collaborative whiteboard with TODO integration
**Researched:** 2026-01-19
**Confidence:** HIGH (based on WebSearch with multiple authoritative sources, official documentation, and production system analysis from Excalidraw, tldraw, Miro)

---

## Executive Summary

Real-time collaborative whiteboards require a layered architecture separating canvas rendering, sync protocol, and persistence. The existing FastAPI/WebSocket infrastructure provides a solid foundation. Two viable architectural approaches exist:

**Option A: Full CRDT (Yjs + tldraw/pycrdt)** - Recommended
- Best for: Offline-first, complex merge scenarios, production-grade collaboration
- Complexity: Higher - requires understanding CRDT semantics
- Powers: JupyterLab, Notion-like apps

**Option B: LWW-Element-Set (Custom approach)**
- Best for: Always-online, simpler implementation, faster initial development
- Complexity: Lower - straightforward timestamp comparison
- Fallback if licensing or bundle size are concerns

---

## Recommended Architecture (Option A: Yjs/CRDT)

### High-Level Overview

```
+------------------+      +-------------------+      +------------------+
|                  |      |                   |      |                  |
|  React SPA       |<---->|  FastAPI Backend  |<---->|  SQLite/Postgres |
|  (tldraw)        |      |                   |      |                  |
|                  |      +-------------------+      +------------------+
+--------+---------+              |
         |                        |
         |  WebSocket             |  REST API
         |  (Yjs binary sync)     |  (Auth, Teams, TODOs)
         v                        v
+------------------+      +-------------------+
|                  |      |                   |
|  pycrdt-         |      |  MinIO            |
|  websocket       |      |  (File Storage)   |
|                  |      |                   |
+------------------+      +-------------------+
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Location |
|-----------|----------------|-------------------|----------|
| **React SPA (tldraw)** | Canvas UI, local CRDT state, drawing tools | pycrdt-websocket (sync), FastAPI (auth, files) | `canvas_frontend/` |
| **FastAPI Backend** | Auth, REST API, file management | SQLite, MinIO, pycrdt-websocket | Existing `main.py`, new `routers/canvas.py` |
| **pycrdt-websocket** | CRDT sync, awareness protocol, binary WebSocket | React clients, persistence layer | New `canvas/room_manager.py` |
| **Presence Manager** | Cursor positions, user awareness (ephemeral) | pycrdt-websocket (awareness API) | Built into Yjs awareness |
| **MinIO** | Asset storage (images, uploaded files) | FastAPI (presigned URLs) | Docker container |
| **SQLite/Postgres** | User, team, TODO data, canvas room metadata | FastAPI | Existing `database.py` |

---

## Data Flow

### Canvas Sync Flow (Real-time Collaboration)

```
User A draws stroke
       |
       v
tldraw captures drawing event
       |
       v
Local Yjs Y.Doc updated (Y.Map for elements)
       |
       v
y-websocket provider sends binary CRDT update
       |
       v
pycrdt-websocket server receives
       |
       v
Server applies update to shared Y.Doc
       |
       v
Broadcasts to all clients in room
       |
       v
User B's Yjs Y.Doc merges update (automatic CRDT merge)
       |
       v
tldraw re-renders with merged state
```

### Conflict Resolution (CRDT Automatic)

With CRDTs, conflicts are resolved automatically:

```
1. User A and User B both modify element "rect-123" simultaneously

2. User A changes fill to "red" (timestamp T1, vector clock VA)
   User B changes fill to "blue" (timestamp T2, vector clock VB)

3. Both updates sent via WebSocket

4. Yjs CRDT merges:
   - Vector clocks compared
   - Deterministic merge rule applied
   - All clients converge to same state
   - No data loss, no manual resolution

5. Result: Last-write-wins semantics built into Yjs for scalar values
   (More sophisticated merge for sequences/text)
```

### Cursor/Presence Flow (Ephemeral - Not Persisted)

```
User moves cursor on canvas
       |
       v
y-awareness.setLocalStateField({ cursor: {x, y} })
       |
       v
Throttled to ~10-20Hz
       |
       v
pycrdt-websocket broadcasts awareness update
       |
       v
Other clients receive via awareness.on('change')
       |
       v
Render cursor overlay with user color/name
```

### File Upload Flow

```
User selects image
       |
       v
React requests presigned URL from FastAPI
       |
       v
FastAPI validates auth, generates MinIO presigned URL
       |
       v
React uploads directly to MinIO (bypasses FastAPI)
       |
       v
React adds image element to canvas with MinIO URL
       |
       v
Yjs syncs image element to other users
       |
       v
Other users' browsers load image from MinIO URL
```

### Authentication Flow (Hybrid - Jinja2 + React)

```
1. User visits /login (Jinja2 page)
2. User submits credentials
3. FastAPI validates, returns JWT token
4. Token stored in localStorage
5. User redirected to /canvas/{room_id} (React SPA)
6. React reads token from localStorage
7. WebSocket connection includes token: /ws/canvas/{room_id}?token=...
8. pycrdt-websocket validates token before accepting connection
```

---

## Real-time Sync Architecture (CRDT Details)

### Why Yjs/CRDT for Whiteboards

| Factor | Yjs CRDT | Custom LWW | OT (Google Docs style) |
|--------|----------|------------|------------------------|
| **Conflict handling** | Automatic, no data loss | Last edit wins | Requires central server |
| **Offline support** | Native | Manual implementation | Requires server |
| **Implementation time** | 1-2 weeks | 3-5 days | 2-4 weeks |
| **Production examples** | JupyterLab, tldraw.com | Many canvas apps | Google Docs |
| **Library maturity** | 5+ years, battle-tested | Custom code | Complex algorithms |
| **Undo/Redo** | Per-user local (complex) | Per-user local (simple) | Per-user local |

### Yjs Data Structures for Canvas

```javascript
// Canvas state as Yjs types
const ydoc = new Y.Doc();

// Elements as Y.Map (each element is a key-value entry)
const yElements = ydoc.getMap('elements');

// Element structure
yElements.set('rect-123', {
  type: 'rectangle',
  x: 100,
  y: 50,
  width: 200,
  height: 150,
  fill: '#3498db',
  stroke: '#2c3e50',
  // ... other properties
});

// Awareness for presence (ephemeral, not persisted)
const awareness = new awarenessProtocol.Awareness(ydoc);
awareness.setLocalStateField('cursor', { x: 450, y: 320 });
awareness.setLocalStateField('user', { name: 'Alice', color: '#ff0000' });
```

---

## Storage Model

### Canvas Room Metadata (SQL)

```python
# models.py additions

class CanvasRoom(Base):
    __tablename__ = "canvas_rooms"

    id = Column(String, primary_key=True)  # UUID
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Yjs document state stored as binary (for persistence)
    yjs_state = Column(LargeBinary, nullable=True)

    team = relationship("Team", back_populates="canvases")
```

### Asset Storage (MinIO + SQL Reference)

```python
class CanvasAsset(Base):
    __tablename__ = "canvas_assets"

    id = Column(String, primary_key=True)  # UUID
    room_id = Column(String, ForeignKey("canvas_rooms.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100))
    storage_key = Column(String(500))  # MinIO key: "canvas/{room_id}/{uuid}/{filename}"
    size_bytes = Column(Integer)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
```

### Yjs State Persistence

```python
# canvas/persistence.py

from pycrdt import Doc
from database import async_session
from models import CanvasRoom

async def save_room_state(room_id: str, ydoc: Doc):
    """Persist Yjs document state to database."""
    state = ydoc.get_state()  # Binary representation

    async with async_session() as session:
        room = await session.get(CanvasRoom, room_id)
        if room:
            room.yjs_state = state
            room.updated_at = datetime.utcnow()
            await session.commit()

async def load_room_state(room_id: str) -> bytes | None:
    """Load Yjs document state from database."""
    async with async_session() as session:
        room = await session.get(CanvasRoom, room_id)
        return room.yjs_state if room else None
```

---

## Patterns to Follow

### Pattern 1: Separate WebSocket Routes

**What:** Keep CRDT sync WebSocket separate from existing event WebSocket.

**Why:** CRDT uses binary protocol; events use JSON.

```python
# main.py

# Existing: JSON events for TODO updates
@app.websocket("/ws/teams/{team_id}")
async def todo_events(websocket: WebSocket, team_id: int, token: str = Query(...)):
    # ... existing JSON broadcast logic (ConnectionManager)

# New: Binary CRDT sync for canvas
from canvas.room_manager import canvas_websocket_handler

@app.websocket("/ws/canvas/{room_id}")
async def canvas_sync(websocket: WebSocket, room_id: str, token: str = Query(...)):
    # Validate token
    user = await verify_token(token)
    if not user:
        await websocket.close(code=4001)
        return

    # Verify room access (user is member of room's team)
    if not await can_access_room(user.id, room_id):
        await websocket.close(code=4003)
        return

    # pycrdt-websocket handles the binary Yjs protocol
    await canvas_websocket_handler(websocket, room_id, user)
```

### Pattern 2: Room-Based Document Management

**What:** Each canvas is a "room" with its own Yjs document.

```python
# canvas/room_manager.py

from pycrdt_websocket import WebSocketServer, Room
from pycrdt import Doc

class CanvasRoomManager:
    def __init__(self):
        self.server = WebSocketServer()
        self.rooms: dict[str, Room] = {}

    async def get_or_create_room(self, room_id: str) -> Room:
        if room_id not in self.rooms:
            # Load persisted state if exists
            state = await load_room_state(room_id)
            ydoc = Doc()
            if state:
                ydoc.apply_update(state)

            room = Room(ydoc=ydoc)
            self.rooms[room_id] = room

            # Auto-save on changes (debounced)
            room.ydoc.observe_deep(lambda events: self._queue_save(room_id))

        return self.rooms[room_id]

    async def _save_room(self, room_id: str):
        room = self.rooms.get(room_id)
        if room:
            await save_room_state(room_id, room.ydoc)

room_manager = CanvasRoomManager()
```

### Pattern 3: Presigned URLs for Assets

**What:** Generate time-limited upload URLs; client uploads directly to MinIO.

```python
# routers/canvas.py

from boto3 import client as boto3_client
from uuid import uuid4

s3 = boto3_client('s3',
    endpoint_url=settings.MINIO_URL,
    aws_access_key_id=settings.MINIO_ACCESS_KEY,
    aws_secret_access_key=settings.MINIO_SECRET_KEY
)

@router.post("/rooms/{room_id}/upload-url")
async def get_upload_url(
    room_id: str,
    filename: str,
    content_type: str,
    user: User = Depends(get_current_user)
):
    # Verify room access
    if not await can_access_room(user.id, room_id):
        raise HTTPException(403, "Not authorized")

    key = f"canvas/{room_id}/{uuid4()}/{filename}"
    upload_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'canvas-assets',
            'Key': key,
            'ContentType': content_type
        },
        ExpiresIn=3600  # 1 hour
    )

    # Public URL for accessing the asset
    asset_url = f"{settings.MINIO_PUBLIC_URL}/canvas-assets/{key}"

    return {"upload_url": upload_url, "asset_url": asset_url}
```

### Pattern 4: Throttled Presence Updates

**What:** Limit cursor/selection broadcasts to prevent flooding.

```javascript
// Frontend: useAwareness.ts

import { throttle } from 'lodash';

const PRESENCE_THROTTLE_MS = 50; // 20Hz max

export function usePresence(awareness: Awareness) {
  const updateCursor = useMemo(
    () => throttle((x: number, y: number) => {
      awareness.setLocalStateField('cursor', { x, y });
    }, PRESENCE_THROTTLE_MS),
    [awareness]
  );

  return { updateCursor };
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Canvas Elements in SQL Rows

**What:** Creating a table row per canvas shape/stroke.

**Why bad:**
- Yjs handles conflict resolution; SQL cannot
- O(n) queries to load canvas
- Loses CRDT benefits (offline, automatic merge)

**Instead:** Store Yjs document binary state as a blob.

### Anti-Pattern 2: Full State Sync on Every Change

**What:** Broadcasting entire canvas state on every modification.

**Why bad:**
- O(n) bandwidth where n = element count
- Race conditions between state snapshots
- Defeats purpose of CRDTs

**Instead:** Use Yjs incremental updates (only changed deltas).

### Anti-Pattern 3: Proxying File Uploads Through FastAPI

**What:** Reading file into FastAPI memory, then forwarding to MinIO.

**Why bad:**
- Memory exhaustion with large files
- Blocks async event loop
- Double bandwidth

**Instead:** Use presigned URLs for direct client-to-MinIO uploads.

### Anti-Pattern 4: Mixing JSON and Binary on Same WebSocket

**What:** Sending both JSON events and Yjs updates on one connection.

**Why bad:**
- Different protocols require different parsing
- Complicates message handling
- Harder to debug

**Instead:** Separate WebSocket routes for each purpose.

### Anti-Pattern 5: Custom Conflict Resolution

**What:** Building own merge logic for concurrent edits.

**Why bad:**
- CRDTs already solve this correctly
- Edge cases take years to discover
- Yjs has 5+ years of production testing

**Instead:** Use Yjs; it handles all conflict resolution automatically.

---

## Integration with Existing Backend

### Current Codebase Structure

```
TODO/
  main.py           # FastAPI app, existing WebSocket route
  websocket.py      # ConnectionManager for JSON events
  routers/
    auth.py         # JWT auth
    teams.py        # Team management
    todos.py        # TODO CRUD
    lists.py        # List CRUD
  models.py         # SQLAlchemy models
  database.py       # Async SQLAlchemy session
  schemas.py        # Pydantic schemas
```

### Proposed Additions

```
TODO/
  main.py           # Add: React SPA mount, canvas WebSocket route
  websocket.py      # Keep as-is for JSON events
  canvas/           # NEW: Canvas module
    __init__.py
    room_manager.py # pycrdt-websocket integration
    persistence.py  # Yjs state save/load
  routers/
    canvas.py       # NEW: Canvas REST endpoints
  models.py         # Add: CanvasRoom, CanvasAsset
  canvas_frontend/  # NEW: React SPA source
    src/
      App.tsx
      components/
        Whiteboard.tsx
      hooks/
        useYjs.ts
        usePresence.ts
    package.json
    vite.config.ts
    dist/           # Built output, served by FastAPI
```

### main.py Modifications

```python
# main.py additions

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from canvas.room_manager import room_manager, canvas_websocket_handler

# Mount React SPA static files
app.mount("/canvas-app", StaticFiles(directory="canvas_frontend/dist", html=True), name="canvas-app")

# Canvas React SPA entry point
@app.get("/canvas/{room_id}")
async def canvas_page(room_id: str):
    return FileResponse("canvas_frontend/dist/index.html")

# Canvas CRDT WebSocket
@app.websocket("/ws/canvas/{room_id}")
async def canvas_websocket(websocket: WebSocket, room_id: str, token: str = Query(...)):
    user = await verify_websocket_token(token)
    if not user:
        await websocket.close(code=4001)
        return

    if not await can_access_room(user.id, room_id):
        await websocket.close(code=4003)
        return

    await canvas_websocket_handler(websocket, room_id, user)
```

---

## Build Order (Phase Sequencing)

Based on dependencies, recommended build order:

### Phase 1: Storage Foundation
1. **Canvas models** - Add `CanvasRoom`, `CanvasAsset` to `models.py`
2. **Database migration** - Alembic migration for new tables
3. **Canvas REST endpoints** - CRUD for rooms in `routers/canvas.py`

*Rationale: Storage must exist before sync layer can persist.*

### Phase 2: Real-Time Sync
4. **pycrdt-websocket integration** - Room manager, WebSocket handler
5. **Yjs persistence** - Load/save room state from database
6. **WebSocket authentication** - Token validation for canvas connections

*Rationale: Sync layer requires storage; frontend needs sync endpoint.*

### Phase 3: Frontend Canvas
7. **React SPA setup** - Vite, TypeScript, tldraw integration
8. **Yjs client** - y-websocket provider connecting to backend
9. **Basic drawing** - tldraw with default tools

*Rationale: Frontend depends on backend WebSocket being ready.*

### Phase 4: Presence & Polish
10. **Cursor tracking** - Yjs awareness for user cursors
11. **User indicators** - Show who's editing, selection highlights
12. **File uploads** - MinIO integration, presigned URLs

*Rationale: Presence is enhancement after core sync works.*

### Phase 5: Scale & History
13. **Batched persistence** - Debounced auto-save
14. **Version history** - Yjs snapshots (optional)
15. **Redis scaling** - For multi-instance deployment (if needed)

*Rationale: Optimization after functionality validated.*

---

## Scalability Considerations

| Concern | At 10 users | At 100 users | At 1000+ users |
|---------|-------------|--------------|----------------|
| **WebSocket connections** | Single process | Single process | Load balancer + Redis pub/sub |
| **CRDT document size** | < 1MB typical | May reach 10MB | Document splitting, lazy loading |
| **File storage** | Local MinIO | Local MinIO | S3 or distributed MinIO |
| **Database** | SQLite sufficient | SQLite may bottleneck | Migrate to PostgreSQL |
| **Bandwidth per user** | ~10 KB/s | ~50 KB/s | CDN for assets |

### Scaling Beyond Single Instance

```python
# Future: Redis-backed pycrdt-websocket (not needed for MVP)
from pycrdt_websocket import WebSocketServer
from pycrdt_websocket.yredis import YRedis

yredis = YRedis("redis://localhost:6379")
server = WebSocketServer(ystore=yredis)
```

---

## Security Considerations

| Concern | Approach |
|---------|----------|
| **WebSocket auth** | Validate JWT on connection, close (4001) if invalid |
| **Room access** | Check team membership before allowing room join |
| **Asset access** | Presigned URLs with short expiry (1 hour) |
| **Input validation** | Yjs handles binary protocol; validate room IDs |
| **Rate limiting** | Apply to REST endpoints; WebSocket messages harder to limit |

---

## Alternative Architecture (Option B: LWW without CRDT)

If Yjs complexity or tldraw licensing is a concern, a simpler LWW approach:

### Key Differences

| Aspect | Option A (Yjs/tldraw) | Option B (LWW/Fabric.js) |
|--------|----------------------|--------------------------|
| Canvas library | tldraw (React SDK) | Fabric.js (vanilla) |
| Sync protocol | Yjs binary CRDT | JSON over WebSocket |
| Conflict resolution | Automatic CRDT merge | Timestamp comparison |
| Offline support | Built-in | Not supported |
| Implementation time | 1-2 weeks | 3-5 days |
| Bundle size | ~150KB (Yjs + tldraw) | ~100KB (Fabric.js) |

### LWW Sync Protocol

```python
# canvas_sync.py (Option B)

async def apply_change(element_change: dict, room_id: str):
    element_id = element_change["element_id"]
    incoming_timestamp = element_change["timestamp"]

    current = await get_element(room_id, element_id)

    if current is None or incoming_timestamp > current.last_modified:
        await upsert_element(room_id, element_change)
        await broadcast_to_room(room_id, element_change)
        return {"accepted": True}
    else:
        return {"accepted": False, "current": current}
```

### When to Choose Option B

- tldraw commercial license ($6K/year) is not acceptable
- Need SVG export (tldraw doesn't support)
- Team has no React experience
- Simpler maintenance requirements
- Always-online assumption is acceptable

---

## Sources

**HIGH Confidence (Official Documentation):**
- [Yjs Documentation](https://docs.yjs.dev) - CRDT architecture
- [pycrdt-websocket](https://davidbrochart.github.io/pycrdt-websocket/) - Python Yjs server
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/) - WebSocket handling
- [tldraw SDK](https://tldraw.dev/) - Canvas library

**MEDIUM Confidence (Technical Articles):**
- [Building Collaborative Interfaces: OT vs CRDTs](https://dev.to/puritanic/building-collaborative-interfaces-operational-transforms-vs-crdts-2obo)
- [tldraw Real-time Collaboration - DeepWiki](https://deepwiki.com/tldraw/tldraw/4-collaboration-system)
- [Best CRDT Libraries 2025 - Velt](https://velt.dev/blog/best-crdt-libraries-real-time-data-sync)
- [Building Real-Time Chat with Room Management in FastAPI - DigitalOcean](https://www.digitalocean.com/community/questions/building-real-time-chat-with-room-management-in-fastapi)

---

*Architecture research: 2026-01-19*
