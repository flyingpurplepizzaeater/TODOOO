import { useCallback, useMemo, useRef } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useYjsStore, type ConnectionStatus } from './useYjsStore'
import { useUndoManager } from './useUndoManager'
import { cameraOptions, handleWheel } from './cameraOptions'
import { createUiOverrides } from './uiOverrides'
import { toolbarComponents } from './CustomToolbar'
import { restoreNoteColor, createNoteColorListener } from './noteColorPersistence'

interface CanvasProps {
  boardId: string
  token: string
}

/**
 * Connection status indicator component.
 * Shows current WebSocket connection state in top-right corner.
 */
function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const statusColors: Record<ConnectionStatus, string> = {
    connecting: '#f59e0b',  // amber
    connected: '#22c55e',   // green
    disconnected: '#ef4444', // red
    error: '#ef4444',       // red
  }

  const statusLabels: Record<ConnectionStatus, string> = {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Connection Error',
  }

  return (
    <div style={{
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 8px',
      borderRadius: 4,
      background: 'rgba(255, 255, 255, 0.9)',
      fontSize: 12,
      fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: statusColors[status],
      }} />
      {statusLabels[status]}
    </div>
  )
}

/**
 * Undo/Redo status indicator component.
 * Shows availability of undo/redo in bottom-right corner.
 * Positioned above custom toolbar (bottom: 70px) to avoid overlap.
 */
function UndoRedoIndicator({ canUndo, canRedo }: { canUndo: boolean; canRedo: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 70,
      right: 8,
      zIndex: 1000,
      display: 'flex',
      gap: 8,
      padding: '4px 8px',
      borderRadius: 4,
      background: 'rgba(255, 255, 255, 0.9)',
      fontSize: 12,
      fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }}>
      <span style={{ color: canUndo ? '#333' : '#999' }}>
        Undo {canUndo ? '(Ctrl+Z)' : ''}
      </span>
      <span style={{ color: canRedo ? '#333' : '#999' }}>
        Redo {canRedo ? '(Ctrl+Shift+Z)' : ''}
      </span>
    </div>
  )
}

/**
 * Canvas component that renders tldraw with Yjs synchronization.
 *
 * Requires:
 * - boardId: Valid board UUID from backend
 * - token: Valid JWT token with access to the board
 *
 * Features:
 * - Full-viewport canvas (position: fixed, inset: 0)
 * - Real-time sync via Yjs WebSocket
 * - Connection status indicator
 * - Per-user undo/redo (CANV-04) via Yjs UndoManager
 *
 * Note: tldraw requires a license for production use. In development/hobby
 * mode, a "Made with tldraw" watermark appears.
 */
export function Canvas({ boardId, token }: CanvasProps) {
  const { store, status, doc, yArr } = useYjsStore(boardId, token)
  const { canUndo, canRedo, undo, redo } = useUndoManager(doc, yArr)
  const editorRef = useRef<Editor | null>(null)

  // Create UI overrides with per-user undo/redo
  const overrides = useMemo(
    () => createUiOverrides(undo, redo),
    [undo, redo]
  )

  // Handle editor mount - enable snap mode, set default tool, and store reference
  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor

    // Enable snap mode (grid + object snapping) per CONTEXT.md
    editor.user.updateUserPreferences({ isSnapMode: true })

    // Set default tool to select (safe default per CONTEXT.md)
    // Prevents accidental drawing on canvas open
    editor.setCurrentTool('select')

    // Enable aspect-locked resize for notes (square Post-it shape)
    // Per RESEARCH.md: NoteShapeUtil.options.resizeMode = 'scale'
    const noteUtil = editor.getShapeUtil('note')
    if (noteUtil && 'options' in noteUtil) {
      (noteUtil as unknown as { options: { resizeMode: string } }).options.resizeMode = 'scale'
    }

    // Restore last-used note color from localStorage
    restoreNoteColor(editor)

    // Start note color persistence listener
    // Persists color changes to localStorage for session continuity
    createNoteColorListener(editor)
  }, [])

  // Custom wheel handler for Ctrl+scroll only zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (editorRef.current) {
      handleWheel(e.nativeEvent, editorRef.current)
    }
  }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0 }}
      onWheel={onWheel}
    >
      <ConnectionIndicator status={status} />
      <UndoRedoIndicator canUndo={canUndo} canRedo={canRedo} />
      <Tldraw
        store={store}
        cameraOptions={cameraOptions}
        overrides={overrides}
        components={toolbarComponents}
        onMount={handleMount}
        autoFocus
      />
    </div>
  )
}
