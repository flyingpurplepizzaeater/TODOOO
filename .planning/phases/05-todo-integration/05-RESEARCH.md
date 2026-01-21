# Phase 5: TODO Integration - Research

**Researched:** 2026-01-21
**Domain:** tldraw custom shapes, bidirectional backend sync, frame-based grouping
**Confidence:** HIGH

## Summary

Phase 5 integrates visual TODO cards on the canvas with the existing backend TODO system. This requires creating a custom TODO shape type, implementing bidirectional sync between tldraw store and backend API, and using tldraw's built-in frame shapes for visual grouping.

Key findings:
1. **Custom shapes** use `BaseBoxShapeUtil` for rectangular TODO cards with custom props (title, completed, dueDate, assignee, priority)
2. **Bidirectional sync** uses `store.listen({ source: 'user' })` for canvas-to-backend, and `store.mergeRemoteChanges()` for backend-to-canvas
3. **Frame shapes** provide built-in grouping with `onDragShapesIn` for auto-parenting when cards are dropped
4. **Yjs integration** continues to work - custom shapes sync through the existing YKeyValue store automatically
5. **Conflict resolution** leverages Yjs CRDT for canvas state, with field-level merge for backend sync conflicts

**Primary recommendation:** Create a `TodoShapeUtil` extending `BaseBoxShapeUtil` with custom props linking to backend TODO items. Use store listeners to sync changes to backend API. Backend changes arrive via WebSocket and are applied with `mergeRemoteChanges()`. Use existing tldraw `FrameShapeUtil` for grouping.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tldraw | 3.x | Canvas with custom shapes | BaseBoxShapeUtil for rectangular cards, proven pattern |
| @tldraw/editor | 3.x | Store API, shape utils | store.listen, mergeRemoteChanges for bidirectional sync |
| yjs | 13.6.x | CRDT sync | Already integrated, custom shapes sync automatically |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lodash/debounce | 4.x | Debounce API calls | Prevent excessive backend calls during rapid edits |
| date-fns | 3.x | Date formatting | Format due dates in TODO cards |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom TodoShapeUtil | Extend NoteShapeUtil | Custom gives full control over props/rendering |
| store.listen for sync | Yjs observeDeep | store.listen is more idiomatic for tldraw patterns |
| FrameShapeUtil for grouping | Custom container shape | Frame is built-in, tested, handles edge cases |

**Installation:**
```bash
npm install lodash date-fns
# date-fns may already be installed - check package.json
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── src/
│   ├── components/Canvas/
│   │   ├── Canvas.tsx           # Add custom shape utils
│   │   ├── useYjsStore.ts       # Existing sync (works with custom shapes)
│   │   ├── useTodoSync.ts       # NEW: Backend sync hook
│   │   └── shapes/
│   │       ├── todo/
│   │       │   ├── TodoShapeUtil.tsx    # Custom shape util
│   │       │   ├── TodoCard.tsx         # React component for card
│   │       │   ├── TodoTool.ts          # Tool for creating TODOs
│   │       │   └── types.ts             # Shape type definitions
│   │       └── index.ts
│   ├── services/
│   │   └── todoApi.ts           # Backend API calls
│   └── lib/
│       └── todoSync.ts          # Sync state machine
```

