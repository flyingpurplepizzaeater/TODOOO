# Phase 8: Mobile Platform - Research

**Researched:** 2026-01-23
**Domain:** Capacitor mobile app wrapping for React/Vite with tldraw canvas
**Confidence:** HIGH (official Capacitor docs, tldraw docs, verified patterns)

## Summary

This research investigates wrapping the existing CollabBoard React/Vite web application as native iOS and Android apps using Capacitor. The project already has a complete web app with tldraw canvas, Yjs sync, collaboration features, and TODO management.

Key findings:
1. **Capacitor integration is straightforward** for React/Vite projects - install packages, configure `webDir: "dist"`, add platforms
2. **tldraw natively supports mobile touch** including pinch-to-zoom and pan gestures via the `useGestureEvents` hook
3. **iOS WebView memory limits** are a real concern (1.4-1.5GB page limit) but typical canvas use should stay within bounds
4. **WebSocket reconnection on app resume** requires explicit handling via Capacitor App lifecycle events
5. **User decisions from CONTEXT.md** require: camera plugin for photo capture, local notifications for reminders, offline caching for 10 boards

**Primary recommendation:** Use Capacitor 6.x (stable LTS) with official plugins for camera, notifications, filesystem, and status bar. Implement App lifecycle listeners for WebSocket reconnection. Use `forceMobile` prop on tldraw for consistent mobile UI.

## Standard Stack

The established libraries/tools for Capacitor mobile development:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/core | 6.x | Core runtime | LTS version, stable API |
| @capacitor/cli | 6.x | Build tooling | Required for iOS/Android builds |
| @capacitor/ios | 6.x | iOS platform | Official iOS wrapper |
| @capacitor/android | 6.x | Android platform | Official Android wrapper |

### Required Plugins (from CONTEXT.md decisions)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/app | 6.x | App lifecycle events | WebSocket reconnection on resume |
| @capacitor/camera | 6.x | Photo capture | User decision: capture photos to canvas |
| @capacitor/local-notifications | 6.x | TODO reminders | User decision: due date reminders |
| @capacitor/splash-screen | 6.x | Launch screen | User decision: animated checkmark |
| @capacitor/status-bar | 6.x | Status bar styling | Consistent app appearance |
| @capacitor/filesystem | 6.x | Offline caching | User decision: cache last 10 boards |
| @capacitor/preferences | 6.x | Key-value storage | Store board list, user settings |
| @ionic/pwa-elements | Latest | Web camera UI | Required for Camera plugin on web |

### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| Xcode 15+ | iOS builds | Required for TestFlight deployment |
| Android Studio Hedgehog+ | Android builds | Required for APK/AAB signing |
| @capacitor/assets | Icon/splash generation | Generate 1024x1024 icon, 2732x2732 splash |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Capacitor 6.x | Capacitor 8.x | 8.x requires NodeJS 22+, Android Studio 2025.2.1+, newer toolchain |
| @capacitor/push-notifications | Local only | Push requires server infrastructure, FCM setup - not needed for MVP |
| Custom WebSocket plugin | JS reconnection | Web-based y-websocket handles reconnection natively |

**Installation:**
```bash
# Core Capacitor
npm install @capacitor/core@6 @capacitor/app@6 @capacitor/camera@6 @capacitor/local-notifications@6 @capacitor/splash-screen@6 @capacitor/status-bar@6 @capacitor/filesystem@6 @capacitor/preferences@6
npm install -D @capacitor/cli@6

# Platforms
npm install @capacitor/ios@6 @capacitor/android@6

# PWA Elements (for web camera fallback)
npm install @ionic/pwa-elements

# Initialize Capacitor
npx cap init "TODOOO" "com.collabboard.todooo" --web-dir dist

# Add platforms
npx cap add ios
npx cap add android
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── src/
│   ├── capacitor/               # Capacitor-specific code
│   │   ├── lifecycle.ts         # App resume/pause handlers
│   │   ├── camera.ts            # Photo capture service
│   │   ├── notifications.ts     # TODO reminder scheduler
│   │   ├── offline.ts           # Board caching service
│   │   └── platform.ts          # Platform detection utilities
│   ├── components/
│   │   └── Canvas/
│   │       └── MobileCanvas.tsx # Mobile-specific Canvas wrapper
│   └── ...existing code...
├── ios/                         # Generated iOS project
├── android/                     # Generated Android project
├── capacitor.config.ts          # Capacitor configuration
└── package.json
```

