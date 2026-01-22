# Phase 6: File Handling - Research

**Researched:** 2026-01-22
**Domain:** tldraw image upload/paste/drag-drop, canvas export (PNG/PDF), MinIO storage
**Confidence:** HIGH

## Summary

File handling in tldraw requires two distinct subsystems: (1) Image upload with TLAssetStore for persistent storage and sync, and (2) Export via Editor.toImage() for PNG plus jsPDF for PDF generation.

tldraw v4 has a well-defined asset handling architecture through `TLAssetStore` interface, which integrates seamlessly with external storage like MinIO via presigned URLs. The existing ARCHITECTURE.md already outlines the presigned URL pattern for file uploads.

For export, tldraw's `Editor.toImage()` provides PNG/JPEG output with configurable bounds, scale, and background. PDF generation requires an external library (jsPDF) since tldraw has no built-in PDF support.

**Primary recommendation:** Use TLAssetStore with MinIO presigned URLs for uploads; use Editor.toImage() + jsPDF for exports. Frontend-only solution for exports (no backend needed).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tldraw | 4.2.3 | Canvas with built-in image shape | Already in stack, native image support |
| jsPDF | 2.5.x | PDF generation from images | 15M+ weekly downloads, mature, well-documented |
| MinIO (boto3) | - | Object storage backend | Already in architecture plan (S3-compatible) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| File API (native) | - | Handle drag-drop, paste | Built into browser |
| Clipboard API (native) | - | Copy exported image | navigator.clipboard.write() |
| html2canvas | - | NOT NEEDED | tldraw.toImage() handles this natively |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsPDF | pdf-lib | pdf-lib is smaller but less documentation for image-based PDFs |
| jsPDF | html2pdf.js | Bundles html2canvas+jsPDF but adds unnecessary html2canvas |
| MinIO presigned | Direct FastAPI upload | Direct upload wastes server memory; presigned is more scalable |

**Installation:**
```bash
# Frontend
npm install jspdf

# Backend (already has boto3 pattern in ARCHITECTURE.md)
pip install boto3  # Already planned for MinIO integration
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
  components/Canvas/
    fileHandling/
      useAssetStore.ts       # TLAssetStore implementation for MinIO
      useImageUpload.ts      # Drag-drop, paste, toolbar button handlers
      ExportDialog.tsx       # Export options modal
      useExport.ts           # PNG/PDF export logic
    Canvas.tsx               # Add assets prop
  services/
    storageApi.ts            # Presigned URL requests
```

### Pattern 1: TLAssetStore for Image Storage
**What:** Implement TLAssetStore interface to upload images to MinIO via presigned URLs
**When to use:** Always - required for image persistence and sync across collaborators
**Example:**
```typescript
// Source: https://tldraw.dev/reference/tlschema/TLAssetStore
// Source: https://tldraw.dev/examples/data/assets/hosted-images

import { TLAssetStore, uniqueId } from 'tldraw'

const STORAGE_API = '/api/boards'

export function createAssetStore(boardId: string, token: string): TLAssetStore {
  return {
    async upload(asset, file) {
      // 1. Request presigned URL from backend
      const response = await fetch(`${STORAGE_API}/${boardId}/upload-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      })
      const { uploadUrl, assetUrl } = await response.json()

      // 2. Upload directly to MinIO via presigned URL
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      // 3. Return permanent URL for storage in tldraw record
      return { src: assetUrl }
    },

    resolve(asset) {
      // Return the stored URL as-is (MinIO public URL)
      return asset.props.src
    },
  }
}
```

### Pattern 2: Export with Bounds Selection
**What:** Use Editor.getViewportPageBounds() vs Editor.getCurrentPageBounds() for export scope
**When to use:** User choice between "viewport only" vs "full board"
**Example:**
```typescript
// Source: https://tldraw.dev/examples/export-canvas-settings