### Pattern 1: Custom TODO Shape Definition
**What:** Define a custom shape type with backend-linkable props
**When to use:** For TODO cards with structured data (title, status, due date, etc.)
**Example:**
```typescript
// Source: tldraw.dev/examples/custom-shape pattern
import { T, TLBaseShape, BaseBoxShapeUtil, HTMLContainer } from 'tldraw'

// Shape type definition with all required props
export type TodoShape = TLBaseShape<
  'todo',
  {
    w: number
    h: number
    title: string
    completed: boolean
    dueDate: string | null    // ISO date string
    assigneeId: number | null
    assigneeName: string | null
    priority: 'high' | 'medium' | 'low'
    backendId: number | null  // Link to backend TODO item
    listId: number | null     // Which backend list this belongs to
  }
>

export class TodoShapeUtil extends BaseBoxShapeUtil<TodoShape> {
  static override type = 'todo' as const

  static override props = {
    w: T.number,
    h: T.number,
    title: T.string,
    completed: T.boolean,
    dueDate: T.string.nullable(),
    assigneeId: T.number.nullable(),
    assigneeName: T.string.nullable(),
    priority: T.literal('high', 'medium', 'low'),
    backendId: T.number.nullable(),
    listId: T.number.nullable(),
  }

  override getDefaultProps(): TodoShape['props'] {
    return {
      w: 280,
      h: 120,
      title: 'New Task',
      completed: false,
      dueDate: null,
      assigneeId: null,
      assigneeName: null,
      priority: 'medium',
      backendId: null,
      listId: null,
    }
  }

  override canEdit() { return true }
  override canResize() { return true }
}
```

### Pattern 2: Bidirectional Backend Sync
**What:** Sync TODO shape changes to backend API and vice versa
**When to use:** Every TODO card CRUD operation
**Example:**
```typescript
// Source: tldraw.dev/examples/editor-api/store-events pattern
export function useTodoSync(editor: Editor, token: string) {
  useEffect(() => {
    // Canvas -> Backend: Listen for user changes to TODO shapes
    const unsub = editor.store.listen(
      ({ changes }) => {
        // Handle created TODOs
        Object.values(changes.added).forEach(record => {
          if (record.typeName === 'shape' && record.type === 'todo') {
            const todo = record as TodoShape
            if (!todo.props.backendId) {
              // New TODO - create in backend
              createTodoInBackend(todo, token)
            }
          }
        })

        // Handle updated TODOs
        Object.values(changes.updated).forEach(([from, to]) => {
          if (to.typeName === 'shape' && to.type === 'todo') {
            const todo = to as TodoShape
            if (todo.props.backendId) {
              // Existing TODO - update in backend
              updateTodoInBackend(todo, token)
            }
          }
        })

        // Handle deleted TODOs
        Object.values(changes.removed).forEach(record => {
          if (record.typeName === 'shape' && record.type === 'todo') {
            const todo = record as TodoShape
            if (todo.props.backendId) {
              deleteTodoInBackend(todo.props.backendId, token)
            }
          }
        })
      },
      { source: 'user', scope: 'document' }
    )

    return () => unsub()
  }, [editor, token])
}
```

### Pattern 3: Backend -> Canvas Sync via WebSocket
**What:** Apply backend changes to canvas without triggering store listener
**When to use:** When receiving backend TODO updates via WebSocket
**Example:**
```typescript
// Source: tldraw.dev/docs/persistence mergeRemoteChanges pattern
function handleBackendTodoUpdate(editor: Editor, backendTodo: BackendTodoItem) {
  editor.store.mergeRemoteChanges(() => {
    // Find the canvas shape linked to this backend TODO
    const shapes = editor.getCurrentPageShapes()
    const todoShape = shapes.find(
      s => s.type === 'todo' && (s as TodoShape).props.backendId === backendTodo.id
    ) as TodoShape | undefined

    if (todoShape) {
      // Update existing shape - changes won't trigger store.listen
      editor.updateShape<TodoShape>({
        id: todoShape.id,
        type: 'todo',
        props: {
          title: backendTodo.title,
          completed: backendTodo.completed,
          dueDate: backendTodo.due_date,
          assigneeId: backendTodo.assigned_to,
          assigneeName: backendTodo.assignee_username,
        }
      })
    }
  })
}
```

### Pattern 4: Frame-Based Grouping
**What:** Use tldraw's FrameShapeUtil for visual sections/containers
**When to use:** For organizing TODO cards into visual groups
**Example:**
```typescript
// Source: FrameShapeUtil.tsx from tldraw source
// Frames automatically handle drag-and-drop parenting via onDragShapesIn

// Create a frame for a kanban column
editor.createShape({
  type: 'frame',
  x: 100,
  y: 100,
  props: {
    w: 320,
    h: 600,
    name: 'To Do',  // Frame title
    color: 'blue',  // If showColors enabled
  }
})

// TODOs dropped into frames become children automatically
// Frame's onDragShapesIn calls editor.reparentShapes()
```

