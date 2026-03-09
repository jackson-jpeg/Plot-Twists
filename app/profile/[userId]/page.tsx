'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { PlayerStats } from '@/lib/types'
import { useSocket } from '@/contexts/SocketContext'
import { GameHistory } from '@/components/GameHistory'
import { StatsSkeleton } from '@/components/EmptyState'
import { VARIANTS, MOTION } from '@/lib/animations'
import { Button, Card, Avatar, Badge } from '@/components/ui'

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const { socket } = useSocket()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!socket || !userId) return
    socket.emit('get_player_stats', userId, (response) => {
      setLoading(false)
      if (response.success && response.stats) {
        setStats(response.stats)
      }
    })
  }, [socket, userId])

  if (loading) {
    return (
      <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-lg mx-auto px-5 py-8">
          <StatsSkeleton />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>Player not found</p>
          <Button variant="primary" size="md" onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0
  const level = stats.level ?? 1
  const title = stats.title ?? 'Newcomer'

  return (
    <motion.div
      variants={VARIANTS.pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-dvh"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-lg mx-auto px-5 py-6" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>
          &#x2039; Back
        </Button>

        {/* Profile header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
        >
          <Avatar name={stats.nickname} size="lg" className="mx-auto mb-3" />
          <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {stats.nickname}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="default" size="sm">Lv. {level}</Badge>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{title}</span>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-3 gap-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION.gentle, delay: 0.15 }}
        >
          {[
            { label: 'Games', value: stats.gamesPlayed },
            { label: 'MVP Wins', value: stats.gamesWon },
            { label: 'Win Rate', value: `${winRate}%` },
          ].map((stat) => (
            <Card key={stat.label} variant="surface" padding="md" className="text-center">
              <p className="font-display text-xl" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</p>
            </Card>
          ))}
        </motion.div>

        {/* Achievements */}
        {stats.achievements.filter(a => a.unlockedAt).length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...MOTION.gentle, delay: 0.25 }}
          >
            <h2 className="font-display text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              Achievements
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.filter(a => a.unlockedAt).map((a) => (
                <span key={a.id} title={a.description}>
                  <Badge variant="default" size="sm">
                    {a.icon} {a.name}
                  </Badge>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent games */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION.gentle, delay: 0.35 }}
        >
          <h2 className="font-display text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Recent Games
          </h2>
          <GameHistory playerId={userId} limit={10} showTitle={false} />
        </motion.div>
      </div>
    </motion.div>
  )
}
