'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MOTION } from '@/lib/animations'

interface ReconnectionBannerProps {
  reconnecting: boolean
  attempt?: number
}

export function ReconnectionBanner({ reconnecting, attempt = 0 }: ReconnectionBannerProps) {
  return (
    <AnimatePresence>
      {reconnecting && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={MOTION.snappy}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium font-display"
          style={{
            background: 'var(--color-warning)',
            color: '#000',
            paddingTop: 'max(12px, env(safe-area-inset-top))',
          }}
        >
          Reconnecting{attempt > 1 ? ` (attempt ${attempt})` : ''}...
        </motion.div>
      )}
    </AnimatePresence>
  )
}