### Pattern 1: Capacitor Configuration
**What:** Central configuration for all Capacitor plugins and settings
**When to use:** Always - required for platform initialization
**Example:**
```typescript
// capacitor.config.ts
// Source: https://capacitorjs.com/docs/config
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.collabboard.todooo',
  appName: 'TODOOO',
  webDir: 'dist',  // Vite output directory
  server: {
    // Development only - remove for production
    url: 'http://localhost:5173',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#14b8a6',  // Teal brand color
      showSpinner: false,
      // Animated splash handled natively
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#14b8a6',  // Teal brand color
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#14b8a6',
    },
  },
};

export default config;
```

### Pattern 2: App Lifecycle for WebSocket Reconnection
**What:** Handle app background/foreground transitions to manage WebSocket connections
**When to use:** On app resume - reconnect Yjs WebSocket provider
**Example:**
```typescript
// src/capacitor/lifecycle.ts
// Source: https://capacitorjs.com/docs/apis/app
import { App } from '@capacitor/app';
import { WebsocketProvider } from 'y-websocket';

let provider: WebsocketProvider | null = null;

export function initAppLifecycle(wsProvider: WebsocketProvider) {
  provider = wsProvider;

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive && provider) {
      // App returned to foreground - reconnect if disconnected
      if (!provider.wsconnected) {
        provider.connect();
      }
    }
  });

  App.addListener('resume', () => {
    // Explicit resume - ensure connection
    if (provider && !provider.wsconnected) {
      provider.connect();
    }
  });
}
```

### Pattern 3: Mobile-Aware Canvas with forceMobile
**What:** Force tldraw to use mobile UI layout in Capacitor apps
**When to use:** When rendering tldraw inside Capacitor WebView
**Example:**
```tsx
// src/components/Canvas/MobileCanvas.tsx
// Source: https://tldraw.dev/examples/force-mobile
import { Capacitor } from '@capacitor/core';
import { Tldraw } from 'tldraw';

export function MobileCanvas(props: CanvasProps) {
  const isMobile = Capacitor.isNativePlatform();

  return (
    <Tldraw
      {...props}
      forceMobile={isMobile}  // Forces mobile UI on native platforms
    />
  );
}
```

### Pattern 4: Offline Board Caching
**What:** Cache last 10 viewed boards for offline access
**When to use:** On board load and when going offline
**Example:**
```typescript
// src/capacitor/offline.ts
// Source: https://capacitorjs.com/docs/apis/filesystem + preferences
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

const MAX_CACHED_BOARDS = 10;

interface CachedBoard {
  boardId: string;
  name: string;
  lastViewed: number;
  yjsState: string;  // Base64 encoded Y.Doc state
}

export async function cacheBoard(boardId: string, name: string, yjsState: Uint8Array) {
  // Get current cache list
  const { value } = await Preferences.get({ key: 'cached-boards' });
  const boards: CachedBoard[] = value ? JSON.parse(value) : [];

  // Remove if exists (to update position)
  const filtered = boards.filter(b => b.boardId !== boardId);

  // Add to front
  filtered.unshift({
    boardId,
    name,
    lastViewed: Date.now(),
    yjsState: btoa(String.fromCharCode(...yjsState)),
  });

  // Keep only MAX_CACHED_BOARDS
  const trimmed = filtered.slice(0, MAX_CACHED_BOARDS);

  // Save list
  await Preferences.set({ key: 'cached-boards', value: JSON.stringify(trimmed) });

  // Save full state to filesystem (larger data)
  await Filesystem.writeFile({
    path: `boards/${boardId}.json`,
    data: JSON.stringify({ yjsState: btoa(String.fromCharCode(...yjsState)) }),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  });
}

export async function getCachedBoard(boardId: string): Promise<Uint8Array | null> {
  try {
    const result = await Filesystem.readFile({
      path: `boards/${boardId}.json`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    const data = JSON.parse(result.data as string);
    const binary = atob(data.yjsState);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  } catch {
    return null;
  }
}
```

