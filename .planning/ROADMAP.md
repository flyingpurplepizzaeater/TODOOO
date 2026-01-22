# Roadmap: CollabBoard

**Created:** 2026-01-19
**Depth:** Comprehensive (8-12 phases, 5-10 plans each)
**Total v1 Requirements:** 27

## Overview

CollabBoard delivers a collaborative TODO and whiteboard application. The roadmap prioritizes real-time infrastructure first (foundation for everything), then canvas UI, followed by tools and features, and finally mobile wrappers. Each phase delivers a coherent, verifiable capability.

---

## Phase 1: Real-Time Infrastructure

**Goal:** Backend supports real-time CRDT synchronization for collaborative editing

**Dependencies:** None (foundation phase)

**Requirements:**
- SYNC-03: Changes sync to all collaborators within 200ms
- SYNC-04: User can share board via link (team-based or public)
- SYNC-05: Connection automatically reconnects and syncs after network drops

**Success Criteria:**
1. Two browser windows connected to same board receive each other's state changes within 200ms
2. Disconnecting and reconnecting a client restores sync without data loss
3. Board can be accessed via shareable URL with appropriate team/public permissions
4. CRDT state persists to database and survives server restart

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Database models (Board, BoardPermission, AuditLog) and migrations
- [x] 01-02-PLAN.md — Custom CRDT persistence layer for Y.Doc state
- [x] 01-03-PLAN.md — Room manager and WebSocket endpoint for Yjs sync
- [x] 01-04-PLAN.md — REST endpoints for board management and sharing

---

## Phase 2: Canvas Foundation

**Goal:** Users can view and navigate an infinite canvas with selection capabilities

**Dependencies:** Phase 1 (needs sync infrastructure to integrate with)

**Requirements:**
- CANV-01: User can view infinite canvas with pan and zoom navigation
- CANV-02: User can select objects and move/resize/delete them
- CANV-04: User can undo/redo their own actions (per-user in collaborative mode)
- PLAT-01: Web app works responsively on any screen size

**Success Criteria:**
1. User can pan canvas by clicking and dragging, and zoom with scroll wheel
2. User can select, move, resize, and delete objects on the canvas
3. User can undo/redo their own changes without affecting other users' history
4. Canvas UI adapts properly from mobile (320px) to desktop (1920px+) viewports
5. Canvas state syncs to other connected clients in real-time

**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md — React frontend setup (Vite + React + TypeScript)
- [x] 02-02-PLAN.md — tldraw integration with Yjs sync (useYjsStore hook)
- [x] 02-03-PLAN.md — Canvas customization (camera options, toolbar, keyboard shortcuts)
- [x] 02-04-PLAN.md — Per-user undo/redo (Yjs UndoManager integration)

---

## Phase 3: Drawing Tools

**Goal:** Users can draw freehand and create shapes with customizable appearance

**Dependencies:** Phase 2 (needs canvas to draw on)

**Requirements:**
- CANV-03: User can add basic shapes (rectangle, circle, line, arrow)
- DRAW-01: User can draw freehand strokes with pen/marker tool
- DRAW-02: User can erase strokes with eraser tool
- DRAW-03: User can select from 8-12 preset colors for drawing
- DRAW-04: User can select stroke width (thin, medium, thick)

**Success Criteria:**
1. User can draw smooth freehand lines that appear instantly on canvas
2. User can add rectangle, circle, line, and arrow shapes via toolbar
3. User can erase specific strokes with eraser tool
4. User can select from at least 8 distinct colors before drawing
5. User can choose between at least 3 stroke widths that are visibly different

**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Global style configuration (stroke widths, color palette)
- [x] 03-02-PLAN.md — Custom toolbar (bottom-center, auto-hide, pin toggle)
- [x] 03-03-PLAN.md — Tool shortcuts and default tool configuration

---

## Phase 4: Notes & Text

**Goal:** Users can add and edit text content on the canvas

**Dependencies:** Phase 2 (needs canvas foundation)

**Requirements:**
- TEXT-01: User can add sticky notes with multiple color options
- TEXT-02: User can add standalone text objects to canvas
- TEXT-03: User can edit text inline by clicking (no modal dialog)

**Success Criteria:**
1. User can add sticky notes that appear as colored rectangles with text
2. User can choose from multiple sticky note colors (at least 4)
3. User can add text objects that are not contained in sticky notes
4. Clicking on any text object enters inline edit mode directly on the canvas
5. Text edits sync to other collaborators in real-time

**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Note and text configuration (colors, resize mode, persistence)
- [x] 04-02-PLAN.md — Manual verification of notes and text functionality (deferred)

---

## Phase 5: TODO Integration

**Goal:** Users can manage tasks visually on the canvas with backend synchronization

**Dependencies:** Phase 4 (TODO cards build on text/note UI patterns)

