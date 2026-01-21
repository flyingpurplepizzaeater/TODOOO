import { useState, useEffect, useCallback } from 'react'
import { DefaultToolbar, useEditor, type TLComponents } from 'tldraw'

/**
 * Custom toolbar positioned at bottom-center with auto-hide functionality.
 *
 * Features:
 * - Bottom-center positioning for mobile thumb reach
 * - Auto-hide during active drawing strokes (pen, marker, eraser)
 * - Pin toggle to keep toolbar always visible
 * - Smooth opacity transitions
 *
 * Auto-hide behavior:
 * - When pinned=false: toolbar hides during active strokes with drawing tools
 * - When pinned=true: toolbar always visible regardless of drawing state
 */
export function CustomToolbar() {
  const editor = useEditor()
  const [visible, setVisible] = useState(true)
  const [pinned, setPinned] = useState(false)

  // Track pointer state and current tool to determine auto-hide
  useEffect(() => {
    // If pinned, always show
    if (pinned) {
      setVisible(true)
      return
    }

    // Subscribe to store changes to detect drawing state
    const unsubscribe = editor.store.listen(
      () => {
        const currentTool = editor.getCurrentToolId()
        const isDrawingTool = ['draw', 'highlight', 'eraser'].includes(currentTool)
        const isPointerDown = editor.inputs.isPointing

        // Hide when using drawing tools AND actively drawing
        if (isDrawingTool && isPointerDown) {
          setVisible(false)
        } else {
          setVisible(true)
        }
      },
      { source: 'user' }
    )

    return unsubscribe
  }, [editor, pinned])

  // Toggle pin state
  const handlePinToggle = useCallback(() => {
    setPinned((prev) => !prev)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* tldraw's default toolbar */}
      <DefaultToolbar />

      {/* Pin toggle button */}
      <button
        onClick={handlePinToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          border: 'none',
          borderRadius: 6,
          background: pinned ? 'rgba(37, 99, 235, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          color: pinned ? '#fff' : '#666',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          fontSize: 12,
          fontFamily: 'system-ui, sans-serif',
          transition: 'background 0.2s, color 0.2s',
        }}
        title={pinned ? 'Unpin toolbar (auto-hide when drawing)' : 'Pin toolbar (always visible)'}
        aria-label={pinned ? 'Unpin toolbar' : 'Pin toolbar'}
      >
        {/* Pin icon using simple SVG */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {pinned ? (
            // Filled pin icon (pinned state)
            <>
              <line x1="12" y1="17" x2="12" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" fill="currentColor" />
            </>
          ) : (
            // Outline pin icon (unpinned state)
            <>
              <line x1="12" y1="17" x2="12" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}

/**
 * TLComponents configuration for using CustomToolbar with tldraw.
 *
 * Usage in Canvas.tsx:
 * ```typescript
 * import { toolbarComponents } from './CustomToolbar'
 * <Tldraw components={toolbarComponents} />
 * ```
 */
export const toolbarComponents: TLComponents = {
  Toolbar: CustomToolbar,
}
