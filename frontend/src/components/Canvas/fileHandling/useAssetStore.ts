import type { TLAssetStore } from 'tldraw'
import { requestUploadUrl, uploadFile } from '../../../services/storageApi'

/**
 * Create a TLAssetStore implementation for MinIO storage.
 *
 * This enables persistent image storage for tldraw. When a user
 * adds an image to the canvas (via paste, drag-drop, or file picker),
 * tldraw calls upload() to store the file. The returned URL is stored
 * in the asset record and resolved via resolve() when rendering.
 *
 * Without this, images only exist in memory and won't sync to
 * collaborators or persist across page reloads.
 *
 * @param boardId - ID of the board for organizing uploads
 * @param token - JWT authentication token for API requests
 * @returns TLAssetStore compatible with tldraw's assets prop
 */
export function createAssetStore(boardId: string, token: string): TLAssetStore {
  return {
    /**
     * Upload a file to MinIO storage.
     *
     * Called by tldraw when user adds an image to the canvas.
     * The returned src URL is stored in the asset record.
     *
     * @param _asset - Asset metadata (not needed for upload, we use file info)
     * @param file - The file to upload
     */
    async upload(_asset, file) {
      // Request presigned URL from backend
      const { uploadUrl, assetUrl } = await requestUploadUrl(
        boardId,
        file.name,
        file.type,
        token
      )

      // Upload file directly to MinIO via presigned URL
      await uploadFile(uploadUrl, file)

      // Return permanent URL for storage in tldraw record
      return { src: assetUrl }
    },

    /**
     * Resolve an asset URL for rendering.
     *
     * Since we store the full MinIO URL in asset.props.src,
     * we just return it as-is.
     *
     * @param asset - Asset with props.src containing the URL
     */
    resolve(asset) {
      return asset.props.src
    },
  }
}
