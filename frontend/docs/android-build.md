# Android Build Instructions

## Prerequisites

- Android Studio (latest stable)
- Java 17+ (Android Studio includes this)
- Android SDK (API 22+)
- Physical device or emulator

## Build Steps

### 1. Sync web assets

```bash
cd frontend
npm run build
npx cap sync android
```

### 2. Open Android Studio

```bash
npx cap open android
```

Or open Android Studio and select:
File > Open > `frontend/android`

### 3. Wait for Gradle sync

Android Studio will automatically sync Gradle. Wait for completion (status bar shows progress).

### 4. Test on emulator/device

1. Select a device from the toolbar dropdown
2. Click Run (green play button) or press Shift+F10
3. Verify the app launches and canvas works

### 5. Build APK for testing

1. Menu: Build > Build Bundle(s) / APK(s) > Build APK(s)
2. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`
3. Install on device: `adb install app-debug.apk`

### 6. Build for Play Store

1. Menu: Build > Generate Signed Bundle / APK
2. Choose Android App Bundle (AAB) for Play Store
3. Create or select your keystore
4. Select "release" build variant
5. Upload AAB to Google Play Console

## Verification Checklist

After building, verify:

- [ ] App launches without crashing
- [ ] Splash screen shows teal background
- [ ] Canvas renders and is interactive
- [ ] Pinch-to-zoom works
- [ ] One-finger drawing works
- [ ] Two-finger pan works
- [ ] All Phase 2-6 features work (shapes, notes, TODOs, images, export)
- [ ] Camera permission request appears when using camera

## Troubleshooting

### Gradle sync fails

1. File > Invalidate Caches / Restart
2. Or delete `.gradle` folder and sync again

### Build errors with Capacitor plugins

```bash
cd frontend
npm install
npx cap sync android
```

### SDK not found

1. File > Project Structure > SDK Location
2. Set Android SDK location

### Device not showing

1. Enable USB debugging on device
2. Run `adb devices` to verify connection
3. Accept debugging prompt on device

### APK installation fails

```bash
adb uninstall com.collabboard.todooo
adb install -r app-debug.apk
```

## Permission Configuration

The following permissions are configured in AndroidManifest.xml:

- `CAMERA` - For photo capture to canvas
- `READ_EXTERNAL_STORAGE` - For file access (API < 33)
- `WRITE_EXTERNAL_STORAGE` - For file saving (API < 33)
- `READ_MEDIA_IMAGES` - For media access (API 33+)
- `POST_NOTIFICATIONS` - For TODO reminders (API 33+)
- `SCHEDULE_EXACT_ALARM` - For precise notification timing

## Play Store Submission Notes

Before submitting to Play Store:

1. Replace placeholder icons with designed assets
2. Create release keystore and keep it safe
3. Add Data Safety details in Play Console
4. Prepare store listing (screenshots, description)
5. Test on multiple device sizes and Android versions

## Minimum SDK Requirements

- **minSdkVersion:** 22 (Android 5.1 Lollipop)
- **targetSdkVersion:** 34 (Android 14)
- **compileSdkVersion:** 34

---

*TODOOO - CollabBoard Mobile App*
