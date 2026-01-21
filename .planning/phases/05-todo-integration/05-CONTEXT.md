# Phase 5: TODO Integration - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage tasks visually on the canvas with backend synchronization. This includes adding TODO cards with status/due date/assignee, seeing visual task status, grouping tasks into sections (frames), and bidirectional sync with the existing backend TODO system.

Out of scope: Creating the backend TODO system itself (assumed to exist), notifications, recurring tasks, comments on TODOs.

</domain>

<decisions>
## Implementation Decisions

### Card layout & content
- Full card format: title, status checkbox, due date, assignee avatar
- Fully resizable cards (user can resize freely like sticky notes)
- Distinct visual style from sticky notes (different border, shadow, or shape)

### Status visualization
- Completed tasks: checkmark + green tint + strikethrough (all three combined)
- Checkbox positioned left of title (classic todo list pattern)
- Overdue tasks: red due date text AND subtle red border for high visibility
- Priority color-coding: High (red), Medium (yellow), Low (blue) - 3 levels

### Section/grouping behavior
- Frames as named rectangular containers (Figma-style)
- Cards auto-arrange when dropped inside frames (snap to grid/list)
- Multiple presets available: Kanban, Eisenhower matrix, weekly columns, plus fully custom
- Unlimited frame nesting supported

### Backend sync rules
- Full CRUD bidirectional sync (create, update, delete)
- Conflict handling: merge non-conflicting fields, flag conflicts for user resolution
- Can create new TODO cards OR link to existing backend TODOs
- Real-time push updates via WebSocket when backend changes

### Claude's Discretion
- Assignee avatar placement on card
- Specific card dimensions and aspect ratio
- Frame preset visual styling
- Conflict resolution UI design
- Exact grid/arrangement algorithm for auto-arrange

</decisions>

<specifics>
## Specific Ideas

- Cards should feel distinct from sticky notes - they're structured data, not freeform text
- Auto-arrange in frames like a kanban board - organized, not scattered
- Priority colors should be prominent enough to scan at a glance
- Overdue treatment should be obvious - users shouldn't miss deadlines

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 05-todo-integration*
*Context gathered: 2026-01-21*
