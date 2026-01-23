/**
 * TODOOO App Icon Requirements & Generation Guide
 *
 * Creates placeholder icons with teal branding.
 * Replace with proper designed icons before store submission.
 *
 * Brand Color: #14b8a6 (Teal)
 *
 * For production, use:
 * - @capacitor/assets: `npx capacitor-assets generate`
 * - Or design tool: Export 1024x1024 PNG and use capacitor-assets
 *
 * Usage:
 *   node scripts/generate-icons.js
 *
 * NOTE: This script documents requirements. For actual icon generation,
 * create a 1024x1024 icon.png and run: npx @capacitor/assets generate
 */

console.log(`
================================================================================
                        TODOOO App Icon Requirements
================================================================================

iOS Icons (Assets.xcassets/AppIcon.appiconset):
--------------------------------------------------------------------------------
Size          Purpose                     Current Status
--------------------------------------------------------------------------------
1024x1024     App Store                   [EXISTS] AppIcon-512@2x.png
180x180       iPhone @3x                  Xcode generates from 1024
120x120       iPhone @2x                  Xcode generates from 1024
167x167       iPad Pro                    Xcode generates from 1024
152x152       iPad @2x                    Xcode generates from 1024
76x76         iPad @1x                    Xcode generates from 1024
--------------------------------------------------------------------------------

Android Icons (res/mipmap-*):
--------------------------------------------------------------------------------
Directory     Size      Current Status
--------------------------------------------------------------------------------
mipmap-xxxhdpi  192x192   [EXISTS] ic_launcher.png
mipmap-xxhdpi   144x144   [EXISTS] ic_launcher.png
mipmap-xhdpi    96x96     [EXISTS] ic_launcher.png
mipmap-hdpi     72x72     [EXISTS] ic_launcher.png
mipmap-mdpi     48x48     [EXISTS] ic_launcher.png
--------------------------------------------------------------------------------

Splash Screen:
--------------------------------------------------------------------------------
Platform      Size          Notes
--------------------------------------------------------------------------------
iOS           2732x2732     [EXISTS] Centered, teal background
Android       Various       [EXISTS] Splash images in drawable-*
--------------------------------------------------------------------------------

Brand Colors:
--------------------------------------------------------------------------------
Primary Teal: #14b8a6
Background:   #14b8a6 (splash screen)
--------------------------------------------------------------------------------

================================================================================
                          Generation Commands
================================================================================

Option 1: Use Capacitor Assets (Recommended)
--------------------------------------------------------------------------------
1. Create assets/icon.png (1024x1024) with your logo
2. Create assets/splash.png (2732x2732) with centered logo on teal
3. Run:
   npm install --save-dev @capacitor/assets
   npx @capacitor/assets generate --iconBackgroundColor '#14b8a6' --splashBackgroundColor '#14b8a6'

Option 2: Manual Creation
--------------------------------------------------------------------------------
1. Design 1024x1024 icon in your preferred tool
2. Use online resizers to generate all sizes
3. Replace files in:
   - ios/App/App/Assets.xcassets/AppIcon.appiconset/
   - android/app/src/main/res/mipmap-*/

================================================================================
                          Current Placeholder Status
================================================================================

The current icons are Capacitor's default placeholders.
They work for development but should be replaced before store submission.

Design Recommendations for TODOOO:
- Include a checkmark or task-list visual element
- Use teal (#14b8a6) as primary color
- Keep design simple for small sizes (recognizable at 48x48)
- Consider adaptive icon for Android 8+ (foreground + background)

================================================================================
`);