async function exportCanvas(editor: Editor, options: ExportOptions): Promise<Blob> {
  const shapeIds = editor.getCurrentPageShapeIds()
  if (shapeIds.size === 0) throw new Error('No shapes to export')

  // Determine bounds based on user choice
  const bounds = options.viewportOnly
    ? editor.getViewportPageBounds()
    : editor.getCurrentPageBounds()

  const { blob } = await editor.toImage([...shapeIds], {
    format: 'png',
    background: options.includeBackground,
    scale: options.scale,  // 0.5 to 4
    bounds: bounds,
    padding: 32,
  })

  return blob
}
```

### Pattern 3: PDF Multi-Page Tiling
**What:** Split large canvas into multiple PDF pages when content exceeds single page
**When to use:** User selects "multi-page" option for PDF export
**Example:**
```typescript
// Source: https://www.pixelstech.net/article/1741242294-create-multiple-page-pdf

import jsPDF from 'jspdf'

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },  // points
  letter: { width: 612, height: 792 },
  a3: { width: 841.89, height: 1190.55 },
  tabloid: { width: 792, height: 1224 },
  legal: { width: 612, height: 1008 },
}

async function exportToPdf(
  editor: Editor,
  options: PdfExportOptions
): Promise<Blob> {
  const { pageSize, orientation, layout } = options
  const size = PAGE_SIZES[pageSize]
  const pageWidth = orientation === 'landscape' ? size.height : size.width
  const pageHeight = orientation === 'landscape' ? size.width : size.height

  // Get canvas as PNG blob
  const shapeIds = editor.getCurrentPageShapeIds()
  const bounds = options.viewportOnly
    ? editor.getViewportPageBounds()
    : editor.getCurrentPageBounds()

  const { blob } = await editor.toImage([...shapeIds], {
    format: 'png',
    background: options.includeBackground,
    scale: 2,  // Higher quality for PDF
    bounds,
  })

  const imgData = await blobToDataUrl(blob)
  const img = await loadImage(imgData)

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: pageSize,
  })

  if (layout === 'single') {
    // Scale entire content to fit single page
    const scale = Math.min(pageWidth / img.width, pageHeight / img.height)
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    const x = (pageWidth - scaledWidth) / 2
    const y = (pageHeight - scaledHeight) / 2
    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight)
  } else {
    // Multi-page tiling
    const imgAspect = img.width / img.height
    const pageAspect = pageWidth / pageHeight

    // Scale image width to page width
    const scaledWidth = pageWidth
    const scaledHeight = pageWidth / imgAspect
    const totalPages = Math.ceil(scaledHeight / pageHeight)

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage()
      const yOffset = -page * pageHeight
      pdf.addImage(imgData, 'PNG', 0, yOffset, scaledWidth, scaledHeight)
    }
  }

  return pdf.output('blob')
}
```

### Pattern 4: Clipboard Write for Copy-to-Clipboard
**What:** Use Clipboard API to copy exported PNG to system clipboard
**When to use:** User clicks "Copy to Clipboard" instead of download
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write

async function copyImageToClipboard(blob: Blob): Promise<void> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ])
  } catch (error) {
    // Firefox doesn't support image clipboard write
    // Fall back to download
    throw new Error('Clipboard write not supported, downloading instead')
  }
}
```

### Anti-Patterns to Avoid
- **Proxying uploads through FastAPI:** Wastes memory and bandwidth. Use presigned URLs for direct client-to-MinIO upload (per ARCHITECTURE.md).
- **Using html2canvas for export:** tldraw has native `Editor.toImage()` that does this better and faster.
- **Embedding images as base64 in tldraw records:** Will bloat CRDT document. Store URLs only, images in MinIO.
- **Building custom image upload UI:** tldraw already handles paste/drag-drop internally, just needs TLAssetStore.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image paste/drag handling | Custom paste event listeners | tldraw's registerExternalContentHandler | tldraw already intercepts paste/drop, just needs TLAssetStore |
| Canvas to image conversion | html2canvas or manual canvas draw | Editor.toImage() | Built-in, handles all tldraw shapes correctly |
| Multi-page PDF layout | Custom page break calculation | jsPDF addImage with y-offset | Standard pattern, many examples available |
| Presigned URL generation | Custom token signing | boto3 generate_presigned_url | S3-standard, battle-tested security |
| Image shape creation | Custom shape util | tldraw's built-in ImageShapeUtil | Already handles resize, aspect ratio |

