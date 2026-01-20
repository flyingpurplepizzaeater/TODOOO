import { useEffect, useState } from 'react'
import { createTLStore, defaultShapeUtils, TLRecord, TLStoreWithStatus } from 'tldraw'
import * as Y from 'yjs'
import { YKeyValue } from 'y-utility/y-keyvalue'
import { createYjsProvider } from '../../lib/yjs/provider'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Custom hook that creates a tldraw store synced with Yjs.
 *
 * Implementation follows the bidirectional sync pattern:
 * 1. Local changes (tldraw -> Yjs): Listen to store changes, apply to Yjs
 * 2. Remote changes (Yjs -> tldraw): Observe Yjs array, merge into store
 *
 * Key details:
 * - Uses YKeyValue instead of Y.Map (prevents unbounded memory growth)
 * - Uses mergeRemoteChanges() to prevent echo loops
 * - Filters store.listen with { source: 'user' } to ignore remote changes
 *
 * @param boardId - The board UUID to sync
 * @param token - JWT token for authentication
 * @returns Object with tldraw store and connection status
 */
export function useYjsStore(boardId: string, token: string): {
  store: TLStoreWithStatus
  status: ConnectionStatus
} {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }))
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    const { doc, provider } = createYjsProvider(boardId, token)

    // Use Y.Array with YKeyValue for tldraw records
    // YKeyValue prevents unbounded growth that occurs with Y.Map
    // Each entry is { key: string, val: TLRecord }
    const yArr = doc.getArray<{ key: string; val: TLRecord }>('tldraw')
    const yStore = new YKeyValue(yArr)

    // Track if we're applying remote changes (to prevent echo loops)
    let isApplyingRemote = false

    /**
     * Sync Yjs -> tldraw (handle remote changes)
     *
     * When Yjs document changes from remote peers:
     * 1. Set flag to prevent echo loop
     * 2. Use mergeRemoteChanges() to mark changes as remote
     * 3. Compare current store with Yjs state
     * 4. Add/update/remove records as needed
     */
    const handleYjsChange = () => {
      if (isApplyingRemote) return

      isApplyingRemote = true
      try {
        store.mergeRemoteChanges(() => {
          // Collect all records from Yjs
          const remoteRecords: TLRecord[] = []
          yStore.forEach((value) => {
            if (value) remoteRecords.push(value)
          })

          // Get current store records for comparison
          const currentRecords = store.allRecords()
          const currentIds = new Set(currentRecords.map(r => r.id))
          const remoteIds = new Set(remoteRecords.map(r => r.id))

          // Find records to remove (in store but not in Yjs)
          const idsToRemove: TLRecord['id'][] = []
          currentIds.forEach(id => {
            if (!remoteIds.has(id)) {
              idsToRemove.push(id)
            }
          })

          // Remove deleted records
          if (idsToRemove.length > 0) {
            store.remove(idsToRemove)
          }

          // Add/update records from Yjs
          if (remoteRecords.length > 0) {
            store.put(remoteRecords)
          }
        })
      } finally {
        isApplyingRemote = false
      }
    }

    // Observe Yjs array for changes
    yArr.observe(handleYjsChange)

    /**
     * Sync tldraw -> Yjs (handle local changes)
     *
     * When user makes changes in tldraw:
     * 1. Filter for user-originated changes only (not remote)
     * 2. Wrap in Yjs transaction for efficient batching
     * 3. Apply adds, updates, and deletes to YKeyValue
     */
    const unsub = store.listen(
      ({ changes }) => {
        // Skip if we're currently applying remote changes
        if (isApplyingRemote) return

        doc.transact(() => {
          // Handle added records
          Object.values(changes.added).forEach(record => {
            yStore.set(record.id, record)
          })

          // Handle updated records
          // changes.updated is { [id]: [oldRecord, newRecord] }
          Object.values(changes.updated).forEach(([, record]) => {
            yStore.set(record.id, record)
          })

          // Handle removed records
          Object.values(changes.removed).forEach(record => {
            yStore.delete(record.id)
          })
        })
      },
      { source: 'user', scope: 'document' }
    )

    /**
     * Connection status handling
     */
    provider.on('status', ({ status: wsStatus }: { status: string }) => {
      if (wsStatus === 'connected') {
        setStatus('connected')
      } else if (wsStatus === 'disconnected') {
        setStatus('disconnected')
      }
    })

    provider.on('connection-error', () => {
      setStatus('error')
    })

    /**
     * Initial sync when connected
     *
     * The 'sync' event fires when initial state is received from server.
     * Apply Yjs state to tldraw store to get current board state.
     */
    provider.on('sync', (synced: boolean) => {
      if (synced) {
        handleYjsChange()
      }
    })

    /**
     * Cleanup on unmount or when boardId/token changes
     */
    return () => {
      unsub()
      yArr.unobserve(handleYjsChange)
      provider.destroy()
      doc.destroy()
    }
  }, [boardId, token, store])

  return {
    store: store as TLStoreWithStatus,
    status
  }
}
