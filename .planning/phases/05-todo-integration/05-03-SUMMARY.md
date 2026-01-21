---
phase: 05
plan: 03
subsystem: canvas
tags: [frames, presets, kanban, eisenhower, toolbar]
completed: 2026-01-21
duration: ~5 min

dependency_graph:
  requires:
    - 04-01 (Notes & Text - CustomToolbar base)
  provides:
    - Frame preset creation system
    - Toolbar frame dropdown
    - Visual task grouping containers
  affects:
    - 05-04 (TODO Card Shape - cards placed in frames)

tech_stack:
  added: []
  patterns:
    - Frame presets via editor.createShape({ type: 'frame' })
    - Dropdown menu with click-outside dismiss
    - getViewportCenter for centered preset placement

key_files:
  created:
    - frontend/src/components/Canvas/framePresets.ts
  modified:
    - frontend/src/components/Canvas/CustomToolbar.tsx

decisions:
  - key: dropdown-for-frames
    rationale: Space-efficient UI, keeps toolbar compact
  - key: viewport-center-placement
    rationale: Presets visible immediately after creation
  - key: separator-before-custom
    rationale: Visual distinction between presets and custom option
---

# Phase 5 Plan 03: Frame Presets Summary

Frame preset system for visual task grouping on canvas with toolbar integration.

## One-liner

Frame presets (Kanban, Eisenhower, Weekly) via toolbar dropdown, created at viewport center using tldraw frame shapes.

## What Was Built

### Task 1: Frame Preset Functions (`framePresets.ts`)

Created 5 exported functions:

| Function | Description | Output |
|----------|-------------|--------|
| `createKanbanBoard` | 3 columns (To Do, In Progress, Done) | 300x500px columns, 20px gap |
| `createEisenhowerMatrix` | 2x2 urgency/importance grid | 350x300px cells, 10px gap |
| `createWeeklyColumns` | Mon-Fri daily planning | 200x400px columns, 15px gap |
| `createCustomFrame` | Single named section | 300x400px default |
| `getViewportCenter` | Viewport center calculation | Offset for preset size |

All functions use `editor.createShape({ type: 'frame', props: { w, h, name } })` pattern.

### Task 2: Toolbar Frame Dropdown

Added to CustomToolbar.tsx:
- "Frames" dropdown button (styled to match existing toolbar aesthetic)
- 4 preset options in dropdown menu with hover states
- Separator line before Custom Section option
- Click-outside listener to dismiss dropdown
- Frames created at viewport center for immediate visibility

## Technical Details

**Frame Shape API:**
```typescript
editor.createShape({
  type: 'frame',
  x: number,
  y: number,
  props: {
    w: number,
    h: number,
    name: string,  // Label shown on frame
  }
})
```

**Viewport Center Calculation:**
```typescript
const bounds = editor.getViewportScreenBounds()
const center = editor.screenToPage({ x: bounds.w / 2, y: bounds.h / 2 })
return { x: center.x - 300, y: center.y - 200 }  // Offset for typical preset size
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 8afde6f | feat | Create frame preset functions |
| 0dea5f8 | feat | Add frame preset dropdown to toolbar |

## Deviations from Plan

None - plan executed exactly as written.

## What's Next

Plan 05-04 will create the custom TODO card shape (`TodoShapeUtil`) that can be placed inside these frames. Cards dropped into frames automatically become children via tldraw's `onDragShapesIn` behavior.

## Files Reference

**Created:**
- `frontend/src/components/Canvas/framePresets.ts` - Frame preset creation functions

**Modified:**
- `frontend/src/components/Canvas/CustomToolbar.tsx` - Added Frames dropdown with presets

---

*Plan: 05-03 | Phase: TODO Integration | Completed: 2026-01-21*
