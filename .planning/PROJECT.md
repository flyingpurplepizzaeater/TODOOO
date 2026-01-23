# CollabBoard

## What This Is

A collaborative TODO and whiteboard application where teams work together in real-time on a visual canvas. Users can create tasks, draw sketches, add sticky notes, and upload images — all synchronized instantly across devices. Available as a responsive web app with native iOS and Android wrappers.

## Current State

**Shipped:** v1 MVP (2026-01-23)
**Codebase:** ~9,400 LOC (Python + TypeScript)
**Tech Stack:** FastAPI, React, tldraw, Yjs, Capacitor

v1 delivers the complete collaborative whiteboard:
- Real-time CRDT sync over WebSocket (<200ms latency)
- Infinite canvas with pan, zoom, selection, per-user undo
- Drawing tools, shapes, sticky notes, text
- Custom TODO cards with backend sync
- Image upload and PNG/PDF export
- Real-time cursors and presence indicators
- iOS and Android native wrappers

## Core Value

TODO management that works reliably — creating, assigning, and tracking tasks is the foundation everything else builds on.

## Requirements

### Validated

**v1 MVP (2026-01-23):**
- ✓ Infinite canvas with pan/zoom — v1
- ✓ Object selection, move, resize, delete — v1
- ✓ Basic shapes (rectangle, circle, line, arrow) — v1
- ✓ Per-user undo/redo — v1
- ✓ Freehand drawing with pen/marker — v1
- ✓ Eraser tool — v1
- ✓ 13-color palette — v1
- ✓ Stroke width selection (4 sizes) — v1
- ✓ Sticky notes with 8 color options — v1
- ✓ Standalone text objects — v1
- ✓ Inline text editing — v1
- ✓ Real-time collaborator cursors — v1
- ✓ Presence indicator (who's online) — v1
- ✓ Changes sync within 200ms — v1
- ✓ Shareable board links — v1
- ✓ Auto-reconnect after network drops — v1
- ✓ TODO cards with status, due date, assignee — v1
- ✓ Visual task status (checkmark, colors) — v1
- ✓ Task grouping with frame presets — v1
- ✓ TODO backend sync — v1
- ✓ Image upload/paste — v1
- ✓ PNG export — v1
- ✓ PDF export — v1
- ✓ Responsive web app — v1
- ✓ iOS native wrapper — v1
- ✓ Android native wrapper — v1
- ✓ Touch gestures (pinch zoom, touch draw) — v1

**Pre-existing:**
- ✓ User registration with email/password — existing
- ✓ User login with JWT authentication — existing
- ✓ Password reset functionality — existing
- ✓ Team creation and management — existing
- ✓ Team membership and invitations — existing
- ✓ TODO lists within teams — existing
- ✓ TODO items with completion status — existing
- ✓ WebSocket infrastructure — existing
- ✓ Rate limiting on auth endpoints — existing

### Active

(Requirements for next milestone — define with `/gsd:new-milestone`)

### Out of Scope

- Native desktop app (Electron) — web browser sufficient for desktop
- Video/audio collaboration — focus on visual artifacts, not meetings
- AI features (summarization, auto-diagram) — expensive, distracting from core value
- Complex diagramming (UML, ERD) — users needing Lucidchart will use Lucidchart
- Per-element permissions — board-level permissions only

## Context

**Tech Stack:**
- Backend: FastAPI (Python 3.12), SQLAlchemy, Yjs CRDT
- Frontend: React 19, tldraw 4.2, Vite
- Mobile: Capacitor 6 (iOS + Android)
- Storage: SQLite (dev), MinIO (images)

**Known Tech Debt:**
- Vite production build has Y.js type issues (from Phase 2)
- Backend→canvas TODO sync incomplete (one-way only)
- Hardcoded user placeholder in Canvas.tsx

## Constraints

- **Platform**: Web-first with Capacitor native wrappers
- **Backend**: FastAPI (Python 3.12)
- **Database**: SQLite for development, PostgreSQL for production
- **Real-time**: WebSocket with Yjs CRDT protocol

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid platform (web + Capacitor) | Single codebase, broad reach | ✓ Good — works well |
| tldraw for canvas | Mature library, Yjs integration | ✓ Good — saved months |
| Yjs for CRDT | Industry standard, good docs | ✓ Good — <200ms sync |
| MinIO for images | S3-compatible, self-hostable | ✓ Good — simple setup |
| Custom TODO shape | Native canvas integration | ✓ Good — seamless UX |
| Team boards + shareable links | Flexibility for collaboration | ✓ Good — flexible access |

## Next Milestone Goals

(Define with `/gsd:new-milestone` — potential v2 features: version history, offline mode, comments/threads, templates)

---
*Last updated: 2026-01-23 after v1 milestone*
