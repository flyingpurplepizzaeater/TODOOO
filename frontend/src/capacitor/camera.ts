/**
 * Camera capture service for adding photos to canvas.
 *
 * CONTEXT.md requirements:
 * - Camera: Yes - capture photos directly to canvas
 *
 * Uses Capacitor Camera plugin with native UI on iOS/Android.
 * Falls back to PWA camera on web (requires @ionic/pwa-elements).
 */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Editor } from 'tldraw';
import { isNativePlatform } from './platform';

/**
 * Capture a photo and add it to the tldraw canvas.
 *
 * Opens native camera on iOS/Android, PWA camera picker on web.
 * Creates an image shape at center of current viewport.
 *
 * @param editor - tldraw Editor instance
 * @param boardId - Current board ID (for asset upload)
 * @param token - Auth token for API calls
 * @param uploadImage - Function to upload image to storage
 */
export async function capturePhotoToCanvas(
  editor: Editor,
  boardId: string,
  token: string,
  uploadImage: (file: File, boardId: string, token: string) => Promise<string | null>
): Promise<boolean> {
  try {
    // Request camera permission and take photo
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 2048,  // Limit resolution for memory (RESEARCH.md Pitfall 2)
      height: 2048,
    });

    if (!photo.base64String) {
      console.warn('[Camera] No image data returned');
      return false;
    }

    // Convert base64 to File
    const file = base64ToFile(photo.base64String, photo.format || 'jpeg');

    // Upload via existing asset store
    const assetUrl = await uploadImage(file, boardId, token);
    if (!assetUrl) {
      console.error('[Camera] Failed to upload photo');
      return false;
    }

    // Create image shape at viewport center
    const { x, y } = editor.getViewportScreenCenter();
    const point = editor.screenToPage({ x, y });

    // Get image dimensions (approximate from typical photo aspect ratio)
    const img = new Image();
    img.src = `data:image/${photo.format || 'jpeg'};base64,${photo.base64String}`;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    const width = Math.min(img.width || 400, 600);  // Max 600px display width
    const height = img.height ? (width / img.width) * img.height : width * 0.75;

    editor.createShape({
      type: 'image',
      x: point.x - width / 2,
      y: point.y - height / 2,
      props: {
        w: width,
        h: height,
        assetId: assetUrl,  // Reference to uploaded asset
      },
    });

    console.log('[Camera] Photo added to canvas');
    return true;
  } catch (error) {
    // User cancelled or permission denied
    if ((error as Error).message?.includes('User cancelled')) {
      console.log('[Camera] User cancelled photo capture');
      return false;
    }
    console.error('[Camera] Error capturing photo:', error);
    return false;
  }
}

/**
 * Check camera permission status.
 */
export async function checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const result = await Camera.checkPermissions();
    return result.camera;
  } catch {
    return 'prompt';
  }
}

/**
 * Request camera permission.
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const result = await Camera.requestPermissions();
    return result.camera === 'granted';
  } catch {
    return false;
  }
}

/**
 * Helper to convert base64 to File.
 */
function base64ToFile(base64: string, format: string): File {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const mimeType = `image/${format}`;
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], `photo_${Date.now()}.${format}`, { type: mimeType });
}