### Pattern 5: Linking Existing Backend TODOs
**What:** Allow users to link canvas cards to existing backend TODO items
**When to use:** When creating a card that references existing TODO
**Example:**
```typescript
// When user chooses to link to existing TODO:
async function linkToExistingTodo(
  editor: Editor,
  shapeId: TLShapeId,
  backendTodoId: number,
  token: string
) {
  // Fetch the backend TODO
  const backendTodo = await fetchTodo(backendTodoId, token)

  // Update the canvas shape with backend data
  editor.updateShape<TodoShape>({
    id: shapeId,
    type: 'todo',
    props: {
      backendId: backendTodo.id,
      listId: backendTodo.list_id,
      title: backendTodo.title,
      completed: backendTodo.completed,
      dueDate: backendTodo.due_date,
      assigneeId: backendTodo.assigned_to,
      assigneeName: backendTodo.assignee_username,
    }
  })
}
```

### Anti-Patterns to Avoid
- **Syncing inside mergeRemoteChanges:** Never call backend API inside mergeRemoteChanges - it's for receiving, not sending
- **Polling for backend changes:** Use WebSocket push, not polling - matches existing architecture
- **Storing canvas position in backend:** Backend TODO has no concept of x/y - that's canvas-only state
- **Direct Yjs observation for TODO sync:** Use store.listen for better tldraw integration
- **Skipping source filter:** Always use `{ source: 'user' }` to avoid echo loops

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rectangular shape with resize | Custom geometry | BaseBoxShapeUtil | Handles hit testing, resize, geometry |
| Visual grouping | Custom container | FrameShapeUtil | Handles parenting, clipping, labels |
| Shape creation tool | Custom pointer handlers | StateNode + Tool | Integrates with tldraw state machine |
| Edit mode for title | Custom focus handling | canEdit() + RichTextLabel | Handles keyboard, focus, selection |
| Remote change isolation | Manual flag | mergeRemoteChanges() | Built-in source tagging |
| Checkbox toggle | Custom event handlers | onClick + updateShape | Standard tldraw pattern |

**Key insight:** tldraw's architecture separates shape definition (ShapeUtil) from interaction (Tool, StateNode). Leverage both instead of building custom interaction handlers.

## Common Pitfalls

### Pitfall 1: Echo Loop in Bidirectional Sync
**What goes wrong:** Canvas change triggers backend save, backend WebSocket notifies canvas, canvas updates, triggers another save
**Why it happens:** Not filtering by source in store.listen, or applying WebSocket updates without mergeRemoteChanges
**How to avoid:**
1. Always use `store.listen({ source: 'user' })` - ignores remote changes
2. Always use `mergeRemoteChanges()` for backend updates - tags as remote
3. Never call API inside mergeRemoteChanges block
**Warning signs:** Infinite network requests, browser freeze, "too much recursion" errors

### Pitfall 2: Shape Not Found After Backend Create
**What goes wrong:** Create TODO in backend, try to update shape with backendId, shape doesn't exist
**Why it happens:** Async timing - backend responds after shape deleted or page changed
**How to avoid:**
1. Store shape ID when initiating backend create
2. Check shape still exists before updating
3. Use try/catch with shape existence check
**Warning signs:** "Shape not found" errors, orphaned backend TODOs

### Pitfall 3: Custom Shape Not Syncing via Yjs
**What goes wrong:** TODO shapes visible locally but not syncing to other clients
**Why it happens:** Custom shape util not registered with Tldraw component
**How to avoid:**
1. Pass `shapeUtils={[TodoShapeUtil]}` to Tldraw
2. Define shape utils array OUTSIDE component (prevents redefinition)
3. Verify with second browser/tab
**Warning signs:** Shapes appear locally only, other clients show empty canvas

