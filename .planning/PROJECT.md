# CollabBoard

## What This Is

A collaborative TODO and whiteboard application where teams can work together in real-time on a visual canvas. Users can create tasks, draw sketches, add sticky notes, and upload images — all synchronized instantly across devices. Accessible via web browser with native app wrappers for mobile.

## Core Value

TODO management that works reliably — creating, assigning, and tracking tasks is the foundation everything else builds on.

## Requirements

### Validated

- ✓ User registration with email/password — existing
- ✓ User login with JWT authentication — existing
- ✓ Password reset functionality — existing
- ✓ Team creation and management — existing
- ✓ Team membership and invitations — existing
- ✓ TODO lists within teams — existing
- ✓ TODO items with completion status — existing
- ✓ WebSocket infrastructure for real-time events — existing
- ✓ Rate limiting on authentication endpoints — existing

### Active

- [ ] Canvas/whiteboard UI with pan and zoom
- [ ] Freehand drawing tools (pen, brush, eraser)
- [ ] Sticky notes with text editing
- [ ] TODO cards with visual positioning on canvas
- [ ] Image and file uploads to canvas
- [ ] Real-time sync of all canvas elements
- [ ] Shareable board links (public access)
- [ ] Cross-platform web app
- [ ] Mobile native wrappers (iOS, Android)

### Out of Scope

- Native desktop app (Electron) — web browser sufficient for desktop
- Video/audio collaboration — focus on visual artifacts, not meetings
- Version history/undo stack — adds complexity, defer to future
- Offline mode with sync — requires significant architecture changes
- Custom shapes library — freehand drawing covers creative needs

## Context

Existing FastAPI backend provides solid foundation:
- Async Python with SQLAlchemy ORM
- JWT-based authentication flow
- Team authorization model
- WebSocket manager for broadcasting events
- Docker deployment ready

Frontend is currently server-rendered Jinja2 templates with vanilla JS. Will need significant evolution for canvas interactions and real-time collaboration.

Real-time sync is the technical differentiator — multiple users seeing changes as they happen creates the collaborative magic.

## Constraints

- **Platform**: Hybrid approach — web-first, native wrappers via Capacitor/similar
- **Backend**: Build on existing FastAPI codebase (Python 3.12)
- **Database**: SQLite for development, may need PostgreSQL for production scale
- **Real-time**: WebSocket-based (already have infrastructure)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid platform (web + wrappers) | Single codebase, broad reach | — Pending |
| Team boards + shareable links | Flexibility for different collaboration styles | — Pending |
| TODO as core value | Whiteboard is visual layer; task reliability is foundation | — Pending |

---
*Last updated: 2026-01-19 after initialization*
