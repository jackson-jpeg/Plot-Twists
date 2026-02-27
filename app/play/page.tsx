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
      <main className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="container max-w-2xl pt-4 pb-8">
          <div className="text-center mb-6">
            <div className="skeleton mx-auto" style={{ width: 48, height: 48, borderRadius: '50%' }} />
            <div className="skeleton mx-auto mt-3" style={{ width: 180, height: 28, borderRadius: 8 }} />
            <div className="skeleton mx-auto mt-2" style={{ width: 260, height: 16, borderRadius: 6 }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
          </div>
          <div className="flex flex-col gap-3">
            <div className="skeleton" style={{ height: 72, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 72, borderRadius: 12 }} />
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  return (
    <main className="flex flex-col" style={{ minHeight: '100dvh', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="fixed right-4 z-50" style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <UserMenu />
      </div>

      <div className="w-full max-w-2xl mx-auto pt-4 pb-8 px-4">
        {/* Title */}
        <motion.div
          className="mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-display text-[var(--color-text-primary)]">
            Quick Play
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Jump into a game with other players — no room code needed
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
            description="3-6 performers"
            isMatching={isMatching}
            onPlay={() => handleQuickPlay('ENSEMBLE')}
          />
          <QuickPlayButton
            mode="HEAD_TO_HEAD"
            label="Head-to-Head"
            emoji="⚔️"
            description="2-player duel"
            isMatching={isMatching}
            onPlay={() => handleQuickPlay('HEAD_TO_HEAD')}
          />
        </motion.div>

        <p className="text-center text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
          Joins a game starting now — or creates one if none available
        </p>

        {/* Host a Public Game */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => router.push('/host?public=true')}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
            style={{
              border: '1px solid var(--color-purple)',
              color: 'var(--color-purple)',
              background: 'transparent',
            }}
          >
            Host a Public Game
          </button>
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
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] mr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse inline-block" />
            Live
          </span>
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
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No public games right now</p>
              <p className="text-xs mt-1 mb-4" style={{ color: 'var(--color-text-tertiary)' }}>Create the first game and invite friends!</p>
              <button
                onClick={() => router.push('/host?public=true')}
                className="px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--color-purple)', color: 'white' }}
              >
                Host Public Game
              </button>
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
