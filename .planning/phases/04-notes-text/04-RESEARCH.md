# Phase 4: Notes & Text - Research

**Researched:** 2026-01-21
**Domain:** tldraw notes and text shapes, inline editing, style customization
**Confidence:** HIGH

## Summary

Phase 4 adds sticky notes and text objects to the canvas. tldraw provides built-in `note` and `text` shape types with full editing support. The note shape is a colored rectangle (default 200x200px) with text inside, while the text shape is standalone text. Both support rich text editing via tiptap.

Key findings:
1. tldraw's note and text shapes work out of the box - toolbar already includes them
2. Note colors use `noteFill` and `noteText` values in DefaultColorThemePalette (already configured in styleConfig.ts)
3. Notes have aspect-locked resize via `resizeMode: 'scale'` option
4. Text editing is double-click to enter, click-away to exit - tldraw default behavior matches requirements
5. Style persistence uses `stylesForNextShape` in InstanceState, but does NOT persist across sessions by default
6. Shadow styling is built into NoteShapeUtil via `getNoteShadow()` function

**Primary recommendation:** Use tldraw's built-in note and text tools. Add note/text toolbar items, customize note colors via DefaultColorThemePalette, and implement localStorage persistence for last-used sticky note color.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tldraw | 3.x | Canvas with note/text shapes | Built-in NoteShapeUtil and TextShapeUtil |
| @tldraw/editor | 3.x | Editor API for style management | setStyleForNextShapes, setStyleForSelectedShapes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage | Native | Persist last-used note color | Color persistence across sessions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in note shape | Custom shape | Custom = more control but significant effort |
| Built-in text editing | Custom tiptap setup | Built-in handles all edge cases |

**Installation:**
No new packages needed - tldraw includes note and text tools.

## Architecture Patterns

### tldraw Note and Text Architecture
```
src/
├── components/Canvas/
│   ├── Canvas.tsx           # Already has Tldraw component
│   ├── CustomToolbar.tsx    # Add note/text toolbar items
│   ├── styleConfig.ts       # Add note colors to palette
│   └── noteColorPersistence.ts  # New: localStorage for note color
```

### Pattern 1: Note Color Customization
**What:** Customize sticky note colors via DefaultColorThemePalette
**When to use:** At app initialization, before React mounts
**Example:**
```typescript
// Source: TLColorStyle.ts in @tldraw/tlschema
// Note colors are defined per-color in DefaultColorThemePalette
// Each color has noteFill and noteText properties

import { DefaultColorThemePalette } from 'tldraw'

// Customize note fill colors (run before React)
DefaultColorThemePalette.lightMode.yellow.noteFill = '#FCE19C'  // default yellow
DefaultColorThemePalette.lightMode.blue.noteFill = '#8AA3FF'
DefaultColorThemePalette.lightMode.green.noteFill = '#6FC896'
DefaultColorThemePalette.lightMode.violet.noteFill = '#DB91FD'
DefaultColorThemePalette.lightMode['light-red'].noteFill = '#F7A5A1'  // pink
DefaultColorThemePalette.lightMode.orange.noteFill = '#FAA475'

// Note text colors (usually black for readability)
DefaultColorThemePalette.lightMode.yellow.noteText = '#000000'
```

### Pattern 2: Style Persistence for Next Shape
**What:** Use stylesForNextShape to remember color selection
**When to use:** When user changes note color
**Example:**
```typescript
// Source: Editor.ts in @tldraw/editor
// tldraw automatically remembers styles via stylesForNextShape

// When user selects a note and changes its color, or
// when setting style for next shapes:
editor.setStyleForNextShapes(DefaultColorStyle, 'yellow')

// This is stored in InstanceState.stylesForNextShape
// and applied to newly created shapes
```

### Pattern 3: Session Persistence via localStorage
**What:** Save last-used note color to localStorage
**When to use:** To persist color choice between sessions
**Example:**
```typescript
// Custom persistence (tldraw doesn't persist stylesForNextShape across sessions)
const NOTE_COLOR_KEY = 'collabboard:note-color'

// Save on color change
function saveNoteColor(color: string) {
  localStorage.setItem(NOTE_COLOR_KEY, color)
}

// Restore on mount
function restoreNoteColor(editor: Editor) {
  const savedColor = localStorage.getItem(NOTE_COLOR_KEY)
  if (savedColor) {
    editor.setStyleForNextShapes(DefaultColorStyle, savedColor)
  }
}
```

