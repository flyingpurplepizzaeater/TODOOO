import { useState, useCallback, useEffect } from 'react'
import { Editor } from 'tldraw'

interface FollowState {
  isFollowing: boolean
  followingUserId: string | null
  followingUserName: string | null
  followingUserColor: string | null
}

/**
 * Hook for following another user's viewport.
 *
 * Per CONTEXT.md:
 * - Follow mode: click avatar in presence panel to follow their viewport
 * - Following indicated by: toast notification on start + colored border around viewport
 * - Stop following: pan/zoom manually OR click explicit button
 *
 * This hook wraps tldraw's built-in follow API with state tracking
 * to enable UI indicators (colored border, stop button visibility).
 *
 * @param editor - The tldraw editor instance (or null if not ready)
 * @returns Follow state and control functions
 */
export function useFollowMode(editor: Editor | null) {
  const [followState, setFollowState] = useState<FollowState>({
    isFollowing: false,
    followingUserId: null,
    followingUserName: null,
    followingUserColor: null
  })

  /**
   * Start following a user's viewport.
   * Updates local state and calls tldraw's startFollowingUser.
   */
  const startFollowing = useCallback((userId: string, userName: string, color: string) => {
    if (!editor) return

    // tldraw has built-in follow functionality
    editor.startFollowingUser(userId)

    setFollowState({
      isFollowing: true,
      followingUserId: userId,
      followingUserName: userName,
      followingUserColor: color
    })

    // Show toast notification - just log for now, can enhance with toast library later
    console.log(`Now following ${userName}`)
  }, [editor])

  /**
   * Stop following the current user.
   */
  const stopFollowing = useCallback(() => {
    if (!editor) return

    editor.stopFollowingUser()

    setFollowState({
      isFollowing: false,
      followingUserId: null,
      followingUserName: null,
      followingUserColor: null
    })
  }, [editor])

  // Detect when user manually stops following (pan/zoom)
  // tldraw automatically stops following when user interacts, we sync state
  useEffect(() => {
    if (!editor || !followState.isFollowing) return

    const handleCameraChange = () => {
      // Check if tldraw still considers us to be following via instance state
      // When user pans/zooms manually, tldraw clears the followingUserId
      const instance = editor.getInstanceState()
      const tldrawFollowing = instance.followingUserId
      if (!tldrawFollowing && followState.isFollowing) {
        // User manually panned/zoomed, update our state
        setFollowState({
          isFollowing: false,
          followingUserId: null,
          followingUserName: null,
          followingUserColor: null
        })
      }
    }

    // Listen for user-initiated camera changes
    const unsub = editor.store.listen(handleCameraChange, { source: 'user' })
    return unsub
  }, [editor, followState.isFollowing])

  return { ...followState, startFollowing, stopFollowing }
}
