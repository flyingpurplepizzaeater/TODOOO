# Phase 2: Canvas Foundation - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view and navigate an infinite canvas with selection capabilities. This includes pan, zoom, select, move, resize, delete, and undo/redo. The canvas UI adapts responsively from mobile to desktop. Canvas state syncs to other connected clients in real-time via Phase 1 infrastructure.

Drawing tools, shapes, text, and sticky notes belong in later phases.

</domain>

<decisions>
## Implementation Decisions

### Navigation feel
- Direct 1:1 pan tracking — canvas moves exactly with cursor, no inertia/momentum
- Zoom limits: 10% to 400%
- Zoom triggered by Ctrl+scroll only — regular scroll reserved for page scrolling
- Corner minimap showing viewport position on large boards

### Selection behavior
- Shift+click to add to selection (click alone selects single object)
- Clicking empty canvas deselects all
- Blue border + resize handles visible on selected objects

### Claude's Discretion (Selection)
- Marquee selection behavior (intersect vs contain)

### Object manipulation
- Snapping: both grid snap AND smart alignment guides to other objects
- Free rotation available via rotation handle, any angle
- Free resize by default, Shift constrains aspect ratio
- Delete via Delete/Backspace key

### Toolbar & controls
- Top horizontal toolbar (classic position)
- Visible zoom controls: +/- buttons and percentage display
- Visible undo/redo buttons in toolbar (alongside Ctrl+Z/Y shortcuts)
- Extended keyboard shortcuts:
  - Standard: Ctrl+Z/Y, Delete, Ctrl+A, Ctrl+C/V, Space to pan
  - Extended: number keys for tools, bracket keys for zoom

</decisions>

<specifics>
## Specific Ideas

No specific product references mentioned — open to standard tldraw approaches for unspecified details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-canvas-foundation*
*Context gathered: 2026-01-20*
