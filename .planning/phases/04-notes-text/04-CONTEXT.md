# Phase 4: Notes & Text - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add and edit text content on the canvas — sticky notes with multiple colors, standalone text objects, and inline editing. Users can create, edit, and style text directly on the canvas. Text edits sync to collaborators in real-time.

</domain>

<decisions>
## Implementation Decisions

### Sticky note design
- Square shape — classic Post-it look, equal width/height
- 6-8 colors available — expanded palette (yellow, pink, blue, green, orange, purple, etc.)
- Aspect-locked resize — can resize but stays square
- Subtle shadow — light drop shadow like real Post-it for depth

### Text editing experience
- Free font sizing — user picks any size
- Left/center/right alignment options available
- Double-click to edit — single click selects, double-click enters edit mode
- Bold and italic formatting supported via keyboard shortcuts

### Text object behavior
- Optional background — user can toggle background on/off for standalone text
- Separate text color palette — different from drawing palette, optimized for text readability
- No dedicated keyboard shortcut for text tool — use toolbar only
- Clicking away commits edits — clicking outside saves the text

### Empty/default states
- Empty with cursor — no placeholder text, just blinking cursor
- Auto-focus on creation — start typing immediately after placing note/text
- Keep empty objects — empty notes stay on canvas (don't auto-delete)
- Persist color choice — remember last-used sticky note color between sessions

### Claude's Discretion
- Exact sticky note color palette selection (6-8 colors)
- Text color palette design (optimized for readability)
- Shadow depth and styling
- Font family selection
- Keyboard shortcuts for bold/italic (likely Ctrl+B, Ctrl+I)

</decisions>

<specifics>
## Specific Ideas

- Sticky notes should feel like real Post-its — square shape with subtle shadow
- Text editing should be intuitive — double-click convention familiar from desktop apps
- Rich text keeps it useful for emphasis without overcomplicating

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-notes-text*
*Context gathered: 2026-01-21*
