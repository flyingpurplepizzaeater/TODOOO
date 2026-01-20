import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { config } from '../../config'

/**
 * Creates a Yjs document and WebSocket provider for a board.
 *
 * Note: The y-websocket provider expects a standard y-websocket server.
 * Our backend uses pycrdt-websocket which is compatible with the Yjs protocol.
 * The URL format is: ws://host:port/ws/canvas/{boardId}?token={jwt}
 *
 * @param boardId - The board UUID to connect to
 * @param token - JWT token for authentication
 * @returns Object containing the Y.Doc and WebsocketProvider
 */
export function createYjsProvider(boardId: string, token: string) {
  const doc = new Y.Doc()

  // Build WebSocket URL with token as query param
  // Backend expects: /ws/canvas/{board_id}?token={jwt}
  const wsBaseUrl = config.wsUrl.replace(/\/$/, '') // Remove trailing slash if present
  const wsUrl = `${wsBaseUrl}/ws/canvas/${boardId}?token=${token}`

  // y-websocket provider connects to our pycrdt-websocket backend
  // The 'roomname' parameter is used by y-websocket for room identification
  // We use boardId as the room name for clarity
  const provider = new WebsocketProvider(
    wsUrl,
    boardId,
    doc,
    {
      connect: true,
      // Params are already in URL, but provider may append roomname
      params: { token }
    }
  )

  return { doc, provider }
}

/**
 * Destroys the Yjs provider and document cleanly.
 *
 * @param doc - The Y.Doc to destroy
 * @param provider - The WebsocketProvider to destroy
 */
export function destroyYjsProvider(doc: Y.Doc, provider: WebsocketProvider) {
  provider.destroy()
  doc.destroy()
}
