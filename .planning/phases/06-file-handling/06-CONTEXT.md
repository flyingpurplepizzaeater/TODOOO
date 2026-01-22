# Phase 6: File Handling - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add images to the canvas (upload, paste, drag-drop) and export boards as PNG and PDF. Storage handling and image sync to collaborators included. Image editing, cropping, or annotation are separate capabilities.

</domain>

<decisions>
## Implementation Decisions

### Image Placement
- Images appear at viewport center when uploaded/pasted
- Keep original image dimensions (no auto-scaling on placement)
- No file size limit — backend handles storage
- Aspect ratio locked during resize (proportional only)

### Export Scope
- User chooses: viewport only OR full board content
- User chooses: include background OR transparent PNG
- Custom scale factor option (0.5x to 4x range)
- Both download and copy-to-clipboard available

### PDF Layout
- User chooses: single page (scaled) OR multi-page (tiled)
- User chooses: portrait OR landscape orientation
- Content only — no headers, footers, or metadata
- Multiple page sizes: A4, Letter, A3, Tabloid, Legal

### Upload UX
- Three upload methods: drag-drop, paste, toolbar button
- Accept any image format the browser can display
- Batch upload supported (multiple files at once)
- Batch images cascade with offset (like stacked cards)

### Claude's Discretion
- Export dialog layout and button placement
- Cascade offset distance for batch uploads
- Loading states and progress indicators
- Error handling for unsupported formats

</decisions>

<specifics>
## Specific Ideas

- Cascade arrangement for batch uploads makes it easy to separate images without overlap confusion
- Export dialog should feel quick — user picks options and clicks export, not a multi-step wizard

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-file-handling*
*Context gathered: 2026-01-22*