### Pitfall 4: Frame Children Not Moving Together
**What goes wrong:** Move frame, children stay in place
**Why it happens:** Shapes not properly parented to frame
**How to avoid:**
1. Use `onDragShapesIn` for auto-parenting (built into FrameShapeUtil)
2. Or manually `editor.reparentShapes([childId], frameId)`
3. Verify parentId is set correctly
**Warning signs:** shapes.parentId is page ID instead of frame ID

### Pitfall 5: Conflict Between Canvas and Backend State
**What goes wrong:** User A marks complete on canvas, User B marks complete in app, states diverge
**Why it happens:** No conflict detection or resolution strategy
**How to avoid:**
1. Canvas wins for visual properties (position, size)
2. Backend wins for data properties (completed, title) - apply via mergeRemoteChanges
3. For true conflicts, flag for user resolution (per CONTEXT.md)
4. Use timestamps or version numbers for detection
**Warning signs:** Different clients showing different completion states

### Pitfall 6: Overdue Styling Not Updating
**What goes wrong:** Task passes due date but still shows normal styling
**Why it happens:** Component doesn't re-render when date changes
**How to avoid:**
1. Use `useValue()` with date comparison for reactive updates
2. Or re-render on interval (not recommended, wastes cycles)
3. Compare current date vs dueDate in component
**Warning signs:** Tasks stay non-overdue after deadline passes

## Code Examples

### Complete TodoShapeUtil Implementation
```typescript
// Source: Based on tldraw NoteShapeUtil and BaseBoxShapeUtil patterns
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  TLBaseShape,
  TLResizeInfo,
  resizeBox,
  useValue,
} from 'tldraw'
import { format, isPast, isToday } from 'date-fns'
import { TodoCard } from './TodoCard'

export type TodoShape = TLBaseShape<
  'todo',
  {
    w: number
    h: number
    title: string
    completed: boolean
    dueDate: string | null
    assigneeId: number | null
    assigneeName: string | null
    priority: 'high' | 'medium' | 'low'
    backendId: number | null
    listId: number | null
  }
>

export class TodoShapeUtil extends BaseBoxShapeUtil<TodoShape> {
  static override type = 'todo' as const

  static override props = {
    w: T.number,
    h: T.number,
    title: T.string,
    completed: T.boolean,
    dueDate: T.string.nullable(),
    assigneeId: T.number.nullable(),
    assigneeName: T.string.nullable(),
    priority: T.literal('high', 'medium', 'low'),
    backendId: T.number.nullable(),
    listId: T.number.nullable(),
  }

  override getDefaultProps(): TodoShape['props'] {
    return {
      w: 280,
      h: 100,
      title: 'New Task',
      completed: false,
      dueDate: null,
      assigneeId: null,
      assigneeName: null,
      priority: 'medium',
      backendId: null,
      listId: null,
    }
  }

  override canEdit() { return true }
  override canResize() { return true }
  override isAspectRatioLocked() { return false }

  override onResize(shape: TodoShape, info: TLResizeInfo<TodoShape>) {
    return resizeBox(shape, info)
  }

  component(shape: TodoShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id

    // Reactive overdue check
    const isOverdue = useValue(
      'isOverdue',
      () => {
        if (!shape.props.dueDate || shape.props.completed) return false
        return isPast(new Date(shape.props.dueDate)) && !isToday(new Date(shape.props.dueDate))
      },
      [shape.props.dueDate, shape.props.completed]
    )

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          pointerEvents: isEditing ? 'all' : 'none',
        }}
      >
        <TodoCard
          shape={shape}
          isEditing={isEditing}
          isOverdue={isOverdue}
          onToggleComplete={() => {
            this.editor.updateShape<TodoShape>({
              id: shape.id,
              type: 'todo',
              props: { completed: !shape.props.completed }
            })
          }}
          onTitleChange={(title) => {
            this.editor.updateShape<TodoShape>({
              id: shape.id,
              type: 'todo',
              props: { title }
            })
          }}
        />
      </HTMLContainer>
    )
  }

  indicator(shape: TodoShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
      />
    )
  }
}
```

