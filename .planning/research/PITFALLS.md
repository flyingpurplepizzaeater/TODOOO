# Domain Pitfalls

**Domain:** Collaborative Whiteboard on FastAPI Backend
**Researched:** 2026-01-19
**Overall Confidence:** HIGH (verified via documented production issues, GitHub issues, official docs)

---

## Critical Pitfalls

Mistakes that cause rewrites, major performance failures, or fundamental architectural problems.

---

### Pitfall 1: Using Archived ypy Instead of pycrdt

**What goes wrong:** Developer finds ypy in search results, uses it for Python Yjs bindings, discovers it was archived April 2025 and is no longer maintained.

**Why it happens:**
- ypy has more search engine presence (older library)
- Documentation still exists online
- Some tutorials reference ypy

**Consequences:**
- No bug fixes or security updates
- Incompatibilities with newer Yjs versions
- Must migrate mid-project

**Warning signs:**
- GitHub repository marked "archived"
- PyPI shows no recent releases
- Issues go unanswered

**Prevention:**
1. Use **pycrdt** (actively maintained by David Brochart)
2. Use **pycrdt-websocket** for WebSocket server (v0.16.0+)
3. Verify library maintenance status before adoption

**Phase to address:** Phase 1 - Technology selection

**Sources:**
- [ypy archived April 2025](https://github.com/y-crdt/ypy) - HIGH confidence
- [pycrdt announcement](https://discuss.yjs.dev/t/announcing-pycrdt/2284) - HIGH confidence

---

### Pitfall 2: tldraw Licensing Surprises

**What goes wrong:** Team builds entire product with tldraw, discovers at launch that production use requires commercial license ($6K/year minimum) or visible watermark.

**Why it happens:**
- tldraw SDK is "open source" (code is visible)
- License changed in 2024 to require production license
- Development/localhost works without restrictions
- Watermark easy to miss during development

**Consequences:**
- Unexpected budget requirement at launch
- Must pay or show "Made with tldraw" watermark
- OR rewrite with different library under pressure

**Warning signs:**
- License terms mention "development only"
- Watermark appears in production builds

**Prevention:**
1. Read tldraw license before starting (https://tldraw.dev/legal)
2. Budget for $6K/year startup license OR accept watermark
3. Alternative: Use Konva.js (MIT license) if licensing is dealbreaker
4. Trial license available (100 days) for evaluation

**Phase to address:** Phase 0 - Before any development

**Sources:**
- [tldraw License Updates](https://tldraw.dev/blog/license-update-for-the-tldraw-sdk) - HIGH confidence
- [tldraw Pricing](https://tldraw.dev/) - HIGH confidence

---

### Pitfall 3: Infinite Event Loops in CRDT Sync

**What goes wrong:** Canvas change triggers local update, which syncs to Yjs, which triggers "change" event, which updates canvas, which syncs to Yjs... infinite loop.

**Why it happens:**
- Yjs emits events on all changes (local and remote)
- Canvas libraries emit events on all modifications
- Without origin tracking, can't distinguish local vs remote

**Consequences:**
- Browser freezes
- Exponential network traffic
- Complete unusability

**Warning signs:**
- Network tab shows explosion of WebSocket messages
- CPU spikes to 100% on any interaction
- "Maximum call stack exceeded" errors

**Prevention:**
1. Use Yjs transaction origin tracking
2. Skip sync for changes with remote origin
3. Debounce outgoing updates
4. tldraw handles this internally if using their sync

**Pattern:**
```javascript
// Track origin of changes
ydoc.transact(() => {
  ymap.set('shape', data);
}, 'local'); // Mark as local origin

ydoc.on('update', (update, origin) => {
  if (origin === 'local') return; // Don't re-sync local changes
  applyToCanvas(update);
});
```

**Phase to address:** Phase 1 - Core sync implementation

**Sources:**
- [Yjs Transactions](https://docs.yjs.dev/api/y.doc#transactions) - HIGH confidence
- [Building Real-Time Collaborative Whiteboard](https://medium.com/@adredars/building-a-real-time-collaborative-whiteboard-frontend-with-next-js-7c6b2ef1e072) - MEDIUM confidence

---

### Pitfall 4: WebSocket State Lost on Process Restart

**What goes wrong:** Server restarts (deploy, crash, scale). All WebSocket connections drop. Clients reconnect but CRDT state was only in memory. Document appears empty or outdated.

**Why it happens:**
- pycrdt-websocket keeps room state in memory by default
- No persistence configured
- Room is recreated empty on restart

**Consequences:**
- Work lost on server restart
- Inconsistent state between users after reconnect
- "My changes disappeared" reports

**Warning signs:**
- Data survives browser refresh but not server restart
- Deploy causes sync issues
- Users report sporadic data loss

**Prevention:**
1. Configure pycrdt-websocket with persistent storage
2. Save Yjs document state to database periodically
3. Load state on room creation
4. Implement heartbeat/auto-save

**Pattern:**
```python
from pycrdt_websocket import WebSocketServer
from pycrdt_websocket.ystore import SQLiteYStore

# Persist to SQLite
ystore = SQLiteYStore("./yjs_rooms.db")
server = WebSocketServer(ystore=ystore)
```

**Phase to address:** Phase 1 - Must be foundational

**Sources:**
- [pycrdt-websocket Persistence](https://davidbrochart.github.io/pycrdt-websocket/) - HIGH confidence

---

### Pitfall 5: Memory Leaks from Canvas Objects

**What goes wrong:** Long whiteboard sessions accumulate canvas objects in memory. Event listeners pile up. Browser crashes after extended use.

**Why it happens:**
- tldraw/Konva objects created but not properly destroyed
- Undo history grows unbounded
- React components don't clean up on unmount
- Yjs awareness connections not disconnected

**Consequences:**
- Browser tab crashes after 1-2 hours
- Mobile devices fail faster
- "Memory usage keeps growing" reports
- iOS "Process Terminated" errors

**Warning signs:**
- Chrome DevTools shows steadily increasing JS heap
- Performance degrades over session time
- Mobile crashes before desktop

**Prevention:**
1. Limit undo history depth (50-100 operations max)
2. Clean up event listeners on unmount
3. Call `destroy()` on removed canvas objects
4. Disconnect Yjs awareness on component unmount
5. Monitor memory in development

**Phase to address:** Phase 2 - Canvas implementation

**Sources:**
- [Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html) - HIGH confidence

---

### Pitfall 6: Multi-User Undo/Redo Conflicts

**What goes wrong:** User A draws circle, User B draws square, User A hits undo. What happens? Depends on implementation. Often: confusing behavior, lost work, or undo does nothing.

**Why it happens:**
- Single-player undo is simple (stack)
- Multi-player requires fundamentally different approach
- CRDTs don't natively support intuitive undo
- Many implementations get this wrong

**Consequences:**
- Users lose work unexpectedly
- "Undo doesn't work" bug reports
- Trust in collaboration erodes

**Warning signs:**
- Undo sometimes does nothing
- Undo affects other users' work
- Rapid undo/redo causes sync issues

**Prevention:**
1. Implement **local undo** (each user only undoes their own actions)
2. Use command pattern with user-scoped operation stacks
3. tldraw has built-in local undo that handles this correctly
4. Test with 3+ concurrent users

**Phase to address:** Phase 3 - After basic sync works

**Sources:**
- [How to Build Undo/Redo in Multiplayer](https://liveblocks.io/blog/how-to-build-undo-redo-in-a-multiplayer-environment) - HIGH confidence

---

## Moderate Pitfalls

Mistakes that cause significant delays, technical debt, or degraded user experience.

---

### Pitfall 7: Mobile WebView Canvas Performance

**What goes wrong:** Whiteboard works great on desktop, but iOS/Android WebViews struggle with large canvases, causing lag or crashes.

**Why it happens:**
- iOS WebViews have canvas memory limits
- Retina displays require 4x pixels
- Touch generates more events than mouse
- Capacitor uses WebView, not native canvas

**Consequences:**
- 60fps on desktop, 15fps on mobile
- iOS crashes with "Process Terminated"
- Touch drawing feels laggy

**Prevention:**
1. Limit canvas resolution on mobile
2. Throttle touch events more than mouse
3. Test on real devices early (emulators hide GPU limits)
4. Set reasonable viewport size limits

**Canvas size guidelines:**
| Device | Max Recommended |
|--------|-----------------|
| iOS WebView | 2048x2048 effective pixels |
| Android WebView | 4096x4096 |
| Desktop Chrome | 8192x8192+ |

**Phase to address:** Phase 4 - Mobile testing

**Sources:**
- [iOS WebView Canvas Issues](https://github.com/react-native-webview/react-native-webview/issues/2169) - HIGH confidence

---

### Pitfall 8: File Uploads Through Base64

**What goes wrong:** Images uploaded as Base64 strings, stored in Yjs document or database, causing 33% size overhead and slow sync.

**Why it happens:**
- Base64 is easy (just encode and include)
- Works immediately without file storage setup
- Tutorials show Base64 for simplicity

**Consequences:**
- Documents 33% larger than necessary
- Sync slow with many images
- Database queries slow
- No CDN caching

**Prevention:**
1. Upload images to MinIO/S3
2. Store only URLs in whiteboard document
3. Use presigned URLs for secure access
4. Generate thumbnails for previews

**Architecture:**
```
WRONG: { type: "image", data: "data:image/png;base64,..." }

RIGHT: { type: "image", url: "/assets/abc123.png" }
```

**Phase to address:** Phase 2 - Image upload design

**Sources:**
- [FastAPI File Uploads Guide](https://betterstack.com/community/guides/scaling-python/uploading-files-using-fastapi/) - HIGH confidence

---

### Pitfall 9: Missing Cursor Presence

**What goes wrong:** Users collaborate but can't see where others are working. They draw over each other's work unknowingly.

**Why it happens:**
- Cursor tracking seems optional
- Adds complexity
- Bandwidth concern

**Consequences:**
- Accidental overwriting
- "Is anyone else here?"
- Collaboration feels broken
- Users request this constantly

**Prevention:**
1. Plan cursor presence from the start
2. Use Yjs awareness protocol (built for this)
3. Throttle cursor updates (10-20/sec max)
4. Show colored cursors with user names

**Phase to address:** Phase 3 - Core collaboration feature

**Sources:**
- [Yjs Awareness Protocol](https://docs.yjs.dev/getting-started/adding-awareness) - HIGH confidence

---

### Pitfall 10: Jinja2 to React Migration Chaos

**What goes wrong:** Team tries to "gradually migrate" Jinja2 templates to React, ends up with two auth systems, inconsistent styling, and routing conflicts.

**Why it happens:**
- "Just add React to this page"
- Auth tokens handled differently
- CSS conflicts
- Different mental models

**Consequences:**
- Login works in one but not other
- Styles break across sections
- Routing confusion
- Maintenance nightmare

**Prevention:**
1. Keep Jinja2 for auth pages (login, register)
2. Build whiteboard as separate React SPA
3. Mount React at distinct route (`/canvas/*`)
4. Share JWT via localStorage, not cookies
5. Don't mix Jinja2 and React on same page

**Phase to address:** Phase 2 - Frontend architecture decision

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

---

### Pitfall 11: Touch vs Mouse Event Handling

**What goes wrong:** Drawing code works for mouse but not touch. Two-finger zoom accidentally draws.

**Prevention:** Use Pointer Events API, set `touch-action: none` on canvas

---

### Pitfall 12: Z-Index Sync Conflicts

**What goes wrong:** Two users move objects, z-order conflicts.

**Prevention:** Use fractional indexing or deterministic ordering by element ID

---

### Pitfall 13: Document Size Growth

**What goes wrong:** Yjs documents grow unbounded with edit history.

**Prevention:** Use Yjs garbage collection, consider periodic compaction

---

## Phase-Specific Warnings Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|----------------|------------|
| Phase 0 | Technology Selection | tldraw licensing (P2), ypy archived (P1) | Budget for license, use pycrdt |
| Phase 1 | Real-time Infrastructure | Event loops (P3), persistence (P4) | Origin tracking, configure ystore |
| Phase 2 | Canvas Implementation | Memory leaks (P5), Base64 images (P8) | Cleanup on unmount, use MinIO |
| Phase 3 | Collaboration Features | Undo/redo (P6), cursor presence (P9) | Local undo, plan awareness early |
| Phase 4 | Mobile | WebView performance (P7) | Limit canvas size, test real devices |

---

## Pre-Implementation Checklist

Before starting development:

- [ ] tldraw license decision made (pay, watermark, or use Konva)
- [ ] pycrdt/pycrdt-websocket chosen (NOT ypy)
- [ ] Persistence strategy decided (SQLite ystore or custom)
- [ ] File storage planned (MinIO, not Base64)
- [ ] Frontend architecture decided (React SPA separate from Jinja2)
- [ ] Mobile canvas limits documented
- [ ] Multi-user undo strategy chosen

---

## Sources Summary

**HIGH Confidence:**
- [ypy archived](https://github.com/y-crdt/ypy)
- [pycrdt announcement](https://discuss.yjs.dev/t/announcing-pycrdt/2284)
- [tldraw License](https://tldraw.dev/blog/license-update-for-the-tldraw-sdk)
- [Yjs Documentation](https://docs.yjs.dev)
- [pycrdt-websocket Docs](https://davidbrochart.github.io/pycrdt-websocket/)
- [Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)
- [Liveblocks Undo/Redo Guide](https://liveblocks.io/blog/how-to-build-undo-redo-in-a-multiplayer-environment)
- [FastAPI File Uploads](https://betterstack.com/community/guides/scaling-python/uploading-files-using-fastapi/)

**MEDIUM Confidence:**
- [Building Collaborative Whiteboard (Medium)](https://medium.com/@adredars/building-a-real-time-collaborative-whiteboard-frontend-with-next-js-7c6b2ef1e072)
- [iOS WebView Issues](https://github.com/react-native-webview/react-native-webview/issues/2169)