**Key insight:** tldraw already handles image shapes, paste events, and drag-drop. The only custom work needed is: (1) TLAssetStore implementation for MinIO, and (2) Export dialog UI.

## Common Pitfalls

### Pitfall 1: Forgetting to Pass assets Prop to Tldraw
**What goes wrong:** Images appear but don't persist; collaborators see broken images
**Why it happens:** TLAssetStore is optional, defaults to in-memory
**How to avoid:** Always pass `assets={assetStore}` to Tldraw component
**Warning signs:** Images work locally but break on refresh or for other users

### Pitfall 2: CORS Issues with MinIO Presigned URLs
**What goes wrong:** PUT request to presigned URL fails with CORS error
**Why it happens:** MinIO bucket doesn't allow cross-origin PUT
**How to avoid:** Configure MinIO CORS policy:
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"]
  }]
}
```
**Warning signs:** 403 or network errors on upload, works from backend but not browser

### Pitfall 3: Export Scale Factor Confusion
**What goes wrong:** Exported image is blurry or unexpectedly large
**Why it happens:** scale option affects output size multiplicatively
**How to avoid:** Document that scale 2 = 2x resolution, scale 0.5 = half resolution
**Warning signs:** Users complain about image quality or file size

### Pitfall 4: PDF Page Size Mismatch
**What goes wrong:** Content cut off or tiny on PDF page
**Why it happens:** jsPDF uses points (72 per inch) by default, not pixels
**How to avoid:** Use consistent units (points) and calculate scaling correctly
**Warning signs:** Content doesn't fit expected page, blank margins

### Pitfall 5: Clipboard API Browser Support
**What goes wrong:** Copy-to-clipboard fails silently or throws
**Why it happens:** Firefox doesn't support ClipboardItem for images; requires HTTPS
**How to avoid:** Feature detection and fallback to download
**Warning signs:** Works in Chrome but not Firefox/Safari

## Code Examples

Verified patterns from official sources:

### Image Upload via Toolbar Button
```typescript
// Adding upload button to CustomToolbar.tsx

function handleFileUpload(editor: Editor) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true  // Batch upload per CONTEXT.md

  input.onchange = async () => {
    if (!input.files) return
    const center = editor.getViewportPageBounds().center
    const CASCADE_OFFSET = 40  // px offset for stacked images

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i]
      // Let tldraw handle the rest - TLAssetStore.upload will be called
      await editor.putExternalContent({
        type: 'files',
        files: [file],
        point: { x: center.x + i * CASCADE_OFFSET, y: center.y + i * CASCADE_OFFSET },
        ignoreParent: false,
      })
    }
  }

  input.click()
}
```

### Export Dialog Options State
```typescript
// Types for export options per CONTEXT.md decisions

interface PngExportOptions {
  scope: 'viewport' | 'full'
  background: boolean
  scale: 0.5 | 1 | 2 | 4
}

interface PdfExportOptions {
  scope: 'viewport' | 'full'
  background: boolean
  layout: 'single' | 'multipage'
  orientation: 'portrait' | 'landscape'
  pageSize: 'a4' | 'letter' | 'a3' | 'tabloid' | 'legal'
}

// Default options
const DEFAULT_PNG_OPTIONS: PngExportOptions = {
  scope: 'viewport',
  background: true,
  scale: 2,
}

const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  scope: 'full',
  background: true,
  layout: 'single',
  orientation: 'landscape',
  pageSize: 'a4',
}
```

### Download Helper
```typescript
// Utility for triggering browser download

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

