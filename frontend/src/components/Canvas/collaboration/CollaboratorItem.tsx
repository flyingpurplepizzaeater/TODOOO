import type { AwarenessState } from './types'

interface CollaboratorItemProps {
  state: AwarenessState
  isIdle: boolean
  onFollow: () => void
}

/**
 * Individual collaborator row in the presence sidebar.
 *
 * Displays:
 * - Avatar placeholder with first letter of name
 * - Username with colored border (matches cursor color)
 * - Idle indicator when user is inactive
 *
 * Per CONTEXT.md:
 * - Idle users appear dimmed (opacity 0.5)
 * - Click triggers follow mode
 */
export function CollaboratorItem({ state, isIdle, onFollow }: CollaboratorItemProps) {
  const { user } = state

  return (
    <div
      onClick={onFollow}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        cursor: 'pointer',
        borderRadius: 6,
        transition: 'background 0.15s, opacity 0.15s',
        opacity: isIdle ? 0.5 : 1,  // Dimmed when idle per CONTEXT.md
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      title={isIdle ? `${user.name} (idle)` : `Click to follow ${user.name}`}
    >
      {/* Avatar placeholder with colored border per CONTEXT.md */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `3px solid ${user.color}`,
          background: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: '#6b7280',
          fontFamily: 'system-ui, sans-serif',
          flexShrink: 0,
        }}
      >
        {/* First letter of name as avatar placeholder */}
        {user.name.charAt(0).toUpperCase()}
      </div>

      {/* Username */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
            fontFamily: 'system-ui, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user.name}
        </div>
        {isIdle && (
          <div
            style={{
              fontSize: 11,
              color: '#9ca3af',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Idle
          </div>
        )}
      </div>
    </div>
  )
}
