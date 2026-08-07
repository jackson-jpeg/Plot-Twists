'use client'

import { useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { EASE_CAMERA, DUR } from '@/lib/motion'

/**
 * Connection banner — "hold please", not an alarm (NORTH-STAR: reconnecting
 * is a live-party moment and deserves calm confidence). Gold while the
 * machinery is working on it; red only when the connection is genuinely lost
 * and the user has to act.
 */

export interface ConnectionBannerProps {
  online: boolean
  connectionState: string
  reconnectAttempt: number
  onRetry: () => void
}

/** Presentational — also rendered by the design-preview harness. */
export function ConnectionBanner({
  online,
  connectionState,
  reconnectAttempt,
  onRetry,
}: ConnectionBannerProps) {
  const showBanner =
    !online ||
    connectionState === 'reconnecting' ||
    (connectionState === 'disconnected' && reconnectAttempt > 0)
  const isFullyLost = connectionState === 'disconnected' && reconnectAttempt > 0

  let headline = 'No internet connection'
  if (online && connectionState === 'reconnecting') {
    headline = 'Hold, please — reconnecting the theater'
  } else if (online && isFullyLost) {
    headline = 'Connection lost'
  }

  const accent = isFullyLost || !online ? 'var(--color-danger)' : 'var(--color-stage-gold)'

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: DUR.slow, ease: EASE_CAMERA }}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 'env(safe-area-inset-top, 0px)',
            left: 0,
            right: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '10px 16px',
            background: 'rgba(8,7,11,0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${accent}55`,
            boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
          }}
        >
          {/* Calm pulse — a stage lamp, not a siren */}
          <motion.span
            aria-hidden
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: accent,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(240,236,228,0.88)',
            }}
          >
            {headline}
          </span>
          {online && connectionState === 'reconnecting' && reconnectAttempt > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-code)',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(240,236,228,0.5)',
              }}
            >
              take {reconnectAttempt}
            </span>
          )}
          {isFullyLost && (
            <button
              onClick={onRetry}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                background: 'var(--color-stage-red)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '6px 14px',
                cursor: 'pointer',
                marginLeft: '4px',
              }}
            >
              Retry
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function ConnectionStatus() {
  // SSR snapshot defaults to true so the banner never flashes during hydration.
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  )
  const { socket, connectionState, reconnectAttempt } = useSocket()

  return (
    <ConnectionBanner
      online={isOnline}
      connectionState={connectionState}
      reconnectAttempt={reconnectAttempt}
      onRetry={() => {
        if (socket && !socket.connected) {
          socket.connect()
        } else {
          window.location.reload()
        }
      }}
    />
  )
}
