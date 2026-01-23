/**
 * App lifecycle handlers for Capacitor mobile apps.
 *
 * Handles WebSocket reconnection when app returns from background.
 * Mobile OS suspends WebView when backgrounded, killing WebSocket connections.
 *
 * RESEARCH.md Pitfall 1: WebSocket Disconnection on Background
 * Solution: Listen for appStateChange and resume events, reconnect provider.
 */
import { App, type AppState } from '@capacitor/app';
import { isNativePlatform } from './platform';
import type { WebsocketProvider } from 'y-websocket';

// Store cleanup functions for removal
let appStateListener: (() => void) | null = null;
let resumeListener: (() => void) | null = null;
let backButtonListener: (() => void) | null = null;

// Current provider reference
let currentProvider: WebsocketProvider | null = null;

/**
 * Initialize app lifecycle handlers for WebSocket reconnection.
 *
 * Call this after WebSocket provider is created, typically in useYjsStore.
 *
 * @param provider - y-websocket provider instance
 */
export async function initAppLifecycle(provider: WebsocketProvider): Promise<void> {
  // Only set up native listeners on Capacitor platforms
  if (!isNativePlatform()) return;

  currentProvider = provider;

  // Handle app state changes (foreground/background)
  const stateHandle = await App.addListener('appStateChange', (state: AppState) => {
    if (state.isActive && currentProvider) {
      // App returned to foreground - reconnect if disconnected
      if (!currentProvider.wsconnected) {
        console.log('[Lifecycle] App resumed, reconnecting WebSocket...');
        currentProvider.connect();
      }
    }
  });
  appStateListener = () => stateHandle.remove();

  // Handle explicit resume event (more reliable on some devices)
  const resumeHandle = await App.addListener('resume', () => {
    if (currentProvider && !currentProvider.wsconnected) {
      console.log('[Lifecycle] Resume event, reconnecting WebSocket...');
      currentProvider.connect();
    }
  });
  resumeListener = () => resumeHandle.remove();

  // Handle Android back button
  // RESEARCH.md Pitfall 3: Android Back Button Closes App
  const backHandle = await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // At root - could show "press again to exit" toast
      // For now, let default behavior exit the app
    }
  });
  backButtonListener = () => backHandle.remove();
}

/**
 * Update the provider reference when it changes.
 * Call when reconnecting with a new provider instance.
 */
export function updateProvider(provider: WebsocketProvider): void {
  currentProvider = provider;
}

/**
 * Clean up lifecycle listeners.
 * Call on component unmount or when changing boards.
 */
export function cleanupAppLifecycle(): void {
  appStateListener?.();
  resumeListener?.();
  backButtonListener?.();
  appStateListener = null;
  resumeListener = null;
  backButtonListener = null;
  currentProvider = null;
}
