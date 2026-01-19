# Technology Stack

**Project:** Collaborative TODO/Whiteboard App
**Researched:** 2026-01-19
**Overall Confidence:** HIGH (verified via WebSearch with multiple authoritative sources)

---

## Executive Summary

For adding collaborative whiteboard features to an existing FastAPI backend, the recommended stack is:

- **Frontend:** React with tldraw SDK (or Konva.js for custom approach)
- **Real-time Sync:** Yjs CRDTs with pycrdt-websocket (Python-native Yjs server)
- **File Storage:** MinIO (S3-compatible, self-hosted)
- **Mobile:** Capacitor (leverages existing web codebase)

This stack integrates cleanly with the existing FastAPI/SQLAlchemy/WebSocket infrastructure while providing production-grade collaboration features.

---

## Recommended Stack

### Canvas/Whiteboard Library

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **tldraw** | 4.2.x | Complete whiteboard SDK | HIGH |
| OR Konva.js | 9.x | Custom canvas (if tldraw licensing is a concern) | HIGH |

**Recommendation: tldraw SDK**

**Why tldraw:**
- Production-ready infinite canvas with 3+ years of development
- Built-in pressure-sensitive freehand drawing (perfect-freehand algorithm)
- React-native architecture (components all the way down)
- Enterprise-grade: Powers ClickUp Whiteboards, Padlet Sandboxes
- Sticky notes, shapes, arrows, images built-in
- Yjs integration available for CRDT sync

