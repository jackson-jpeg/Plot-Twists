'use client'

import { motion } from 'framer-motion'
import type { AdminStats as AdminStatsType } from '@/lib/types'

interface AdminStatsProps {
  stats: AdminStatsType | null
}

const MODE_COLORS: Record<string, string> = {
  SOLO: 'var(--color-accent)',
  HEAD_TO_HEAD: 'var(--color-purple)',
  ENSEMBLE: 'var(--color-pink)',
}

const MODE_LABELS: Record<string, string> = {
  SOLO: 'Solo',
  HEAD_TO_HEAD: 'Head-to-Head',
  ENSEMBLE: 'Ensemble',
}

const MODE_ICONS: Record<string, string> = {
  SOLO: '🎤',
  HEAD_TO_HEAD: '⚔️',
  ENSEMBLE: '🎭',
}

export function AdminStats({ stats }: AdminStatsProps) {
  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="inline-block text-2xl mb-2"
        >
          ⚙️
        </motion.div>
        <p className="text-sm text-[var(--color-text-secondary)]">Loading stats...</p>
      </motion.div>
    )
  }

  const primaryCards = [
    { label: 'Active Rooms', value: stats.activeRooms, icon: '🏠', color: 'var(--color-accent)' },
    { label: 'Connected Sockets', value: stats.connectedSockets, icon: '🔌', color: 'var(--color-purple)' },
    { label: 'Users in Rooms', value: stats.totalUsersInRooms, icon: '👥', color: 'var(--color-pink)' },
    { label: 'Games Today', value: stats.gamesPlayedToday, icon: '🎮', color: 'var(--color-success)' },
  ]

  const gameModeEntries = Object.entries(stats.recentGameModes)
  const totalModes = gameModeEntries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <div className="space-y-5">
      {/* Primary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {primaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center shadow-sm"
            whileHover={{ scale: 1.04, y: -2 }}
          >
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-2xl font-bold font-display" style={{ color: card.color }}>{card.value}</div>
            <div className="text-[10px] text-[var(--color-text-disabled)] mt-0.5 uppercase tracking-wider">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Secondary stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] font-display">Total Registered Users</p>
              <p className="text-xs text-[var(--color-text-disabled)]">All users who have created an account</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-[var(--color-text-primary)] font-display">{stats.totalRegisteredUsers}</span>
        </div>
      </motion.div>

      {/* Game mode breakdown */}
      {gameModeEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4"
        >
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-4 font-display">
            Active Game Modes
          </h3>
          <div className="space-y-3">
            {gameModeEntries.map(([mode, count], i) => {
              const pct = totalModes > 0 ? Math.round((count / totalModes) * 100) : 0
              const color = MODE_COLORS[mode] || 'var(--color-accent)'
              return (
                <div key={mode}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      {MODE_ICONS[mode] || '🎲'} {MODE_LABELS[mode] || mode}
                    </span>
                    <span className="text-xs text-[var(--color-text-disabled)]">
                      {count} room{count !== 1 ? 's' : ''} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 2)}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state for no game modes */}
      {gameModeEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 text-center"
        >
          <p className="text-sm text-[var(--color-text-disabled)]">
            No active game modes — rooms will appear as they're created
          </p>
        </motion.div>
      )}

      {/* Keyboard shortcuts hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3 mt-2"
      >
        <p className="text-[10px] text-[var(--color-text-disabled)] text-center">
          Keyboard shortcuts: <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[10px]">1</kbd> <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[10px]">2</kbd> <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[10px]">3</kbd> switch tabs · <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[10px]">R</kbd> refresh
        </p>
      </motion.div>
    </div>
  )
}
