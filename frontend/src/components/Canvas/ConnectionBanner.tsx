/**
 * Connection status banner for mobile apps.
 *
 * CONTEXT.md requirements:
 * - Connection loss: Warning banner but allow continued editing
 * - Reconnection: Auto-dismiss banner ("Reconnected!" fades after 2-3s)
 */
import { useEffect, useState, useRef } from 'react';
import type { ConnectionStatus } from './useYjsStore';

interface ConnectionBannerProps {
  status: ConnectionStatus;
}

/**
 * Shows connection status banners for disconnection and reconnection.
 *
 * - Disconnected: Persistent warning banner
 * - Reconnected: Success banner that auto-dismisses after 2.5s
 */
export function ConnectionBanner({ status }: ConnectionBannerProps) {
  const [showReconnected, setShowReconnected] = useState(false);
  const wasDisconnectedRef = useRef(false);

  useEffect(() => {
    if (status === 'disconnected' || status === 'error') {
      wasDisconnectedRef.current = true;
    }

    if (status === 'connected' && wasDisconnectedRef.current) {
      setShowReconnected(true);
      wasDisconnectedRef.current = false;

      // Auto-dismiss after 2.5 seconds per CONTEXT.md
      const timer = setTimeout(() => setShowReconnected(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Disconnected/error banner
  if (status === 'disconnected' || status === 'error') {
    return (
      <div style={{
        position: 'absolute',
        top: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        padding: '8px 16px',
        borderRadius: 8,
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        color: '#92400e',
        fontSize: 14,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 500,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>!</span>
        Connection lost. Changes saved locally.
      </div>
    );
  }

  // Reconnected success banner
  if (showReconnected) {
    return (
      <div style={{
        position: 'absolute',
        top: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        padding: '8px 16px',
        borderRadius: 8,
        background: '#d1fae5',
        border: '1px solid #10b981',
        color: '#065f46',
        fontSize: 14,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 500,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.3s ease-out',
      }}>
        Reconnected!
      </div>
    );
  }

  return null;
}
