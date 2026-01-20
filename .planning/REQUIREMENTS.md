# Requirements: CollabBoard

**Defined:** 2026-01-19
**Core Value:** TODO management that works reliably — creating, assigning, and tracking tasks is the foundation everything else builds on.

## v1 Requirements

### Canvas

- [x] **CANV-01**: User can view infinite canvas with pan and zoom navigation
- [x] **CANV-02**: User can select objects and move/resize/delete them
- [x] **CANV-03**: User can add basic shapes (rectangle, circle, line, arrow)
- [x] **CANV-04**: User can undo/redo their own actions (per-user in collaborative mode)

### Drawing

- [x] **DRAW-01**: User can draw freehand strokes with pen/marker tool
- [x] **DRAW-02**: User can erase strokes with eraser tool
- [x] **DRAW-03**: User can select from 8-12 preset colors for drawing
- [x] **DRAW-04**: User can select stroke width (thin, medium, thick)

### Notes & Text

- [ ] **TEXT-01**: User can add sticky notes with multiple color options
- [ ] **TEXT-02**: User can add standalone text objects to canvas
- [ ] **TEXT-03**: User can edit text inline by clicking (no modal dialog)

### Real-Time Collaboration

- [ ] **SYNC-01**: User sees other collaborators' cursors with username labels in real-time
- [ ] **SYNC-02**: User sees presence indicator showing who's online
- [x] **SYNC-03**: Changes sync to all collaborators within 200ms
- [x] **SYNC-04**: User can share board via link (team-based or public)
- [x] **SYNC-05**: Connection automatically reconnects and syncs after network drops

### TODO Integration

- [ ] **TODO-01**: User can add TODO cards to canvas with status, due date, assignee
- [ ] **TODO-02**: User sees visual task status (checkmark, color coding for done/not done)
- [ ] **TODO-03**: User can group tasks into visual sections on canvas
- [ ] **TODO-04**: Canvas TODO cards sync with existing backend TODO system

### File Handling

- [ ] **FILE-01**: User can upload/paste images onto canvas
- [ ] **FILE-02**: User can export board as PNG image
- [ ] **FILE-03**: User can export board as PDF document

### Platform

- [x] **PLAT-01**: Web app works responsively on any screen size
- [ ] **PLAT-02**: iOS native app wrapper via Capacitor
- [ ] **PLAT-03**: Android native app wrapper via Capacitor
- [ ] **PLAT-04**: Touch gestures work (pinch zoom, touch draw) on mobile

## Validated (Existing)

From existing codebase:

- [x] **AUTH-01**: User can register with email and password — existing
- [x] **AUTH-02**: User can log in with JWT authentication — existing
- [x] **AUTH-03**: User can reset password — existing
- [x] **TEAM-01**: User can create and manage teams — existing
- [x] **TEAM-02**: User can invite/manage team membership — existing
- [x] **LIST-01**: User can create TODO lists within teams — existing
- [x] **ITEM-01**: User can create TODO items with completion status — existing
- [x] **INFR-01**: WebSocket infrastructure exists for real-time events — existing
- [x] **INFR-02**: Rate limiting on authentication endpoints — existing

## v2 Requirements

Deferred to future release:

### Collaboration Enhancements
- **COLLAB-01**: User can add comments/threads on canvas objects
- **COLLAB-02**: User can vote/react on canvas objects
- **COLLAB-03**: User can follow presenter in spotlight mode

### Canvas Intelligence
- **INTEL-01**: User can auto-tidy scattered objects into grid
- **INTEL-02**: User can use pre-made templates
- **INTEL-03**: Objects snap to alignment guides

### History & Offline
- **HIST-01**: User can view and restore version history
- **HIST-02**: User can edit offline and sync when reconnected

## Out of Scope

Explicitly excluded from this project:

| Feature | Reason |
|---------|--------|
| Native desktop app (Electron) | Web browser sufficient for desktop use |
| Video/audio collaboration | Focus on visual artifacts, not meetings — link to external tools |
| Complex permission hierarchies | Simple view/edit at board level is sufficient for v1 |
| AI features (summarization, auto-diagram) | Expensive, distracting from core value |
| Full document editing (headers, tables) | Scope creep into Notion territory — keep it simple |
| Complex diagramming (UML, ERD) | Users needing Lucidchart will use Lucidchart |
| Pixel-perfect design tools | Hand-drawn aesthetic easier and reduces "I can't draw" anxiety |
| Per-element permissions | Massive complexity — board-level permissions only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CANV-01 | Phase 2 | Complete |
| CANV-02 | Phase 2 | Complete |
| CANV-03 | Phase 3 | Complete |
| CANV-04 | Phase 2 | Complete |
| DRAW-01 | Phase 3 | Complete |
| DRAW-02 | Phase 3 | Complete |
| DRAW-03 | Phase 3 | Complete |
| DRAW-04 | Phase 3 | Complete |
| TEXT-01 | Phase 4 | Pending |
| TEXT-02 | Phase 4 | Pending |
| TEXT-03 | Phase 4 | Pending |
| SYNC-01 | Phase 7 | Pending |
| SYNC-02 | Phase 7 | Pending |
| SYNC-03 | Phase 1 | Complete |
| SYNC-04 | Phase 1 | Complete |
| SYNC-05 | Phase 1 | Complete |
| TODO-01 | Phase 5 | Pending |
| TODO-02 | Phase 5 | Pending |
| TODO-03 | Phase 5 | Pending |
| TODO-04 | Phase 5 | Pending |
| FILE-01 | Phase 6 | Pending |
| FILE-02 | Phase 6 | Pending |
| FILE-03 | Phase 6 | Pending |
| PLAT-01 | Phase 2 | Complete |
| PLAT-02 | Phase 8 | Pending |
| PLAT-03 | Phase 8 | Pending |
| PLAT-04 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-21 after Phase 3 completion*
