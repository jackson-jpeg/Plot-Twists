'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGGER } from '@/lib/motion'
import { useSocket } from '@/contexts/SocketContext'
import type { PlayerStats, Achievement, LeaderboardEntry, LeaderboardCategory } from '@/lib/types'
import { GameHistory } from './GameHistory'
import { StatsSkeleton } from './EmptyState'
import { Button, Badge } from '@/components/ui'

interface PlayerProfileProps {
  playerId: string
  onClose?: () => void
  hideHeader?: boolean
}

const RARITY_BADGE_BG: Record<string, string> = {
  common: 'rgba(255,255,255,0.15)',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: 'var(--color-stage-gold)',
}

const RARITY_FRAME_CLASS: Record<string, string> = {
  rare: 'achievement-card-rare',
  epic: 'achievement-card-epic',
  legendary: 'achievement-card-legendary',
}

// Lock icon SVG used in empty state and locked achievements
function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'rgba(255,255,255,0.15)' }}>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
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
      <div style={{ padding: '24px 0' }}>
        <StatsSkeleton />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center" style={{ padding: '48px 0' }}>
        <p style={{ color: 'var(--color-stage-red)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>{error || 'Profile not found'}</p>
        <button
          onClick={fetchStats}
          style={{
            marginTop: '12px',
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--color-cream)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  const unlockedAchievements = stats.achievements.filter(a => a.unlockedAt)
  const lockedAchievements = stats.achievements.filter(a => !a.unlockedAt)

  // Empty state: playbill cast bio page
  if (stats.gamesPlayed === 0) {
    return (
      <div style={{ padding: '8px 0' }}>
        {/* The Playbill Paper */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotate: -0.5 }}
          animate={{ opacity: 1, y: 0, rotate: -0.5 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'var(--color-paper)',
            borderRadius: '4px',
            padding: '32px 28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Paper texture overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.03) 28px, rgba(0,0,0,0.03) 29px)',
            pointerEvents: 'none',
          }} />

          {/* CAST MEMBER label */}
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-stage-red)',
            marginBottom: '8px',
          }}>
            Cast Member
          </p>

          {/* Name placeholder */}
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '28px',
            fontStyle: 'italic',
            fontWeight: 400,
            color: 'rgba(8,7,11,0.35)',
            marginBottom: '20px',
          }}>
            Your name here
          </h2>

          {/* Dashed bio placeholder */}
          <div style={{
            border: '2px dashed rgba(8,7,11,0.12)',
            borderRadius: '6px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'rgba(8,7,11,0.4)',
              lineHeight: 1.5,
            }}>
              Play your first game to fill in your bio
            </p>
          </div>

          {/* Stat placeholders in a row */}
          <div className="grid grid-cols-4 gap-3" style={{ marginBottom: '24px' }}>
            {[
              { label: 'Games', value: '--' },
              { label: 'MVP Wins', value: '--' },
              { label: 'Votes', value: '--' },
              { label: 'Streak', value: '--' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  color: 'rgba(8,7,11,0.2)',
                  marginBottom: '2px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'rgba(8,7,11,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Locked achievement circles */}
          <div className="flex gap-3 justify-center">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(8,7,11,0.06)',
                  border: '1px solid rgba(8,7,11,0.08)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'rgba(8,7,11,0.2)' }}>
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA below the paper (on dark bg) */}
        <div style={{ marginTop: '24px' }}>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => { window.location.href = '/join' }}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '100px',
              fontSize: '15px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              background: 'var(--color-cream)',
              color: 'var(--color-void)',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Play a Game
          </motion.button>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            <a
              href="/sign-up"
              style={{
                color: 'rgba(255,255,255,0.35)',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Create an account
            </a>
            {' '}to save progress across devices
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '24px',
              fontWeight: 400,
              color: 'var(--color-cream)',
            }}>
              {stats.nickname}
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
              Playing since {new Date(stats.joinedAt).toLocaleDateString()}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                fontSize: '20px',
                padding: '4px 8px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
              }}
            >
              x
            </button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {!hideHeader && (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{ marginBottom: '24px' }}
        >
          <StatCard label="Games" value={stats.gamesPlayed} index={0} />
          <StatCard label="Wins" value={stats.gamesWon} index={1} />
          <StatCard label="Win Rate" value={`${Math.round(stats.winRate)}%`} index={2} />
          <StatCard label="Best Streak" value={stats.bestWinStreak} index={3} />
        </motion.div>
      )}

      {/* Current Streak Banner */}
      {!hideHeader && stats.currentWinStreak >= 2 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            borderRadius: '10px',
            padding: '12px 16px',
            background: 'rgba(194,59,34,0.08)',
            border: '1px solid rgba(194,59,34,0.3)',
            marginBottom: '24px',
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--color-stage-red)', fontSize: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2c-1 4-4 6-4 10a6 6 0 0012 0c0-4-3-6-4-10-1 2-3 3-4 0z" fill="currentColor" /></svg>
            </span>
            <div>
              <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-stage-red)', fontFamily: 'var(--font-mono)' }}>On Fire!</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {stats.currentWinStreak} game win streak
              </p>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--color-stage-red)' }}>
            {stats.currentWinStreak}
          </span>
        </motion.div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1" style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 0,
        position: 'relative',
        marginBottom: '20px',
      }}>
        {(['stats', 'achievements', 'history'] as const).map((tab) => {
          const isActive = activeTab === tab
          const labels: Record<string, string> = {
            stats: 'Stats',
            achievements: `Achievements (${unlockedAchievements.length})`,
            history: 'History',
          }

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px 6px 0 0',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: isActive ? 600 : 400,
                border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                borderBottom: isActive ? '1px solid var(--color-void)' : '1px solid transparent',
                cursor: 'pointer',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: isActive ? 'var(--color-cream)' : 'rgba(255,255,255,0.3)',
                position: 'relative',
                marginBottom: '-1px',
                transition: 'all 0.15s ease',
              }}
            >
              {labels[tab]}
            </button>
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
            className="space-y-4"
          >
            {/* Favorite Character */}
            {stats.favoriteCharacter && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  borderRadius: '10px',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <h3 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Favorite Character
                </h3>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '24px', color: 'var(--color-stage-gold)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 8c0 0 3-4 9-4s9 4 9 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="9" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="15" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M9 18c1.5 1 4.5 1 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </span>
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--color-cream)', fontSize: '15px', fontFamily: 'var(--font-serif)' }}>{stats.favoriteCharacter}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                      Played {stats.characterCounts[stats.favoriteCharacter]} times
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Game Mode Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                borderRadius: '10px',
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h3 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Game Mode Performance
              </h3>
              <div className="space-y-3">
                <ModeStatRow mode="Solo" stats={stats.gameModeStats.solo} />
                <ModeStatRow mode="Head to Head" stats={stats.gameModeStats.headToHead} />
                <ModeStatRow mode="Ensemble" stats={stats.gameModeStats.ensemble} />
              </div>
            </motion.div>

            {/* Audience Love */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                borderRadius: '10px',
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h3 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Audience Reactions
              </h3>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '28px', color: 'var(--color-stage-gold)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><circle cx="15" cy="9" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /></svg>
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--color-cream)' }}>{stats.totalReactionsReceived}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>total reactions received</p>
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
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-cream)',
                  fontFamily: 'var(--font-serif)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ color: 'var(--color-stage-gold)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                  </span>
                  Unlocked ({unlockedAchievements.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {unlockedAchievements.map((achievement, index) => (
                    <AchievementCard key={achievement.id} achievement={achievement} unlocked index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-serif)',
                  marginBottom: '12px',
                }}>
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
      staggerChildren: STAGGER
    }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// Sub-components

function StatCard({ label, value, index = 0 }: { label: string, value: string | number, index?: number }) {
  return (
    <motion.div
      className="text-center"
      style={{
        padding: '14px 8px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      variants={staggerItem}
    >
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '22px',
        color: 'var(--color-cream)',
        marginBottom: '2px',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </div>
    </motion.div>
  )
}

function ModeStatRow({
  mode,
  stats
}: {
  mode: string
  stats: { played: number, won: number }
}) {
  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0

  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{mode}</span>
      <div className="flex items-center gap-4" style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{stats.played} played</span>
        <span style={{ color: '#4ade80' }}>{stats.won} won</span>
        <span style={{ color: 'var(--color-stage-gold)' }}>{winRate}%</span>
      </div>
    </div>
  )
}

function AchievementCard({ achievement, unlocked, index = 0 }: { achievement: Achievement, unlocked: boolean, index?: number }) {
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: '10px',
        border: unlocked ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.04)',
        background: unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        opacity: unlocked ? 1 : 0.6,
      }}
    >
      <div style={{ padding: '14px' }}>
        <div className="flex items-start gap-3">
          <div className="relative">
            <span
              style={{
                fontSize: '24px',
                display: 'block',
                ...((!unlocked) ? { filter: 'blur(1px) saturate(0.3)', opacity: 0.5 } : {}),
              }}
            >
              {achievement.icon}
            </span>
            {!unlocked && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <LockIcon size={12} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 style={{
                fontWeight: 600,
                fontSize: '13px',
                color: unlocked ? 'var(--color-cream)' : 'rgba(255,255,255,0.25)',
                fontFamily: 'var(--font-mono)',
              }} className="truncate">
                {achievement.name}
              </h4>
              <Badge
                size="sm"
                style={{
                  background: RARITY_BADGE_BG[achievement.rarity] || 'rgba(255,255,255,0.15)',
                  color: achievement.rarity === 'legendary' ? 'var(--color-void)' : 'white',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {achievement.rarity}
              </Badge>
            </div>
            <p style={{
              fontSize: '12px',
              marginTop: '4px',
              color: unlocked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
            }}>
              {achievement.description}
            </p>
            {/* Progress bar for locked achievements */}
            {!unlocked && achievement.progress !== undefined && achievement.target && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div
                    style={{
                      height: '100%',
                      borderRadius: '2px',
                      background: progressPct >= 75 ? '#4ade80' : 'var(--color-stage-gold)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, delay: index * 0.06 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {achievement.progress} / {achievement.target}
                </p>
              </div>
            )}
            {unlocked && achievement.unlockedAt && (
              <div className="flex items-center justify-between" style={{ marginTop: '6px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
                <button
                  onClick={handleShare}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    fontFamily: 'var(--font-mono)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Share
                </button>
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
  const medalColors = ['var(--color-stage-gold)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.25)']

  const hasPodium = entries.length >= 3
  const podiumEntries = hasPodium ? entries.slice(0, 3) : []
  const rowEntries = hasPodium ? entries.slice(3) : entries

  return (
    <div className="space-y-4">
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '20px',
        fontWeight: 400,
        color: 'var(--color-cream)',
      }}>
        Leaderboard
      </h2>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: activeCategory === cat.key ? 600 : 400,
              background: activeCategory === cat.key ? 'var(--color-stage-gold)' : 'rgba(255,255,255,0.04)',
              color: activeCategory === cat.key ? 'var(--color-void)' : 'rgba(255,255,255,0.35)',
              border: activeCategory === cat.key ? 'none' : '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="text-center" style={{ padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center" style={{ padding: '32px 0' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--color-cream)', marginBottom: '8px' }}>
            The Hall of Fame Awaits
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            Play more games to compete on the leaderboard!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
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
                  className="text-center"
                  style={{
                    borderRadius: '10px',
                    padding: '12px 8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: index === 0 ? '1px solid rgba(201,162,77,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: medalColors[index], fontFamily: 'var(--font-mono)' }}>
                    {medals[index]}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-cream)', fontFamily: 'var(--font-serif)' }} className="truncate">
                    {entry.nickname}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                    {entry.value}{activeCategory === 'winRate' ? '%' : ''}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Remaining rows */}
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
                    className="flex items-center gap-3"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, width: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
                      {!hasPodium && actualIndex < 3
                        ? medals[actualIndex]
                        : `#${entry.rank}`
                      }
                    </span>
                    <span className="flex-1 truncate" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-cream)' }}>{entry.nickname}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-stage-gold)', fontFamily: 'var(--font-mono)' }}>
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