### TodoCard Component (Visual Rendering)
```typescript
// Source: Based on CONTEXT.md requirements for card layout
import { TodoShape } from './types'
import { format, isPast } from 'date-fns'

interface TodoCardProps {
  shape: TodoShape
  isEditing: boolean
  isOverdue: boolean
  onToggleComplete: () => void
  onTitleChange: (title: string) => void
}

const priorityColors = {
  high: '#ef4444',    // red
  medium: '#f59e0b',  // yellow/amber
  low: '#3b82f6',     // blue
}

export function TodoCard({
  shape,
  isEditing,
  isOverdue,
  onToggleComplete,
  onTitleChange,
}: TodoCardProps) {
  const { props } = shape
  const { completed, title, dueDate, assigneeName, priority } = props

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: 12,
        borderRadius: 8,
        backgroundColor: completed ? '#dcfce7' : '#ffffff',  // green tint when complete
        border: `2px solid ${isOverdue ? '#ef4444' : '#e5e7eb'}`,
        borderLeft: `4px solid ${priorityColors[priority]}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Header row: checkbox + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggleComplete}
          style={{
            width: 18,
            height: 18,
            marginTop: 2,
            cursor: 'pointer',
          }}
        />
        <div
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => onTitleChange(e.currentTarget.textContent || '')}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: completed ? 'line-through' : 'none',
            color: completed ? '#6b7280' : '#111827',
            outline: 'none',
          }}
        >
          {title}
        </div>
      </div>

      {/* Footer row: due date + assignee */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: '#6b7280',
      }}>
        {dueDate && (
          <span style={{ color: isOverdue ? '#ef4444' : '#6b7280' }}>
            {format(new Date(dueDate), 'MMM d')}
          </span>
        )}
        {assigneeName && (
          <span style={{
            backgroundColor: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: 12,
          }}>
            {assigneeName}
          </span>
        )}
      </div>
    </div>
  )
}
```

### Registering Custom Shape with Tldraw
```typescript
// Source: tldraw.dev/examples/custom-shape registration pattern
import { Tldraw, defaultShapeUtils } from 'tldraw'
import { TodoShapeUtil } from './shapes/todo/TodoShapeUtil'

// IMPORTANT: Define outside component to prevent recreation
const customShapeUtils = [TodoShapeUtil]

export function Canvas({ boardId, token }: CanvasProps) {
  const { store, status, doc, yArr } = useYjsStore(boardId, token)

  return (
    <Tldraw
      store={store}
      shapeUtils={customShapeUtils}
      // ... other props
    />
  )
}
```

### Backend WebSocket Event Handling
```typescript
// Source: Existing websocket.py pattern + store events
interface TodoEvent {
  event: 'todo_created' | 'todo_updated' | 'todo_deleted'
  data: {
    id: number
    title: string
    completed: boolean
    due_date: string | null
    assigned_to: number | null
    assignee_username: string | null
    list_id: number
  }
}

