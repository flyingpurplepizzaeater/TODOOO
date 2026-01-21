import { Editor } from 'tldraw'

/**
 * Frame preset functions for creating organized layouts on the canvas.
 *
 * Presets provide quick setup for common task organization patterns:
 * - Kanban boards (3 columns: To Do, In Progress, Done)
 * - Eisenhower matrix (2x2 urgency/importance grid)
 * - Weekly columns (Monday through Friday)
 * - Custom sections (single named frame)
 *
 * Frames act as visual containers - when TODO cards are dropped inside,
 * they automatically become children of the frame (handled by tldraw's
 * FrameShapeUtil.onDragShapesIn).
 */

/**
 * Creates a Kanban board with 3 columns: To Do, In Progress, Done.
 * Standard workflow visualization for task management.
 *
 * @param editor - The tldraw Editor instance
 * @param x - Starting X position for the board
 * @param y - Starting Y position for the board
 */
export function createKanbanBoard(editor: Editor, x: number, y: number): void {
  const columns = [
    { name: 'To Do' },
    { name: 'In Progress' },
    { name: 'Done' }
  ]
  const columnWidth = 300
  const columnHeight = 500
  const gap = 20

  columns.forEach((col, index) => {
    editor.createShape({
      type: 'frame',
      x: x + (columnWidth + gap) * index,
      y: y,
      props: {
        w: columnWidth,
        h: columnHeight,
        name: col.name,
      }
    })
  })
}

/**
 * Creates an Eisenhower matrix (2x2 grid) for prioritization.
 * Quadrants: Urgent & Important, Not Urgent & Important,
 *            Urgent & Not Important, Not Urgent & Not Important.
 *
 * @param editor - The tldraw Editor instance
 * @param x - Starting X position for the matrix
 * @param y - Starting Y position for the matrix
 */
export function createEisenhowerMatrix(editor: Editor, x: number, y: number): void {
  const quadrants = [
    { name: 'Urgent & Important', row: 0, col: 0 },
    { name: 'Not Urgent & Important', row: 0, col: 1 },
    { name: 'Urgent & Not Important', row: 1, col: 0 },
    { name: 'Not Urgent & Not Important', row: 1, col: 1 }
  ]
  const cellWidth = 350
  const cellHeight = 300
  const gap = 10

  quadrants.forEach(q => {
    editor.createShape({
      type: 'frame',
      x: x + q.col * (cellWidth + gap),
      y: y + q.row * (cellHeight + gap),
      props: {
        w: cellWidth,
        h: cellHeight,
        name: q.name,
      }
    })
  })
}

/**
 * Creates weekly columns for daily task planning.
 * Five columns for Monday through Friday.
 *
 * @param editor - The tldraw Editor instance
 * @param x - Starting X position for the columns
 * @param y - Starting Y position for the columns
 */
export function createWeeklyColumns(editor: Editor, x: number, y: number): void {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const columnWidth = 200
  const columnHeight = 400
  const gap = 15

  days.forEach((day, index) => {
    editor.createShape({
      type: 'frame',
      x: x + (columnWidth + gap) * index,
      y: y,
      props: {
        w: columnWidth,
        h: columnHeight,
        name: day,
      }
    })
  })
}

/**
 * Creates a single custom frame (section) with configurable name.
 * Use for creating arbitrary grouping containers.
 *
 * @param editor - The tldraw Editor instance
 * @param x - X position for the frame
 * @param y - Y position for the frame
 * @param name - Label for the frame (default: 'Section')
 */
export function createCustomFrame(
  editor: Editor,
  x: number,
  y: number,
  name: string = 'Section'
): void {
  editor.createShape({
    type: 'frame',
    x: x,
    y: y,
    props: {
      w: 300,
      h: 400,
      name: name,
    }
  })
}

/**
 * Gets the center of the current viewport in page coordinates.
 * Useful for placing presets at a visible location.
 *
 * The returned coordinates are offset to account for preset dimensions,
 * so the preset appears roughly centered in the viewport.
 *
 * @param editor - The tldraw Editor instance
 * @returns Page coordinates for centering a preset
 */
export function getViewportCenter(editor: Editor): { x: number; y: number } {
  const bounds = editor.getViewportScreenBounds()
  const center = editor.screenToPage({ x: bounds.w / 2, y: bounds.h / 2 })
  // Offset for typical preset size (center the preset, not its top-left corner)
  return { x: center.x - 300, y: center.y - 200 }
}
