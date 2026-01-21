/**
 * Note color persistence for tldraw sticky notes
 *
 * Persists the last-used sticky note color to localStorage so the user's
 * preference survives browser sessions. tldraw's stylesForNextShape doesn't
 * persist across sessions by default.
 *
 * @module noteColorPersistence
 */

import { Editor, DefaultColorStyle } from 'tldraw'

/**
 * localStorage key for persisting note color preference.
 */
export const NOTE_COLOR_KEY = 'collabboard:note-color'

/**
 * Default note color when no preference is saved.
 * Classic Post-it yellow for familiarity.
 */
export const DEFAULT_NOTE_COLOR = 'yellow'

/**
 * Save the selected note color to localStorage.
 *
 * @param color - The color key (e.g., 'yellow', 'light-red', 'light-blue')
 */
export function saveNoteColor(color: string): void {
  try {
    localStorage.setItem(NOTE_COLOR_KEY, color)
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
    // Fail silently - color persistence is non-critical
  }
}

/**
 * Restore the last-used note color from localStorage.
 *
 * Applies the saved color preference to the editor's stylesForNextShape
 * so the next note created will use the remembered color.
 *
 * @param editor - The tldraw Editor instance
 */
export function restoreNoteColor(editor: Editor): void {
  try {
    const savedColor = localStorage.getItem(NOTE_COLOR_KEY)
    if (savedColor) {
      editor.setStyleForNextShapes(DefaultColorStyle, savedColor)
    }
  } catch {
    // localStorage may be unavailable
    // Fail silently - user gets default color
  }
}

/**
 * Create a listener that persists note color changes to localStorage.
 *
 * Watches the editor's instance state for changes to stylesForNextShape.
 * When the user selects a different color (for notes or any shape), we
 * persist it so the next session remembers the preference.
 *
 * @param editor - The tldraw Editor instance
 * @returns Unsubscribe function to stop listening
 */
export function createNoteColorListener(editor: Editor): () => void {
  return editor.store.listen(
    (entry) => {
      // Check for instance state updates
      // Cast to access instance_state key which holds editor preferences
      const updated = entry.changes.updated as Record<string, [unknown, unknown]>
      const instanceUpdate = updated['instance:instance_state']
      if (instanceUpdate) {
        // instanceUpdate is [oldValue, newValue]
        const newState = instanceUpdate[1] as { stylesForNextShape?: Record<string, string> } | null
        if (newState?.stylesForNextShape) {
          const colorKey = newState.stylesForNextShape['tldraw:color']
          if (colorKey) {
            saveNoteColor(colorKey)
          }
        }
      }
    },
    { source: 'user' }
  )
}
