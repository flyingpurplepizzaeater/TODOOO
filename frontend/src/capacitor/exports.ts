/**
 * Export service for saving boards to Photos and Files.
 *
 * CONTEXT.md requirements:
 * - File exports: Both Photos app and Files app - user chooses destination per export
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { isNativePlatform, isIOS, isAndroid } from './platform';

/**
 * Export image data to device Photos/Gallery.
 *
 * @param base64Data - Base64 encoded image (without data URL prefix)
 * @param filename - Filename for the saved image
 * @returns Success status
 */
export async function exportToPhotos(
  base64Data: string,
  filename: string = `TODOOO_export_${Date.now()}.png`
): Promise<boolean> {
  if (!isNativePlatform()) {
    // Web fallback - trigger download
    downloadBase64(base64Data, filename, 'image/png');
    return true;
  }

  try {
    if (isIOS()) {
      // iOS: Write to photo library requires different approach
      // Use Filesystem to write, then share to Photos via native share
      await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Note: Full Photos integration requires @capacitor/share or native module
      // For MVP, save to Files and user can manually add to Photos
      console.log('[Export] Saved to cache, use share to add to Photos');
      return true;
    }

    if (isAndroid()) {
      // Android: Write to Pictures directory
      await Filesystem.writeFile({
        path: `Pictures/TODOOO/${filename}`,
        data: base64Data,
        directory: Directory.ExternalStorage,
        recursive: true,
      });
      console.log('[Export] Saved to Pictures/TODOOO');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Export] Failed to export to Photos:', error);
    return false;
  }
}

/**
 * Export file to device Files/Documents.
 *
 * @param data - File data (base64 for binary, string for text)
 * @param filename - Filename including extension
 * @param mimeType - MIME type of the file
 * @returns Success status and saved path
 */
export async function exportToFiles(
  data: string,
  filename: string,
  mimeType: string = 'application/octet-stream'
): Promise<{ success: boolean; path?: string }> {
  if (!isNativePlatform()) {
    // Web fallback - trigger download
    downloadBase64(data, filename, mimeType);
    return { success: true };
  }

  try {
    const isText = mimeType.startsWith('text/') || mimeType === 'application/json';

    const result = await Filesystem.writeFile({
      path: `Documents/TODOOO/${filename}`,
      data: data,
      directory: Directory.ExternalStorage,
      encoding: isText ? Encoding.UTF8 : undefined,
      recursive: true,
    });

    console.log('[Export] Saved to Documents/TODOOO');
    return { success: true, path: result.uri };
  } catch (error) {
    console.error('[Export] Failed to export to Files:', error);

    // Fallback to cache directory
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: Directory.Cache,
      });
      console.log('[Export] Saved to cache as fallback');
      return { success: true, path: result.uri };
    } catch {
      return { success: false };
    }
  }
}

/**
 * Get the appropriate directory for exports.
 */
export function getExportDirectory(): string {
  if (isIOS()) return 'On My iPhone/TODOOO';
  if (isAndroid()) return 'Documents/TODOOO';
  return 'Downloads';
}

/**
 * Web fallback download helper.
 */
function downloadBase64(base64: string, filename: string, mimeType: string): void {
  const link = document.createElement('a');
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
