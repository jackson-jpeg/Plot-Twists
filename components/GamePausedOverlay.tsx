'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MOTION } from '@/lib/animations'

interface GamePausedOverlayProps {
  visible: boolean
  reason?: string
}

export function GamePausedOverlay({ visible, reason = 'Host disconnected' }: GamePausedOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION.gentle}
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={MOTION.bouncy}
            className="text-center px-8 py-10 rounded-2xl mx-4"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              maxWidth: '400px',
            }}
          >
            <motion.div
              className="text-4xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⏸
            </motion.div>
            <h2
              className="font-display text-xl mb-2"
              style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}
            >
              Performance Paused
            </h2>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}
            >
              {reason} — waiting for reconnection...
            </p>
            <motion.div
              className="flex justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-warning)',
                  }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
