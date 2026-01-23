import { type TLCameraOptions, Editor } from 'tldraw'
import { isTouchDevice } from './touchConfig'

/**
 * Camera configuration for CollabBoard canvas.
 *
 * User requirements (from 02-CONTEXT.md):
 * - Direct 1:1 pan tracking (no inertia/momentum) - default tldraw behavior
 * - Zoom limits: 10% to 400%
 * - Zoom triggered by Ctrl+scroll only on DESKTOP
 * - Mobile: pinch-to-zoom works naturally
 * - Corner minimap for large boards - built into tldraw navigation panel
 */
export const cameraOptions: TLCameraOptions = {
  // Zoom behavior - 'zoom' means scroll wheel zooms
  // Note: On desktop, we use custom wheel handler for Ctrl-only
  // On mobile, tldraw's native pinch-to-zoom takes over
  wheelBehavior: 'zoom',

  // Pan and zoom speed (1 = default, 0-2 range)
  panSpeed: 1,
  zoomSpeed: 1,

  // Zoom steps define allowed zoom levels
  // First value = minimum (10%), last value = maximum (400%)
  zoomSteps: [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4],

  // Don't lock camera movement
  isLocked: false,
}

/**
 * Custom wheel event handler to implement Ctrl+scroll only zoom on DESKTOP.
 * On mobile/touch devices, this handler is bypassed to allow native pinch gestures.
 *
 * RESEARCH.md Pitfall 6: Touch Gestures Conflict with Ctrl+Scroll Zoom
 * - On mobile, pinch events are handled by tldraw's useGestureEvents
 * - This handler only restricts desktop mouse wheel behavior
 *
 * Usage: Apply to tldraw container div's onWheel event
 */
export function handleWheel(e: WheelEvent, _editor: Editor): void {
  // On touch devices, let tldraw handle all gestures natively
  // This allows pinch-to-zoom to work without Ctrl key
  if (isTouchDevice()) {
    return; // Don't prevent default - let tldraw handle it
  }

  // DESKTOP ONLY: Only zoom if Ctrl (or Cmd on Mac) is pressed
  if (!e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    e.stopPropagation()
    return
  }
  // Otherwise, let tldraw handle it (zoom)
}
