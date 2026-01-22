import { T, type TLBaseShape } from 'tldraw'

/**
 * TodoShape type definition for tldraw custom shape.
 *
 * Represents a TODO card on the canvas with full task metadata.
 * Links to backend TODO items via backendId for bidirectional sync.
 */
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

/**
 * Shape prop validators for TodoShape.
 * Used by TodoShapeUtil.props for runtime type validation.
 */
export const todoShapeProps = {
  w: T.number,
  h: T.number,
  title: T.string,
  completed: T.boolean,
  dueDate: T.string.nullable(),
  assigneeId: T.number.nullable(),
  assigneeName: T.string.nullable(),
  priority: T.literalEnum('high', 'medium', 'low'),
  backendId: T.number.nullable(),
  listId: T.number.nullable(),
}

/**
 * Default prop values for new TodoShape instances.
 */
export const todoShapeDefaultProps: TodoShape['props'] = {
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
