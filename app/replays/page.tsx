'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { SavedGame } from '@/lib/types'
import { useSocket } from '@/contexts/SocketContext'
import { withTimeout } from '@/lib/socketTimeout'
import { ReplayCard } from './components/ReplayCard'
import { Button } from '@/components/ui'
import { ENTER_Y, SPRING_GENTLE } from '@/lib/motion'

type Tab = 'recent' | 'trending'

export default function ReplaysPage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const [tab, setTab] = useState<Tab>('trending')
  const [games, setGames] = useState<SavedGame[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  const fetchReplays = useCallback(async (currentTab: Tab, offset: number = 0) => {
    if (!socket || !isConnected) return
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await withTimeout(
        (cb) => socket.emit('get_public_replays', { tab: currentTab, limit: PAGE_SIZE, offset }, cb),
        10000
      )
      if (response.success && response.games) {
        if (offset === 0) {
          setGames(response.games)
        } else {
          setGames(prev => [...prev, ...response.games])
        }
        setHasMore(response.games.length === PAGE_SIZE)
      }
    } catch {
      // Failed to fetch
    } finally {
      setLoading(false)
    }
  }, [socket, isConnected])

  useEffect(() => {
    fetchReplays(tab, 0)
  }, [tab, fetchReplays])

  const loadMore = () => {
    fetchReplays(tab, games.length)
  }

  return (
    <motion.div
      {...ENTER_Y}
      transition={SPRING_GENTLE}
      className="min-h-dvh"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-2xl mx-auto px-5 py-6" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} style={{ color: 'var(--color-text-tertiary)' }}>
            &#x2039; Back
          </Button>
          <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Replays
          </h1>
          <div style={{ width: 60 }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['trending', 'recent'] as const).map((t) => (
            <Button
              key={t}
              variant={tab === t ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTab(t)}
              style={tab === t ? {} : { background: 'transparent' }}
            >
              {t === 'trending' ? 'Trending' : 'Recent'}
            </Button>
          ))}
        </div>

        {/* Games list */}
        <div className="flex flex-col gap-3">
          {games.map((game, i) => (
            <ReplayCard
              key={game.id}
              game={game}
              index={i}
              onClick={() => {
                const code = game.shareCode || game.id
                router.push(`/replay/${code}`)
              }}
            />
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 24, height: 24, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && games.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={SPRING_GENTLE}
          >
            <div className="text-4xl mb-3">🎬</div>
            <p className="font-display text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>No replays yet</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Play a game and share it to see it here!
            </p>
          </motion.div>
        )}

        {/* Load more */}
        {!loading && hasMore && games.length > 0 && (
          <motion.div className="flex justify-center mt-6 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button variant="secondary" size="md" onClick={loadMore}>
              Load More
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
