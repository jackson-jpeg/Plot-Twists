'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface AutoStartCountdownProps {
  seconds: number | null
}

export function AutoStartCountdown({ seconds }: AutoStartCountdownProps) {
  return (
    <AnimatePresence>
      {seconds !== null && seconds > 0 && (
        <motion.div
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-purple)]/10 border border-[var(--color-purple)]/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <motion.div
            className="w-5 h-5 rounded-full border-2 border-[var(--color-purple)]"
            style={{
              background: `conic-gradient(var(--color-purple) ${((30 - seconds) / 30) * 360}deg, transparent 0deg)`,
            }}
          />
          <span className="text-sm font-medium text-[var(--color-purple)]">
            Game starts in {seconds}s
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
