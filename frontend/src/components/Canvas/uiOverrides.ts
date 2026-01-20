import { TLUiOverrides, TLUiActionsContextType, TLUiToolsContextType } from 'tldraw'

/**
 * UI overrides for CollabBoard canvas.
 *
 * User requirements (from 02-CONTEXT.md):
 * - Standard: Ctrl+Z/Y, Delete, Ctrl+A, Ctrl+C/V, Space to pan
 * - Extended: number keys for tools, bracket keys for zoom
 * - Delete via Delete/Backspace key
 *
 * tldraw already provides most standard shortcuts. We customize:
 * - Bracket keys [ ] for zoom in/out
 * - Number keys 1-5 for common tools
 */
export const uiOverrides: TLUiOverrides = {
  actions(_editor, actions): TLUiActionsContextType {
    return {
      ...actions,
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
