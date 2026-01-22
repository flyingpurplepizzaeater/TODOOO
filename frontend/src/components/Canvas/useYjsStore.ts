import { useEffect, useRef, useState } from 'react'
import { createTLStore, defaultShapeUtils, type TLRecord, type TLStoreWithStatus, type TLAssetStore } from 'tldraw'
import * as Y from 'yjs'
import { YKeyValue } from 'y-utility/y-keyvalue'
import { createYjsProvider } from '../../lib/yjs/provider'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Return type for useYjsStore hook.
 * Includes doc and yArr refs for UndoManager integration.
 */
export interface YjsStoreResult {
  store: TLStoreWithStatus
  status: ConnectionStatus
  doc: Y.Doc | null
  yArr: Y.Array<{ key: string; val: TLRecord }> | null
}

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
 * - Passes clientId as transaction origin for per-user undo tracking
 *
 * @param boardId - The board UUID to sync
 * @param token - JWT token for authentication
 * @param assetStore - Optional TLAssetStore for persistent image storage
 * @returns Object with tldraw store, connection status, doc, and yArr for UndoManager
 */
export function useYjsStore(boardId: string, token: string, assetStore?: TLAssetStore): YjsStoreResult {
  const [store] = useState(() => createTLStore({
    shapeUtils: defaultShapeUtils,
    assets: assetStore,
  }))
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  // Refs for UndoManager access - these are exposed for per-user undo/redo
  const docRef = useRef<Y.Doc | null>(null)
  const yArrRef = useRef<Y.Array<{ key: string; val: TLRecord }> | null>(null)

  useEffect(() => {
    const { doc, provider } = createYjsProvider(boardId, token)
    docRef.current = doc

    // Get clientId for transaction origins (enables per-user undo)
    const clientId = doc.clientID

    // Use Y.Array with YKeyValue for tldraw records
    // YKeyValue prevents unbounded growth that occurs with Y.Map
    // Each entry is { key: string, val: TLRecord }
    const yArr = doc.getArray<{ key: string; val: TLRecord }>('tldraw')
    yArrRef.current = yArr
    const yStore = new YKeyValue(yArr)

    // Track if we're applying remote changes (to prevent echo loops)
    let isApplyingRemote = false

    /**
     * Sync Yjs -> tldraw (handle remote changes)
     *
     * When Yjs document changes from remote peers:
     * 1. Skip if this is our own transaction (already applied locally)
     * 2. Set flag to prevent echo loop
     * 3. Use mergeRemoteChanges() to mark changes as remote
     * 4. Compare current store with Yjs state
     * 5. Add/update/remove records as needed
     */
    const handleYjsChange = (_events: Y.YEvent<unknown>[], transaction: Y.Transaction) => {
      // Skip if this is our own transaction (we already applied it locally)
      if (transaction.origin === clientId) return
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
    yArr.observeDeep(handleYjsChange)

    /**
     * Sync tldraw -> Yjs (handle local changes)
     *
     * When user makes changes in tldraw:
     * 1. Filter for user-originated changes only (not remote)
     * 2. Wrap in Yjs transaction with clientId as origin for per-user undo
     * 3. Apply adds, updates, and deletes to YKeyValue
     *
     * IMPORTANT: clientId as transaction origin enables per-user undo tracking
     */
    const unsub = store.listen(
      ({ changes }) => {
        // Skip if we're currently applying remote changes
        if (isApplyingRemote) return

        // Pass clientId as origin so UndoManager tracks this change
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
        }, clientId) // <-- clientId as transaction origin for per-user undo
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
      yArr.unobserveDeep(handleYjsChange)
      provider.destroy()
      doc.destroy()
      docRef.current = null
      yArrRef.current = null
    }
  }, [boardId, token, store])

  return {
    store: store as TLStoreWithStatus,
    status,
    doc: docRef.current,
    yArr: yArrRef.current,
  }
}
