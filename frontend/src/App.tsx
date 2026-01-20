import { Canvas } from './components/Canvas'

// TODO: These will come from routing/auth in later phases
const TEST_BOARD_ID = 'test-board-123'
const TEST_TOKEN = '' // Empty for now - backend will reject without valid token

function App() {
  // Show Canvas if we have a token, otherwise show setup instructions
  if (!TEST_TOKEN) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        background: '#f8fafc',
      }}>
        <h1 style={{ margin: 0, fontSize: 28, color: '#1e293b' }}>
          CollabBoard Canvas
        </h1>
        <p style={{ margin: 0, color: '#64748b', maxWidth: 400 }}>
          Canvas is ready. To test real-time sync:
        </p>
        <ol style={{
          textAlign: 'left',
          margin: 0,
          padding: '0 0 0 20px',
          color: '#334155',
          lineHeight: 1.8,
        }}>
          <li>Start backend: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>uvicorn main:app --reload</code></li>
          <li>Create a user and get a JWT token via <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>POST /auth/register</code></li>
          <li>Create a board via <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>POST /boards</code></li>
          <li>Set <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>TEST_TOKEN</code> and <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>TEST_BOARD_ID</code> in App.tsx</li>
          <li>Refresh the page</li>
        </ol>
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#f0fdf4',
          borderRadius: 8,
          border: '1px solid #bbf7d0',
          maxWidth: 400,
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#166534' }}>
            tldraw is installed and ready to render. The canvas will appear once you configure authentication.
          </p>
        </div>
      </div>
    )
  }

  return <Canvas boardId={TEST_BOARD_ID} token={TEST_TOKEN} />
}

export default App