**When to choose Konva.js instead:**
- tldraw commercial license ($6K/year for startups) is not acceptable
- Need SVG export (tldraw doesn't support SVG export)
- Want full control over every UI element
- Building something very different from a whiteboard (e.g., image editor)

**Sources:**
- [tldraw SDK](https://tldraw.dev/) - Official site
- [tldraw npm](https://www.npmjs.com/package/tldraw) - v4.2.3 current
- [tldraw Series A announcement](https://tldraw.dev/blog/announcing-tldraw-series-a) - $10M raised April 2025

---

### Real-time Collaboration (CRDT)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Yjs** | 13.x | Client-side CRDT library | HIGH |
| **pycrdt** | 0.10.x | Python Yjs bindings (Rust-based) | HIGH |
| **pycrdt-websocket** | 0.16.x | Python WebSocket server for Yjs | HIGH |

**Why Yjs + pycrdt:**
- **Yjs** is the dominant CRDT library with 900K+ weekly npm downloads
- **pycrdt** is the actively maintained Python binding (ypy was archived April 2025)
- **pycrdt-websocket** provides async Python WebSocket server compatible with Yjs clients
- Powers JupyterLab real-time collaboration
- No need for Node.js sidecar - pure Python backend

**Integration with existing WebSocket:**
The existing `ConnectionManager` in `websocket.py` handles JSON message broadcasting. For CRDT sync, you'll run pycrdt-websocket alongside (or integrate into) the existing WebSocket routes. The CRDT sync uses binary protocols, separate from JSON events.

**Alternatives NOT recommended:**
- **y-websocket (Node.js):** Requires running a separate Node.js server
- **Automerge:** Historically slower than Yjs, though 2.0 improved
- **Custom OT:** Operational Transform is harder to implement correctly than CRDTs

**Sources:**
- [Yjs Documentation](https://docs.yjs.dev) - Official docs
- [pycrdt GitHub](https://github.com/y-crdt/pycrdt) - Active development
- [pycrdt-websocket PyPI](https://pypi.org/project/pycrdt-websocket/) - v0.16.0

---

### Frontend Framework

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **React** | 18.x / 19.x | UI framework | HIGH |
| **TypeScript** | 5.x | Type safety | HIGH |
| **Vite** | 5.x / 6.x | Build tooling | HIGH |

**Why React:**
- tldraw is React-only (not optional)
- Largest ecosystem for canvas libraries
- Best tooling and hiring pool
- Existing Jinja2 templates can be progressively migrated

**Alternative considered:**
- **Svelte:** Better raw performance, but tldraw requires React. If using Konva.js, Svelte is viable.

**Migration path from Jinja2:**
1. Keep Jinja2 for server-rendered pages (login, register)
2. Build whiteboard as separate React SPA
3. Mount React app at `/canvas` or `/whiteboard` routes
4. Share JWT auth between both

**Sources:**
- [tldraw Requirements](https://tldraw.dev/docs) - React required
- [Frontend Framework Comparison 2025](https://www.frontendtools.tech/blog/best-frontend-frameworks-2025-comparison)

---

### File/Asset Storage

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **MinIO** | Latest | S3-compatible object storage | HIGH |
| **boto3** | 1.35.x | S3 client for Python | HIGH |
| **aiofiles** | 24.x | Async file I/O | MEDIUM |

**Why MinIO:**
- S3-compatible API (same code works with AWS S3 later)
- Self-hosted (no cloud dependency for development)
- Perfect for storing whiteboard assets (images, uploaded files)
- Docker-friendly deployment

**File upload architecture:**
```
Client -> FastAPI (validate/auth) -> MinIO (store)
                                  -> Return presigned URL
Client <- Use presigned URL for direct upload (large files)
```

**Important:** MinIO community edition is now source-only. Install via `go install github.com/minio/minio@latest` or use Docker image.

**Sources:**
- [MinIO GitHub](https://github.com/minio/minio)
- [FastAPI MinIO Integration Guide](https://medium.com/@mojimich2015/fastapi-minio-integration-31b35076afcb)

---

### Mobile Wrapper

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| **Capacitor** | 6.x | Native wrapper for web app | HIGH |

**Why Capacitor over React Native:**
- Reuses 100% of web codebase (React + tldraw)
- Canvas rendering via WebView is sufficient for whiteboard
- No need to rebuild UI in native components
- Simpler deployment pipeline
- Plugin ecosystem for native features (camera, filesystem)

**Performance consideration:**
WebView canvas performance is "good enough" for whiteboard apps. The bottleneck is network latency for sync, not rendering. React Native would only matter for 60fps gaming or heavy animations.

**Limitations to accept:**
- Slightly worse performance on low-end Android devices
- No native UI feel (but whiteboard doesn't need it)

**Sources:**
- [Capacitor vs React Native 2025](https://nextnative.dev/blog/capacitor-vs-react-native)
- [Capacitor Documentation](https://capacitorjs.com/docs)

---

## Complete Dependency List

### Python Backend (add to existing)

```bash
# CRDT real-time sync
pip install pycrdt>=0.10.0 pycrdt-websocket>=0.16.0

# File storage
pip install boto3>=1.35.0 aiofiles>=24.0.0

# Image processing (optional, for thumbnails)
pip install pillow>=10.0.0
```

### Frontend (new React app)

```bash
# Core
npm install react react-dom typescript

# Canvas/Whiteboard (choose one)
npm install tldraw@^4.2.0           # Recommended
# OR
npm install konva react-konva       # Custom approach

# CRDT sync
npm install yjs y-websocket

# Build
npm install -D vite @vitejs/plugin-react
```

### Mobile

```bash
# Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap init
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Canvas | tldraw | Excalidraw | Excalidraw self-hosted collaboration requires separate room server; tldraw has better SDK |
| Canvas | tldraw | Fabric.js | Fabric.js has synchronous rendering, performance issues with many objects |
| CRDT | Yjs | Automerge | Yjs faster, larger ecosystem, better text support |
| Python CRDT | pycrdt | ypy | ypy archived April 2025; pycrdt actively maintained |
| Mobile | Capacitor | React Native | Would require rewriting canvas in native; unnecessary complexity |
| Storage | MinIO | Local filesystem | Doesn't scale, no presigned URLs, harder to migrate to cloud |

---

## Architecture Integration

### How it fits with existing stack

```
Existing Stack              New Components
--------------              --------------
FastAPI          +--------> pycrdt-websocket (CRDT sync)
SQLAlchemy       +--------> Canvas state stored via Yjs persistence
SQLite
JWT Auth         +--------> Shared between Jinja2 and React
WebSocket mgr    +--------> Separate routes for CRDT vs events
Jinja2 templates +--------> Coexists with React SPA

                 New:
                 - React SPA for whiteboard UI
                 - MinIO for asset storage
                 - Capacitor for mobile builds
```

### WebSocket route separation

```python
# Existing: JSON event broadcasting for TODO updates
@app.websocket("/ws/teams/{team_id}")
async def todo_events(...): ...

# New: Binary CRDT sync for canvas state
@app.websocket("/ws/canvas/{room_id}")
async def canvas_sync(...): ...  # pycrdt-websocket handles this
```

---

## Licensing Notes

| Technology | License | Commercial Use |
|------------|---------|----------------|
| tldraw | tldraw License | Free with watermark; $6K/year startup license to remove |
| Yjs | MIT | Free |
| pycrdt | MIT | Free |
| Konva.js | MIT | Free |
| MinIO | AGPLv3 | Free for self-hosted; commercial license available |
| Capacitor | MIT | Free |

**tldraw licensing decision:**
- Start with free tier (includes "Made with tldraw" watermark)
- Evaluate after MVP whether watermark removal is worth $6K/year
- Alternative: Use Konva.js + custom UI if licensing is a dealbreaker

---

## Version Verification

All versions verified via web search on 2026-01-19:

| Package | Verified Version | Source |
|---------|------------------|--------|
| tldraw | 4.2.3 | npm registry |
| pycrdt | 0.10.x | PyPI |
| pycrdt-websocket | 0.16.0 | PyPI, released June 2025 |
| Yjs | 13.x | npm registry |
| Capacitor | 6.x | capacitorjs.com |

---

## What NOT to Use

| Technology | Reason |
|------------|--------|
| **ypy** | Archived April 2025; use pycrdt instead |
| **Socket.IO for CRDT** | Yjs has its own sync protocol; Socket.IO adds complexity |
| **Local file storage** | Doesn't support presigned URLs, hard to scale |
| **Fabric.js** | Performance issues with real-time updates |
| **Custom OT implementation** | CRDTs are easier to implement correctly |
| **React Native** | Overkill when WebView canvas works fine for whiteboards |
| **Electron for mobile** | Capacitor is lighter and mobile-native |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| tldraw licensing changes | LOW | Konva.js fallback path documented |
| pycrdt-websocket compatibility issues | MEDIUM | JupyterLab uses it in production; well-tested |
| WebView canvas performance on old phones | MEDIUM | Test early on low-end devices; canvas optimization |
| MinIO complexity for small deployments | LOW | Can start with local files, migrate to MinIO later |

---

## Summary

**For the collaborative whiteboard milestone, use:**

1. **tldraw** - Best-in-class React whiteboard SDK
2. **Yjs + pycrdt-websocket** - Python-native CRDT sync
3. **MinIO** - S3-compatible file storage
4. **Capacitor** - Mobile wrapper preserving web codebase

This stack provides production-grade collaboration with minimal new infrastructure, integrates cleanly with FastAPI, and avoids Node.js dependencies.
