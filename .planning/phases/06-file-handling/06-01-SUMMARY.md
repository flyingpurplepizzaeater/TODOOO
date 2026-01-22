---
phase: 06-file-handling
plan: 01
subsystem: api, storage
tags: [minio, presigned-url, tldraw, asset-store, boto3]

# Dependency graph
requires:
  - phase: 02-canvas-foundation
    provides: tldraw integration, useYjsStore hook, Canvas component
provides:
  - POST /boards/{board_id}/upload-url endpoint for presigned URL generation
  - createAssetStore() TLAssetStore implementation for tldraw
  - storageApi.ts client for presigned URL requests
affects: [06-02, 06-03, 06-04] # Image upload UI, export functionality

# Tech tracking
tech-stack:
  added: [boto3 (backend dependency for MinIO)]
  patterns: [presigned URL pattern for direct client-to-storage uploads]

key-files:
  created:
    - frontend/src/services/storageApi.ts
    - frontend/src/components/Canvas/fileHandling/useAssetStore.ts
  modified:
    - config.py
    - schemas.py
    - routers/boards.py
    - frontend/src/components/Canvas/Canvas.tsx
    - frontend/src/components/Canvas/useYjsStore.ts

key-decisions:
  - "Lazy boto3 import to avoid startup failure if not installed"
  - "Pass assetStore to createTLStore via useYjsStore parameter (not Tldraw prop)"
  - "Key format: boards/{board_id}/{uuid}/{filename} for unique asset paths"

patterns-established:
  - "Presigned URL pattern: client requests URL from backend, uploads directly to MinIO"
  - "TLAssetStore integration: pass to createTLStore, not as Tldraw prop"

# Metrics
duration: 15min
completed: 2026-01-22
---

# Phase 6 Plan 1: Asset Store Foundation Summary

**MinIO presigned URL endpoint and TLAssetStore implementation for persistent canvas image storage**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-22
- **Completed:** 2026-01-22
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Backend presigned URL endpoint with edit-access verification
- MinIO configuration with environment variable support
- Frontend TLAssetStore that uploads images via presigned URLs
- Canvas component wired to use persistent asset storage

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend presigned URL endpoint** - `2de68c8` (feat)
2. **Task 2: Frontend storage API and asset store** - `d7b29a3` (feat)

## Files Created/Modified
- `config.py` - MinIO configuration (URL, keys, bucket)
- `schemas.py` - UploadUrlRequest/UploadUrlResponse schemas
- `routers/boards.py` - POST /{board_id}/upload-url endpoint
- `frontend/src/services/storageApi.ts` - Presigned URL API client
- `frontend/src/components/Canvas/fileHandling/useAssetStore.ts` - TLAssetStore implementation
- `frontend/src/components/Canvas/useYjsStore.ts` - Added assetStore parameter
- `frontend/src/components/Canvas/Canvas.tsx` - Wired up assetStore

## Decisions Made
- **Lazy boto3 import:** Backend doesn't fail on startup if boto3 not installed; returns 503 on upload attempt instead
- **assetStore via createTLStore:** tldraw v4 with external store requires assets passed to store creation, not as Tldraw component prop
- **Key format with UUID:** Prevents filename collisions: boards/{board_id}/{uuid}/{filename}
- **1-hour presigned URL expiry:** Balances usability with security

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed tldraw assets integration approach**
- **Found during:** Task 2 (Frontend asset store)
- **Issue:** tldraw v4 with store prop doesn't accept `assets` prop on Tldraw component
- **Fix:** Modified useYjsStore to accept assetStore parameter and pass to createTLStore
- **Files modified:** useYjsStore.ts, Canvas.tsx
- **Verification:** TypeScript compiles without errors for asset-related code
- **Committed in:** d7b29a3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** API change discovery required different integration approach. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in useYjsStore.ts, useTodoSync.ts remain (not introduced by this plan)
- These are Phase 2/5 issues unrelated to asset store functionality

## User Setup Required

**For production deployment:**
1. Install boto3: `pip install boto3`
2. Configure MinIO/S3 environment variables:
   - MINIO_URL
   - MINIO_ACCESS_KEY
   - MINIO_SECRET_KEY
   - MINIO_PUBLIC_URL
   - MINIO_BUCKET
3. Create bucket and configure CORS for browser uploads

## Next Phase Readiness
- Asset store foundation complete
- Ready for Plan 02: Image upload UI (toolbar button, paste/drag-drop)
- MinIO deployment/configuration needed for end-to-end testing

---
*Phase: 06-file-handling*
*Completed: 2026-01-22*
