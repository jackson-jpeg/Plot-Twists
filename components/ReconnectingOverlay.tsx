'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { SPRING_GENTLE, STAGGER } from '@/lib/motion'

interface ReconnectingOverlayProps {
  /** Only show during active game phases */
  gameState: string
}

const ACTIVE_GAME_STATES = new Set([
  'SELECTION', 'LOADING', 'PERFORMING', 'VOTING', 'RESULTS',
])

export function ReconnectingOverlay({ gameState }: ReconnectingOverlayProps) {
  const { connectionState, reconnectAttempt } = useSocket()

  const isActiveGame = ACTIVE_GAME_STATES.has(gameState)
  const isDisconnected = connectionState === 'disconnected' || connectionState === 'reconnecting'
  const show = isActiveGame && isDisconnected

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={SPRING_GENTLE}
            className="text-center p-8 rounded-2xl max-w-xs mx-4"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="relative flex justify-center mb-4">
              <motion.div
                className="absolute inset-0 m-auto w-16 h-16 rounded-full"
                style={{ background: 'var(--color-accent)', filter: 'blur(18px)' }}
                animate={{ opacity: [0.2, 0.45, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="relative text-5xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                📡
              </motion.div>
            </div>
            <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Reconnecting...
            </h2>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Connection lost. Trying to get back on stage.
            </p>
            {reconnectAttempt > 1 && (
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Attempt {reconnectAttempt}
              </p>
            )}
            <div className="mt-4 flex justify-center">
              <motion.div
                className="flex gap-1"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * STAGGER * 5 }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
