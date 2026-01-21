---
phase: 05-todo-integration
plan: 01
subsystem: ui
tags: [tldraw, custom-shape, react, date-fns]

# Dependency graph
requires:
  - phase: 04-notes-text
    provides: tldraw canvas with notes, custom toolbar
provides:
  - TodoShape custom tldraw shape type
  - TodoCard visual component with status/priority visualization
  - TodoShapeUtil for shape behavior
  - TodoTool for shape creation
  - Toolbar integration with TODO button
  - Keyboard shortcuts (T, 7) for TODO tool
affects: [05-02 backend sync, 05-04 task status]

# Tech tracking
tech-stack:
  added: [date-fns 4.1.0]
  patterns: [custom tldraw shape, BaseBoxShapeUtil extension, StateNode tool]

key-files:
  created:
    - frontend/src/components/Canvas/shapes/todo/types.ts
    - frontend/src/components/Canvas/shapes/todo/TodoCard.tsx
    - frontend/src/components/Canvas/shapes/todo/TodoShapeUtil.tsx
    - frontend/src/components/Canvas/shapes/todo/TodoTool.ts
    - frontend/src/components/Canvas/shapes/todo/index.ts
    - frontend/src/components/Canvas/shapes/index.ts
  modified:
    - frontend/package.json
    - frontend/src/components/Canvas/Canvas.tsx
    - frontend/src/components/Canvas/CustomToolbar.tsx
    - frontend/src/components/Canvas/uiOverrides.ts

key-decisions:
  - "T.literalEnum for priority validator (high/medium/low)"
  - "Freely resizable cards (not aspect-locked) per CONTEXT.md"
  - "Checkbox with stopPropagation to prevent canvas click-through"
  - "contentEditable for inline title editing"
  - "isPast() + isToday() for overdue calculation"

patterns-established:
  - "Custom shape: types.ts -> TodoCard.tsx -> TodoShapeUtil.tsx -> TodoTool.ts -> index.ts"
  - "Shape/tool registration outside component (const customShapeUtils = [...])"
  - "Tool button in CustomToolbar with active state styling"

# Metrics
duration: 7min
completed: 2026-01-21
---

# Phase 5 Plan 1: TODO Shape Type Summary

**Custom TODO card shape for tldraw with checkbox, priority border, overdue styling, and toolbar/keyboard integration**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-21T04:03:47Z
- **Completed:** 2026-01-21T04:10:51Z
- **Tasks:** 4
- **Files modified:** 10

## Accomplishments
- TodoShape type with full metadata (title, completed, dueDate, assignee, priority, backendId, listId)
- TodoCard component with visual states: green tint for completed, red border for overdue, priority left border
- TodoShapeUtil extending BaseBoxShapeUtil for free resize and inline editing
- TodoTool for click-to-create with automatic select tool switch
- Toolbar TODO button and keyboard shortcuts (T, 7)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install date-fns and create TODO shape types** - `0ee1966` (feat)
2. **Task 2: Create TodoCard visual component** - `ec3b770` (feat)
3. **Task 3: Create TodoShapeUtil and TodoTool** - `550516e` (feat)
4. **Task 4: Register shape and add toolbar/keyboard integration** - `48ae060` (feat)

## Files Created/Modified

**Created:**
- `frontend/src/components/Canvas/shapes/todo/types.ts` - TodoShape type definition with T validators
- `frontend/src/components/Canvas/shapes/todo/TodoCard.tsx` - Visual card component with priority/status styling
- `frontend/src/components/Canvas/shapes/todo/TodoShapeUtil.tsx` - Shape utility extending BaseBoxShapeUtil
- `frontend/src/components/Canvas/shapes/todo/TodoTool.ts` - StateNode tool for creating TODOs
- `frontend/src/components/Canvas/shapes/todo/index.ts` - Barrel exports
- `frontend/src/components/Canvas/shapes/index.ts` - Shapes barrel export

**Modified:**
- `frontend/package.json` - Added date-fns 4.1.0
- `frontend/src/components/Canvas/Canvas.tsx` - Register shapeUtils and tools
- `frontend/src/components/Canvas/CustomToolbar.tsx` - Add TODO button
- `frontend/src/components/Canvas/uiOverrides.ts` - Add T/7 keyboard shortcuts

## Decisions Made

- **T.literalEnum for priority:** Used `T.literalEnum('high', 'medium', 'low')` validator for type-safe priority enum
- **Free resize cards:** Per CONTEXT.md, TODO cards are freely resizable (not aspect-locked like notes)
- **Checkbox stopPropagation:** Prevent checkbox clicks from propagating to canvas to avoid selection issues
- **isPast + isToday for overdue:** Task is overdue if past due date AND not today (today is still valid)
- **Shape utils outside component:** Defined as const arrays outside Canvas component to prevent recreation on render

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TODO shape renders and can be created via toolbar or keyboard
- Ready for Phase 5 Plan 2: Backend sync integration
- Shape has backendId and listId props ready for linking to backend TODOs
- Checkbox toggle and title editing work locally, need backend sync

---
*Phase: 05-todo-integration*
*Completed: 2026-01-21*
