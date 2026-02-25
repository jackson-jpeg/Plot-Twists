'use client'

import { motion } from 'framer-motion'
import type { GameMode } from '@/lib/types'

interface QuickPlayButtonProps {
  mode: GameMode
  label: string
  emoji: string
  description: string
  isMatching: boolean
  onPlay: () => void
}

export function QuickPlayButton({ label, emoji, description, isMatching, onPlay }: QuickPlayButtonProps) {
  return (
    <motion.button
      onClick={onPlay}
      disabled={isMatching}
      className="relative rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 text-center hover:border-[var(--color-purple)]/50 transition-colors disabled:opacity-60"
      whileHover={isMatching ? undefined : { y: -3, scale: 1.02 }}
      whileTap={isMatching ? undefined : { scale: 0.97 }}
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-sm font-bold text-[var(--color-text-primary)] font-display">{label}</div>
      <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{description}</div>
      {isMatching && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-[var(--color-purple)]/10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-purple)]">
            <motion.div
              className="w-4 h-4 border-2 border-[var(--color-purple)] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Matching...
          </div>
        </motion.div>
      )}
    </motion.button>
  )
}
