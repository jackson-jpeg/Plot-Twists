'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Achievement } from '@/lib/types'

interface AchievementToastProps {
  achievements: Achievement[]
  onDismiss: (id: string) => void
}

const RARITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: 'rgba(107, 101, 96, 0.15)', border: 'rgba(107, 101, 96, 0.4)', text: 'var(--color-text-secondary)' },
  rare: { bg: 'rgba(124, 159, 217, 0.15)', border: 'rgba(124, 159, 217, 0.4)', text: 'var(--color-accent-2)' },
  epic: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: 'var(--color-purple)' },
  legendary: { bg: 'rgba(245, 158, 66, 0.15)', border: 'rgba(245, 158, 66, 0.4)', text: 'var(--color-accent)' },
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '360px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {achievements.map((achievement) => (
          <AchievementToastItem
            key={achievement.id}
            achievement={achievement}
            onDismiss={() => onDismiss(achievement.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function AchievementToastItem({ achievement, onDismiss }: { achievement: Achievement; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const colors = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: colors.bg,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
      onClick={onDismiss}
    >
      <motion.div
        style={{ fontSize: '32px', lineHeight: 1 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
      >
        {achievement.icon}
      </motion.div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.text, marginBottom: '2px' }}>
          Achievement Unlocked!
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {achievement.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {achievement.description}
        </div>
      </div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: '999px',
          background: colors.border,
          color: 'var(--color-text-primary)',
        }}
      >
        {achievement.rarity}
      </div>
    </motion.div>
  )
}

/**
 * Hook to manage achievement toast queue
 */
export function useAchievementToasts() {
  const [queue, setQueue] = useState<Achievement[]>([])

  const addAchievement = useCallback((achievement: Achievement) => {
    setQueue(prev => [...prev, achievement])
  }, [])

  const dismissAchievement = useCallback((id: string) => {
    setQueue(prev => prev.filter(a => a.id !== id))
  }, [])

  return { achievements: queue, addAchievement, dismissAchievement }
}
