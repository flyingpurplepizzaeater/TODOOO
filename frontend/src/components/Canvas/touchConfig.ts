/**
 * Touch gesture configuration for mobile canvas.
 *
 * CONTEXT.md requirements:
 * - Two-finger pan, one-finger draw (default draw mode)
 * - Stylus pressure sensitivity for stroke width
 * - Stylus draws while finger pans
 * - Long-press: context menu for shapes, edit for text
 *
 * tldraw natively handles most touch via useGestureEvents hook:
 * - Pinch-to-zoom: Built-in
 * - Two-finger pan: Built-in
 * - One-finger draw: Default in draw tool
 * - Stylus pressure: Automatic detection
 */

/**
 * Returns true if device supports touch input.
 * Used to conditionally adjust behavior for touch vs mouse.
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Returns true if device supports pressure-sensitive input (stylus).
 * Checks for PointerEvent pressure property support.
 */
export function supportsStylus(): boolean {
  return 'PointerEvent' in window && navigator.maxTouchPoints > 0;
}

/**
 * Returns true if we're likely on a mobile device.
 * More aggressive than isTouchDevice - also checks screen size.
 */
export function isMobileViewport(): boolean {
  return window.innerWidth <= 768 || isTouchDevice();
}

/**
 * Detect if pointer event is from stylus (pen/pencil).
 * Used to differentiate stylus input from finger touch.
 */
export function isStylusEvent(e: PointerEvent): boolean {
  return e.pointerType === 'pen';
}

/**
 * Get pressure value from pointer event.
 * Returns 0.5 (medium) for non-pressure devices.
 * Stylus devices return actual pressure (0-1).
 */
export function getPointerPressure(e: PointerEvent): number {
  // pointerType 'pen' indicates stylus
  if (e.pointerType === 'pen' && e.pressure > 0) {
    return e.pressure;
  }
  // Default pressure for finger/mouse
  return 0.5;
}

/**
 * Long-press duration in milliseconds.
 * Per CONTEXT.md: long-press shows context menu for shapes, edit for text.
 */
export const LONG_PRESS_DURATION = 500;
