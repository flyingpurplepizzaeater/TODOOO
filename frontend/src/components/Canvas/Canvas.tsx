import { useCallback, useRef } from 'react'
import { Tldraw, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useYjsStore, ConnectionStatus } from './useYjsStore'
import { cameraOptions, handleWheel } from './cameraOptions'
import { uiOverrides } from './uiOverrides'

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
 *
 * Note: tldraw requires a license for production use. In development/hobby
 * mode, a "Made with tldraw" watermark appears.
 */
export function Canvas({ boardId, token }: CanvasProps) {
  const { store, status } = useYjsStore(boardId, token)
  const editorRef = useRef<Editor | null>(null)

  // Handle editor mount - enable snap mode and store reference
  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor

    // Enable snap mode (grid + object snapping) per CONTEXT.md
    editor.user.updateUserPreferences({ isSnapMode: true })
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
      <Tldraw
        store={store}
        cameraOptions={cameraOptions}
        overrides={uiOverrides}
        onMount={handleMount}
        autoFocus
      />
    </div>
  )
}
