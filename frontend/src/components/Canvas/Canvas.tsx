import { useCallback, useMemo, useRef, useState } from 'react'
import { Tldraw, Editor, type TLComponents } from 'tldraw'
import 'tldraw/tldraw.css'
import { useYjsStore, type ConnectionStatus } from './useYjsStore'
import { useUndoManager } from './useUndoManager'
import { useTodoSync } from './useTodoSync'
import { useAwareness, useFollowMode, PresenceSidebar, DotCursor, CollaboratorIndicator } from './collaboration'
import { cameraOptions, handleWheel } from './cameraOptions'
import { createUiOverrides } from './uiOverrides'
import { toolbarComponents } from './CustomToolbar'
import { restoreNoteColor, createNoteColorListener } from './noteColorPersistence'
import { TodoShapeUtil, TodoTool } from './shapes/todo'
import { createAssetStore } from './fileHandling/useAssetStore'

// Custom shape utils and tools - defined OUTSIDE component to prevent recreation
const customShapeUtils = [TodoShapeUtil]
const customTools = [TodoTool]

/**
 * Canvas TLComponents configuration.
 *
 * Merges toolbar components with collaboration components:
 * - Toolbar: Custom toolbar from CustomToolbar.tsx
 * - CollaboratorCursor: Custom dot cursor (per CONTEXT.md: dot/circle shape)
 * - CollaboratorShapeIndicator: Custom selection indicators with username labels
 */
const canvasComponents: TLComponents = {
  ...toolbarComponents,
  // Custom dot cursor for collaborators (replaces default arrow pointer)
  CollaboratorCursor: DotCursor,
  // Custom selection indicator with username label
  CollaboratorShapeIndicator: CollaboratorIndicator,
}

interface CanvasProps {
  boardId: string
  token: string
  defaultListId?: number  // Backend list ID for creating new TODOs (optional)
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
export function Canvas({ boardId, token, defaultListId }: CanvasProps) {
  // Create asset store for persistent image storage via MinIO
  // Without this, images won't sync to collaborators or persist across reloads
  // Must be created before useYjsStore since it's passed to store creation
  const assetStore = useMemo(
    () => createAssetStore(boardId, token),
    [boardId, token]
  )

  const { store, status, doc, yArr, provider } = useYjsStore(boardId, token, assetStore)
  const { canUndo, canRedo, undo, redo } = useUndoManager(doc, yArr)
  const editorRef = useRef<Editor | null>(null)
  // Editor state for sync hook (set on mount)
  const [editor, setEditor] = useState<Editor | null>(null)

  // Mock user info - TODO: Replace with actual user from auth context
  const currentUser = useMemo(() => ({
    id: 'user-' + Math.random().toString(36).slice(2, 9),
    name: 'Anonymous User'
  }), [])

  // Enable TODO sync to backend when editor is ready and listId is provided
  useTodoSync(editor, token, defaultListId ?? null)

  // Enable awareness/cursor sync when editor and provider are ready
  const { others, clearCursor } = useAwareness(
    editor && provider
      ? { provider, editor, user: currentUser }
      : null
  )

  // Enable follow mode for following other users' viewports
  const followMode = useFollowMode(editor)

  // Handle follow user action from presence sidebar
  const handleFollowUser = useCallback((userId: string, userName: string, color: string) => {
    if (!userId) {
      // Empty userId means stop following
      followMode.stopFollowing()
    } else {
      followMode.startFollowing(userId, userName, color)
    }
  }, [followMode])

  // Create UI overrides with per-user undo/redo
  const overrides = useMemo(
    () => createUiOverrides(undo, redo),
    [undo, redo]
  )

  // Handle editor mount - enable snap mode, set default tool, and store reference
  const handleMount = useCallback((ed: Editor) => {
    editorRef.current = ed
    setEditor(ed)  // Enable TODO sync hook

    // Enable snap mode (grid + object snapping) per CONTEXT.md
    ed.user.updateUserPreferences({ isSnapMode: true })

    // Set default tool to select (safe default per CONTEXT.md)
    // Prevents accidental drawing on canvas open
    ed.setCurrentTool('select')

    // Enable aspect-locked resize for notes (square Post-it shape)
    // Per RESEARCH.md: NoteShapeUtil.options.resizeMode = 'scale'
    const noteUtil = ed.getShapeUtil('note')
    if (noteUtil && 'options' in noteUtil) {
      (noteUtil as unknown as { options: { resizeMode: string } }).options.resizeMode = 'scale'
    }

    // Restore last-used note color from localStorage
    restoreNoteColor(ed)

    // Start note color persistence listener
    // Persists color changes to localStorage for session continuity
    createNoteColorListener(ed)
  }, [])

  // Custom wheel handler for Ctrl+scroll only zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (editorRef.current) {
      handleWheel(e.nativeEvent, editorRef.current)
    }
  }, [])

  // Handle canvas mouse leave - clear cursor from awareness
  const handleMouseLeave = useCallback(() => {
    clearCursor()
  }, [clearCursor])

  return (
    <div
      style={{ position: 'fixed', inset: 0 }}
      onWheel={onWheel}
      onMouseLeave={handleMouseLeave}
    >
      <ConnectionIndicator status={status} />
      <UndoRedoIndicator canUndo={canUndo} canRedo={canRedo} />
      <PresenceSidebar
        others={others}
        onFollowUser={handleFollowUser}
        followingUserId={followMode.followingUserId}
        followingUserColor={followMode.followingUserColor}
      />
      <Tldraw
        store={store}
        shapeUtils={customShapeUtils}
        tools={customTools}
        cameraOptions={cameraOptions}
        overrides={overrides}
        components={canvasComponents}
        onMount={handleMount}
        autoFocus
      />
    </div>
  )
}
