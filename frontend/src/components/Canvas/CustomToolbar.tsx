import { useState, useEffect, useCallback, useRef } from 'react'
import { DefaultToolbar, useEditor, type TLComponents } from 'tldraw'
import {
  createKanbanBoard,
  createEisenhowerMatrix,
  createWeeklyColumns,
  createCustomFrame,
  getViewportCenter,
} from './framePresets'
import { handleFileUpload } from './fileHandling/useImageUpload'
import { ExportDialog } from './fileHandling/ExportDialog'
import { isNativePlatform } from '../../capacitor/platform'

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
  const [showFrameMenu, setShowFrameMenu] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const frameMenuRef = useRef<HTMLDivElement>(null)

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

  // Close frame menu when clicking outside
  useEffect(() => {
    if (!showFrameMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      if (frameMenuRef.current && !frameMenuRef.current.contains(event.target as Node)) {
        setShowFrameMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFrameMenu])

  // Handle frame preset selection
  const handleFramePreset = useCallback((preset: 'kanban' | 'eisenhower' | 'weekly' | 'custom') => {
    const { x, y } = getViewportCenter(editor)
    switch (preset) {
      case 'kanban':
        createKanbanBoard(editor, x, y)
        break
      case 'eisenhower':
        createEisenhowerMatrix(editor, x, y)
        break
      case 'weekly':
        createWeeklyColumns(editor, x, y)
        break
      case 'custom':
        createCustomFrame(editor, x, y, 'Section')
        break
    }
    setShowFrameMenu(false)
  }, [editor])

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

      {/* TODO tool button */}
      <button
        onClick={() => editor.setCurrentTool('todo')}
        title="TODO Card (T)"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 32,
          paddingLeft: 10,
          paddingRight: 10,
          border: 'none',
          borderRadius: 6,
          background: editor.getCurrentToolId() === 'todo' ? 'rgba(37, 99, 235, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          color: editor.getCurrentToolId() === 'todo' ? '#fff' : '#444',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'system-ui, sans-serif',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        TODO
      </button>

      {/* Image upload button */}
      <button
        onClick={() => handleFileUpload(editor)}
        title="Upload Image"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 32,
          paddingLeft: 10,
          paddingRight: 10,
          border: 'none',
          borderRadius: 6,
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#444',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'system-ui, sans-serif',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        Image
      </button>

      {/* Camera button - mobile native only */}
      {isNativePlatform() && (
        <button
          onClick={() => {
            // Dispatch custom event for camera capture (handled in Canvas.tsx)
            window.dispatchEvent(new CustomEvent('toolbar-camera-capture'));
          }}
          title="Take Photo"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            border: 'none',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            color: '#444',
          }}
        >
          {/* Camera icon SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      )}

      {/* Frame preset dropdown */}
      <div ref={frameMenuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowFrameMenu(!showFrameMenu)}
          title="Frame Presets"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 32,
            paddingLeft: 10,
            paddingRight: 10,
            border: 'none',
            borderRadius: 6,
            background: showFrameMenu ? 'rgba(37, 99, 235, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: showFrameMenu ? '#fff' : '#444',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'system-ui, sans-serif',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Frames
        </button>
        {showFrameMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 6,
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minWidth: 160,
              zIndex: 400,
            }}
          >
            <button
              onClick={() => handleFramePreset('kanban')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 4,
                background: 'transparent',
                color: '#374151',
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Kanban Board
            </button>
            <button
              onClick={() => handleFramePreset('eisenhower')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 4,
                background: 'transparent',
                color: '#374151',
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Eisenhower Matrix
            </button>
            <button
              onClick={() => handleFramePreset('weekly')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 4,
                background: 'transparent',
                color: '#374151',
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Weekly Columns
            </button>
            <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
            <button
              onClick={() => handleFramePreset('custom')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 4,
                background: 'transparent',
                color: '#374151',
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Custom Section
            </button>
          </div>
        )}
      </div>

      {/* Export button */}
      <button
        onClick={() => setShowExportDialog(true)}
        title="Export Board"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 32,
          paddingLeft: 10,
          paddingRight: 10,
          border: 'none',
          borderRadius: 6,
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#444',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'system-ui, sans-serif',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        Export
      </button>

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

      {/* Export dialog */}
      {showExportDialog && (
        <ExportDialog editor={editor} onClose={() => setShowExportDialog(false)} />
      )}
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
