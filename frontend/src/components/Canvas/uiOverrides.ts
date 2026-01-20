import { TLUiOverrides, TLUiActionsContextType, TLUiToolsContextType } from 'tldraw'

/**
 * Create UI overrides with custom undo/redo handlers.
 *
 * We override tldraw's default undo/redo to use Yjs UndoManager,
 * which provides per-user undo history (CANV-04 requirement).
 *
 * User requirements (from 02-CONTEXT.md):
 * - Standard: Ctrl+Z/Y, Delete, Ctrl+A, Ctrl+C/V, Space to pan
 * - Extended: number keys for tools, bracket keys for zoom
 * - Delete via Delete/Backspace key
 *
 * @param customUndo - Per-user undo function from Yjs UndoManager
 * @param customRedo - Per-user redo function from Yjs UndoManager
 */
export function createUiOverrides(
  customUndo: () => void,
  customRedo: () => void
): TLUiOverrides {
  return {
    actions(_editor, actions): TLUiActionsContextType {
      return {
        ...actions,
        // Override undo to use per-user Yjs UndoManager
        undo: {
          ...actions.undo,
          onSelect: () => {
            customUndo()
          },
        },
        // Override redo to use per-user Yjs UndoManager
        redo: {
          ...actions.redo,
          onSelect: () => {
            customRedo()
          },
        },
        // Bracket keys for zoom (in addition to +/- which tldraw provides)
        'zoom-in': {
          ...actions['zoom-in'],
          kbd: ']=,shift+=', // ] and = (same key, shift for +)
        },
        'zoom-out': {
          ...actions['zoom-out'],
          kbd: '[-', // [ and -
        },
      }
    },

    tools(_editor, tools): TLUiToolsContextType {
      return {
        ...tools,
        // Number keys for tools (1=select, 2=draw, 3=eraser, 4=arrow, 5=rectangle)
        // Note: These will be useful in Phase 3 when drawing tools are enabled
        select: { ...tools.select, kbd: '1,v' },
        draw: { ...tools.draw, kbd: '2,p' },
        eraser: { ...tools.eraser, kbd: '3,e' },
        arrow: { ...tools.arrow, kbd: '4,a' },
        geo: { ...tools.geo, kbd: '5,r' },
      }
    },
  }
}

/**
 * Fallback static overrides (without custom undo/redo).
 * Use createUiOverrides() instead for per-user undo support.
 */
export const uiOverrides: TLUiOverrides = createUiOverrides(
  () => console.warn('Undo not connected to UndoManager'),
  () => console.warn('Redo not connected to UndoManager')
)

/**
 * Default shortcuts provided by tldraw (no override needed):
 *
 * Navigation:
 * - Space + drag: Pan canvas
 * - Scroll wheel (with our Ctrl requirement): Zoom
 * - Ctrl+0: Zoom to 100%
 * - Ctrl+1: Zoom to fit
 * - Ctrl+2: Zoom to selection
 *
 * Selection & Editing:
 * - Ctrl+A: Select all
 * - Ctrl+C: Copy
 * - Ctrl+V: Paste
 * - Ctrl+X: Cut
 * - Ctrl+D: Duplicate
 * - Delete/Backspace: Delete selected
 * - Escape: Deselect / cancel
 *
 * History:
 * - Ctrl+Z: Undo
 * - Ctrl+Shift+Z / Ctrl+Y: Redo
 *
 * Multi-select:
 * - Shift+click: Add to selection
 * - Click empty: Deselect all
 */
