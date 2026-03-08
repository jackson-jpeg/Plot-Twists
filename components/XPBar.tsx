'use client'

import { motion } from 'framer-motion'
import type { LevelInfo } from '@/lib/types'

interface XPBarProps {
  levelInfo: LevelInfo
  compact?: boolean
}

export function XPBar({ levelInfo, compact }: XPBarProps) {
  const { level, currentXP, xpForNextLevel, progressPercent, title } = levelInfo

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--color-accent)]">Lv.{level}</span>
          <span className="text-xs text-[var(--color-text-secondary)]">{title}</span>
        </div>
        <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'var(--color-accent)',
              boxShadow: progressPercent >= 90 ? '0 0 8px var(--color-accent)' : undefined,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[var(--color-accent)]">Level {level}</span>
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</span>
        </div>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {currentXP} / {xpForNextLevel} XP
        </span>
      </div>
      <div className="h-3 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'var(--color-accent)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
