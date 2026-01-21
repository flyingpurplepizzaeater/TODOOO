/**
 * Style configuration for tldraw
 *
 * Customizes stroke widths, color palette, and sticky note colors for the canvas.
 * MUST be called BEFORE any Tldraw component mounts.
 *
 * @module styleConfig
 */

import { STROKE_SIZES, DefaultColorThemePalette } from 'tldraw'

/**
 * Configure global tldraw styles.
 *
 * Stroke widths:
 * - s (thin):   2px
 * - m (medium): 6px
 * - l (thick):  12px
 * - xl (extra): 18px
 *
 * Color palette: 13 colors combining professional and vibrant options.
 *
 * @example
 * ```typescript
 * // In main.tsx, BEFORE React imports:
 * import { configureStyles } from './components/Canvas/styleConfig'
 * configureStyles()
 * ```
 */
export function configureStyles(): void {
  // =============================================================
  // Stroke Widths
  // Per CONTEXT.md: ~2/~6/~12px (thin/medium/thick)
  // =============================================================
  STROKE_SIZES.s = 2   // thin
  STROKE_SIZES.m = 6   // medium
  STROKE_SIZES.l = 12  // thick
  STROKE_SIZES.xl = 18 // extra thick (bonus option)

  // =============================================================
  // Color Palette - Light Mode
  // 13 colors: Professional + vibrant saturated options
  // =============================================================

  // Professional colors
  DefaultColorThemePalette.lightMode.black.solid = '#1a1a2e'    // dark navy-black
  DefaultColorThemePalette.lightMode.grey.solid = '#6b7280'     // neutral grey
  DefaultColorThemePalette.lightMode.white.solid = '#ffffff'    // pure white
  DefaultColorThemePalette.lightMode.blue.solid = '#2563eb'     // royal blue
  DefaultColorThemePalette.lightMode.red.solid = '#dc2626'      // standard red
  DefaultColorThemePalette.lightMode.green.solid = '#16a34a'    // forest green

  // Vibrant saturated colors
  DefaultColorThemePalette.lightMode.orange.solid = '#f97316'   // bright orange
  DefaultColorThemePalette.lightMode.yellow.solid = '#eab308'   // golden yellow
  DefaultColorThemePalette.lightMode.violet.solid = '#8b5cf6'   // purple

  // Additional palette colors (reusing light-* slots)
  DefaultColorThemePalette.lightMode['light-blue'].solid = '#06b6d4'   // cyan/teal
  DefaultColorThemePalette.lightMode['light-green'].solid = '#84cc16'  // lime green
  DefaultColorThemePalette.lightMode['light-red'].solid = '#ec4899'    // pink/magenta
  DefaultColorThemePalette.lightMode['light-violet'].solid = '#a855f7' // lighter purple

  // =============================================================
  // Color Palette - Dark Mode (mirror changes for consistency)
  // =============================================================

  // Professional colors
  DefaultColorThemePalette.darkMode.black.solid = '#1a1a2e'
  DefaultColorThemePalette.darkMode.grey.solid = '#9ca3af'      // slightly lighter for dark mode
  DefaultColorThemePalette.darkMode.white.solid = '#ffffff'
  DefaultColorThemePalette.darkMode.blue.solid = '#3b82f6'      // slightly brighter for dark mode
  DefaultColorThemePalette.darkMode.red.solid = '#ef4444'       // slightly brighter for dark mode
  DefaultColorThemePalette.darkMode.green.solid = '#22c55e'     // slightly brighter for dark mode

  // Vibrant saturated colors
  DefaultColorThemePalette.darkMode.orange.solid = '#fb923c'    // slightly brighter
  DefaultColorThemePalette.darkMode.yellow.solid = '#facc15'    // slightly brighter
  DefaultColorThemePalette.darkMode.violet.solid = '#a78bfa'    // slightly brighter

  // Additional palette colors
  DefaultColorThemePalette.darkMode['light-blue'].solid = '#22d3ee'   // brighter cyan
  DefaultColorThemePalette.darkMode['light-green'].solid = '#a3e635'  // brighter lime
  DefaultColorThemePalette.darkMode['light-red'].solid = '#f472b6'    // brighter pink
  DefaultColorThemePalette.darkMode['light-violet'].solid = '#c084fc' // brighter purple

  // =============================================================
  // Sticky Note Colors - Light Mode
  // 8 colors for Post-it style notes per CONTEXT.md
  // =============================================================

  // Classic Post-it yellow (default)
  DefaultColorThemePalette.lightMode.yellow.noteFill = '#FEF3C7'
  DefaultColorThemePalette.lightMode.yellow.noteText = '#1a1a2e'

  // Pink (light-red slot)
  DefaultColorThemePalette.lightMode['light-red'].noteFill = '#FECACA'
  DefaultColorThemePalette.lightMode['light-red'].noteText = '#1a1a2e'

  // Sky blue (light-blue slot)
  DefaultColorThemePalette.lightMode['light-blue'].noteFill = '#BFDBFE'
  DefaultColorThemePalette.lightMode['light-blue'].noteText = '#1a1a2e'

  // Mint green (light-green slot)
  DefaultColorThemePalette.lightMode['light-green'].noteFill = '#BBF7D0'
  DefaultColorThemePalette.lightMode['light-green'].noteText = '#1a1a2e'

  // Peach orange
  DefaultColorThemePalette.lightMode.orange.noteFill = '#FED7AA'
  DefaultColorThemePalette.lightMode.orange.noteText = '#1a1a2e'

  // Purple (violet slot)
  DefaultColorThemePalette.lightMode.violet.noteFill = '#DDD6FE'
  DefaultColorThemePalette.lightMode.violet.noteText = '#1a1a2e'

  // Lavender (light-violet slot)
  DefaultColorThemePalette.lightMode['light-violet'].noteFill = '#E9D5FF'
  DefaultColorThemePalette.lightMode['light-violet'].noteText = '#1a1a2e'

  // Plain white
  DefaultColorThemePalette.lightMode.white.noteFill = '#FFFFFF'
  DefaultColorThemePalette.lightMode.white.noteText = '#1a1a2e'

  // =============================================================
  // Sticky Note Colors - Dark Mode
  // Slightly brighter for visibility on dark backgrounds
  // =============================================================

  // Classic Post-it yellow (default)
  DefaultColorThemePalette.darkMode.yellow.noteFill = '#FEF9C3'
  DefaultColorThemePalette.darkMode.yellow.noteText = '#1a1a2e'

  // Pink (light-red slot)
  DefaultColorThemePalette.darkMode['light-red'].noteFill = '#FECDD3'
  DefaultColorThemePalette.darkMode['light-red'].noteText = '#1a1a2e'

  // Sky blue (light-blue slot)
  DefaultColorThemePalette.darkMode['light-blue'].noteFill = '#DBEAFE'
  DefaultColorThemePalette.darkMode['light-blue'].noteText = '#1a1a2e'

  // Mint green (light-green slot)
  DefaultColorThemePalette.darkMode['light-green'].noteFill = '#D1FAE5'
  DefaultColorThemePalette.darkMode['light-green'].noteText = '#1a1a2e'

  // Peach orange
  DefaultColorThemePalette.darkMode.orange.noteFill = '#FFEDD5'
  DefaultColorThemePalette.darkMode.orange.noteText = '#1a1a2e'

  // Purple (violet slot)
  DefaultColorThemePalette.darkMode.violet.noteFill = '#EDE9FE'
  DefaultColorThemePalette.darkMode.violet.noteText = '#1a1a2e'

  // Lavender (light-violet slot)
  DefaultColorThemePalette.darkMode['light-violet'].noteFill = '#F3E8FF'
  DefaultColorThemePalette.darkMode['light-violet'].noteText = '#1a1a2e'

  // Plain white
  DefaultColorThemePalette.darkMode.white.noteFill = '#FFFFFF'
  DefaultColorThemePalette.darkMode.white.noteText = '#1a1a2e'
}