### Pattern 5: Camera Photo to Canvas
**What:** Capture photo and add as image to tldraw canvas
**When to use:** User taps camera button in toolbar
**Example:**
```typescript
// src/capacitor/camera.ts
// Source: https://capacitorjs.com/docs/apis/camera
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Editor } from 'tldraw';

export async function capturePhotoToCanvas(editor: Editor, boardId: string, token: string) {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
  });

  if (photo.base64String) {
    // Convert to blob for upload
    const byteCharacters = atob(photo.base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${photo.format}` });
    const file = new File([blob], `photo.${photo.format}`, { type: `image/${photo.format}` });

    // Use existing asset store upload flow
    // (Integrate with useImageUpload hook)
  }
}
```

### Anti-Patterns to Avoid
- **Running WebSockets in background:** Mobile OS kills background WebView connections - don't try to maintain them
- **Large canvas state in memory:** iOS has ~1.4GB page limit - avoid loading many high-res images simultaneously
- **Synchronous localStorage calls:** Use Capacitor Preferences (async) for better performance
- **Hardcoded localhost URLs:** Use environment-based config for API/WebSocket URLs

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo capture | Custom camera WebView | @capacitor/camera | Handles permissions, formats, gallery access |
| Local notifications | setTimeout + alert | @capacitor/local-notifications | Proper system notifications, exact scheduling |
| File caching | IndexedDB wrapper | @capacitor/filesystem | Native file access, proper directories |
| Key-value storage | localStorage wrapper | @capacitor/preferences | Async, native performance |
| App lifecycle | visibilitychange polyfill | @capacitor/app | Native events, reliable background detection |
| Splash screen | HTML loading screen | @capacitor/splash-screen | Native splash, no white flash |
| Status bar | CSS viewport units | @capacitor/status-bar | Native control, overlay modes |

**Key insight:** Capacitor plugins provide native implementations that are more reliable than web workarounds. The camera plugin handles iOS permission dialogs, Android 13+ photo permissions, and gallery integration automatically.

## Common Pitfalls

### Pitfall 1: WebSocket Disconnection on Background
**What goes wrong:** App goes to background, WebSocket disconnects, user returns to stale data
**Why it happens:** Mobile OS suspends WebView when app is backgrounded
**How to avoid:**
1. Listen for `appStateChange` via @capacitor/app
2. Reconnect WebSocket provider on `resume` event
3. Show "Reconnecting..." banner during reconnection
**Warning signs:** Users report "changes lost" after switching apps

### Pitfall 2: iOS Canvas Memory Exhaustion
**What goes wrong:** Canvas stops rendering, app becomes unresponsive
**Why it happens:** iOS limits WebView pages to ~1.4GB memory
**How to avoid:**
1. Limit image resolution on upload (max 2048px dimension)
2. Use webPath URLs instead of base64 for images
3. Implement lazy loading for off-screen images
4. Monitor memory with Safari Web Inspector
**Warning signs:** "Total canvas memory use exceeds the maximum limit" in console

### Pitfall 3: Android Back Button Closes App
**What goes wrong:** User presses back, app exits instead of navigating
**Why it happens:** Default Capacitor behavior exits app on back button
**How to avoid:**
```typescript
App.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    // Show "Press again to exit" toast or handle appropriately
  }
});
```
**Warning signs:** Users complain app closes unexpectedly

### Pitfall 4: Camera Permissions Denied Silently
**What goes wrong:** Camera capture fails with no user feedback
**Why it happens:** Missing permission descriptions in Info.plist/AndroidManifest
**How to avoid:** Add all required permissions:
- iOS Info.plist: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`
- Android: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` (SDK < 33)
**Warning signs:** Camera works on simulator but fails on device

### Pitfall 5: Splash Screen White Flash
**What goes wrong:** Brief white screen between native splash and web app
**Why it happens:** Web bundle takes time to load after splash hides
**How to avoid:**
1. Set `launchAutoHide: false` in config
2. Manually hide splash after app hydrates: `SplashScreen.hide()`
3. Match splash background color to app background
**Warning signs:** Jarring visual transition on app launch

### Pitfall 6: Touch Gestures Conflict with Ctrl+Scroll Zoom
**What goes wrong:** Pinch-to-zoom doesn't work on mobile
**Why it happens:** Current `handleWheel` prevents non-Ctrl zoom
**How to avoid:** Make touch gesture handling platform-aware:
```typescript
// Allow pinch gestures on mobile (no Ctrl key)
export function handleWheel(e: WheelEvent, _editor: Editor): void {
  // On mobile/touch, pinch events are handled by tldraw's useGestureEvents
  // This handler is only for desktop mouse wheel
  if ('ontouchstart' in window) return;  // Let mobile handle natively

  if (!e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    e.stopPropagation();
  }
}
```
**Warning signs:** Desktop zoom works but mobile pinch doesn't

## Code Examples

Verified patterns from official sources:

### Capacitor Plugin Initialization
```typescript
// src/main.tsx - Initialize PWA Elements for web camera
// Source: https://capacitorjs.com/docs/web/pwa-elements
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { Capacitor } from '@capacitor/core';

