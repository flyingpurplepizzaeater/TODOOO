import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Timeout constants per CONTEXT.md:
 * - Cursor fades after 30 seconds of inactivity
 * - User marked as idle in presence panel after 2 minutes
 * - Instant restore when idle user becomes active again
 */
const CURSOR_FADE_TIMEOUT = 30 * 1000   // 30 seconds
const IDLE_STATUS_TIMEOUT = 120 * 1000  // 2 minutes

interface IdleState {
  cursorFaded: boolean
  isIdle: boolean
}

/**
 * Hook for tracking idle status.
 *
 * This hook manages two tiers of inactivity:
 * 1. Cursor fade (30s) - visual dimming of cursor
 * 2. Idle status (2min) - marked idle in presence panel
 *
 * Activity is tracked via resetTimers() which should be called
 * on any user interaction (pointer move, selection change, etc.)
 *
 * @param onCursorFade - Callback when cursor should fade (30s inactive)
 * @param onIdleStatusChange - Callback when idle status changes
 * @returns Idle state and resetTimers function
 */
export function useIdleDetection(
  onCursorFade: () => void,
  onIdleStatusChange: (isIdle: boolean) => void
) {
  const [state, setState] = useState<IdleState>({
    cursorFaded: false,
    isIdle: false
  })

  const cursorTimerRef = useRef<number | null>(null)
  const idleTimerRef = useRef<number | null>(null)
  const stateRef = useRef(state)

  // Keep ref in sync with state for callback access
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (cursorTimerRef.current) {
      clearTimeout(cursorTimerRef.current)
      cursorTimerRef.current = null
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }

    // Instant restore if was idle or cursor faded
    if (stateRef.current.cursorFaded || stateRef.current.isIdle) {
      setState({ cursorFaded: false, isIdle: false })
      if (stateRef.current.isIdle) {
        onIdleStatusChange(false)
      }
    }

    // Set new cursor fade timer
    cursorTimerRef.current = window.setTimeout(() => {
      setState(s => ({ ...s, cursorFaded: true }))
      onCursorFade()
    }, CURSOR_FADE_TIMEOUT)

    // Set new idle status timer
    idleTimerRef.current = window.setTimeout(() => {
      setState(s => ({ ...s, isIdle: true }))
      onIdleStatusChange(true)
    }, IDLE_STATUS_TIMEOUT)
  }, [onCursorFade, onIdleStatusChange])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [])

  return { ...state, resetTimers }
}
