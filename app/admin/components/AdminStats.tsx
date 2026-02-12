'use client'

import { motion } from 'framer-motion'
import type { AdminStats as AdminStatsType } from '@/lib/types'

interface AdminStatsProps {
  stats: AdminStatsType | null
}

export function AdminStats({ stats }: AdminStatsProps) {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-secondary)] font-handwritten">Loading stats...</p>
      </div>
    )
  }

  const cards = [
    { label: 'Active Rooms', value: stats.activeRooms, icon: '🏠' },
    { label: 'Connected Sockets', value: stats.connectedSockets, icon: '🔌' },
    { label: 'Users in Rooms', value: stats.totalUsersInRooms, icon: '👥' },
    { label: 'Games Today', value: stats.gamesPlayedToday, icon: '🎮' },
  ]

  const gameModeEntries = Object.entries(stats.recentGameModes)
  const totalModes = gameModeEntries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center"
            whileHover={{ scale: 1.04, y: -2 }}
          >
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)] font-display">{card.value}</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Game mode breakdown */}
      {gameModeEntries.length > 0 && (
        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3 font-display">
            Active Game Modes
          </h3>
          <div className="space-y-2">
            {gameModeEntries.map(([mode, count]) => {
              const pct = totalModes > 0 ? Math.round((count / totalModes) * 100) : 0
              return (
                <div key={mode} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] w-28">{mode}</span>
                  <div className="flex-1 h-6 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-tertiary)] w-16 text-right">{count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
