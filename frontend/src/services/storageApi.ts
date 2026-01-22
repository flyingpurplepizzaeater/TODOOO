import { config } from '../config'

/**
 * Response from presigned URL endpoint.
 */
export interface UploadUrlResponse {
  uploadUrl: string
  assetUrl: string
}

/**
 * Error thrown when storage API request fails.
 */
export class StorageApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'StorageApiError'
    this.status = status
    this.details = details
  }
}

/**
 * Request a presigned URL for uploading a file to storage.
 *
 * @param boardId - ID of the board to upload the file to
 * @param filename - Name of the file being uploaded
 * @param contentType - MIME type of the file (e.g., 'image/png')
 * @param token - JWT authentication token
 * @returns Presigned upload URL and final asset URL
 */
export async function requestUploadUrl(
  boardId: string,
  filename: string,
  contentType: string,
  token: string
): Promise<UploadUrlResponse> {
  const response = await fetch(`${config.apiUrl}/boards/${boardId}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename,
      contentType,
    }),
  })

  if (!response.ok) {
    let errorMessage = `Upload URL request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.detail || errorBody.message || errorMessage
    } catch {
      // Response body not JSON
    }
    throw new StorageApiError(errorMessage, response.status)
  }

  return response.json()
}

/**
 * Upload a file directly to storage using a presigned URL.
 *
 * @param uploadUrl - Presigned URL for PUT request
 * @param file - File to upload
 * @returns void (throws on error)
 */
export async function uploadFile(
  uploadUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  if (!response.ok) {
    throw new StorageApiError(
      `File upload failed with status ${response.status}`,
      response.status
    )
  }
}
