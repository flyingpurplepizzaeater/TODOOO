import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor, InstancePresenceRecordType, type TLInstancePresence, type TLShapeId } from 'tldraw'
import { WebsocketProvider } from 'y-websocket'
import type { AwarenessState } from './types'
import { colorFromUserId } from './collaboratorColors'

/**
 * Options for the useAwareness hook.
 */
export interface UseAwarenessOptions {
  provider: WebsocketProvider
  editor: Editor
  user: { id: string; name: string }
}

/**
 * Return type for useAwareness hook.
 */
export interface UseAwarenessResult {
  /** Map of remote user states (clientId -> AwarenessState) */
  others: Map<number, AwarenessState>
  /** This client's awareness ID (0 if not connected) */
  localClientId: number
  /** Manual cursor update function (usually not needed - hook tracks automatically) */
  updateCursor: (x: number, y: number) => void
  /** Clear cursor from awareness (call on canvas leave) */
  clearCursor: () => void
}

/** Empty result returned when options are null */
const EMPTY_RESULT: UseAwarenessResult = {
  others: new Map(),
  localClientId: 0,
  updateCursor: () => {},
  clearCursor: () => {},
}

/**
 * Throttle interval for cursor position updates.
 * 50ms = 20 updates/second, balancing smoothness with bandwidth.
 */
const CURSOR_UPDATE_INTERVAL = 50

/**
 * Hook that integrates Yjs Awareness with tldraw for cursor/presence sync.
 *
 * This hook:
 * 1. Sets up local awareness state with user info and color
 * 2. Subscribes to remote awareness changes
 * 3. Syncs remote presence to tldraw's TLInstancePresence records
 * 4. Tracks local cursor position with throttling
 * 5. Cleans up on unmount (prevents ghost cursors)
 *
 * If options is null, returns empty result (no-op). This allows calling
 * the hook unconditionally even when editor/provider aren't ready.
 *
 * @param options - Provider, editor, and user info (or null)
 * @returns Object with remote users, cursor control functions
 */
export function useAwareness(
  options: UseAwarenessOptions | null
): UseAwarenessResult {
  const [others, setOthers] = useState<Map<number, AwarenessState>>(new Map())
  const localClientIdRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCursorUpdateRef = useRef<number>(0)

  // Extract options (null-safe)
  const provider = options?.provider ?? null
  const editor = options?.editor ?? null
  const user = options?.user ?? null

  // Initialize awareness and set up subscriptions
  useEffect(() => {
    // Skip if not ready
    if (!provider || !editor || !user) return

    const awareness = provider.awareness
    const localClientId = awareness.clientID
    localClientIdRef.current = localClientId

    // Get deterministic color for this user
    const userColor = colorFromUserId(user.id)

    // Initialize local awareness state
    const initialState: AwarenessState = {
      user: {
        id: user.id,
        name: user.name,
        color: userColor,
      },
      cursor: null,
      selection: [],
      viewport: null,
      lastActivity: Date.now(),
      isIdle: false,
    }
    awareness.setLocalState(initialState)

    /**
     * Handle awareness changes from remote peers.
     * Updates `others` state and syncs to tldraw store.
     */
    const handleAwarenessChange = () => {
      const states = new Map<number, AwarenessState>()

      awareness.getStates().forEach((state, clientId) => {
        // Filter out local client to prevent echo loops
        if (clientId !== localClientId && state) {
          states.set(clientId, state as AwarenessState)
        }
      })

      setOthers(states)

      // Sync remote presence to tldraw store
      syncPresenceToTldraw(editor, states, localClientId)
    }

    awareness.on('change', handleAwarenessChange)

    // Initial population
    handleAwarenessChange()

    // Cleanup on unmount
    return () => {
      awareness.off('change', handleAwarenessChange)
      // CRITICAL: Set local state to null to prevent ghost cursors
      awareness.setLocalState(null)

      // Clear throttle timeout
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
    }
  }, [provider, editor, user?.id, user?.name])

  // Track pointer moves on the editor
  useEffect(() => {
    // Skip if not ready
    if (!provider || !editor) return

    const awareness = provider.awareness

    /**
     * Listen to store changes to detect pointer movement.
     * We can't directly listen to pointer-move events, so we track
     * the pointer state from the editor's inputs.
     */
    const handlePointerMove = () => {
      const now = Date.now()

      // Throttle cursor updates
      if (now - lastCursorUpdateRef.current < CURSOR_UPDATE_INTERVAL) {
        // Schedule update for later if not already scheduled
        if (!throttleTimeoutRef.current) {
          throttleTimeoutRef.current = setTimeout(() => {
            throttleTimeoutRef.current = null
            handlePointerMove()
          }, CURSOR_UPDATE_INTERVAL - (now - lastCursorUpdateRef.current))
        }
        return
      }

      lastCursorUpdateRef.current = now

      // Get current pointer position in page coordinates
      const { currentPagePoint } = editor.inputs

      // Update local awareness state
      const currentState = awareness.getLocalState() as AwarenessState | null
      if (currentState) {
        awareness.setLocalState({
          ...currentState,
          cursor: {
            x: currentPagePoint.x,
            y: currentPagePoint.y,
            type: 'default',
            rotation: 0,
          },
          lastActivity: now,
          isIdle: false,
        })
      }
    }

    // Use interval-based tracking since tldraw doesn't expose pointer-move events directly
    // This is more reliable than trying to hook into internal store changes
    let animationFrameId: number
    let lastX = 0
    let lastY = 0

    const trackPointer = () => {
      const { currentPagePoint } = editor.inputs
      // Only update if position changed significantly
      if (Math.abs(currentPagePoint.x - lastX) > 0.5 || Math.abs(currentPagePoint.y - lastY) > 0.5) {
        lastX = currentPagePoint.x
        lastY = currentPagePoint.y
        handlePointerMove()
      }
      animationFrameId = requestAnimationFrame(trackPointer)
    }

    animationFrameId = requestAnimationFrame(trackPointer)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [provider, editor])

  // Track selection changes
  useEffect(() => {
    // Skip if not ready
    if (!provider || !editor) return

    const awareness = provider.awareness

    const handleSelectionChange = () => {
      const selectedIds = editor.getSelectedShapeIds()
      const currentState = awareness.getLocalState() as AwarenessState | null

      if (currentState) {
        awareness.setLocalState({
          ...currentState,
          selection: selectedIds as string[],
          lastActivity: Date.now(),
          isIdle: false,
        })
      }
    }

    // Subscribe to selection changes
    const unsub = editor.store.listen(handleSelectionChange, {
      source: 'user',
      scope: 'session',
    })

    return () => {
      unsub()
    }
  }, [provider, editor])

  /**
   * Manual cursor update function.
   * Usually not needed since hook tracks automatically.
   */
  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!provider) return

      const awareness = provider.awareness
      const currentState = awareness.getLocalState() as AwarenessState | null

      if (currentState) {
        awareness.setLocalState({
          ...currentState,
          cursor: {
            x,
            y,
            type: 'default',
            rotation: 0,
          },
          lastActivity: Date.now(),
          isIdle: false,
        })
      }
    },
    [provider]
  )

  /**
   * Clear cursor from awareness.
   * Call this when the mouse leaves the canvas.
   */
  const clearCursor = useCallback(() => {
    if (!provider) return

    const awareness = provider.awareness
    const currentState = awareness.getLocalState() as AwarenessState | null

    if (currentState) {
      awareness.setLocalState({
        ...currentState,
        cursor: null,
      })
    }
  }, [provider])

  // Return empty result if not ready
  if (!options) {
    return EMPTY_RESULT
  }

  return {
    others,
    localClientId: localClientIdRef.current,
    updateCursor,
    clearCursor,
  }
}

