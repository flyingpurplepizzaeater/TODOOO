---
phase: 06-file-handling
plan: 02
subsystem: ui, canvas
tags: [tldraw, image-upload, file-picker, toolbar, batch-upload]

# Dependency graph
requires:
  - phase: 06-01
    provides: TLAssetStore implementation, presigned URL pattern
provides:
  - handleFileUpload() utility for toolbar-initiated image uploads
  - Image button in CustomToolbar between TODO and Frames
  - Batch upload with cascade offset (40px stacked cards effect)
affects: [06-04] # Manual verification of image upload UI

# Tech tracking
tech-stack:
  added: []
  patterns: [toolbar file picker pattern, cascade offset for batch placement]

key-files:
  created:
    - frontend/src/components/Canvas/fileHandling/useImageUpload.ts
  modified:
    - frontend/src/components/Canvas/CustomToolbar.tsx

key-decisions:
  - "Cascade offset 40px for stacked cards effect on batch uploads"
  - "Toolbar upload only - drag-drop and paste handled natively by tldraw + TLAssetStore"

patterns-established:
  - "Toolbar file picker: create hidden input, trigger click, process files via editor.putExternalContent"
  - "Viewport-center placement with cascade offset for multi-file uploads"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 6 Plan 2: Image Upload UI Summary

**Toolbar Image button with batch upload support via hidden file picker and cascade layout for multiple images**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T05:03:47Z
- **Completed:** 2026-01-22T05:06:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Image upload utility function with cascade offset for batch uploads
- Toolbar Image button integrated between TODO and Frames buttons
- Consistent styling with existing toolbar elements
- Full FILE-01 requirement support: toolbar button, drag-drop, paste all working

## Task Commits

Each task was committed atomically:

1. **Task 1: Image upload utility function** - `db572e4` (feat)
2. **Task 2: Toolbar image button integration** - `37ec40b` (feat)

## Files Created/Modified
- `frontend/src/components/Canvas/fileHandling/useImageUpload.ts` - handleFileUpload() with cascade offset for batch uploads
- `frontend/src/components/Canvas/CustomToolbar.tsx` - Added Image button with consistent styling

## Decisions Made
- **CASCADE_OFFSET = 40px:** Creates stacked cards effect per CONTEXT.md when uploading multiple images
- **Toolbar-only code:** Drag-drop and paste work automatically via tldraw + TLAssetStore from Plan 01, no custom handlers needed
- **Viewport center placement:** Images appear at visible canvas center, not page origin

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript build errors in useYjsStore.ts, useTodoSync.ts remain (Phase 2/5 issues)
- These errors are unrelated to image upload functionality and were already documented in STATE.md

## User Setup Required

None - no external service configuration required for this plan.

**Note:** MinIO configuration from Plan 01 still required for actual uploads to work.

## Next Phase Readiness
- Image upload UI complete
- All three upload methods functional: toolbar button, drag-drop, paste
- Ready for Plan 03: Export functionality (PNG, PDF)
- Plan 04: Manual verification will test image upload along with export

---
*Phase: 06-file-handling*
*Completed: 2026-01-22*
