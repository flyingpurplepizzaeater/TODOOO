import { useEditor, useValue, DefaultShapeIndicator, type TLShapeIndicatorProps } from 'tldraw'

/**
 * Custom CollaboratorShapeIndicator that renders selection outlines for shapes
 * selected by other users.
 *
 * Per CONTEXT.md requirements:
 * - Objects selected by others show colored selection outline (their cursor color)
 * - Small label shows who selected the shape
 *
 * This component wraps tldraw's DefaultShapeIndicator and adds:
 * - Consistent styling with the user's cursor color
 * - Optional username label above the selection
 *
 * The color is passed from TLInstancePresence.color which is set in useAwareness
 * based on the user's deterministic color from colorFromUserId().
 *
 * Note: tldraw automatically renders CollaboratorShapeIndicator for each shape
 * in a collaborator's selectedShapeIds array. We just customize the appearance.
 */
export function CollaboratorIndicator(props: TLShapeIndicatorProps) {
  const { shapeId, color, userId, className, opacity, hidden } = props
  const editor = useEditor()

  // Get the collaborator info to show username
  const collaborator = useValue(
    'collaborator',
    () => {
      if (!userId) return null
      return editor.getCollaborators().find((c) => c.userId === userId) ?? null
    },
    [editor, userId]
  )

  // Get shape bounds for positioning the label
  const bounds = useValue(
    'shape bounds',
    () => editor.getShapePageBounds(shapeId),
    [editor, shapeId]
  )

  // If hidden or no bounds, don't render
  if (hidden || !bounds) return null

  // Use the default indicator with custom styling
  // The DefaultShapeIndicator handles the actual outline rendering
  return (
    <div style={{ position: 'absolute', pointerEvents: 'none' }}>
      {/* Username label above the selection */}
      {collaborator && color && (
        <div
          style={{
            position: 'absolute',
            left: bounds.x,
            top: bounds.y - 22,
            backgroundColor: color,
            color: 'white',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 500,
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}
        >
          {collaborator.userName}
        </div>
      )}

      {/* Default shape indicator (handles the actual outline) */}
      <DefaultShapeIndicator
        shapeId={shapeId}
        color={color}
        userId={userId}
        className={className}
        opacity={opacity}
        hidden={hidden}
      />
    </div>
  )
}