### Backend Presigned URL Endpoint
```python
# routers/boards.py (new endpoint)
# Source: ARCHITECTURE.md Pattern 3

from boto3 import client as boto3_client
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

class UploadUrlRequest(BaseModel):
    filename: str
    contentType: str

class UploadUrlResponse(BaseModel):
    uploadUrl: str
    assetUrl: str

s3 = boto3_client('s3',
    endpoint_url=settings.MINIO_URL,
    aws_access_key_id=settings.MINIO_ACCESS_KEY,
    aws_secret_access_key=settings.MINIO_SECRET_KEY
)

@router.post("/{board_id}/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(
    board_id: str,
    request: UploadUrlRequest,
    user: User = Depends(get_current_user)
):
    # Verify board access
    if not await can_access_board(user.id, board_id):
        raise HTTPException(403, "Not authorized")

    key = f"boards/{board_id}/{uuid4()}/{request.filename}"
    upload_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'canvas-assets',
            'Key': key,
            'ContentType': request.contentType
        },
        ExpiresIn=3600  # 1 hour
    )

    asset_url = f"{settings.MINIO_PUBLIC_URL}/canvas-assets/{key}"
    return UploadUrlResponse(uploadUrl=upload_url, assetUrl=asset_url)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| exportToBlob() function | Editor.toImage() method | tldraw v4 | Cleaner API, returns {blob, dataUrl} |
| Custom paste handlers | registerExternalContentHandler | tldraw v4 | Built-in support for files, URLs, clipboard |
| Base64 inline images | TLAssetStore + external URLs | Always recommended | Prevents CRDT bloat |
| document.execCommand('copy') | Clipboard API write() | 2020+ | Modern async, supports images |

**Deprecated/outdated:**
- exportToBlob: Use Editor.toImage() instead
- html2canvas: Not needed, tldraw handles natively
- document.execCommand: Use Clipboard API

## Open Questions

Things that couldn't be fully resolved:

1. **MinIO configuration**
   - What we know: ARCHITECTURE.md specifies MinIO in Docker, boto3 for presigned URLs
   - What's unclear: Exact CORS configuration, public URL vs internal URL
   - Recommendation: Plan task should include MinIO CORS setup step

2. **Image size limits**
   - What we know: CONTEXT.md says "no file size limit, backend handles storage"
   - What's unclear: Practical limit for browser memory during upload
   - Recommendation: May want to add client-side warning for very large files (>50MB)

3. **Firefox Clipboard Support**
   - What we know: ClipboardItem for images not fully supported in Firefox
   - What's unclear: When Firefox will add support
   - Recommendation: Always provide download fallback, treat clipboard as enhancement

## Sources

### Primary (HIGH confidence)
- [tldraw TLAssetStore Reference](https://tldraw.dev/reference/tlschema/TLAssetStore) - Asset interface definition
- [tldraw Hosted Images Example](https://tldraw.dev/examples/data/assets/hosted-images) - Upload implementation pattern
- [tldraw Export Canvas Example](https://tldraw.dev/examples/export-canvas-as-image) - toImage usage
- [tldraw Export Settings Example](https://tldraw.dev/examples/export-canvas-settings) - Export options
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) - Clipboard write specification
- [jsPDF Documentation](https://www.npmjs.com/package/jspdf) - PDF generation

### Secondary (MEDIUM confidence)
- [MinIO Presigned URL Documentation](https://docs.min.io/community/minio-object-store/integrations/presigned-put-upload-via-browser.html) - Upload pattern
- [tldraw Assets Documentation](https://tldraw.dev/docs/assets) - Asset concepts
- [jsPDF Multi-Page Tutorial](https://www.pixelstech.net/article/1741242294-create-multiple-page-pdf) - Multi-page layout

### Tertiary (LOW confidence)
- GitHub Issue #5235 on non-media assets - Limitations of asset handlers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - tldraw, jsPDF, MinIO all well-documented
- Architecture: HIGH - Patterns from official tldraw docs and existing ARCHITECTURE.md
- Pitfalls: MEDIUM - CORS and clipboard issues verified via web search

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable libraries)
