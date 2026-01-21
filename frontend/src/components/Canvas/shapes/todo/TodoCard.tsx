import { format } from 'date-fns'
import type { TodoShape } from './types'

/**
 * Props for the TodoCard component.
 */
interface TodoCardProps {
  shape: TodoShape
  isEditing: boolean
  isOverdue: boolean
  onToggleComplete: () => void
  onTitleChange: (title: string) => void
}

/**
 * Priority color mapping for left border.
 * - high: red (#ef4444)
 * - medium: amber/yellow (#f59e0b)
 * - low: blue (#3b82f6)
 */
export const priorityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
} as const

/**
 * TodoCard visual component for rendering TODO cards on canvas.
 *
 * Visual states:
 * - Completed: green background tint, strikethrough title, checkmark
 * - Overdue: red due date text, red border
 * - Priority: colored left border (red/amber/blue)
 *
 * Layout:
 * - Header row: checkbox + title
 * - Footer row: due date + assignee badge
 */
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
        backgroundColor: completed ? '#dcfce7' : '#ffffff',
        border: `2px solid ${isOverdue ? '#ef4444' : '#e5e7eb'}`,
        borderLeft: `4px solid ${priorityColors[priority]}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header row: checkbox + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => {
            e.stopPropagation()
            onToggleComplete()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            width: 18,
            height: 18,
            marginTop: 2,
            cursor: 'pointer',
            flexShrink: 0,
            accentColor: completed ? '#22c55e' : undefined,
          }}
        />
        <div
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => onTitleChange(e.currentTarget.textContent || '')}
          onPointerDown={(e) => {
            if (isEditing) {
              e.stopPropagation()
            }
          }}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: completed ? 'line-through' : 'none',
            color: completed ? '#6b7280' : '#111827',
            outline: 'none',
            minHeight: 20,
            wordBreak: 'break-word',
          }}
        >
          {title}
        </div>
      </div>

      {/* Footer row: due date + assignee */}
      {(dueDate || assigneeName) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#6b7280',
            marginTop: 'auto',
          }}
        >
          {dueDate && (
            <span style={{ color: isOverdue ? '#ef4444' : '#6b7280' }}>
              {format(new Date(dueDate), 'MMM d')}
            </span>
          )}
          {assigneeName && (
            <span
              style={{
                backgroundColor: '#f3f4f6',
                padding: '2px 8px',
                borderRadius: 12,
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {assigneeName}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
