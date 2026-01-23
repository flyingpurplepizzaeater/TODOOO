# iOS Build Instructions

## Prerequisites

- macOS with Xcode 15+
- Apple Developer account
- iOS device or simulator

## Build Steps

### 1. Sync web assets

```bash
cd frontend
npm run build
npx cap sync ios
```

### 2. Open Xcode

```bash
npx cap open ios
```

### 3. Configure project

In Xcode, select the "App" target and configure:

- **Bundle Identifier:** com.collabboard.todooo
- **Display Name:** TODOOO
- **Development Team:** (select your team)
- **Deployment Target:** iOS 14.0

### 4. Test on simulator

1. Select an iPhone simulator target from the device dropdown
2. Press Cmd+R to build and run
3. Verify the canvas loads and responds to touch

### 5. Archive for TestFlight

1. Select "Any iOS Device (arm64)" as the target
2. Menu: Product > Archive
3. In Organizer (Window > Organizer):
   - Select the archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow prompts to upload

## Verification Checklist

After building, verify:

- [ ] App launches without crashing
- [ ] Splash screen shows teal background
- [ ] Canvas renders and is interactive
- [ ] Pinch-to-zoom works
- [ ] One-finger drawing works
- [ ] Two-finger pan works
- [ ] All Phase 2-6 features work (shapes, notes, TODOs, images, export)

## Troubleshooting

### Signing errors

Ensure Development Team is selected in Signing & Capabilities tab.

### Build errors

Try Product > Clean Build Folder (Cmd+Shift+K) then rebuild.

### Capacitor sync issues

If the public folder seems stale:

```bash
rm -rf ios/App/App/public
npx cap sync ios
```

### CocoaPods issues

If pods are out of sync:

```bash
cd ios/App
pod install --repo-update
```

### Permissions not working

Verify Info.plist contains the required usage descriptions:

- NSCameraUsageDescription
- NSPhotoLibraryUsageDescription
- NSPhotoLibraryAddUsageDescription

## App Store Submission Notes

Before submitting to App Store:

1. Replace placeholder icons with designed assets
2. Add App Privacy details in App Store Connect
3. Complete app metadata (description, screenshots, etc.)
4. Test on physical devices, not just simulator

---

*TODOOO - CollabBoard Mobile App*
