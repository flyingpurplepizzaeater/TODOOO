/**
 * Collaboration module - cursor presence and awareness sync.
 *
 * This module provides:
 * - AwarenessState type for Yjs awareness protocol
 * - Collaborator color palette and assignment
 * - useAwareness hook for cursor/presence sync
 */

// Types
export type { AwarenessState } from './types'

// Color utilities
export {
  COLLABORATOR_COLORS,
  colorFromUserId,
  colorFromIndex,
} from './collaboratorColors'

// Hooks
export { useAwareness } from './useAwareness'
export type { UseAwarenessOptions, UseAwarenessResult } from './useAwareness'