function handleTodoWebSocketEvent(editor: Editor, event: TodoEvent) {
  editor.store.mergeRemoteChanges(() => {
    switch (event.event) {
      case 'todo_created':
        // Don't auto-create shape - user may not want it on canvas
        break

      case 'todo_updated': {
        // Find linked shape and update
        const shapes = editor.getCurrentPageShapes()
        const todoShape = shapes.find(
          s => s.type === 'todo' &&
               (s as TodoShape).props.backendId === event.data.id
        ) as TodoShape | undefined

        if (todoShape) {
          editor.updateShape<TodoShape>({
            id: todoShape.id,
            type: 'todo',
            props: {
              title: event.data.title,
              completed: event.data.completed,
              dueDate: event.data.due_date,
              assigneeId: event.data.assigned_to,
              assigneeName: event.data.assignee_username,
            }
          })
        }
        break
      }

      case 'todo_deleted': {
        // Find and optionally remove linked shape
        const shapes = editor.getCurrentPageShapes()
        const todoShape = shapes.find(
          s => s.type === 'todo' &&
               (s as TodoShape).props.backendId === event.data.id
        ) as TodoShape | undefined

        if (todoShape) {
          // Option: Delete shape, or mark as "unlinked"
          editor.deleteShape(todoShape.id)
        }
        break
      }
    }
  })
}
```

### Frame Preset Creation (Kanban Example)
```typescript
// Source: FrameShapeUtil.tsx from tldraw source
function createKanbanBoard(editor: Editor, x: number, y: number) {
  const columns = ['To Do', 'In Progress', 'Done']
  const columnWidth = 300
  const columnHeight = 600
  const gap = 20

  columns.forEach((name, index) => {
    editor.createShape({
      type: 'frame',
      x: x + (columnWidth + gap) * index,
      y: y,
      props: {
        w: columnWidth,
        h: columnHeight,
        name: name,
        color: ['blue', 'yellow', 'green'][index],
      }
    })
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Embed shape for external data | Custom ShapeUtil with props | tldraw 2.x | Full control over rendering, behavior |
| Y.Map for key-value | YKeyValue from y-utility | 2024 | Better memory efficiency |
| Manual parent tracking | editor.reparentShapes() | tldraw 2.x | Built-in parent-child management |

**Deprecated/outdated:**
- `propsForNextShape`: Use `stylesForNextShape` in schema
- Direct Y.Map access for tldraw records: Use YKeyValue wrapper
- Custom geometry for boxes: Use `BaseBoxShapeUtil`

## Open Questions

1. **Auto-arrange algorithm for frames**
   - What we know: CONTEXT.md says "auto-arrange when dropped inside frames"
   - What's unclear: Exact algorithm - snap to grid? List layout? Masonry?
   - Recommendation: Start with simple vertical list layout, allow manual override

2. **Conflict resolution UI**
   - What we know: CONTEXT.md says "flag conflicts for user resolution"
   - What's unclear: What does the UI look like? Modal? Inline notification?
   - Recommendation: Claude's discretion per CONTEXT.md - research modal vs toast patterns

3. **Backend list association**
   - What we know: Backend TODOs belong to lists, canvas is board-scoped
   - What's unclear: How to map board to default list? Per-frame list?
   - Recommendation: Use board metadata to specify default list ID, or create canvas-specific list

## Sources

### Primary (HIGH confidence)
- [tldraw Custom Shape Docs](https://tldraw.dev/examples/custom-shape) - BaseBoxShapeUtil pattern
- [tldraw Store Events](https://tldraw.dev/examples/editor-api/store-events) - store.listen pattern
- [tldraw Shapes Docs](https://tldraw.dev/docs/shapes) - Shape definition structure
- FrameShapeUtil.tsx (tldraw source) - onDragShapesIn, reparentShapes patterns
- NoteShapeUtil.tsx (tldraw source) - Component rendering, canEdit patterns

### Secondary (MEDIUM confidence)
- [tldraw Drag and Drop](https://tldraw.dev/examples/drag-and-drop) - Parent-child via drag
- [tldraw Editable Shape](https://tldraw.dev/examples/editable-shape) - Edit mode handling
- [tldraw Persistence](https://tldraw.dev/docs/persistence) - mergeRemoteChanges API

### Tertiary (LOW confidence)
- WebSearch results for CRDT conflict resolution patterns

## Metadata

**Confidence breakdown:**
- Custom shapes: HIGH - verified from official docs and source code
- Bidirectional sync: HIGH - store.listen + mergeRemoteChanges is documented pattern
- Frame grouping: HIGH - verified from FrameShapeUtil source
- Conflict resolution: MEDIUM - CRDT handles canvas, backend strategy is architectural choice

**Research date:** 2026-01-21
**Valid until:** 60 days (tldraw API stable, custom shapes well-documented)
