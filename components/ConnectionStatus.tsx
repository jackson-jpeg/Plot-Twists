'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SPRING } from '@/lib/motion'
import { useSocket } from '@/contexts/SocketContext'
import { Button } from '@/components/ui/Button'

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const { socket, connectionState, reconnectAttempt } = useSocket()

  useEffect(() => {
    // Set initial state (avoid SSR mismatch by defaulting to true)
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const showBanner = !isOnline || connectionState === 'reconnecting' || (connectionState === 'disconnected' && reconnectAttempt > 0)
  const isFullyLost = connectionState === 'disconnected' && reconnectAttempt > 0

  let message = 'No internet connection'
  if (isOnline && connectionState === 'reconnecting') {
    message = `Reconnecting... (attempt ${reconnectAttempt})`
  } else if (isOnline && isFullyLost) {
    message = 'Connection lost'
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={SPRING}
          style={{
            position: 'fixed',
            top: 'env(safe-area-inset-top, 0px)',
            left: 0,
            right: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'rgba(8,7,11,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(231,76,60,0.3)',
            color: 'rgba(231,76,60,0.9)',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            textAlign: 'center',
            boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          {message}
          {isFullyLost && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (socket && !socket.connected) {
                  socket.connect()
                } else {
                  window.location.reload()
                }
              }}
              style={{
                marginLeft: '8px',
                background: 'rgba(231,76,60,0.15)',
                border: '1px solid rgba(231,76,60,0.35)',
                color: 'rgba(231,76,60,0.9)',
              }}
            >
              Retry
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
