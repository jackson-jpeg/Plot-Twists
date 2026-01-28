'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { PlayerStats, Achievement, LeaderboardEntry, LeaderboardCategory } from '@/lib/types'
import { GameHistory } from './GameHistory'

interface PlayerProfileProps {
  playerId: string
  onClose?: () => void
}

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500'
}

const RARITY_BG = {
  common: 'bg-gray-500/20 border-gray-500/50',
  rare: 'bg-blue-500/20 border-blue-500/50',
  epic: 'bg-purple-500/20 border-purple-500/50',
  legendary: 'bg-yellow-500/20 border-yellow-500/50'
}

export function PlayerProfile({ playerId, onClose }: PlayerProfileProps) {
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
      <div className="text-center py-12 text-gray-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="inline-block text-4xl mb-4"
        >
          🎭
        </motion.div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-red-400">
        <p>{error || 'Profile not found'}</p>
        <button onClick={fetchStats} className="mt-2 text-purple-400 hover:underline">
          Try again
        </button>
      </div>
    )
  }

  const unlockedAchievements = stats.achievements.filter(a => a.unlockedAt)
  const lockedAchievements = stats.achievements.filter(a => !a.unlockedAt)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
            {stats.nickname[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{stats.nickname}</h2>
            <p className="text-gray-400">
              Playing since {new Date(stats.joinedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon="🎮"
          label="Games"
          value={stats.gamesPlayed}
        />
        <StatCard
          icon="🏆"
          label="Wins"
          value={stats.gamesWon}
        />
        <StatCard
          icon="📈"
          label="Win Rate"
          value={`${Math.round(stats.winRate)}%`}
        />
        <StatCard
          icon="🔥"
          label="Best Streak"
          value={stats.bestWinStreak}
        />
      </div>

      {/* Current Streak Banner */}
      {stats.currentWinStreak >= 2 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-semibold text-orange-300">On Fire!</p>
              <p className="text-sm text-orange-400/80">
                {stats.currentWinStreak} game win streak
              </p>
            </div>
          </div>
          <span className="text-4xl font-bold text-orange-400">
            {stats.currentWinStreak}
          </span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {(['stats', 'achievements', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'stats' && '📊 Stats'}
            {tab === 'achievements' && `🏅 Achievements (${unlockedAchievements.length})`}
            {tab === 'history' && '📜 History'}
          </button>
        ))}
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
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm text-gray-400 mb-2">Favorite Character</h3>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎭</span>
                  <div>
                    <p className="font-semibold text-white text-lg">{stats.favoriteCharacter}</p>
                    <p className="text-sm text-gray-400">
                      Played {stats.characterCounts[stats.favoriteCharacter]} times
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Game Mode Breakdown */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-3">Game Mode Performance</h3>
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

            {/* Audience Love */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-2">Audience Reactions</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl">😂</div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalReactionsReceived}</p>
                  <p className="text-sm text-gray-400">total reactions received</p>
                </div>
              </div>
            </div>
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
                <h3 className="text-lg font-semibold text-white mb-3">
                  Unlocked ({unlockedAchievements.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {unlockedAchievements.map(achievement => (
                    <AchievementCard key={achievement.id} achievement={achievement} unlocked />
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-400 mb-3">
                  Locked ({lockedAchievements.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {lockedAchievements.map(achievement => (
                    <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} />
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

// Sub-components

function StatCard({ icon, label, value }: { icon: string, label: string, value: string | number }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
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
        <span className="text-gray-300">{mode}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-400">{stats.played} played</span>
        <span className="text-green-400">{stats.won} won</span>
        <span className="text-purple-400">{winRate}%</span>
      </div>
    </div>
  )
}

function AchievementCard({ achievement, unlocked }: { achievement: Achievement, unlocked: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl border transition-all ${
        unlocked
          ? RARITY_BG[achievement.rarity]
          : 'bg-gray-900/50 border-gray-700 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-3xl ${!unlocked ? 'grayscale' : ''}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold truncate ${unlocked ? 'text-white' : 'text-gray-500'}`}>
              {achievement.name}
            </h4>
            <span className={`text-xs px-1.5 py-0.5 rounded bg-gradient-to-r ${RARITY_COLORS[achievement.rarity]} text-white`}>
              {achievement.rarity}
            </span>
          </div>
          <p className={`text-xs mt-1 ${unlocked ? 'text-gray-400' : 'text-gray-600'}`}>
            {achievement.description}
          </p>
          {/* Progress bar for locked achievements with progress */}
          {!unlocked && achievement.progress !== undefined && achievement.target && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {achievement.progress} / {achievement.target}
              </p>
            </div>
          )}
          {unlocked && achievement.unlockedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
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
        setEntries(response.entries)
      }
    })
  }, [socket, activeCategory])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const categories: { key: LeaderboardCategory, label: string, icon: string }[] = [
    { key: 'wins', label: 'Wins', icon: '🏆' },
    { key: 'games', label: 'Games', icon: '🎮' },
    { key: 'winRate', label: 'Win %', icon: '📈' },
    { key: 'streak', label: 'Streak', icon: '🔥' }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <span>🏅</span> Leaderboard
      </h2>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No entries yet</div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.playerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-xl ${
                index < 3 ? 'bg-gradient-to-r from-gray-800/80 to-gray-800/40' : 'bg-gray-800/30'
              }`}
            >
              <div className="w-8 text-center text-xl">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{entry.nickname}</p>
              </div>
              <div className="text-lg font-bold text-purple-400">
                {entry.value}{activeCategory === 'winRate' ? '%' : ''}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
