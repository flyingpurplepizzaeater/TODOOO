import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type TLResizeInfo,
  resizeBox,
} from 'tldraw'
import { isPast, isToday } from 'date-fns'
import type { TodoShape } from './types'
import { todoShapeProps, todoShapeDefaultProps } from './types'
import { TodoCard } from './TodoCard'

/**
 * TodoShapeUtil - Custom shape utility for TODO cards on canvas.
 *
 * Extends BaseBoxShapeUtil for rectangular card behavior with:
 * - Free resize (not aspect-locked per CONTEXT.md)
 * - Inline title editing via double-click
 * - Checkbox toggle for completed state
 * - Visual indicators for priority, overdue, and completed states
 *
 * Shape syncs to other clients via existing Yjs integration automatically.
 */
export class TodoShapeUtil extends BaseBoxShapeUtil<TodoShape> {
  static override type = 'todo' as const
  static override props = todoShapeProps

  override getDefaultProps(): TodoShape['props'] {
    return { ...todoShapeDefaultProps }
  }

  override canEdit() {
    return true
  }

  override canResize() {
    return true
  }

  override isAspectRatioLocked() {
    return false // Freely resizable per CONTEXT.md
  }

  override onResize(shape: TodoShape, info: TLResizeInfo<TodoShape>) {
    return resizeBox(shape, info)
  }

  component(shape: TodoShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id

    // Calculate overdue status
    // Overdue = past due date AND not today AND not completed
    const isOverdue = (() => {
      if (!shape.props.dueDate || shape.props.completed) return false
      const dueDate = new Date(shape.props.dueDate)
      return isPast(dueDate) && !isToday(dueDate)
    })()

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: '100%',
          height: '100%',
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
              props: { completed: !shape.props.completed },
            })
          }}
          onTitleChange={(title) => {
            this.editor.updateShape<TodoShape>({
              id: shape.id,
              type: 'todo',
              props: { title },
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