// Only needed for web platform (iOS/Android have native camera)
if (!Capacitor.isNativePlatform()) {
  defineCustomElements(window);
}
```

### Local Notification for TODO Reminder
```typescript
// src/capacitor/notifications.ts
// Source: https://capacitorjs.com/docs/apis/local-notifications
import { LocalNotifications } from '@capacitor/local-notifications';

export async function scheduleTodoReminder(
  todoId: string,
  title: string,
  dueDate: Date
) {
  // Request permission first
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') return;

  // Schedule notification for due date
  await LocalNotifications.schedule({
    notifications: [{
      id: hashCode(todoId),  // Numeric ID required
      title: 'TODO Reminder',
      body: title,
      schedule: { at: dueDate },
      extra: { todoId },
    }],
  });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```

### Connection Status Banner with Reconnection
```typescript
// src/components/Canvas/ConnectionBanner.tsx
// Implements CONTEXT.md: warning banner, auto-dismiss on reconnect
import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import type { ConnectionStatus } from './useYjsStore';

export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);

  useEffect(() => {
    if (status === 'disconnected') {
      setWasDisconnected(true);
    }
    if (status === 'connected' && wasDisconnected) {
      setShowReconnected(true);
      setWasDisconnected(false);
      // Auto-dismiss after 2-3 seconds per CONTEXT.md
      const timer = setTimeout(() => setShowReconnected(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [status, wasDisconnected]);

  if (status === 'disconnected') {
    return (
      <div className="connection-banner warning">
        Connection lost. Changes saved locally.
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="connection-banner success">
        Reconnected!
      </div>
    );
  }

  return null;
}
```

### Platform-Aware Touch Configuration
```typescript
// src/components/Canvas/touchConfig.ts
// Handles CONTEXT.md: two-finger pan, one-finger draw, stylus pressure
import { Capacitor } from '@capacitor/core';

export function isMobileApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function supportsStylus(): boolean {
  // Check for pressure-sensitive input support
  return 'PointerEvent' in window &&
         navigator.maxTouchPoints > 0;
}

// tldraw handles most touch gestures natively via useGestureEvents
// Custom configuration only needed for edge cases
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cordova plugins | Capacitor native plugins | 2019+ | Better TypeScript support, modern async API |
| UIWebView (iOS) | WKWebView | iOS 12+ required | Better performance, but stricter memory limits |
| Manual APK signing | Capacitor CLI build | Capacitor 4+ | `npx cap build android` handles signing |
| Full-page splash images | Android 12 Splash API | Android 12 (2021) | Smaller centered icon with color, not full bleed |
| Manual Xcode schemes | Capacitor CLI | Capacitor 3+ | `npx cap run ios` manages build settings |

**Deprecated/outdated:**
- **Cordova:** Still works but Capacitor is the modern replacement from same team
- **UIWebView:** Removed from iOS 13+, WKWebView only
- **Android 11 splash screens:** Full-bleed images replaced by centered icon on Android 12+

## iOS-Specific Concerns

### Memory Management
- **Page limit:** ~1.4-1.5GB per WKWebView page
- **Canvas memory:** Separate from JS heap, can hit limits with many large canvases
- **Mitigation:** Limit uploaded image dimensions, use URL references over base64, implement image unloading

### TestFlight Deployment
1. Build web assets: `npm run build`
2. Sync to iOS: `npx cap sync ios`
3. Open Xcode: `npx cap open ios`
4. Select "Generic iOS Device" target
5. Product > Archive
6. Distribute App > App Store Connect > Upload
7. In App Store Connect, add to TestFlight and invite testers

### Required Info.plist Keys
```xml
<key>NSCameraUsageDescription</key>
<string>TODOOO needs camera access to add photos to your boards</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>TODOOO needs photo library access to add images to your boards</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>TODOOO needs permission to save exported images</string>
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

## Android-Specific Concerns

### APK/AAB Signing
```bash
# Create keystore (one-time)
keytool -genkey -v -keystore android/release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias release

# Build signed APK
npx cap build android --keystorepath android/release.jks --keystorepass PASSWORD --keystorealias release --keystorealiaspass PASSWORD --androidreleasetype APK
```

### Required AndroidManifest Permissions
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

### Android 12+ Splash Screen
Android 12+ enforces system splash screen with centered icon. Cannot use full-bleed images. Configure in `styles.xml`:
```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">#14b8a6</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splash_icon</item>
</style>
```

## Touch Gesture Compatibility

### tldraw Native Support
tldraw supports mobile touch gestures out of the box via `useGestureEvents` hook:
- **Pinch-to-zoom:** Built-in, tracks active touches and dispatches pinch events
- **Two-finger pan:** Native support
- **One-finger draw:** Default behavior when in draw tool
- **Edge swipe prevention:** Prevents browser navigation on touch devices

### CONTEXT.md Requirements Mapping
| Requirement | tldraw Support | Additional Work |
|-------------|---------------|-----------------|
| Two-finger pan, one-finger draw | Native | None - default behavior |
| Pinch-to-zoom | Native | May need sensitivity tuning |
| Stylus pressure sensitivity | Supported | Detect PointerEvent pressure |
| Stylus draws while finger pans | Needs work | May need custom event handling |
| Long-press context menu | Partial | Implement custom handler |

### Stylus Pressure Implementation
```typescript
// tldraw detects pressure-sensitive devices automatically
// Pressure affects stroke width in draw tool
// Source: tldraw release notes - "more accurately detect devices with pressure"
```

## Open Questions

Things that couldn't be fully resolved:

1. **Exact iOS canvas memory threshold**
   - What we know: ~1.4-1.5GB page limit, canvas memory counted separately
   - What's unclear: Exact thresholds for tldraw with typical board sizes
   - Recommendation: Monitor in Safari Web Inspector during testing, set conservative image limits

2. **Stylus + finger simultaneous input**
   - What we know: tldraw supports stylus, supports multi-touch
   - What's unclear: Whether "stylus draws while finger pans" works without customization
   - Recommendation: Test on iPad with Apple Pencil, implement custom handler if needed

3. **WebSocket reconnection timing**
   - What we know: y-websocket has built-in reconnection, App lifecycle provides events
   - What's unclear: Optimal delay between resume and reconnection attempt
   - Recommendation: Use y-websocket defaults initially, tune based on testing

4. **Animated splash screen implementation**
   - What we know: User wants "checkmark drawing" animation
   - What's unclear: Native vs web implementation for animation
   - Recommendation: Use static native splash (fast), animate in web layer after load

## Sources

### Primary (HIGH confidence)
- [Capacitor Installation](https://capacitorjs.com/docs/getting-started) - Core setup, webDir configuration
- [Capacitor Development Workflow](https://capacitorjs.com/docs/basics/workflow) - Build, sync, run commands
- [Capacitor App Plugin](https://capacitorjs.com/docs/apis/app) - Lifecycle events, background handling
- [Capacitor Camera Plugin](https://capacitorjs.com/docs/apis/camera) - Photo capture API, permissions
- [Capacitor Local Notifications](https://capacitorjs.com/docs/apis/local-notifications) - Scheduling, Android permissions
- [Capacitor Splash Screen](https://capacitorjs.com/docs/apis/splash-screen) - Configuration, programmatic control
- [Capacitor Status Bar](https://capacitorjs.com/docs/apis/status-bar) - Styling, overlay modes
- [Capacitor Filesystem](https://capacitorjs.com/docs/apis/filesystem) - Directory types, read/write
- [Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences) - Key-value storage
- [tldraw Force Mobile](https://tldraw.dev/examples/force-mobile) - forceMobile prop
- [tldraw Editor Docs](https://tldraw.dev/docs/editor) - inputs object, gesture handling

### Secondary (MEDIUM confidence)
- [Apple Developer Forums - WKWebView Memory](https://developer.apple.com/forums/thread/766309) - iOS 1.4GB limit confirmed
- [Ionic Blog - Building Capacitor iOS](https://ionic.io/blog/building-and-releasing-your-capacitor-ios-app) - TestFlight workflow
- [Ionic Blog - Building Capacitor Android](https://ionic.io/blog/building-and-releasing-your-capacitor-android-app) - APK signing
- [tldraw GitHub Issue #4251](https://github.com/tldraw/tldraw/issues/4251) - Native mobile support discussion
- [Capgo Blog - Background Tasks](https://capgo.app/blog/how-background-tasks-work-in-capacitor/) - Lifecycle event details

### Tertiary (LOW confidence)
- WebSearch results on stylus pressure - needs testing validation
- Community boilerplates for React+Vite+Capacitor - patterns vary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Capacitor docs, well-established patterns
- Architecture: HIGH - Standard Capacitor patterns, official plugin APIs
- Touch gestures: MEDIUM - tldraw docs confirm support, edge cases need testing
- iOS memory: MEDIUM - Multiple sources agree on limits, exact thresholds vary
- Offline caching: HIGH - Official Filesystem/Preferences APIs
- Pitfalls: MEDIUM - Based on community reports and official warnings

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable technology, Capacitor 6.x LTS)
