import { useState } from 'react'
import type { TLCursorProps } from 'tldraw'

/**
 * Custom dot-shaped cursor component for collaborators.
 *
 * Per CONTEXT.md requirements:
 * - Dot/circle shape (not arrow pointer) for unobtrusive feel
 * - Medium size (16-20px) for visibility without dominance
 * - Username label appears on hover only (keeps canvas clean)
 * - Size adjusts inversely with zoom to maintain consistent screen size
 *
 * Props from tldraw's TLCursorProps:
 * - point: Cursor position {x, y} in page coordinates
 * - zoom: Current canvas zoom level
 * - color: User's assigned cursor color
 * - name: User's display name
 * - userId: User's unique ID
 * - chatMessage: Optional chat message (unused in this component)
 */
export function DotCursor({ point, zoom, color, name }: TLCursorProps) {
  const [showName, setShowName] = useState(false)

  // Base size of 18px at zoom 1.0 (within CONTEXT.md's 16-20px range)
  // Dividing by zoom keeps screen size constant regardless of canvas zoom
  const BASE_SIZE = 18
  const size = BASE_SIZE / zoom

  // If no point, don't render
  if (!point) return null

  // Default color fallback
  const cursorColor = color ?? '#888888'

  return (
    <div
      style={{
        position: 'absolute',
        left: point.x,
        top: point.y,
        transform: 'translate(-50%, -50%)', // Center on cursor position
        pointerEvents: 'auto', // Enable hover detection
      }}
      onMouseEnter={() => setShowName(true)}
      onMouseLeave={() => setShowName(false)}
    >
      {/* Dot cursor */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: cursorColor,
          border: `${2 / zoom}px solid white`, // Scale border with zoom
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          transition: 'opacity 0.3s ease', // Per CONTEXT.md: cursor fade animation
        }}
      />

      {/* Username label - shown on hover only per CONTEXT.md */}
      {showName && name && (
        <div
          style={{
            position: 'absolute',
            top: size + 4 / zoom, // Offset below dot, scaled with zoom
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: cursorColor,
            color: 'white',
            padding: `${2 / zoom}px ${8 / zoom}px`,
            borderRadius: 4 / zoom,
            fontSize: 11 / zoom,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {name}
        </div>
      )}
    </div>
  )
}
