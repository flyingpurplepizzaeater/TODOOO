# Phase 3: Drawing Tools - Research

**Researched:** 2026-01-20
**Domain:** tldraw drawing tools, styles, and UI customization
**Confidence:** HIGH

## Summary

tldraw v4.2.3 provides comprehensive built-in drawing tools that align well with Phase 3 requirements. The draw tool (pen), highlight tool (marker), eraser, and geo shapes (rectangle, circle/ellipse, line, arrow) are all native features. The main implementation work involves:

1. **Customizing stroke widths** - tldraw's defaults (1/2/4/8px) need adjustment to match the ~2/~6/~12px decision
2. **Color palette configuration** - tldraw provides 13 default colors; we'll remap these to match the professional+vibrant palette
3. **Toolbar positioning** - Bottom-center requires custom positioning; mobile layout needs the `forceMobile` prop
4. **UI customization** - Auto-hide toolbar requires custom component implementation since tldraw doesn't provide this natively

**Primary recommendation:** Leverage tldraw's native tools and customize only the styling/presentation layer. The draw tool is the "pen," highlight tool is the "marker," and eraser already works on whole strokes. Pixel-level erasing is NOT available in tldraw and would require custom implementation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tldraw | ^4.2.3 | Canvas + drawing tools | Already in project, provides all core drawing features |
| perfect-freehand | (bundled) | Freehand stroke smoothing | Used internally by tldraw, created by tldraw author |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | - | tldraw is self-contained for drawing features |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tldraw highlight | Custom freehand | Highlight has semi-transparent rendering built-in |
| Custom eraser | tldraw eraser | tldraw only supports stroke erasing, not pixel erasing |

**Installation:**
```bash
# No new packages needed - tldraw already in project
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/components/Canvas/
├── Canvas.tsx           # Main tldraw wrapper (exists)
├── useYjsStore.ts       # Yjs sync (exists)
├── useUndoManager.ts    # Per-user undo (exists)
├── uiOverrides.ts       # Tool shortcuts (exists, extend)
├── styleConfig.ts       # NEW: Color/stroke customization
├── ToolbarWrapper.tsx   # NEW: Custom toolbar with auto-hide
└── cameraOptions.ts     # Zoom config (exists)
```

### Pattern 1: Global Style Configuration
**What:** Mutate tldraw's exported style constants before component mount
**When to use:** Changing stroke widths, font sizes, color palette values
**Example:**
```typescript
// Source: https://tldraw.dev/examples/custom-stroke-and-font-sizes
import { STROKE_SIZES, DefaultColorThemePalette } from 'tldraw'

// Must be called BEFORE Tldraw component mounts
// This affects ALL tldraw instances globally

// Customize stroke widths (~2/~6/~12px as decided)
STROKE_SIZES.s = 2   // thin
STROKE_SIZES.m = 6   // medium
STROKE_SIZES.l = 12  // thick
STROKE_SIZES.xl = 18 // extra-thick (bonus)

// Customize colors (example for black)
DefaultColorThemePalette.lightMode.black.solid = '#1a1a2e'
```

### Pattern 2: Editor API for Tool Selection
**What:** Use editor.setCurrentTool() and editor.setStyleForNextShapes()
**When to use:** Setting default tool on mount, programmatic tool switching
**Example:**
```typescript
// Source: https://tldraw.dev/docs/tools
import { Editor, DefaultColorStyle, GeoShapeGeoStyle } from 'tldraw'

const handleMount = (editor: Editor) => {
  // Set default tool to select (as decided in CONTEXT.md)
  editor.setCurrentTool('select')

  // Set default color for next shapes
  editor.setStyleForNextShapes(DefaultColorStyle, 'blue')

  // Set geo shape type for geo tool
  editor.setStyleForNextShapes(GeoShapeGeoStyle, 'rectangle')
}
```

