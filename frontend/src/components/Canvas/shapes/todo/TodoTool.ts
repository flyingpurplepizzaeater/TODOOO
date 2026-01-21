import { StateNode, createShapeId } from 'tldraw'

/**
 * TodoTool - Tool for creating TODO cards on canvas.
 *
 * Usage:
 * 1. User selects TODO tool from toolbar (or presses 'T')
 * 2. User clicks on canvas
 * 3. New TODO card is created at click position
 * 4. Tool switches back to select for immediate editing
 */
export class TodoTool extends StateNode {
  static override id = 'todo'

  override onEnter() {
    this.editor.setCursor({ type: 'cross' })
  }

  override onPointerDown() {
    const { currentPagePoint } = this.editor.inputs

    // Create TODO shape at click position
    const id = createShapeId()
    this.editor.createShape({
      id,
      type: 'todo',
      x: currentPagePoint.x,
      y: currentPagePoint.y,
    })

    // Select the new shape
    this.editor.select(id)

    // Switch back to select tool for immediate interaction
    this.editor.setCurrentTool('select')
  }
}
