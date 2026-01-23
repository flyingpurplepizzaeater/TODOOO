---
phase: 08-mobile-platform
plan: 02
subsystem: canvas-touch
tags: [touch-gestures, pinch-zoom, stylus, mobile-ui, capacitor]
dependency-graph:
  requires: [08-01-capacitor-setup]
  provides: [touch-configuration, mobile-aware-canvas, pinch-zoom-support]
  affects: [08-03-offline-support, 08-04-camera-export]
tech-stack:
  added: []
  patterns:
    - "Touch device detection utilities"
    - "Mobile-first wheel handler bypass"
    - "forceMobile conditional tldraw UI"
key-files:
  created:
    - frontend/src/components/Canvas/touchConfig.ts
  modified:
    - frontend/src/components/Canvas/cameraOptions.ts
    - frontend/src/components/Canvas/Canvas.tsx
    - frontend/src/capacitor/camera.ts
    - frontend/src/capacitor/notifications.ts
decisions:
  - decision: "Touch detection via ontouchstart AND maxTouchPoints"
    rationale: "Cross-browser compatible touch capability detection"
  - decision: "Early return for touch devices in wheel handler"
    rationale: "Allows tldraw native pinch-to-zoom without Ctrl key requirement"
  - decision: "Window.Capacitor check for native platform detection"
    rationale: "Avoids build errors when Capacitor not installed on web-only builds"
  - decision: "Normalize permission states to exclude 'prompt-with-rationale'"
    rationale: "Capacitor Camera/Notifications return extended permission states"
metrics:
  duration: "~8 minutes"
  completed: 2026-01-23
---

# Phase 8 Plan 2: Touch Gestures Summary

**One-liner:** Mobile touch configuration with pinch-to-zoom, stylus support, and forceMobile UI detection for Capacitor/tldraw integration.

## What Was Built

### Touch Configuration Module
- **touchConfig.ts**: Centralized touch gesture utilities
  - `isTouchDevice()`: Detect touch-capable devices
  - `supportsStylus()`: Check for pressure-sensitive input (PointerEvent)
  - `isMobileViewport()`: Combined viewport width + touch detection
  - `isStylusEvent()`: Differentiate stylus from finger input
  - `getPointerPressure()`: Get stylus pressure (0-1) or default 0.5
  - `LONG_PRESS_DURATION`: 500ms constant for context menus

### Mobile-Aware Wheel Handler
- **cameraOptions.ts**: Updated to bypass Ctrl requirement on touch devices
  - Import `isTouchDevice` from touchConfig
  - Early return for touch devices (allows native pinch-to-zoom)
  - Desktop behavior preserved (Ctrl+scroll only zoom)
  - Addresses RESEARCH.md Pitfall 6: touch gesture conflicts

### Canvas Mobile UI Detection
- **Canvas.tsx**: Added forceMobile prop for mobile-optimized UI
  - `shouldForceMobile` useMemo: Checks Capacitor native OR touch+mobile viewport
  - Passes `forceMobile={shouldForceMobile}` to Tldraw component
  - Dynamic window.Capacitor check avoids build errors

## Commits

| Hash | Type | Description |
|------|------|-------------|
| b6f58da | feat | Add touch configuration module |
| 87ca52a | feat | Update wheel handler for mobile pinch-to-zoom |
| e4973df | feat | Add forceMobile prop for mobile UI layout |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript permission type errors**
- **Found during:** Task 3 build verification
- **Issue:** Capacitor Camera and LocalNotifications return `'prompt-with-rationale'` permission state that doesn't match declared return types
- **Fix:** Normalize permission states in `checkCameraPermission()` and `checkNotificationPermission()` to map extended states to `'prompt'`
- **Files modified:** frontend/src/capacitor/camera.ts, frontend/src/capacitor/notifications.ts
- **Commit:** e4973df

## Verification Results

All success criteria met:

- [x] touchConfig.ts provides device detection utilities
- [x] cameraOptions.ts allows native pinch gestures on touch devices
- [x] Canvas.tsx passes forceMobile to tldraw for mobile UI
- [x] Desktop behavior unchanged (Ctrl+scroll zoom)
- [x] TypeScript compiles without errors
- [x] npm run build completes successfully

## Technical Notes

### tldraw Native Touch Support
Per RESEARCH.md, tldraw natively handles most touch gestures via `useGestureEvents`:
- Pinch-to-zoom: Built-in
- Two-finger pan: Built-in
- One-finger draw: Default in draw tool
- Stylus pressure: Automatic detection

The configuration in this plan:
1. Removes the Ctrl key requirement for zoom on touch devices
2. Forces mobile UI layout (toolbar, menus) when appropriate
3. Provides utilities for future stylus-specific features

### Capacitor Integration
The `shouldForceMobile` detection uses a window global check for Capacitor:
```typescript
const Capacitor = (window as { Capacitor?: ... }).Capacitor;
if (Capacitor?.isNativePlatform()) return true;
```

This avoids import-time errors when building for web-only deployment.

## Next Phase Readiness

**Ready for 08-03 App Lifecycle & Offline:**
- Touch configuration available for mobile-specific offline indicators
- Canvas properly forces mobile UI in native app context
- WebSocket wheel handler won't interfere with touch gestures

**Dependencies met:**
- 08-01 Capacitor setup provides platform detection
- Touch utilities ready for offline mode integration

---

*Phase: 08-mobile-platform | Plan: 02 | Completed: 2026-01-23*