**Requirements:**
- TODO-01: User can add TODO cards to canvas with status, due date, assignee
- TODO-02: User sees visual task status (checkmark, color coding for done/not done)
- TODO-03: User can group tasks into visual sections on canvas
- TODO-04: Canvas TODO cards sync with existing backend TODO system

**Success Criteria:**
1. User can add a TODO card with title, status toggle, due date, and assignee
2. Completed tasks show visual checkmark and distinct color (e.g., green vs white)
3. User can create visual sections/frames to group related TODO cards
4. Creating/updating a TODO card on canvas updates the backend TODO list
5. Changes to backend TODO items reflect on canvas TODO cards

**Plans:** 4 plans

Plans:
- [x] 05-01-PLAN.md — Custom TODO shape (TodoShapeUtil, TodoCard, TodoTool, toolbar integration)
- [x] 05-02-PLAN.md — Bidirectional backend sync (todoApi service, useTodoSync hook)
- [x] 05-03-PLAN.md — Frame presets for task grouping (Kanban, Eisenhower, custom sections)
- [x] 05-04-PLAN.md — Manual verification of TODO integration functionality (deferred)

---

## Phase 6: File Handling

**Goal:** Users can add images and export boards as PNG/PDF

**Dependencies:** Phase 2 (needs canvas to upload to and export from)

**Requirements:**
- FILE-01: User can upload/paste images onto canvas
- FILE-02: User can export board as PNG image
- FILE-03: User can export board as PDF document

**Success Criteria:**
1. User can upload an image file via file picker and it appears on canvas
2. User can paste an image from clipboard and it appears on canvas
3. User can export the current board view as a PNG file
4. User can export the current board as a PDF document
5. Uploaded images sync to other collaborators

**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — Backend presigned URL endpoint and frontend TLAssetStore
- [x] 06-02-PLAN.md — Image upload UI (toolbar button, drag-drop, paste)
- [x] 06-03-PLAN.md — Export dialog and PNG/PDF generation

---

## Phase 7: Collaboration Polish

**Goal:** Users have full awareness of collaborators' activity

**Dependencies:** Phase 1 (needs sync infrastructure), Phase 2 (needs canvas for cursors)

**Requirements:**
- SYNC-01: User sees other collaborators' cursors with username labels in real-time
- SYNC-02: User sees presence indicator showing who's online

**Success Criteria:**
1. User sees colored cursors for each collaborator with their username displayed
2. Cursor movements from other users appear smoothly without lag
3. User sees a presence list showing all currently connected collaborators
4. Collaborators joining/leaving updates presence indicator within 2 seconds

---

## Phase 8: Mobile Platform

**Goal:** App works natively on iOS and Android with touch interactions

**Dependencies:** Phase 2-6 (web app must be stable before wrapping)

**Requirements:**
- PLAT-02: iOS native app wrapper via Capacitor
- PLAT-03: Android native app wrapper via Capacitor
- PLAT-04: Touch gestures work (pinch zoom, touch draw) on mobile

**Success Criteria:**
1. iOS app installs from TestFlight and opens the canvas
2. Android app installs from APK and opens the canvas
3. User can pinch to zoom on mobile devices
4. User can draw with finger/stylus touch
5. All Phase 2-6 features work in mobile apps without degradation

**Research Notes:** May need research on iOS canvas memory limits and Capacitor WebView optimization.

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Real-Time Infrastructure | SYNC-03, SYNC-04, SYNC-05 | Complete |
| 2 | Canvas Foundation | CANV-01, CANV-02, CANV-04, PLAT-01 | Complete |
| 3 | Drawing Tools | CANV-03, DRAW-01, DRAW-02, DRAW-03, DRAW-04 | Complete |
| 4 | Notes & Text | TEXT-01, TEXT-02, TEXT-03 | Complete |
| 5 | TODO Integration | TODO-01, TODO-02, TODO-03, TODO-04 | Complete |
| 6 | File Handling | FILE-01, FILE-02, FILE-03 | Complete |
| 7 | Collaboration Polish | SYNC-01, SYNC-02 | Not Started |
| 8 | Mobile Platform | PLAT-02, PLAT-03, PLAT-04 | Not Started |

**Coverage:** 27/27 requirements mapped

---

## Dependency Graph

```
Phase 1: Real-Time Infrastructure
    |
    v
Phase 2: Canvas Foundation ---> Phase 7: Collaboration Polish
    |
    +---> Phase 3: Drawing Tools
    |
    +---> Phase 4: Notes & Text ---> Phase 5: TODO Integration
    |
    +---> Phase 6: File Handling
    |
    v
Phase 8: Mobile Platform (depends on 2-6 stable)
```

---

*Roadmap created: 2026-01-19*
*Last updated: 2026-01-22 after Phase 6 execution*