### Pattern 3: Custom Toolbar Component
**What:** Use TLComponents to replace default toolbar with custom implementation
**When to use:** Bottom-center positioning, auto-hide behavior
**Example:**
```typescript
// Source: https://tldraw.dev/examples/vertical-toolbar
import { TLComponents, DefaultToolbar } from 'tldraw'

// For vertical/custom positioning
const components: TLComponents = {
  Toolbar: () => <DefaultToolbar orientation="vertical" />,
}

// For completely custom toolbar with auto-hide
const components: TLComponents = {
  Toolbar: CustomToolbarWithAutoHide,
}

<Tldraw components={components} />
```

### Pattern 4: UI Overrides for Shortcuts
**What:** Use overrides prop to customize keyboard shortcuts and actions
**When to use:** Number keys for tools, custom undo/redo (already implemented)
**Example:**
```typescript
// Source: existing uiOverrides.ts + https://tldraw.dev/examples/custom-menus
const overrides: TLUiOverrides = {
  tools(_editor, tools) {
    return {
      ...tools,
      draw: { ...tools.draw, kbd: '2,p,d,b,x' },      // pen shortcuts
      highlight: { ...tools.highlight, kbd: 'shift+d,m' }, // marker shortcut
      eraser: { ...tools.eraser, kbd: '3,e' },
      'geo-rectangle': { ...tools['geo-rectangle'], kbd: 'r' },
      'geo-ellipse': { ...tools['geo-ellipse'], kbd: 'o' },
    }
  }
}
```

### Anti-Patterns to Avoid
- **Modifying styles after mount:** Global style mutations must happen BEFORE Tldraw renders
- **Creating custom freehand implementation:** Use tldraw's draw tool + perfect-freehand
- **Fighting tldraw's tool state:** Work with the state machine, not against it
- **Hiding UI without providing alternatives:** If you hide the toolbar, ensure keyboard shortcuts work

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Freehand drawing | Custom canvas drawing | tldraw draw tool | Uses perfect-freehand with pressure simulation, smoothing |
| Shape hit testing | Manual geometry math | tldraw's built-in selection | Handles rotation, bounds, precise hit detection |
| Stroke smoothing | Custom smoothing algorithm | perfect-freehand options | Production-tested in Canva, Excalidraw, draw.io |
| Color picker UI | Custom picker component | tldraw StylePanel | Integrated with style system, accessibility built-in |
| Arrow routing | Bezier curve calculation | tldraw ArrowShapeUtil | Smart bindings, end detection, curve optimization |

**Key insight:** tldraw has spent years solving drawing tool edge cases. The highlight tool has "sandwich mode rendering," arrows have smart binding detection, and the eraser has proper hit testing. Custom implementations will miss these details.

## Common Pitfalls

