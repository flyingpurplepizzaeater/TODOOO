/**
 * Offline board caching service.
 *
 * CONTEXT.md requirements:
 * - Cold start offline: Show cached boards (last-viewed boards available)
 * - Cache size: Last 10 boards
 *
 * Uses Capacitor Filesystem for data storage and Preferences for metadata.
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform';

const MAX_CACHED_BOARDS = 10;
const CACHE_KEY = 'cached-boards';
const BOARDS_DIR = 'boards';

/**
 * Metadata for a cached board.
 */
export interface CachedBoardMeta {
  boardId: string;
  name: string;
  lastViewed: number;
}

/**
 * Cache a board's Y.Doc state for offline access.
 *
 * @param boardId - Board UUID
 * @param name - Board display name
 * @param yjsState - Y.Doc state as Uint8Array
 */
export async function cacheBoard(
  boardId: string,
  name: string,
  yjsState: Uint8Array
): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // Get current cache list
    const { value } = await Preferences.get({ key: CACHE_KEY });
    const boards: CachedBoardMeta[] = value ? JSON.parse(value) : [];

    // Remove if exists (to update position)
    const filtered = boards.filter(b => b.boardId !== boardId);

    // Add to front (most recent)
    filtered.unshift({
      boardId,
      name,
      lastViewed: Date.now(),
    });

    // Keep only MAX_CACHED_BOARDS
    const trimmed = filtered.slice(0, MAX_CACHED_BOARDS);

    // Remove old boards from filesystem if over limit
    const removedIds = boards
      .slice(MAX_CACHED_BOARDS)
      .map(b => b.boardId);
    for (const id of removedIds) {
      try {
        await Filesystem.deleteFile({
          path: `${BOARDS_DIR}/${id}.json`,
          directory: Directory.Data,
        });
      } catch {
        // Ignore deletion errors
      }
    }

    // Save metadata list
    await Preferences.set({
      key: CACHE_KEY,
      value: JSON.stringify(trimmed),
    });

    // Convert Uint8Array to base64
    const base64 = uint8ArrayToBase64(yjsState);

    // Ensure directory exists
    try {
      await Filesystem.mkdir({
        path: BOARDS_DIR,
        directory: Directory.Data,
        recursive: true,
      });
    } catch {
      // Directory might already exist
    }

    // Save board state to filesystem
    await Filesystem.writeFile({
      path: `${BOARDS_DIR}/${boardId}.json`,
      data: JSON.stringify({ yjsState: base64 }),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    console.log(`[Offline] Cached board ${boardId}`);
  } catch (error) {
    console.error('[Offline] Failed to cache board:', error);
  }
}

/**
 * Get cached board state for offline loading.
 *
 * @param boardId - Board UUID
 * @returns Y.Doc state as Uint8Array, or null if not cached
 */
export async function getCachedBoard(boardId: string): Promise<Uint8Array | null> {
  if (!isNativePlatform()) return null;

  try {
    const result = await Filesystem.readFile({
      path: `${BOARDS_DIR}/${boardId}.json`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    const data = JSON.parse(result.data as string) as { yjsState: string };
    return base64ToUint8Array(data.yjsState);
  } catch {
    return null;
  }
}

/**
 * Get list of cached boards (metadata only).
 *
 * @returns Array of cached board metadata, most recent first
 */
export async function getCachedBoardList(): Promise<CachedBoardMeta[]> {
  if (!isNativePlatform()) return [];

  try {
    const { value } = await Preferences.get({ key: CACHE_KEY });
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a board is cached.
 */
export async function isBoardCached(boardId: string): Promise<boolean> {
  const list = await getCachedBoardList();
  return list.some(b => b.boardId === boardId);
}

/**
 * Clear all cached boards.
 */
export async function clearCache(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const boards = await getCachedBoardList();
    for (const board of boards) {
      try {
        await Filesystem.deleteFile({
          path: `${BOARDS_DIR}/${board.boardId}.json`,
          directory: Directory.Data,
        });
      } catch {
        // Ignore
      }
    }
    await Preferences.remove({ key: CACHE_KEY });
  } catch (error) {
    console.error('[Offline] Failed to clear cache:', error);
  }
}

// Utility functions for base64 conversion
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
