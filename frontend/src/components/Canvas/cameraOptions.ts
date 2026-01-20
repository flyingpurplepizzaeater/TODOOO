import { TLCameraOptions, Editor } from 'tldraw'

/**
 * Camera configuration for CollabBoard canvas.
 *
 * User requirements (from 02-CONTEXT.md):
 * - Direct 1:1 pan tracking (no inertia/momentum) - default tldraw behavior
 * - Zoom limits: 10% to 400%
 * - Zoom triggered by Ctrl+scroll only - NOTE: tldraw wheelBehavior is global,
 *   implementing Ctrl-only requires custom event handling (see handleWheel)
 * - Corner minimap for large boards - built into tldraw navigation panel
 */
export const cameraOptions: TLCameraOptions = {
  // Zoom behavior - 'zoom' means scroll wheel zooms
  // Note: tldraw doesn't natively support "Ctrl+scroll only"
  // We handle this with a custom wheel event handler
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
 * Custom wheel event handler to implement Ctrl+scroll only zoom.
 * Regular scroll should do nothing (page doesn't scroll within tldraw).
 *
 * Usage: Apply to tldraw container div's onWheel event
 */
export function handleWheel(e: WheelEvent, _editor: Editor): void {
  // Only zoom if Ctrl (or Cmd on Mac) is pressed
  if (!e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    e.stopPropagation()
    return
  }
  // Otherwise, let tldraw handle it (zoom)
}