/**
 * Syncs remote awareness states to tldraw's TLInstancePresence records.
 *
 * This function:
 * 1. Converts AwarenessState to TLInstancePresence
 * 2. Uses mergeRemoteChanges to mark as remote (prevents echo loops)
 * 3. Removes presence records for disconnected users
 *
 * @param editor - The tldraw editor instance
 * @param others - Map of remote awareness states
 * @param localClientId - Local client ID to filter out
 */
function syncPresenceToTldraw(
  editor: Editor,
  others: Map<number, AwarenessState>,
  localClientId: number
): void {
  const currentPageId = editor.getCurrentPageId()

  editor.store.mergeRemoteChanges(() => {
    // Get existing collaborator presence records
    const existingIds = new Set(
      editor.getCollaborators().map((c) => c.id)
    )

    // Create/update presence records for all remote users
    const presenceRecords: TLInstancePresence[] = []

    others.forEach((state, clientId) => {
      // Skip local client (shouldn't be in others, but double-check)
      if (clientId === localClientId) return

      // Only show users with active cursors
      if (state.cursor) {
        const presenceId = InstancePresenceRecordType.createId(String(clientId))

        presenceRecords.push(
          InstancePresenceRecordType.create({
            id: presenceId,
            currentPageId,
            userId: state.user.id,
            userName: state.user.name,
            color: state.user.color,
            cursor: {
              x: state.cursor.x,
              y: state.cursor.y,
              type: state.cursor.type,
              rotation: state.cursor.rotation,
            },
            // CRITICAL: Without lastActivityTimestamp, tldraw hides cursors
            lastActivityTimestamp: state.lastActivity,
            // Include selected shapes for CollaboratorShapeIndicator rendering
            // Cast to TLShapeId[] since awareness state stores them as strings
            selectedShapeIds: state.selection as TLShapeId[],
            chatMessage: '',
          })
        )
      }
    })

    if (presenceRecords.length > 0) {
      editor.store.put(presenceRecords)
    }

    // Remove presence for disconnected users or users without cursors
    const currentIds = new Set(presenceRecords.map((r) => r.id))
    const toRemove = [...existingIds].filter((id) => !currentIds.has(id))

    if (toRemove.length > 0) {
      editor.store.remove(toRemove as TLInstancePresence['id'][])
    }
  })
}
