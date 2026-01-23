---
phase: 08-mobile-platform
plan: 01
subsystem: mobile-infrastructure
tags: [capacitor, ios, android, splash-screen, platform-detection]
dependency-graph:
  requires: [07-collaboration-polish]
  provides: [capacitor-setup, native-platforms, platform-detection, splash-animation]
  affects: [08-02-touch-gestures, 08-03-offline-support, 08-04-camera-export]
tech-stack:
  added:
    - "@capacitor/core@6.2.1"
    - "@capacitor/cli@6.2.1"
    - "@capacitor/ios@6.2.1"
    - "@capacitor/android@6.2.1"
    - "@capacitor/app@6.0.3"
    - "@capacitor/camera@6.1.3"
    - "@capacitor/filesystem@6.0.4"
    - "@capacitor/local-notifications@6.1.3"
    - "@capacitor/preferences@6.0.4"
    - "@capacitor/splash-screen@6.0.4"
    - "@capacitor/status-bar@6.0.3"
    - "@ionic/pwa-elements@3.3.0"
  patterns:
    - "Capacitor native wrapping for React/Vite"
    - "Web-based animated splash with SVG"
    - "Platform detection utilities"
key-files:
  created:
    - frontend/capacitor.config.ts
    - frontend/src/capacitor/platform.ts
    - frontend/src/capacitor/splash.ts
    - frontend/src/capacitor/index.ts
    - frontend/src/components/SplashAnimation.tsx
    - frontend/ios/ (native project)
    - frontend/android/ (native project)
  modified:
    - frontend/package.json
    - frontend/src/main.tsx
decisions:
  - decision: "launchShowDuration: 0 for immediate native splash hide"
    rationale: "Web animation takes over immediately, avoiding white flash"
  - decision: "Web-based animated splash instead of native animation"
    rationale: "Cross-platform consistency, easier to customize, no native tooling required"
  - decision: "PWA elements for web camera fallback"
    rationale: "Required for Camera plugin to work on web platform during development"
metrics:
  duration: "~15 minutes"
  completed: 2026-01-23
---

# Phase 8 Plan 1: Capacitor Setup Summary

**One-liner:** Capacitor 6.x mobile foundation with iOS/Android platforms and animated checkmark splash screen for TODOOO app.

## What Was Built

### Capacitor Configuration
- **capacitor.config.ts**: TODOOO branding with teal (#14b8a6) theme
  - appId: `com.collabboard.todooo`
  - webDir: `dist` (Vite output)
  - SplashScreen: Immediate hide, manual control for web animation
  - StatusBar: Dark style with teal background
  - LocalNotifications: Configured for TODO reminders

### Native Platforms
- **iOS project**: `frontend/ios/` with Xcode workspace
  - 7 Capacitor plugins configured
  - Ready for pod install (requires macOS)
- **Android project**: `frontend/android/` with Gradle build
  - 7 Capacitor plugins configured
  - Ready for Android Studio build

### Platform Detection Utilities
- **isNativePlatform()**: True only in Capacitor app
- **isIOS() / isAndroid()**: Specific platform checks
- **isMobileDevice()**: Native OR mobile browser (touch detection)
- **getPlatformName()**: Returns 'ios', 'android', or 'web'
- **isMobileApp**: Alias for isNativePlatform

### Animated Splash Screen
- **SplashAnimation component**: Web-based overlay
  - Checkmark SVG animation (500ms draw)
  - TODOOO text fade-in
  - Teal background matching brand
  - Auto-hide on web, controlled on native
- **splash.ts**: Control functions
  - hideSplash(): Hides native splash after animation
  - showSplash(): Re-shows native splash (rare use)

### NPM Scripts
```bash
npm run cap:sync    # Build + sync to all platforms
npm run cap:ios     # Build + sync + open Xcode
npm run cap:android # Build + sync + open Android Studio
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 801d200 | feat | Install Capacitor packages and configuration |
| b61991c | fix | Resolve TypeScript build errors blocking Capacitor setup |
| a42bcfa | feat | Add iOS and Android platforms |
| 1326cb0 | feat | Add platform detection and animated splash screen |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript build errors**
- **Found during:** Task 2 (before platform setup)
- **Issue:** Pre-existing strict mode TypeScript errors preventing build
- **Fix:**
  - Added type-only imports for TLResizeInfo, TLBaseShape, TLShapeId, TodoShape
  - Fixed debounce generic type constraints
  - Fixed YKeyValue iteration using .map.forEach()
  - Fixed TLStoreWithStatus cast
  - Fixed TLUiToolItem todo tool properties
  - Fixed TodoApiError class property declarations
- **Files modified:** 7 files in Canvas/ and services/
- **Commit:** b61991c

## Verification Results

All success criteria met:

- [x] Capacitor 6.x installed (6.2.1) with all required plugins
- [x] capacitor.config.ts exists with TODOOO branding
- [x] iOS platform added (ios/ directory with Xcode project)
- [x] Android platform added (android/ directory with Gradle project)
- [x] Platform detection utilities available for feature gating
- [x] Animated splash screen with checkmark drawing animation
- [x] npm scripts added for Capacitor workflow
- [x] TypeScript compiles without errors
- [x] cap:sync completes successfully

## Technical Notes

### Splash Screen Strategy
Per RESEARCH.md, we use a hybrid approach:
1. Native splash shows briefly (backgroundColor matches app)
2. Web animation takes over immediately (launchShowDuration: 0)
3. Animation completes in ~1.3s total
4. hideSplash() called after animation done

This avoids:
- White flash between native splash and web app
- Complex native animation tooling
- Platform-specific animation code

### Plugin Readiness
7 Capacitor plugins installed and synced:
- @capacitor/app - Lifecycle events (08-02)
- @capacitor/camera - Photo capture (08-04)
- @capacitor/filesystem - Board caching (08-03)
- @capacitor/local-notifications - TODO reminders (08-04)
- @capacitor/preferences - Settings storage (08-03)
- @capacitor/splash-screen - Launch screen control
- @capacitor/status-bar - App chrome styling

### Build Warnings
- CocoaPods not installed (expected on Windows)
- xcodebuild not found (expected on Windows)
- Large chunk warning (~2MB) - tldraw bundle size (existing issue)

## Next Phase Readiness

**Ready for 08-02 Touch Gestures:**
- Platform detection available for touch-specific behavior
- Native projects configured and syncing
- App lifecycle plugin ready for WebSocket reconnection

**Dependencies met:**
- Capacitor core runtime operational
- Both platforms successfully added
- Web assets syncing correctly

---

*Phase: 08-mobile-platform | Plan: 01 | Completed: 2026-01-23*