### Pitfall 1: Pixel Eraser Expectation
**What goes wrong:** CONTEXT.md specifies "pixel eraser (portions)" but tldraw only supports stroke-based erasing
**Why it happens:** This is a requested feature in tldraw (Issue #6054, May 2025) but not implemented
**How to avoid:** Document that pixel erasing requires custom implementation; prioritize stroke eraser which works natively
**Warning signs:** User expectations vs. tldraw capabilities mismatch

### Pitfall 2: Style Mutations After Mount
**What goes wrong:** Colors/sizes don't change or affect only some shapes
**Why it happens:** tldraw reads style constants at initialization
**How to avoid:** Create styleConfig.ts that runs BEFORE any Tldraw component imports
**Warning signs:** Inconsistent styling between components

### Pitfall 3: Mobile Toolbar Position
**What goes wrong:** Toolbar covers content or is unreachable on mobile
**Why it happens:** Default tldraw toolbar positioning varies by breakpoint
**How to avoid:** Use `forceMobile` prop and custom toolbar component for consistent positioning
**Warning signs:** Different layouts between breakpoints

### Pitfall 4: Eraser Size Options
**What goes wrong:** Expecting eraser size configuration like brush sizes
**Why it happens:** tldraw eraser doesn't have size options - it erases whatever shapes it touches
**How to avoid:** Document limitation; eraser "size" is visual only (cursor size), not functional
**Warning signs:** UI implying eraser size affects erase area

### Pitfall 5: Line vs Arrow Confusion
**What goes wrong:** Using "line" tool when "arrow" is needed, or vice versa
**Why it happens:** tldraw has both LineShapeUtil and ArrowShapeUtil
**How to avoid:** LineShape is for multi-point lines with handles; ArrowShape is for directional arrows with bindings
**Warning signs:** Wrong tool exposed in UI

## Code Examples

Verified patterns from official sources:

### Setting Up Custom Stroke Widths
```typescript
// Source: https://tldraw.dev/examples/custom-stroke-and-font-sizes
// File: styleConfig.ts - MUST be imported before Tldraw component

import { STROKE_SIZES } from 'tldraw'

// Per CONTEXT.md: ~2/~6/~12px (thin/medium/thick)
export function configureStyles() {
  STROKE_SIZES.s = 2   // thin
  STROKE_SIZES.m = 6   // medium
  STROKE_SIZES.l = 12  // thick
  STROKE_SIZES.xl = 18 // extra thick (optional 4th option)
}

// Call this at app initialization, before any Tldraw renders
configureStyles()
```

### Setting Up Custom Color Palette
```typescript
// Source: https://tldraw.dev/examples/changing-default-colors
// File: styleConfig.ts

import { DefaultColorThemePalette } from 'tldraw'

// Per CONTEXT.md: Professional + vibrant saturated colors
// tldraw has 13 colors: black, grey, white, red, orange, yellow,
// green, blue, violet, light-blue, light-green, light-red, light-violet

export function configureColors() {
  // Professional colors (keeping close to defaults)
  DefaultColorThemePalette.lightMode.black.solid = '#1a1a2e'
  DefaultColorThemePalette.lightMode.blue.solid = '#2563eb'
  DefaultColorThemePalette.lightMode.red.solid = '#dc2626'
  DefaultColorThemePalette.lightMode.green.solid = '#16a34a'

  // Vibrant saturated options
  DefaultColorThemePalette.lightMode.orange.solid = '#f97316'
  DefaultColorThemePalette.lightMode.violet.solid = '#8b5cf6'
  DefaultColorThemePalette.lightMode.yellow.solid = '#eab308'

  // Additional palette colors (reusing light-* slots)
  DefaultColorThemePalette.lightMode['light-blue'].solid = '#06b6d4'  // cyan
  DefaultColorThemePalette.lightMode['light-green'].solid = '#84cc16' // lime
  DefaultColorThemePalette.lightMode['light-red'].solid = '#ec4899'   // pink
  DefaultColorThemePalette.lightMode['light-violet'].solid = '#a855f7' // purple

  // Note: Same changes needed for darkMode if supporting dark theme
}
```

### Tool IDs and Shortcuts Reference
```typescript
// Source: https://github.com/tldraw/tldraw/blob/main/packages/tldraw/src/lib/ui/hooks/useTools.tsx

// Built-in tool IDs:
// select, hand, eraser, draw, arrow, line, frame, text, asset, note, laser, highlight

// Geo shape tool IDs (use with editor.setCurrentTool('geo')):
// Then set GeoShapeGeoStyle for: rectangle, ellipse, triangle, diamond,
// pentagon, hexagon, octagon, star, rhombus, oval, trapezoid, cloud, heart,
// x-box, check-box, arrow-up, arrow-down, arrow-left, arrow-right

// Default shortcuts:
// d, b, x = draw    shift+d = highlight    e = eraser
// v = select        h = hand               a = arrow
// l = line          r = rectangle          o = ellipse
// t = text          f = frame              n = note
// k = laser
```

### Custom Toolbar with Auto-Hide
```typescript
// Source: https://tldraw.dev/examples/custom-ui + custom implementation
// File: ToolbarWrapper.tsx

import { useEditor, DefaultToolbar, TLComponents } from 'tldraw'
import { useState, useEffect } from 'react'

function AutoHideToolbar() {
  const editor = useEditor()
  const [visible, setVisible] = useState(true)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (pinned) return

    // Hide when actively drawing
    const unsubscribe = editor.store.listen(
      () => {
        const currentTool = editor.getCurrentToolId()
        const isDrawing = ['draw', 'highlight', 'eraser'].includes(currentTool)
        // Hide during active drawing strokes
        setVisible(!isDrawing || !editor.getIsPointerDown())
      },
      { source: 'user' }
    )

    return unsubscribe
  }, [editor, pinned])

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.2s',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <DefaultToolbar />
      <button onClick={() => setPinned(!pinned)}>
        {pinned ? 'Unpin' : 'Pin'}
      </button>
    </div>
  )
}

export const toolbarComponents: TLComponents = {
  Toolbar: AutoHideToolbar,
}
```

### Arrow Arrowhead Configuration
```typescript
// Source: https://github.com/tldraw/tldraw/blob/main/packages/tlschema/src/shapes/TLArrowShape.ts

// Arrowhead types available:
type TLArrowShapeArrowheadStyle =
  | 'arrow'    // standard arrow point
  | 'triangle' // filled triangle
  | 'square'   // filled square
  | 'dot'      // circle
  | 'pipe'     // straight line (bar)
  | 'diamond'  // filled diamond
  | 'inverted' // inverted triangle
  | 'bar'      // thin bar
  | 'none'     // no arrowhead

// Per CONTEXT.md: single, double, or no arrowhead
// - Single: arrowheadEnd = 'arrow', arrowheadStart = 'none' (default)
// - Double: arrowheadEnd = 'arrow', arrowheadStart = 'arrow'
// - None: arrowheadEnd = 'none', arrowheadStart = 'none'

// Set via editor:
editor.setStyleForNextShapes(ArrowShapeArrowheadEndStyle, 'arrow')
editor.setStyleForNextShapes(ArrowShapeArrowheadStartStyle, 'none')
```

### Dash/Line Style Configuration
```typescript
// Source: tldraw schema types

// Dash style values for shapes:
type TLDefaultDashStyle = 'draw' | 'solid' | 'dashed' | 'dotted'

// Per CONTEXT.md: solid + dashed + dotted available
// 'draw' is the hand-drawn/sketchy style (may want to include or exclude)

// Set for next shapes:
import { DefaultDashStyle } from 'tldraw'
editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
```

### Fill Style for Shapes
```typescript
// Source: tldraw schema types

// Fill options for geo shapes:
type TLDefaultFillStyle = 'none' | 'semi' | 'solid' | 'pattern'

// Per CONTEXT.md: Shapes support solid fill option
// - 'none' = outline only
// - 'solid' = filled with solid color
// - 'semi' = semi-transparent fill
// - 'pattern' = pattern fill

import { DefaultFillStyle } from 'tldraw'
editor.setStyleForNextShapes(DefaultFillStyle, 'solid')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tldraw v1 | tldraw v2+ | Late 2023 | Complete rewrite, different API |
| Y.Map for sync | YKeyValue | v2+ | Prevents unbounded memory growth |
| Custom freehand | perfect-freehand | Ongoing | Better smoothing, pressure support |
| No highlight tool | Highlight tool | June 2023 | Semi-transparent marker strokes |
| Static toolbar | TLComponents customization | v4.0.0 | Style panel rewrite, easier customization |

**Deprecated/outdated:**
- tldraw v1 API: Completely different from v2+
- Direct Y.Map usage: Use YKeyValue (already implemented in project)

## Open Questions

Things that couldn't be fully resolved:

1. **Pixel-level erasing**
   - What we know: tldraw only supports stroke-based erasing (whole shapes)
   - What's unclear: Whether this is a hard requirement from CONTEXT.md
   - Recommendation: Implement stroke eraser first (native tldraw); pixel eraser would require custom shape splitting logic. May need to revisit with user if pixel erasing is critical.

2. **Marker smoothing parameters**
   - What we know: perfect-freehand has smoothing (0.5 default), streamline (0.5 default), thinning (0.5 default)
   - What's unclear: Optimal values for "marker feel" vs "pen feel" - tldraw doesn't expose these for highlight tool
   - Recommendation: Use tldraw defaults; if users request adjustment, may need to extend HighlightShapeUtil

3. **Eraser size options**
   - What we know: tldraw eraser doesn't have functional size options
   - What's unclear: How to implement "small/medium/large" eraser per CONTEXT.md
   - Recommendation: Could be visual-only (cursor size) or affect hit-test radius via custom EraserTool extension

## Sources

### Primary (HIGH confidence)
- [tldraw docs - Tools](https://tldraw.dev/docs/tools) - Tool state machine
- [tldraw docs - Shapes](https://tldraw.dev/docs/shapes) - Shape system
- [tldraw docs - User Interface](https://tldraw.dev/docs/user-interface) - UI customization
- [tldraw examples - Custom stroke sizes](https://tldraw.dev/examples/custom-stroke-and-font-sizes) - Style mutation
- [tldraw examples - Changing default colors](https://tldraw.dev/examples/changing-default-colors) - Color customization
- [tldraw examples - Vertical toolbar](https://tldraw.dev/examples/vertical-toolbar) - Toolbar positioning
- [tldraw GitHub - TLColorStyle.ts](https://github.com/tldraw/tldraw/blob/main/packages/tlschema/src/styles/TLColorStyle.ts) - Color names
- [tldraw GitHub - TLArrowShape.ts](https://github.com/tldraw/tldraw/blob/main/packages/tlschema/src/shapes/TLArrowShape.ts) - Arrowhead types
- [tldraw GitHub - useTools.tsx](https://github.com/tldraw/tldraw/blob/main/packages/tldraw/src/lib/ui/hooks/useTools.tsx) - Tool IDs

### Secondary (MEDIUM confidence)
- [perfect-freehand GitHub](https://github.com/steveruizok/perfect-freehand) - Smoothing algorithm options
- [tldraw examples index](https://examples.tldraw.com/) - Various implementation patterns

### Tertiary (LOW confidence)
- [tldraw GitHub Issue #6054](https://github.com/tldraw/tldraw/issues/6054) - Pixel eraser feature request (confirms not implemented)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - tldraw is already in project, well-documented
- Architecture: HIGH - Patterns from official tldraw docs and examples
- Pitfalls: HIGH - Direct from GitHub issues and feature requests
- Pixel eraser limitation: HIGH - Confirmed via GitHub issue

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - tldraw is stable, minor updates expected)

---

## Quick Reference for Planning

### Tools Already Available in tldraw
| Requirement | tldraw Tool | Ready? |
|-------------|-------------|--------|
| Freehand pen | draw tool | Yes |
| Marker | highlight tool | Yes |
| Eraser (stroke) | eraser tool | Yes |
| Eraser (pixel) | N/A | No - custom needed |
| Rectangle | geo tool (rectangle) | Yes |
| Circle | geo tool (ellipse) | Yes |
| Line | line tool | Yes |
| Arrow | arrow tool | Yes |

### Customization Needed
| Feature | How to Implement |
|---------|------------------|
| Stroke widths | Mutate STROKE_SIZES before mount |
| Color palette | Mutate DefaultColorThemePalette before mount |
| Dash styles | Use DefaultDashStyle (already has solid/dashed/dotted) |
| Fill option | Use DefaultFillStyle (none/solid/semi/pattern) |
| Arrow heads | Use ArrowShapeArrowheadStartStyle/EndStyle |
| Bottom toolbar | TLComponents with custom Toolbar |
| Auto-hide toolbar | Custom component with visibility state |
| Default select tool | editor.setCurrentTool('select') in onMount |

### UI Components to Replace
```typescript
const components: TLComponents = {
  Toolbar: CustomBottomToolbar,      // Required for positioning
  StylePanel: CustomStylePanel,       // Optional - for custom color picker UI
  // Keep others as default
}
```
