'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MOTION } from '@/lib/animations'
import { useEffect } from 'react'
import { successHaptic } from '@/hooks/useHaptics'
import { useConfetti } from '@/hooks/useConfetti'

interface LevelUpCelebrationProps {
  show: boolean
  level: number
  title: string
  onClose: () => void
}

export function LevelUpCelebration({ show, level, title, onClose }: LevelUpCelebrationProps) {
  const { fireConfetti } = useConfetti()

  useEffect(() => {
    if (show) {
      successHaptic()
      fireConfetti()
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose, fireConfetti])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60" />
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4 p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl max-w-sm mx-4"
            initial={{ scale: 0.3, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={MOTION.dramatic}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              className="text-6xl"
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              🎉
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                Level Up!
              </div>
              <div className="text-4xl font-bold font-display" style={{ color: 'var(--color-accent)' }}>
                Level {level}
              </div>
              <div className="mt-1 text-lg font-medium text-[var(--color-text-primary)]">
                {title}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
