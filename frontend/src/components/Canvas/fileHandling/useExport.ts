/**
 * Export utilities for PNG and PDF export from tldraw canvas.
 *
 * Features:
 * - PNG export with viewport/full scope, background toggle, scale options
 * - PDF export with layout (single/multipage), orientation, page size options
 * - All options per CONTEXT.md decisions
 */
import { Editor } from 'tldraw'
import jsPDF from 'jspdf'

// ============================================================================
// Types
// ============================================================================

export interface PngExportOptions {
  scope: 'viewport' | 'full'
  background: boolean
  scale: 0.5 | 1 | 2 | 4
}

export interface PdfExportOptions {
  scope: 'viewport' | 'full'
  background: boolean
  layout: 'single' | 'multipage'
  orientation: 'portrait' | 'landscape'
  pageSize: 'a4' | 'letter' | 'a3' | 'tabloid' | 'legal'
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Page sizes in points (72 points = 1 inch).
 * Source: jsPDF documentation and standard paper sizes.
 */
export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  a3: { width: 841.89, height: 1190.55 },
  tabloid: { width: 792, height: 1224 },
  legal: { width: 612, height: 1008 },
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Triggers a download of a blob with the given filename.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Converts a Blob to a data URL string.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Loads an image from a data URL and returns its dimensions.
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export the canvas as a PNG image.
 *
 * @param editor - The tldraw Editor instance
 * @param options - Export options (scope, background, scale)
 * @param filename - The output filename (without extension)
 * @throws Error if no shapes exist on the canvas
 */
export async function exportToPng(
  editor: Editor,
  options: PngExportOptions,
  filename: string
): Promise<void> {
  const shapeIds = editor.getCurrentPageShapeIds()
  if (shapeIds.size === 0) {
    throw new Error('No shapes to export. Add content to the canvas first.')
  }

  // Determine bounds based on scope option
  const bounds = options.scope === 'viewport'
    ? editor.getViewportPageBounds()
    : editor.getCurrentPageBounds()

  if (!bounds) {
    throw new Error('Could not determine canvas bounds.')
  }

  // Generate the image using tldraw's built-in export
  const result = await editor.toImage([...shapeIds], {
    format: 'png',
    background: options.background,
    scale: options.scale,
    bounds: bounds,
    padding: 32,
  })

  if (!result || !result.blob) {
    throw new Error('Failed to generate PNG image.')
  }

  // Download the image
  downloadBlob(result.blob, `${filename}.png`)
}

/**
 * Export the canvas as a PDF document.
 *
 * @param editor - The tldraw Editor instance
 * @param options - Export options (scope, background, layout, orientation, pageSize)
 * @param filename - The output filename (without extension)
 * @throws Error if no shapes exist on the canvas
 */
export async function exportToPdf(
  editor: Editor,
  options: PdfExportOptions,
  filename: string
): Promise<void> {
  const shapeIds = editor.getCurrentPageShapeIds()
  if (shapeIds.size === 0) {
    throw new Error('No shapes to export. Add content to the canvas first.')
  }

  // Determine bounds based on scope option
  const bounds = options.scope === 'viewport'
    ? editor.getViewportPageBounds()
    : editor.getCurrentPageBounds()

  if (!bounds) {
    throw new Error('Could not determine canvas bounds.')
  }

  // Generate a high-quality PNG first (scale 2 for PDF quality)
  const result = await editor.toImage([...shapeIds], {
    format: 'png',
    background: options.background,
    scale: 2, // Higher quality for PDF
    bounds: bounds,
    padding: 32,
  })

  if (!result || !result.blob) {
    throw new Error('Failed to generate image for PDF.')
  }

  // Convert blob to data URL for jsPDF
  const imgData = await blobToDataUrl(result.blob)
  const img = await loadImage(imgData)

  // Get page dimensions based on orientation
  const size = PAGE_SIZES[options.pageSize]
  const pageWidth = options.orientation === 'landscape' ? size.height : size.width
  const pageHeight = options.orientation === 'landscape' ? size.width : size.height

  // Create PDF document
  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: 'pt',
    format: options.pageSize,
  })

  if (options.layout === 'single') {
    // Scale entire content to fit single page
    const scale = Math.min(
      (pageWidth - 40) / img.width,  // 20pt margin on each side
      (pageHeight - 40) / img.height
    )
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale

    // Center image on page
    const x = (pageWidth - scaledWidth) / 2
    const y = (pageHeight - scaledHeight) / 2

    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight)
  } else {
    // Multi-page tiling: scale image width to page width
    const scaledWidth = pageWidth - 40  // 20pt margin on each side
    const scaledHeight = (scaledWidth / img.width) * img.height
    const totalPages = Math.ceil(scaledHeight / (pageHeight - 40))
    const margin = 20

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage()
      }
      // Calculate y-offset to show the correct portion of the image
      const yOffset = margin - (page * (pageHeight - 40))
      pdf.addImage(imgData, 'PNG', margin, yOffset, scaledWidth, scaledHeight)
    }
  }

  // Download the PDF
  const pdfBlob = pdf.output('blob')
  downloadBlob(pdfBlob, `${filename}.pdf`)
}

/**
 * Copy an image blob to the system clipboard.
 * Note: This may not work in all browsers (Firefox has limited support).
 *
 * @param blob - The image blob to copy
 * @throws Error if clipboard write is not supported
 */
export async function copyImageToClipboard(blob: Blob): Promise<void> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ])
  } catch {
    throw new Error('Clipboard write not supported. Please download instead.')
  }
}
