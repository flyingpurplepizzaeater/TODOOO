# Research Summary: Collaborative Whiteboard Stack (2026)

**Domain:** Collaborative whiteboard/TODO app with visual canvas
**Researched:** 2026-01-19
**Overall Confidence:** HIGH

---

## Executive Summary

Adding collaborative whiteboard features to the existing FastAPI TODO app is well-supported by mature tooling in 2026. The ecosystem has consolidated around a few clear winners:

**For canvas rendering**, tldraw (v4.2.x) is the dominant React SDK, powering ClickUp Whiteboards, Padlet Sandboxes, and hundreds of other products. It includes built-in freehand drawing (perfect-freehand algorithm), shapes, sticky notes, images, and infinite canvas with pan/zoom. The main decision point is licensing: tldraw requires a commercial license ($6K/year for startups) or displays a "Made with tldraw" watermark. Konva.js (MIT license) is the fallback if licensing is unacceptable.

**For real-time sync**, Yjs is the clear winner with 900K+ weekly npm downloads. The Python ecosystem has stabilized: ypy was archived April 2025, and **pycrdt** (maintained by David Brochart, same author) is now the standard. The **pycrdt-websocket** library (v0.16.0) provides an async Python WebSocket server that implements the Yjs sync protocol, eliminating the need for a Node.js sidecar process.

**For mobile**, Capacitor is the right choice for wrapping the web app. WebView canvas performance is sufficient for whiteboard use cases, and it preserves 100% of the web codebase.

The existing FastAPI backend with WebSocket support is an excellent foundation. The recommended architecture adds pycrdt-websocket as a separate WebSocket route for CRDT sync, MinIO for asset storage, and a React SPA for the canvas UI.

---

## Key Findings

**Stack:** tldraw + Yjs + pycrdt-websocket + MinIO + Capacitor

**Architecture:** React SPA (tldraw) connected to FastAPI backend with two WebSocket routes: existing JSON events for TODO updates, new binary CRDT sync for canvas state.

**Critical Decision:** tldraw licensing - budget $6K/year startup license, accept watermark, or use Konva.js instead.

**Critical Pitfall:** Do NOT use ypy (archived April 2025). Use pycrdt instead.

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Real-time Infrastructure
**Build:** pycrdt-websocket integration, CRDT room management, persistence to database
**Addresses:** Core collaboration foundation
**Avoids:** Pitfall P3 (event loops), P4 (state loss on restart)
**Likely needs:** Deeper research on pycrdt-websocket API details

### Phase 2: Canvas Frontend
**Build:** React SPA with tldraw, WebSocket client, basic drawing tools
**Addresses:** User-facing whiteboard experience
**Avoids:** P5 (memory leaks), P10 (Jinja2/React mixing)
**Likely needs:** Phase-specific research on tldraw customization

### Phase 3: File Uploads & Assets
**Build:** MinIO integration, presigned URLs, image upload to canvas
**Addresses:** Image/file support
**Avoids:** P8 (Base64 bloat)
**Standard patterns:** Unlikely to need deep research

### Phase 4: Collaboration Polish
**Build:** Multi-user cursors, user presence, selection indicators
**Addresses:** Collaborative UX
**Avoids:** P6 (undo/redo), P9 (missing cursors)
**Uses:** Yjs awareness protocol (well-documented)

### Phase 5: Mobile Wrapper
**Build:** Capacitor integration, mobile-specific optimizations
**Addresses:** iOS/Android apps
**Avoids:** P7 (WebView performance)
**Likely needs:** Phase-specific research on Capacitor canvas plugins

**Phase ordering rationale:**
- Real-time infrastructure must exist before frontend can integrate
- Canvas frontend before assets (need UI to upload to)
- Collaboration polish after core sync works
- Mobile after web version stable

**Research flags for phases:**
- Phase 1: May need research on pycrdt-websocket room lifecycle
- Phase 2: May need research on tldraw Yjs integration specifics
- Phase 5: May need research on iOS canvas memory limits

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | tldraw/Yjs/Capacitor all have 10K+ GitHub stars, production use |
| Python CRDT | HIGH | pycrdt maintained by same author as JupyterLab RTC |
| Features | HIGH | Table stakes well-defined from competitor analysis |
| Architecture | HIGH | Patterns proven in production (ClickUp, Padlet) |
| Pitfalls | HIGH | Documented in GitHub issues, postmortems, official docs |
| Mobile | MEDIUM | Capacitor WebView has known limitations, may need workarounds |

---

## Technology Summary

### Recommended

| Category | Technology | Version | License | Rationale |
|----------|------------|---------|---------|-----------|
| Canvas SDK | tldraw | 4.2.x | Commercial | Best-in-class, production-proven |
| CRDT | Yjs | 13.x | MIT | Dominant library, 900K+ weekly downloads |
| Python CRDT | pycrdt | 0.10.x | MIT | Actively maintained, JupyterLab uses it |
| Python WS | pycrdt-websocket | 0.16.x | MIT | Async Python, no Node.js needed |
| File Storage | MinIO | Latest | AGPLv3 | S3-compatible, self-hosted |
| Mobile | Capacitor | 6.x | MIT | Web-first, preserves codebase |
| Frontend | React | 18+/19.x | MIT | Required by tldraw |

### Alternatives if Licensing is Concern

| If... | Use Instead | Trade-off |
|-------|-------------|-----------|
| tldraw license too expensive | Konva.js + react-konva | More custom code, less out-of-box features |
| Need SVG export | Konva.js | tldraw doesn't support SVG export |

### Do NOT Use

| Technology | Reason |
|------------|--------|
| ypy | Archived April 2025 |
| Fabric.js | Performance issues with real-time updates |
| Base64 image storage | 33% overhead, slow sync |
| Custom OT | CRDTs are simpler to implement correctly |

---

## Files Created

| File | Purpose |
|------|---------|
| `.planning/research/STACK.md` | Complete technology recommendations with versions |
| `.planning/research/FEATURES.md` | Feature landscape (table stakes, differentiators) |
| `.planning/research/ARCHITECTURE.md` | System structure, integration patterns |
| `.planning/research/PITFALLS.md` | Domain pitfalls with prevention strategies |
| `.planning/research/SUMMARY.md` | This executive summary |

---

## Gaps to Address

- **pycrdt-websocket room lifecycle:** How exactly to persist/restore rooms
- **tldraw + Yjs integration:** Official tldraw-yjs example exists but may need customization
- **iOS canvas memory limits:** Exact numbers may need empirical testing
- **MinIO community edition:** Now source-only, deployment may need adjustment

---

## Sources (Key)

- [tldraw SDK](https://tldraw.dev/) - Official documentation
- [Yjs Documentation](https://docs.yjs.dev) - CRDT library docs
- [pycrdt GitHub](https://github.com/y-crdt/pycrdt) - Python bindings
- [pycrdt-websocket](https://pypi.org/project/pycrdt-websocket/) - WebSocket server
- [Capacitor](https://capacitorjs.com/) - Mobile wrapper
- [Best CRDT Libraries 2025](https://velt.dev/blog/best-crdt-libraries-real-time-data-sync) - Comparison
- [Top Whiteboard Libraries](https://byby.dev/js-whiteboard-libs) - Feature comparison

---

## Ready for Roadmap

Research complete. The stack is well-defined with high confidence. Key decisions (tldraw licensing, pycrdt vs ypy) are documented. Proceeding to roadmap creation is recommended.
