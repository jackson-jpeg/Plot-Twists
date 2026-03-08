'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { XPEvent } from '@/lib/types'

interface XPGainAnimationProps {
  events: XPEvent[]
  show: boolean
}

export function XPGainAnimation({ events, show }: XPGainAnimationProps) {
  const totalXP = events.reduce((sum, e) => sum + e.amount, 0)

  return (
    <AnimatePresence>
      {show && events.length > 0 && (
        <motion.div
          className="flex flex-col items-center gap-1.5 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {events.map((event, i) => (
            <motion.div
              key={`${event.source}-${i}`}
              className="flex items-center gap-2 text-sm"
              initial={{ opacity: 0, y: 10, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: i * 0.15 + 0.2 }}
            >
              <span className="text-[var(--color-text-secondary)]">{event.description}</span>
              <span className="font-bold text-[var(--color-accent)]">+{event.amount} XP</span>
            </motion.div>
          ))}
          <motion.div
            className="mt-2 text-lg font-bold text-[var(--color-accent)]"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: events.length * 0.15 + 0.3, type: 'spring', stiffness: 200 }}
          >
            +{totalXP} XP Total
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
