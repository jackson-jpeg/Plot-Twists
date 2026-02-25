'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { UserMenu } from '@/components/UserMenu'
import { PublicRoomCard } from './components/PublicRoomCard'
import { QuickPlayButton } from './components/QuickPlayButton'
import type { GameMode, PublicRoomListing } from '@/lib/types'

type FilterMode = GameMode | 'ALL'

export default function PlayPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { socket, isConnected } = useSocket()
  const [rooms, setRooms] = useState<PublicRoomListing[]>([])
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL')
  const [filterMature, setFilterMature] = useState(false)
  const [isMatching, setIsMatching] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)

  // Fetch & subscribe to public rooms
  useEffect(() => {
    if (!socket || !isConnected) return

    socket.emit('list_public_rooms', undefined, (res) => {
      if (res.success && res.rooms) setRooms(res.rooms)
    })

    socket.emit('subscribe_public_rooms')
    socket.on('public_rooms_update', (updatedRooms) => {
      setRooms(updatedRooms)
    })

    return () => {
      socket.emit('unsubscribe_public_rooms')
      socket.off('public_rooms_update')
    }
  }, [socket, isConnected])

  const handleQuickPlay = useCallback((gameMode: GameMode) => {
    if (!socket || !isConnected || !user) return
    setIsMatching(true)
    setMatchError(null)

    socket.emit('quick_play', { gameMode, isMature: filterMature }, (res) => {
      setIsMatching(false)
      if (res.success && res.code) {
        router.push(`/join?code=${res.code}`)
      } else {
        setMatchError(res.error || 'Failed to find a game')
      }
    })
  }, [socket, isConnected, user, filterMature, router])

  const handleJoinRoom = useCallback((code: string) => {
    router.push(`/join?code=${code}`)
  }, [router])

  const filteredRooms = rooms.filter(r => {
    if (filterMode !== 'ALL' && r.gameMode !== filterMode) return false
    if (!filterMature && r.isMature) return false
    return true
  })

  if (authLoading) {
    return (
      <main className="page-container items-center justify-center">
        <div className="skeleton skeleton-heading" />
      </main>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  return (
    <main className="page-container">
      {/* Header */}
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      <div className="container max-w-2xl pt-4 pb-20">
        {/* Back button */}
        <motion.button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-4"
          whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Home
        </motion.button>

        {/* Title */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)]">
            Quick Play
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Jump into a game with other players
          </p>
        </motion.div>

        {/* Quick Play buttons */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuickPlayButton
            mode="ENSEMBLE"
            label="Ensemble"
            emoji="👥"
            description="3-6 players"
            isMatching={isMatching}
            onPlay={() => handleQuickPlay('ENSEMBLE')}
          />
          <QuickPlayButton
            mode="HEAD_TO_HEAD"
            label="Head-to-Head"
            emoji="⚔️"
            description="1v1 battle"
            isMatching={isMatching}
            onPlay={() => handleQuickPlay('HEAD_TO_HEAD')}
          />
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {matchError && (
            <motion.div
              className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {matchError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-[var(--color-text-tertiary)] mr-1">Filter:</span>
          {(['ALL', 'ENSEMBLE', 'HEAD_TO_HEAD'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterMode === mode
                  ? 'bg-[var(--color-purple)] text-white'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
              }`}
            >
              {mode === 'ALL' ? 'All' : mode === 'ENSEMBLE' ? 'Ensemble' : 'H2H'}
            </button>
          ))}
          <button
            onClick={() => setFilterMature(m => !m)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterMature
                ? 'bg-[var(--color-pink)] text-white'
                : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
            }`}
          >
            18+
          </button>
        </div>

        {/* Public Room List */}
        <div className="flex flex-col gap-3">
          {filteredRooms.length === 0 ? (
            <motion.div
              className="text-center py-12 text-[var(--color-text-tertiary)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-4xl mb-3">🎭</div>
              <p className="text-sm">No public games right now</p>
              <p className="text-xs mt-1">Start one with Quick Play above!</p>
            </motion.div>
          ) : (
            filteredRooms.map((room, i) => (
              <PublicRoomCard
                key={room.code}
                room={room}
                index={i}
                onJoin={() => handleJoinRoom(room.code)}
              />
            ))
          )}
        </div>
      </div>
    </main>
  )
}
