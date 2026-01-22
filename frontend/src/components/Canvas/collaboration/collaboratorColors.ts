/**
 * 12-color palette optimized for distinguishability.
 *
 * Colors are selected for:
 * - Visual distinction from each other
 * - Good contrast on both light and dark backgrounds
 * - Accessibility (avoiding pure red/green pairs)
 */
export const COLLABORATOR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#6C5CE7', // Purple
  '#00B894', // Green
  '#FDCB6E', // Gold
  '#74B9FF', // Blue
  '#E17055', // Orange
  '#A29BFE', // Lavender
  '#55A3FF', // Sky
] as const

/**
 * Derives a deterministic color from a user ID.
 *
 * Uses a simple hash function to map any string to an index in the color palette.
 * The same user ID will always produce the same color across all clients.
 *
 * @param userId - The user's unique identifier
 * @returns Hex color string from COLLABORATOR_COLORS palette
 */
export function colorFromUserId(userId: string): string {
  // djb2 hash algorithm - simple and effective for string hashing
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit int
  }
  return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length]
}

/**
 * Assigns a color based on sequential index.
 *
 * Useful when colors need to be assigned in order (e.g., first user = red).
 *
 * @param index - Sequential index (0-based)
 * @returns Hex color string from COLLABORATOR_COLORS palette
 */
export function colorFromIndex(index: number): string {
  return COLLABORATOR_COLORS[Math.abs(index) % COLLABORATOR_COLORS.length]
}
