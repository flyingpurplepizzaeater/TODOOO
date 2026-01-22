/**
 * Export dialog for PNG and PDF export with comprehensive options.
 *
 * Features per CONTEXT.md:
 * - Format tabs: PNG | PDF
 * - Scope: viewport only OR full board content
 * - Background: include or transparent
 * - Scale factor: 0.5x to 4x (PNG only)
 * - PDF layout: single page (scaled) or multi-page (tiled)
 * - PDF orientation: portrait or landscape
 * - PDF page sizes: A4, Letter, A3, Tabloid, Legal
 *
 * Design: Quick option selection dialog, NOT a multi-step wizard.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from 'tldraw'
import { exportToPng, exportToPdf, type PngExportOptions, type PdfExportOptions } from './useExport'

// ============================================================================
// Types
// ============================================================================

interface ExportDialogProps {
  editor: Editor
  onClose: () => void
}

type Format = 'png' | 'pdf'
type Scope = 'viewport' | 'full'
type Scale = 0.5 | 1 | 2 | 4
type Layout = 'single' | 'multipage'
type Orientation = 'portrait' | 'landscape'
type PageSize = 'a4' | 'letter' | 'a3' | 'tabloid' | 'legal'

// ============================================================================
// Component
// ============================================================================

export function ExportDialog({ editor, onClose }: ExportDialogProps) {
  // State for export options
  const [format, setFormat] = useState<Format>('png')
  const [scope, setScope] = useState<Scope>('viewport')
  const [background, setBackground] = useState(true)
  const [scale, setScale] = useState<Scale>(2)
  const [layout, setLayout] = useState<Layout>('single')
  const [orientation, setOrientation] = useState<Orientation>('landscape')
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setError(null)

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `board-export-${timestamp}`

      if (format === 'png') {
        const options: PngExportOptions = { scope, background, scale }
        await exportToPng(editor, options, filename)
      } else {
        const options: PdfExportOptions = { scope, background, layout, orientation, pageSize }
        await exportToPdf(editor, options, filename)
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }, [editor, format, scope, background, scale, layout, orientation, pageSize, onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        ref={dialogRef}
        style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          padding: 24,
          width: 360,
          maxWidth: '90vw',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1f2937' }}>Export Board</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#6b7280',
              fontSize: 20,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            x
          </button>
        </div>

        {/* Format tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setFormat('png')}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: format === 'png' ? 'white' : 'transparent',
              color: format === 'png' ? '#1f2937' : '#6b7280',
              fontWeight: format === 'png' ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: format === 'png' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            PNG
          </button>
          <button
            onClick={() => setFormat('pdf')}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: format === 'pdf' ? 'white' : 'transparent',
              color: format === 'pdf' ? '#1f2937' : '#6b7280',
              fontWeight: format === 'pdf' ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: format === 'pdf' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            PDF
          </button>
        </div>

        {/* Common options */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
            Export Scope
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setScope('viewport')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: scope === 'viewport' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: 6,
                background: scope === 'viewport' ? '#eff6ff' : 'white',
                color: '#374151',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Viewport Only
            </button>
            <button
              onClick={() => setScope('full')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: scope === 'full' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: 6,
                background: scope === 'full' ? '#eff6ff' : 'white',
                color: '#374151',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Full Board
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}
          >
            <input
              type="checkbox"
              checked={background}
              onChange={(e) => setBackground(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            Include background
          </label>
        </div>

        {/* PNG-specific options */}
        {format === 'png' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
              Scale
            </label>
            <select
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value) as Scale)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 13,
                color: '#374151',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <option value={0.5}>0.5x (Half size)</option>
              <option value={1}>1x (Original)</option>
              <option value={2}>2x (High quality)</option>
              <option value={4}>4x (Ultra high quality)</option>
            </select>
          </div>
        )}

        {/* PDF-specific options */}
        {format === 'pdf' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Layout
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setLayout('single')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: layout === 'single' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: 6,
                    background: layout === 'single' ? '#eff6ff' : 'white',
                    color: '#374151',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Single Page
                </button>
                <button
                  onClick={() => setLayout('multipage')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: layout === 'multipage' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: 6,
                    background: layout === 'multipage' ? '#eff6ff' : 'white',
                    color: '#374151',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Multi-Page
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Orientation
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setOrientation('portrait')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: orientation === 'portrait' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: 6,
                    background: orientation === 'portrait' ? '#eff6ff' : 'white',
                    color: '#374151',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Portrait
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: orientation === 'landscape' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    borderRadius: 6,
                    background: orientation === 'landscape' ? '#eff6ff' : 'white',
                    color: '#374151',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Landscape
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSize)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#374151',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="a4">A4 (210 x 297 mm)</option>
                <option value="letter">Letter (8.5 x 11 in)</option>
                <option value="a3">A3 (297 x 420 mm)</option>
                <option value="tabloid">Tabloid (11 x 17 in)</option>
                <option value="legal">Legal (8.5 x 14 in)</option>
              </select>
            </div>
          </>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#dc2626',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            borderRadius: 8,
            background: isExporting ? '#9ca3af' : '#3b82f6',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isExporting ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Exporting...
            </>
          ) : (
            `Export as ${format.toUpperCase()}`
          )}
        </button>

        {/* Spinner keyframes */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
