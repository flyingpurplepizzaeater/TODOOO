import type { Editor } from 'tldraw'

/**
 * Cascade offset in pixels for batch image uploads.
 * Creates a stacked cards effect when multiple images are uploaded.
 */
const CASCADE_OFFSET = 40

/**
 * Handle file upload via toolbar button.
 *
 * Opens a file picker dialog allowing the user to select one or more images.
 * Selected images are placed at the viewport center with a cascade offset
 * for batch uploads (stacked cards effect).
 *
 * NOTE: This function only handles toolbar-initiated uploads.
 * tldraw automatically handles:
 * - Drag-drop onto canvas (when TLAssetStore is provided)
 * - Paste from clipboard (when TLAssetStore is provided)
 *
 * @param editor - tldraw Editor instance
 */
export function handleFileUpload(editor: Editor): void {
  // Create hidden file input element
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.style.display = 'none'

  input.onchange = async () => {
    if (!input.files || input.files.length === 0) {
      // Clean up and exit if no files selected
      input.remove()
      return
    }

    // Get viewport center for image placement
    const center = editor.getViewportPageBounds().center

    // Process each file with cascade offset
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i]

      // Let tldraw handle the upload via TLAssetStore
      await editor.putExternalContent({
        type: 'files',
        files: [file],
        point: {
          x: center.x + i * CASCADE_OFFSET,
          y: center.y + i * CASCADE_OFFSET,
        },
        ignoreParent: false,
      })
    }

    // Clean up input element
    input.remove()
  }

  // Also clean up if dialog is cancelled
  input.oncancel = () => {
    input.remove()
  }

  // Append to body (required for some browsers) and trigger file picker
  document.body.appendChild(input)
  input.click()
}