### Pattern 4: Enabling Note Resize
**What:** Enable scale-based resizing for notes
**When to use:** To allow user to resize notes (keeps aspect ratio)
**Example:**
```typescript
// Source: NoteShapeUtil.tsx - options.resizeMode
// By default, notes don't have resize handles (resizeMode: 'none')
// To enable square aspect-locked resize:

import { NoteShapeUtil } from 'tldraw'

// In onMount callback:
function handleMount(editor: Editor) {
  const noteUtil = editor.getShapeUtil<NoteShapeUtil>('note')
  noteUtil.options.resizeMode = 'scale'  // Enables resize, locks aspect ratio
}
```

### Anti-Patterns to Avoid
- **Custom text editing implementation:** tldraw's rich text via tiptap handles all edge cases
- **Manually tracking editing state:** Use `editor.getEditingShapeId()` and `editor.setEditingShape()`
- **Overriding note component:** Shadow and styling are built-in, customize via palette instead
- **Polling for style changes:** Use store listeners with source:'user' filter

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editing | Custom contenteditable | tldraw's RichTextLabel | Handles focus, selection, formatting, keyboard shortcuts |
| Note shadows | CSS box-shadow | Built-in getNoteShadow() | Rotation-aware, zoom-aware, seeded random for variety |
| Inline editing flow | Custom edit mode | editor.setEditingShape() | Integrates with tldraw's state machine |
| Style memory | Custom state | stylesForNextShape | Automatic per-style-prop persistence |
| Text measurement | Manual measurement | editor.textMeasure | Handles fonts, wrapping, auto-sizing |
| Font loading | Manual preload | editor.fonts | Tracks font usage, lazy loads |

**Key insight:** tldraw's note and text shapes have years of refinement handling edge cases like touch input, keyboard navigation, IME input, RTL text, and more. Custom solutions would need to handle all of these.

## Common Pitfalls

