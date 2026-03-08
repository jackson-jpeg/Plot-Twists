'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { PlayerStats, Achievement, LeaderboardEntry, LeaderboardCategory } from '@/lib/types'
import { GameHistory } from './GameHistory'
import { StatsSkeleton } from './EmptyState'

interface PlayerProfileProps {
  playerId: string
  onClose?: () => void
  hideHeader?: boolean
}

const RARITY_BADGE_BG: Record<string, string> = {
  common: 'var(--color-text-tertiary)',
  rare: 'var(--color-blue)',
  epic: 'var(--color-purple)',
  legendary: 'var(--color-gold)',
}

const RARITY_FRAME_CLASS: Record<string, string> = {
  rare: 'achievement-card-rare',
  epic: 'achievement-card-epic',
  legendary: 'achievement-card-legendary',
}

export function PlayerProfile({ playerId, onClose, hideHeader = false }: PlayerProfileProps) {
  const { socket } = useSocket()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history'>('stats')

  const fetchStats = useCallback(() => {
    if (!socket || !playerId) {
      setLoading(false)
      return
    }

    setLoading(true)
    socket.emit('get_player_stats', playerId, (response) => {
      setLoading(false)
      if (response.success && response.stats) {
        setStats(response.stats)
      } else {
        setError(response.error || 'Failed to load stats')
      }
    })
  }, [socket, playerId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <StatsSkeleton />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-[var(--color-danger)]">
        <p>{error || 'Profile not found'}</p>
        <button onClick={fetchStats} className="mt-2 text-[var(--color-accent)] hover:underline">
          Try again
        </button>
      </div>
    )
  }

  const unlockedAchievements = stats.achievements.filter(a => a.unlockedAt)
  const lockedAchievements = stats.achievements.filter(a => !a.unlockedAt)

  // Show onboarding for new players with no games
  if (stats.gamesPlayed === 0) {
    return (
      <div className="text-center py-8">
        <motion.div
          className="text-7xl mb-6"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          🎭
        </motion.div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-display mb-3">Ready for Your Debut?</h2>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-xs mx-auto">
          Play your first game to start tracking stats and unlock achievements!
        </p>

        {/* What you'll unlock */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
          <motion.div
            className="p-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Stats</div>
          </motion.div>
          <motion.div
            className="p-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-2xl mb-1">🏅</div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Achievements</div>
          </motion.div>
          <motion.div
            className="p-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Leaderboard</div>
          </motion.div>
        </div>

        <motion.a
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-xl shadow-lg"
          style={{ background: 'var(--color-accent)' }}
          whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(245, 158, 66, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-xl">🎬</span>
          <span>Start Playing</span>
        </motion.a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-3xl font-bold text-white">
              {stats.nickname[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-display">{stats.nickname}</h2>
              <p className="text-[var(--color-text-secondary)]">
                Playing since {new Date(stats.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] text-2xl"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {!hideHeader && (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <StatCard
            icon="🎮"
            label="Games"
            value={stats.gamesPlayed}
            index={0}
          />
          <StatCard
            icon="🏆"
            label="Wins"
            value={stats.gamesWon}
            index={1}
          />
          <StatCard
            icon="📈"
            label="Win Rate"
            value={`${Math.round(stats.winRate)}%`}
            index={2}
          />
          <StatCard
            icon="🔥"
            label="Best Streak"
            value={stats.bestWinStreak}
            index={3}
          />
        </motion.div>
      )}

      {/* Current Streak Banner */}
      {!hideHeader && stats.currentWinStreak >= 2 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl p-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(to right, var(--color-accent-light), var(--color-danger-light))',
            border: '1px solid var(--color-accent)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--color-accent-dark)' }}>On Fire!</p>
              <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
                {stats.currentWinStreak} game win streak
              </p>
            </div>
          </div>
          <span className="text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>
            {stats.currentWinStreak}
          </span>
        </motion.div>
      )}

      {/* Tabs - styled as paper tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)] pb-0 relative">
        {(['stats', 'achievements', 'history'] as const).map((tab, index) => {
          const rotations = [-1, 0.5, -0.5]
          const isActive = activeTab === tab

          return (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-t-lg font-medium transition-all border border-b-0 relative -mb-px ${
                isActive
                  ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] z-10'
                  : 'bg-[var(--color-surface-alt)] border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
              }`}
              style={{
                transform: isActive ? 'rotate(0deg) translateY(-2px)' : `rotate(${rotations[index]}deg)`,
                boxShadow: isActive ? 'var(--shadow-2)' : 'none'
              }}
              whileHover={!isActive ? { y: -2, rotate: 0 } : {}}
              whileTap={{ scale: 0.98 }}
            >
              {tab === 'stats' && '📊 Stats'}
              {tab === 'achievements' && `🏅 Achievements (${unlockedAchievements.length})`}
              {tab === 'history' && '📜 History'}
            </motion.button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Favorite Character */}
            {stats.favoriteCharacter && (
              <motion.div
                className="relative rounded-xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="p-5">
                  <h3 className="text-sm text-[var(--color-text-tertiary)] mb-2 font-display">Favorite Character</h3>
                  <div className="flex items-center gap-3">
                    <motion.span
                      className="text-3xl"
                      animate={{ rotate: [-5, 5, -5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🎭
                    </motion.span>
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)] text-lg">{stats.favoriteCharacter}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Played {stats.characterCounts[stats.favoriteCharacter]} times
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Game Mode Breakdown */}
            <motion.div
              className="relative rounded-xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="p-5">
                <h3 className="text-sm text-[var(--color-text-tertiary)] mb-3 font-display">Game Mode Performance</h3>
                <div className="space-y-3">
                  <ModeStatRow
                    mode="Solo"
                    icon="🎤"
                    stats={stats.gameModeStats.solo}
                  />
                  <ModeStatRow
                    mode="Head to Head"
                    icon="⚔️"
                    stats={stats.gameModeStats.headToHead}
                  />
                  <ModeStatRow
                    mode="Ensemble"
                    icon="👥"
                    stats={stats.gameModeStats.ensemble}
                  />
                </div>
              </div>
            </motion.div>

            {/* Audience Love */}
            <motion.div
              className="relative rounded-xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="p-5">
                <h3 className="text-sm text-[var(--color-text-tertiary)] mb-2 font-display">Audience Reactions</h3>
                <div className="flex items-center gap-4">
                  <motion.div
                    className="text-4xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    😂
                  </motion.div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)] font-display">{stats.totalReactionsReceived}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">total reactions received</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-display mb-4 flex items-center gap-2">
                  <span className="font-handwritten text-[var(--color-accent)]">★</span>
                  Unlocked ({unlockedAchievements.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {unlockedAchievements.map((achievement, index) => (
                    <AchievementCard key={achievement.id} achievement={achievement} unlocked index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-tertiary)] font-display mb-4">
                  Locked ({lockedAchievements.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lockedAchievements.map((achievement, index) => (
                    <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} index={index} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <GameHistory playerId={playerId} showTitle={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const emojiWiggle = {
  initial: { rotate: 0 },
  animate: {
    rotate: [-3, 3, -3],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
}

// Sub-components

function StatCard({ icon, label, value, index = 0 }: { icon: string, label: string, value: string | number, index?: number }) {
  const rotations = [-1, 1, -0.5, 1.5]
  const rotation = rotations[index % rotations.length]

  return (
    <motion.div
      className="p-4 text-center relative rounded-xl"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      variants={staggerItem}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="text-2xl mb-1"
        variants={emojiWiggle}
        initial="initial"
        animate="animate"
      >
        {icon}
      </motion.div>
      <div className="text-xl font-bold text-[var(--color-text-primary)] font-display">{value}</div>
      <div className="text-xs text-[var(--color-text-tertiary)]">{label}</div>
    </motion.div>
  )
}

function ModeStatRow({
  mode,
  icon,
  stats
}: {
  mode: string
  icon: string
  stats: { played: number, won: number }
}) {
  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-[var(--color-text-secondary)]">{mode}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-[var(--color-text-tertiary)]">{stats.played} played</span>
        <span className="text-[var(--color-success)]">{stats.won} won</span>
        <span className="text-[var(--color-accent)]">{winRate}%</span>
      </div>
    </div>
  )
}

function AchievementCard({ achievement, unlocked, index = 0 }: { achievement: Achievement, unlocked: boolean, index?: number }) {
  const rotations = [-1, 1, -0.5, 1.5, 0.5, -1.5]
  const rotation = rotations[index % rotations.length]
  const rarityClass = RARITY_FRAME_CLASS[achievement.rarity] || ''
  const progressPct = (!unlocked && achievement.progress !== undefined && achievement.target)
    ? Math.min((achievement.progress / achievement.target) * 100, 100)
    : 0

  const handleShare = async () => {
    const text = `I unlocked "${achievement.name}" (${achievement.rarity}) in Plot Twists! ${achievement.icon}`
    if (navigator.share) {
      try {
        await navigator.share({ text, url: window.location.origin })
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: unlocked ? rotation + 5 : 0 }}
      animate={{ opacity: 1, y: 0, rotate: unlocked ? rotation : 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, rotate: 0 }}
      className={`relative transition-all ${
        unlocked
          ? `polaroid-card ${rarityClass}`
          : 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg opacity-60'
      }`}
    >
      {/* Tape decoration for unlocked achievements */}
      {unlocked && (
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ background: 'var(--color-accent)' }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <motion.div
              className="text-3xl"
              style={!unlocked ? { filter: 'blur(1px) saturate(0.3)', opacity: 0.5 } : undefined}
              animate={unlocked ? { rotate: [-3, 3, -3] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {achievement.icon}
            </motion.div>
            {!unlocked && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '16px', zIndex: 1 }}>🔒</div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold truncate ${unlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-disabled)]'}`}>
                {achievement.name}
              </h4>
              <span
                className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{
                  background: RARITY_BADGE_BG[achievement.rarity] || 'var(--color-text-tertiary)',
                  color: achievement.rarity === 'legendary' ? 'var(--color-text-primary)' : 'white',
                }}
              >
                {achievement.rarity}
              </span>
            </div>
            <p className={`text-xs mt-1 ${unlocked ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-disabled)]'}`}>
              {achievement.description}
            </p>
            {/* Animated progress bar for locked achievements */}
            {!unlocked && achievement.progress !== undefined && achievement.target && (
              <div className="mt-2">
                <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: progressPct >= 75 ? 'var(--color-success)' : 'var(--color-accent)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, delay: index * 0.06 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-disabled)] mt-1">
                  {achievement.progress} / {achievement.target}
                </p>
              </div>
            )}
            {unlocked && achievement.unlockedAt && (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-[var(--color-text-tertiary)] font-handwritten">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
                <motion.button
                  onClick={handleShare}
                  className="text-xs px-2 py-0.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  Share
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Leaderboard Component
export function Leaderboard({ category = 'wins' }: { category?: LeaderboardCategory }) {
  const { socket } = useSocket()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>(category)

  const fetchLeaderboard = useCallback(() => {
    if (!socket) return

    setLoading(true)
    socket.emit('get_leaderboard', activeCategory, 10, (response) => {
      setLoading(false)
      if (response.success && response.entries) {
        setEntries(response.entries.filter(e => e.value > 0))
      }
    })
  }, [socket, activeCategory])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const categories: { key: LeaderboardCategory, label: string }[] = [
    { key: 'wins', label: 'Wins' },
    { key: 'games', label: 'Games' },
    { key: 'winRate', label: 'Win %' },
    { key: 'streak', label: 'Streak' }
  ]

  const medals = ['1st', '2nd', '3rd']
  const medalColors = ['var(--color-accent)', 'var(--color-text-tertiary)', 'var(--color-text-disabled)']

  // Split entries into podium (top 3) and remaining rows
  const hasPodium = entries.length >= 3
  const podiumEntries = hasPodium ? entries.slice(0, 3) : []
  const rowEntries = hasPodium ? entries.slice(3) : entries

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-display">
        Leaderboard
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat.key
                ? 'text-white'
                : 'text-[var(--color-text-tertiary)]'
            }`}
            style={{
              background: activeCategory === cat.key ? 'var(--color-accent)' : 'var(--color-surface-alt)',
              border: activeCategory === cat.key ? 'none' : '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">The Hall of Fame Awaits</h3>
          <p className="text-[var(--color-text-secondary)]">Play more games to compete on the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium — only when >= 3 entries */}
          {hasPodium && (
            <motion.div
              className="grid grid-cols-3 gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {podiumEntries.map((entry, index) => (
                <motion.div
                  key={entry.playerId}
                  className="text-center rounded-xl p-3"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-xs font-bold mb-1" style={{ color: medalColors[index] }}>{medals[index]}</div>
                  <div className="text-sm font-semibold text-[var(--color-text-primary)] font-display truncate">{entry.nickname}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {entry.value}{activeCategory === 'winRate' ? '%' : ''}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Remaining rows (4-10, or all if < 3 entries) */}
          {rowEntries.length > 0 && (
            <div className="space-y-1">
              {rowEntries.map((entry, i) => {
                const actualIndex = hasPodium ? i + 3 : i
                return (
                  <motion.div
                    key={entry.playerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: actualIndex * 0.04 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: 'var(--color-surface-alt)' }}
                  >
                    <span className="text-xs font-bold w-6 text-center" style={{ color: 'var(--color-text-disabled)' }}>
                      {!hasPodium && actualIndex < 3
                        ? medals[actualIndex]
                        : `#${entry.rank}`
                      }
                    </span>
                    <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">{entry.nickname}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                      {entry.value}{activeCategory === 'winRate' ? '%' : ''}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
