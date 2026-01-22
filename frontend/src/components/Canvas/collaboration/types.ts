/**
 * Awareness state interface for Yjs awareness protocol.
 *
 * This defines the shape of transient presence data synced between clients.
 * Unlike CRDT document state, awareness is ephemeral and not persisted.
 *
 * Key usage:
 * - provider.awareness.setLocalState(state: AwarenessState)
 * - provider.awareness.getStates() returns Map<clientId, AwarenessState>
 */
export interface AwarenessState {
  /**
   * User identification and display information.
   * Color is deterministically derived from user ID for consistency.
   */
  user: {
    id: string
    name: string
    color: string // Hex color for cursor/avatar
  }

  /**
   * Current cursor position in canvas coordinates.
   * Null when cursor leaves the canvas.
   */
  cursor: {
    x: number
    y: number
    type: 'default' | 'pointer' | 'grab'
    rotation: number
  } | null

  /**
   * Array of currently selected shape IDs.
   * Used to show selection indicators for other users.
   */
  selection: string[]

  /**
   * Current viewport position and zoom level.
   * Used for "follow user" feature.
   */
  viewport: {
    x: number
    y: number
    zoom: number
  } | null

  /**
   * Timestamp of last user activity (cursor move, selection, edit).
   * Used for idle detection and tldraw presence lastActivityTimestamp.
   */
  lastActivity: number

  /**
   * Whether user is considered idle (no activity for 2 minutes).
   * Idle users are dimmed in the presence panel.
   */
  isIdle: boolean
}
