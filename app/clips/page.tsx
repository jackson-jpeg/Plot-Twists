'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { SPRING_GENTLE, ENTER_Y } from '@/lib/motion'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { ClipGallery } from '@/components/ClipGallery'
import { withTimeout } from '@/lib/socketTimeout'
import type { SavedGame } from '@/lib/types'

const CLIP_COLORS = [
  'linear-gradient(180deg, #1a2a3a 0%, #2a1a0a 60%)',
  'linear-gradient(180deg, #2a1a2a 0%, #1a0a1a 60%)',
  'linear-gradient(180deg, #0a2a1a 0%, #0a1a0a 60%)',
]

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function gameToClip(game: SavedGame, index: number) {
  // Pick best quote: winner's longest line, or overall longest line
  const winnerCharacter = game.winner?.character
  const candidateLines = winnerCharacter
    ? game.script.lines.filter(l => l.speaker === winnerCharacter)
    : game.script.lines
  const bestLine = (candidateLines.length > 0 ? candidateLines : game.script.lines)
    .reduce((longest, line) => line.text.length > longest.text.length ? line : longest)

  return {
    id: game.shareCode || game.id,
    quote: bestLine.text,
    showTitle: game.title,
    players: game.players.map(p => p.nickname),
    duration: game.duration,
    timeAgo: timeAgo(game.playedAt),
    likes: game.likes,
    reactions: game.audienceReactionCount,
    color: CLIP_COLORS[index % CLIP_COLORS.length],
  }
}

export default function ClipsPage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const { getPlayerId } = useAuth()
  const [games, setGames] = useState<SavedGame[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGames = useCallback(() => {
    if (!socket) return
    setLoading(true)
    const playerId = getPlayerId()
    withTimeout<{ success: boolean; games?: SavedGame[]; error?: string }>(
      (cb) => socket.emit('get_game_history', playerId, 50, cb)
    ).then((response) => {
      setLoading(false)
      if (response.success && response.games) {
        setGames(response.games)
      }
    }).catch(() => {
      setLoading(false)
    })
  }, [socket, getPlayerId])

  useEffect(() => {
    if (isConnected) fetchGames()
  }, [isConnected, fetchGames])

  // Sort clips by tab criteria
  const trendingClips = [...games]
    .sort((a, b) => b.audienceReactionCount - a.audienceReactionCount)
    .map(gameToClip)

  const clips = trendingClips.length > 0 ? trendingClips : []

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-theater-bg, #0f0f0f)', color: 'white', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="px-5 pt-8 pb-4">
          <div className="h-7 w-16 rounded skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>
        <div className="px-5 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl skeleton-shimmer" style={{ height: 200, background: 'rgba(255,255,255,0.05)' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div {...ENTER_Y} transition={SPRING_GENTLE} style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      <ClipGallery
        clips={clips}
        onPlayClip={(clipId) => router.push(`/replay/${clipId}`)}
        onPlayGame={() => router.push('/host')}
      />
    </motion.div>
  )
}
