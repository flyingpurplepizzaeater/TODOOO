import { useState, useEffect } from 'react'
import type { AwarenessState } from './types'
import { CollaboratorItem } from './CollaboratorItem'

interface PresenceSidebarProps {
  others: Map<number, AwarenessState>
  onFollowUser: (userId: string, userName: string, color: string) => void
  followingUserId: string | null
  followingUserColor: string | null
}

/**
 * Mobile breakpoint - sidebar collapsed below this width.
 */
const MOBILE_BREAKPOINT = 768

/**
 * Idle timeout threshold (2 minutes in milliseconds).
 */
const IDLE_THRESHOLD = 120 * 1000

/**
 * Sidebar component showing online collaborators.
 *
 * Per CONTEXT.md:
 * - Sidebar layout (right side of canvas)
 * - Adaptive default: collapsed on mobile, open on desktop
 * - Shows online count in header
 * - Clicking collaborator triggers follow mode
 * - Following user shows colored border around viewport
 */
export function PresenceSidebar({
  others,
  onFollowUser,
  followingUserId,
  followingUserColor
}: PresenceSidebarProps) {
  // Responsive: collapsed on mobile, open on desktop
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(prevMobile => {
        // Auto-collapse when transitioning to mobile
        if (mobile && !prevMobile) setIsOpen(false)
        // Auto-open when transitioning to desktop
        if (!mobile && prevMobile) setIsOpen(true)
        return mobile
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const collaborators = Array.from(others.entries())
  const onlineCount = collaborators.length

  /**
   * Determine if a user is idle based on lastActivity timestamp.
   * User is idle if no activity for 2+ minutes.
   */
  const isUserIdle = (state: AwarenessState): boolean => {
    return state.isIdle || (Date.now() - state.lastActivity > IDLE_THRESHOLD)
  }

  /**
   * Handle stop following - call with empty strings to stop.
   */
  const handleStopFollowing = () => {
    onFollowUser('', '', '')
  }

  return (
    <>
      {/* Following indicator border per CONTEXT.md */}
      {followingUserId && followingUserColor && (
        <div
          style={{
            position: 'fixed',
            inset: 4,
            border: `3px solid ${followingUserColor}`,
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 400,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 60,  // Below connection indicator
          right: isOpen ? 0 : -240,
          width: 240,
          maxHeight: 'calc(100vh - 140px)',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '8px 0 0 8px',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
          zIndex: 350,
          transition: 'right 0.2s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Online ({onlineCount})
          </span>
          {followingUserId && (
            <button
              onClick={handleStopFollowing}
              style={{
                fontSize: 11,
                color: '#6366f1',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
                padding: '2px 6px',
              }}
            >
              Stop Following
            </button>
          )}
        </div>

        {/* Collaborator list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 4px',
          }}
        >
          {collaborators.length === 0 ? (
            <div
              style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontSize: 12,
                color: '#9ca3af',
              }}
            >
              No other collaborators
            </div>
          ) : (
            collaborators.map(([clientId, state]) => (
              <CollaboratorItem
                key={clientId}
                state={state}
                isIdle={isUserIdle(state)}
                onFollow={() => onFollowUser(state.user.id, state.user.name, state.user.color)}
              />
            ))
          )}
        </div>
      </div>

      {/* Toggle button - visible on both mobile and desktop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: 60,
          right: isOpen ? 240 : 0,
          width: 28,
          height: 40,
          background: 'rgba(255, 255, 255, 0.95)',
          border: 'none',
          borderRadius: '4px 0 0 4px',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 351,
          transition: 'right 0.2s ease-in-out',
          color: '#6b7280',
        }}
        title={isOpen ? 'Hide collaborators' : 'Show collaborators'}
      >
        {isOpen ? (
          // Right arrow (collapse)
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : (
          // Badge with count when collapsed
          <span style={{ fontSize: 11, fontWeight: 600 }}>{onlineCount}</span>
        )}
      </button>
    </>
  )
}