### Pitfall 1: Style Changes Not Persisting Across Sessions
**What goes wrong:** User selects pink note color, refreshes, color resets to default
**Why it happens:** `stylesForNextShape` is stored in InstanceState with `preserveNone` (doesn't persist)
**How to avoid:** Implement localStorage persistence in onMount, listen for style changes
**Warning signs:** Color resets after page reload

### Pitfall 2: Note Not Square After Resize
**What goes wrong:** User resizes note, it becomes rectangular
**Why it happens:** Default resizeMode is 'none', custom resize might not lock aspect
**How to avoid:** Set `noteUtil.options.resizeMode = 'scale'` which enforces aspect ratio
**Warning signs:** isAspectRatioLocked returns false

### Pitfall 3: Text Shape Auto-Deleted on Empty
**What goes wrong:** User creates text, deletes all content, text shape disappears
**Why it happens:** TextShapeUtil.onEditEnd deletes shape if trimmed text is empty
**How to avoid:** This is intentional behavior for text shapes. Notes do NOT auto-delete.
**Warning signs:** Text shapes vanish after clearing content
**Note:** Per CONTEXT.md "Keep empty objects" applies to notes only. Text auto-delete is standard behavior.

### Pitfall 4: Double-Click vs Single-Click Confusion
**What goes wrong:** User expects single-click to edit, but it only selects
**Why it happens:** tldraw convention: single-click selects, double-click edits
**How to avoid:** This matches CONTEXT.md requirement - document expected behavior
**Warning signs:** None - this is correct behavior per requirements

### Pitfall 5: Note Color Not Applied to New Notes
**What goes wrong:** User changes note color, creates new note, wrong color appears
**Why it happens:** Color style set for selected shape, not for next shapes
**How to avoid:** Use `setStyleForNextShapes` in addition to `setStyleForSelectedShapes`
**Warning signs:** Only existing shapes change color, not new ones

## Code Examples

Verified patterns from tldraw source:

### Adding Note and Text Tools to Toolbar
```typescript
// Source: DefaultToolbarContent.tsx
// These toolbar items are already exported and available

// In CustomToolbar.tsx - can use DefaultToolbar which includes them,
// or build custom toolbar with specific items:
import { NoteToolbarItem, TextToolbarItem } from 'tldraw'

// DefaultToolbar already includes:
// <TextToolbarItem />  (tool id: 'text')
// <NoteToolbarItem /> (tool id: 'note')
```

### Note Shape Default Properties
```typescript
// Source: NoteShapeUtil.tsx getDefaultProps()
{
  color: 'black',           // Note background color key
  richText: toRichText(''), // Empty rich text
  size: 'm',                // Font size preset
  font: 'draw',             // Font family
  align: 'middle',          // Horizontal alignment
  verticalAlign: 'middle',  // Vertical alignment
  labelColor: 'black',      // Text color key
  growY: 0,                 // Auto-grow for content
  fontSizeAdjustment: 0,    // Auto font size reduction
  url: '',                  // Optional hyperlink
  scale: 1,                 // Shape scale
}
```

### Text Shape Default Properties
```typescript
// Source: TextShapeUtil.tsx getDefaultProps()
{
  color: 'black',           // Text color key
  size: 'm',                // Font size preset
  w: 8,                     // Initial width
  font: 'draw',             // Font family
  textAlign: 'start',       // Alignment (start, middle, end)
  autoSize: true,           // Auto-size to content
  scale: 1,                 // Shape scale
  richText: toRichText(''), // Empty rich text
}
```

### Starting Edit Mode Programmatically
```typescript
// Source: selectHelpers.ts
import { startEditingShapeWithLabel } from 'tldraw'

// To programmatically start editing a shape:
startEditingShapeWithLabel(editor, shape, true /* selectAll */)

// Or manually:
editor.select(shape)
editor.setEditingShape(shape)
editor.setCurrentTool('select.editing_shape', { target: 'shape', shape })
```

### Note Shadow Function
```typescript
// Source: NoteShapeUtil.tsx getNoteShadow()
// Shadows are auto-generated based on shape id and rotation
// Creates realistic Post-it shadow with slight random variation
// Automatically hidden at low zoom levels (zoom < 0.35 / scale)

// Shadow CSS generated:
// - Main shadow for depth
// - Secondary shadow based on rotation
// - Inset shadow for subtle lighting effect
```

### Style Change Detection
```typescript
// Source: Editor.ts, store patterns from existing codebase
// Listen for style changes to persist to localStorage

editor.store.listen(
  (entry) => {
    // Check if it's an instance state change with stylesForNextShape
    if (entry.changes.updated['instance:instance_state']) {
      const updated = entry.changes.updated['instance:instance_state']
      const newStyles = updated[1]?.stylesForNextShape
      const noteColor = newStyles?.['tldraw:color']
      if (noteColor) {
        localStorage.setItem('collabboard:note-color', noteColor)
      }
    }
  },
  { source: 'user' }
)
```

### Note Colors Available (Default Palette)
```typescript
// Source: TLColorStyle.ts defaultColorNames
// Available colors that have noteFill/noteText properties:
const availableNoteColors = [
  'black',       // #FCE19C (yellow-ish default)
  'blue',        // #8AA3FF (blue)
  'green',       // #6FC896 (green)
  'grey',        // #C0CAD3 (grey)
  'light-blue',  // #9BC4FD (light blue)
  'light-green', // #98D08A (light green)
  'light-red',   // #F7A5A1 (pink)
  'light-violet', // #DFB0F9 (lavender)
  'orange',      // #FAA475 (orange)
  'red',         // #FC8282 (red)
  'violet',      // #DB91FD (purple)
  'yellow',      // #FED49A (yellow)
  'white',       // #FFFFFF (white)
]
// Per CONTEXT.md: 6-8 colors recommended subset
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| propsForNextShape | stylesForNextShape | tldraw 2.0 | Cleaner style management |
| Plain text | Rich text (tiptap) | tldraw 2.x | Bold, italic, links supported |
| Fixed note size | Scale-based resize option | Recent | Notes can be resized |

**Deprecated/outdated:**
- `propsForNextShape`: Migrated to `stylesForNextShape` in schema
- Manual text measurement: Use `editor.textMeasure` API instead

## Open Questions

Things that couldn't be fully resolved:

1. **Note Tool vs Tool Selection**
   - What we know: Note tool creates notes on click/drag
   - What's unclear: Best UX for creating notes (click once vs drag to size)
   - Recommendation: Use default tldraw behavior (click to create at default size)

2. **Empty Note Behavior**
   - What we know: CONTEXT.md says "Keep empty objects"
   - What's unclear: Whether this applies to text shapes too
   - Recommendation: Keep notes (built-in), allow text auto-delete (standard behavior)

## Sources

### Primary (HIGH confidence)
- NoteShapeUtil.tsx (tldraw source) - Note shape implementation
- TextShapeUtil.tsx (tldraw source) - Text shape implementation
- TLColorStyle.ts (@tldraw/tlschema) - Color palette with noteFill/noteText
- selectHelpers.ts (tldraw source) - Edit mode helpers
- TLInstance.ts (@tldraw/tlschema) - stylesForNextShape persistence

### Secondary (MEDIUM confidence)
- DefaultToolbarContent.tsx - Toolbar item exports
- Editor.ts - Style management APIs

### Tertiary (LOW confidence)
- None - all findings verified from source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from tldraw source code
- Architecture: HIGH - based on existing codebase patterns
- Pitfalls: HIGH - documented in source and observed behavior
- Color customization: HIGH - verified DefaultColorThemePalette structure

**Research date:** 2026-01-21
**Valid until:** 90 days (tldraw API stable)
