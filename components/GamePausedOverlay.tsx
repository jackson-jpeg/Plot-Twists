'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { EASE_CAMERA, DUR } from '@/lib/motion'

/**
 * Intermission title card (NORTH-STAR: deadpan theatrical register — a pause
 * is part of the show, not an emergency). Dark card in the theater world; the
 * old version floated a light-mode surface over the void with a ⏸ emoji.
 */

interface GamePausedOverlayProps {
  visible: boolean
  reason?: string
}

export function GamePausedOverlay({
  visible,
  reason = 'Host disconnected',
}: GamePausedOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.slow, ease: EASE_CAMERA }}
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{
            background: 'rgba(8,7,11,0.88)',
            backdropFilter: 'var(--backdrop-md, blur(8px))',
          }}
          role="alertdialog"
          aria-label="Performance paused"
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: DUR.slower, ease: EASE_CAMERA }}
            className="text-center mx-4"
            style={{
              background: 'var(--color-ink)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-card)',
              maxWidth: '380px',
              width: '100%',
              padding: '44px 32px 36px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-code)',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--color-stage-gold)',
                margin: '0 0 16px',
              }}
            >
              Intermission
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '28px',
                fontWeight: 400,
                lineHeight: 1.15,
                color: 'rgba(240,236,228,0.94)',
                margin: '0 0 10px',
              }}
            >
              The show will resume shortly.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                lineHeight: 1.5,
                color: 'rgba(240,236,228,0.55)',
                margin: '0 0 24px',
              }}
            >
              {reason} — holding for reconnection.
            </p>
            <div className="flex justify-center gap-1.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--color-stage-gold)',
                  }}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
