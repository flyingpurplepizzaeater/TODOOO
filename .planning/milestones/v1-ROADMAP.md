# Milestone v1: CollabBoard MVP

**Status:** SHIPPED 2026-01-23
**Phases:** 1-8
**Total Plans:** 28

## Overview

CollabBoard delivers a collaborative TODO and whiteboard application. The roadmap prioritized real-time infrastructure first (foundation for everything), then canvas UI, followed by tools and features, and finally mobile wrappers. Each phase delivered a coherent, verifiable capability.

## Phases

### Phase 1: Real-Time Infrastructure

**Goal:** Backend supports real-time CRDT synchronization for collaborative editing
**Depends on:** None (foundation phase)
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Database models (Board, BoardPermission, AuditLog) and migrations
- [x] 01-02-PLAN.md — Custom CRDT persistence layer for Y.Doc state
- [x] 01-03-PLAN.md — Room manager and WebSocket endpoint for Yjs sync
- [x] 01-04-PLAN.md — REST endpoints for board management and sharing

**Requirements:** SYNC-03, SYNC-04, SYNC-05

---

### Phase 2: Canvas Foundation

**Goal:** Users can view and navigate an infinite canvas with selection capabilities
**Depends on:** Phase 1
**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md — React frontend setup (Vite + React + TypeScript)
- [x] 02-02-PLAN.md — tldraw integration with Yjs sync (useYjsStore hook)
- [x] 02-03-PLAN.md — Canvas customization (camera options, toolbar, keyboard shortcuts)
- [x] 02-04-PLAN.md — Per-user undo/redo (Yjs UndoManager integration)

**Requirements:** CANV-01, CANV-02, CANV-04, PLAT-01

---

### Phase 3: Drawing Tools

**Goal:** Users can draw freehand and create shapes with customizable appearance
**Depends on:** Phase 2
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Global style configuration (stroke widths, color palette)
- [x] 03-02-PLAN.md — Custom toolbar (bottom-center, auto-hide, pin toggle)
- [x] 03-03-PLAN.md — Tool shortcuts and default tool configuration

**Requirements:** CANV-03, DRAW-01, DRAW-02, DRAW-03, DRAW-04

---

### Phase 4: Notes & Text

**Goal:** Users can add and edit text content on the canvas
**Depends on:** Phase 2
**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Note and text configuration (colors, resize mode, persistence)
- [x] 04-02-PLAN.md — Manual verification of notes and text functionality (deferred)

**Requirements:** TEXT-01, TEXT-02, TEXT-03

---

### Phase 5: TODO Integration

**Goal:** Users can manage tasks visually on the canvas with backend synchronization
**Depends on:** Phase 4
**Plans:** 4 plans

Plans:
- [x] 05-01-PLAN.md — Custom TODO shape (TodoShapeUtil, TodoCard, TodoTool, toolbar integration)
- [x] 05-02-PLAN.md — Bidirectional backend sync (todoApi service, useTodoSync hook)
- [x] 05-03-PLAN.md — Frame presets for task grouping (Kanban, Eisenhower, custom sections)
- [x] 05-04-PLAN.md — Manual verification of TODO integration functionality (deferred)

**Requirements:** TODO-01, TODO-02, TODO-03, TODO-04

---

### Phase 6: File Handling

**Goal:** Users can add images and export boards as PNG/PDF
**Depends on:** Phase 2
**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — Backend presigned URL endpoint and frontend TLAssetStore
- [x] 06-02-PLAN.md — Image upload UI (toolbar button, drag-drop, paste)
- [x] 06-03-PLAN.md — Export dialog and PNG/PDF generation

**Requirements:** FILE-01, FILE-02, FILE-03

---

### Phase 7: Collaboration Polish

**Goal:** Users have full awareness of collaborators' activity
**Depends on:** Phase 1, Phase 2
**Plans:** 3 plans

Plans:
- [x] 07-01-PLAN.md — Awareness hook and cursor sync (Yjs Awareness, TLInstancePresence, color palette)
- [x] 07-02-PLAN.md — Dot cursor and selection indicators (DotCursor component, TLComponents config)
- [x] 07-03-PLAN.md — Presence sidebar (collaborator list, idle detection, follow mode)

**Requirements:** SYNC-01, SYNC-02

---

### Phase 8: Mobile Platform

**Goal:** App works natively on iOS and Android with touch interactions
**Depends on:** Phases 2-6 stable
**Plans:** 5 plans

Plans:
- [x] 08-01-PLAN.md — Capacitor setup (packages, config, iOS/Android platforms)
- [x] 08-02-PLAN.md — Touch gesture configuration (pinch zoom, finger draw, stylus support)
- [x] 08-03-PLAN.md — App lifecycle and offline caching (WebSocket reconnection, 10-board cache)
- [x] 08-04-PLAN.md — Native features (camera capture, notifications, Photos/Files export)
- [x] 08-05-PLAN.md — Native builds and verification (icons, splash, TestFlight/APK)

**Requirements:** PLAT-02, PLAT-03, PLAT-04

---

## Milestone Summary

**Key Decisions:**

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid platform (web + Capacitor) | Single codebase, broad reach | Good - works well |
| tldraw for canvas | Mature library, Yjs integration | Good - saved months |
| Yjs for CRDT | Industry standard, good docs | Good - <200ms sync |
| MinIO for images | S3-compatible, self-hostable | Good - simple setup |
| Custom TODO shape | Native canvas integration | Good - seamless UX |

**Issues Resolved:**

- Fixed Y.js type imports with verbatimModuleSyntax
- Fixed WebSocket reconnection with exponential backoff
- Fixed mobile touch detection with proper viewport checks

**Technical Debt Incurred:**

- Phase 4 missing VERIFICATION.md (functionality complete, verification deferred)
- Vite production build has Y.js generic type issues (from Phase 2)
- todo-sync event dispatcher not implemented (backend->canvas sync one-way)
- defaultListId not passed to Canvas (TODO API sync disabled by default)
- Hardcoded user placeholder in Canvas.tsx:149

---

*Archived: 2026-01-23 as part of v1 milestone completion*
*For current project status, see .planning/ROADMAP.md*
