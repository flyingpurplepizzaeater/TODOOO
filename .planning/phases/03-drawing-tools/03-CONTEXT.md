# Phase 3: Drawing Tools - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can draw freehand and create shapes with customizable appearance. This includes freehand drawing (pen/marker), basic shapes (rectangle, circle, line, arrow), eraser tool, color selection (8-12 presets), and stroke width selection (thin/medium/thick). Since tldraw already provides these tools, the work focuses on customization and presentation.

</domain>

<decisions>
## Implementation Decisions

### Color palette
- Mix of classic whiteboard + vibrant modern colors (no specific brand colors)
- Target 12+ colors combining professional (black, blue, red, green) with vibrant saturated options
- Colors stay consistent regardless of dark/light mode — no theme adaptation

### Stroke styles
- Three widths with clear visual difference: ~2px, ~6px, ~12px (thin/medium/thick)
- Line styles: solid + dashed + dotted available
- Shapes support solid fill option (user can choose filled or outline)
- Arrows have head options: single, double, or no arrowhead

### Tool behavior
- Default tool on canvas open: Select tool (safe default)
- Both pen (sharp/precise) and marker (smoothed/natural) tools available
- Eraser supports both modes: stroke eraser (whole strokes) and pixel eraser (portions)
- Eraser has size options: small/medium/large

### Toolbar presentation
- Main toolbar positioned at bottom center (mobile-friendly, thumb reach)
- Touch targets use responsive scaling (same size, consistent across devices)
- Toolbar visibility is user-toggleable (can pin visible or set to auto-hide when drawing)

### Claude's Discretion
- Color/width picker presentation method (popup, inline, or context panel)
- Exact pixel values for stroke widths within ~2/~6/~12 range
- Specific colors in the 12+ color palette
- Smoothing algorithm parameters for marker tool

</decisions>

<specifics>
## Specific Ideas

- Toolbar at bottom center positions it for mobile thumb reach — prioritizing touch ergonomics
- Both pen and marker available gives users choice between technical diagrams and natural sketching
- Clear stroke width difference (~2/~6/~12px) ensures choices are obvious at a glance
- User-toggleable toolbar auto-hide balances screen real estate with quick access preferences

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-drawing-tools*
*Context gathered: 2026-01-20*
