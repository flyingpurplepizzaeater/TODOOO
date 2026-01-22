/**
 * Platform detection utilities for Capacitor mobile apps.
 *
 * Use these helpers to conditionally enable mobile-specific features
 * or adjust behavior based on platform.
 */
import { Capacitor } from '@capacitor/core';

/**
 * Returns true if running inside a native Capacitor app (iOS or Android).
 * Returns false for web browser, including mobile browsers.
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns true if the platform is iOS (native app).
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Returns true if the platform is Android (native app).
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Returns true if running on a mobile device (native app OR mobile browser).
 * Uses touch capability as fallback for mobile browser detection.
 */
export function isMobileDevice(): boolean {
  if (isNativePlatform()) return true;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Alias for isNativePlatform - clearer name for mobile app checks.
 */
export const isMobileApp = isNativePlatform;

/**
 * Returns the current platform name: 'ios', 'android', or 'web'.
 */
export function getPlatformName(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}
