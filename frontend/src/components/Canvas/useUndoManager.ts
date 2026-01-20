import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'

export interface UndoManagerState {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

/**
 * Per-user undo/redo using Yjs UndoManager with trackedOrigins.
 *
 * How it works:
 * 1. Each client has a unique clientId from Y.Doc
 * 2. UndoManager only tracks changes with that clientId as origin
 * 3. When User A undoes, only User A's changes are reverted
 * 4. User B's changes remain untouched
 *
 * From 02-RESEARCH.md:
 * - Use Yjs UndoManager with trackedOrigins scoped to clientId
 * - All local mutations must include clientId as transaction origin
 * - Override tldraw's Ctrl+Z/Y to use Yjs UndoManager instead
 *
 * @param doc - Yjs document (null before connection)
 * @param yArr - Yjs array containing tldraw records (null before connection)
 * @returns Object with canUndo, canRedo flags and undo/redo functions
 */
export function useUndoManager(
  doc: Y.Doc | null,
  yArr: Y.Array<unknown> | null
): UndoManagerState {
  const undoManagerRef = useRef<Y.UndoManager | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    if (!doc || !yArr) return

    // Create UndoManager scoped to this client's changes only
    const clientId = doc.clientID

    const undoManager = new Y.UndoManager(yArr, {
      // Only track changes made with this client's ID as origin
      trackedOrigins: new Set([clientId]),
      // Group changes within 500ms into single undo operation
      captureTimeout: 500,
    })

    undoManagerRef.current = undoManager

    // Update canUndo/canRedo state when stack changes
    const updateState = () => {
      setCanUndo(undoManager.canUndo())
      setCanRedo(undoManager.canRedo())
    }

    undoManager.on('stack-item-added', updateState)
    undoManager.on('stack-item-popped', updateState)
    undoManager.on('stack-cleared', updateState)

    return () => {
      undoManager.destroy()
      undoManagerRef.current = null
    }
  }, [doc, yArr])

  const undo = () => {
    undoManagerRef.current?.undo()
  }

  const redo = () => {
    undoManagerRef.current?.redo()
  }

  return { canUndo, canRedo, undo, redo }
}

/**
 * Helper to get clientId for transaction origins.
 * Use this when making changes that should be tracked by UndoManager.
 */
export function getClientId(doc: Y.Doc): number {
  return doc.clientID
}
