/**
 * Splash screen controller.
 *
 * CONTEXT.md requirements:
 * - Splash screen: Animated loading animation (brief, e.g., checkmark drawing)
 *
 * Implementation approach per RESEARCH.md:
 * - Native splash hides immediately (launchShowDuration: 0)
 * - Web-based animation shows on top
 * - Animation completes, then hides
 *
 * This avoids fighting native splash limitations and provides
 * smooth animated experience on both platforms.
 */
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativePlatform } from './platform';

/**
 * Hide the native splash screen.
 * Call this after web animation completes.
 */
export async function hideSplash(): Promise<void> {
  if (isNativePlatform()) {
    await SplashScreen.hide();
  }
}

/**
 * Show the native splash screen (rarely needed).
 */
export async function showSplash(): Promise<void> {
  if (isNativePlatform()) {
    await SplashScreen.show();
  }
}
