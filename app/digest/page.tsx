'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { SPRING_GENTLE, ENTER_Y } from '@/lib/motion'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { WeeklyDigest } from '@/components/WeeklyDigest'
import { withTimeout } from '@/lib/socketTimeout'
import type { SavedGame } from '@/lib/types'

function getWeekRange() {
  const now = new Date()
  const end = new Date(now)
  const start = new Date(now)
  start.setDate(start.getDate() - 7)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startMs: start.getTime(),
  }
}

function computeDigest(games: SavedGame[], playerId: string) {
  const { start, end, startMs } = getWeekRange()
  const weekGames = games.filter(g => g.playedAt >= startMs)

  const gamesPlayed = weekGames.length
  const mvpsWon = weekGames.filter(g => g.winner?.playerId === playerId).length
  const reactionsEarned = weekGames.reduce((sum, g) => sum + g.audienceReactionCount, 0)

  // Find line of the week: scan script lines for player's character, pick from highest-reaction game
  let lineOfTheWeek: { quote: string; playerName: string; characterName: string; showTitle: string } | undefined
  const sortedByReactions = [...weekGames].sort((a, b) => b.audienceReactionCount - a.audienceReactionCount)

  for (const game of sortedByReactions) {
    const playerEntry = game.players.find(p => p.id === playerId)
    if (!playerEntry) continue
    const characterLines = game.script.lines.filter(l => l.speaker === playerEntry.character)
    if (characterLines.length === 0) continue
    const longestLine = characterLines.reduce((best, l) => l.text.length > best.text.length ? l : best)
    lineOfTheWeek = {
      quote: longestLine.text,
      playerName: playerEntry.nickname,
      characterName: playerEntry.character,
      showTitle: game.title,
    }
    break
  }

  // Find funniest character: most frequently played character name
  const charCounts = new Map<string, number>()
  let mvpChars = new Set<string>()
  for (const game of weekGames) {
    const playerEntry = game.players.find(p => p.id === playerId)
    if (!playerEntry) continue
    charCounts.set(playerEntry.character, (charCounts.get(playerEntry.character) || 0) + 1)
    if (game.winner?.playerId === playerId) mvpChars.add(playerEntry.character)
  }

  let funniestCharacter: { name: string; gamesAppeared: number; isMvp: boolean } | undefined
  if (charCounts.size > 0) {
    const [topChar, topCount] = [...charCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    funniestCharacter = {
      name: topChar,
      gamesAppeared: topCount,
      isMvp: mvpChars.has(topChar),
    }
  }

  return {
    dateRange: { start, end },
    stats: { gamesPlayed, mvpsWon, reactionsEarned },
    lineOfTheWeek,
    funniestCharacter,
  }
}

export default function DigestPage() {
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
      (cb) => socket.emit('get_game_history', playerId, 100, cb)
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

  const playerId = getPlayerId()
  const digest = computeDigest(games, playerId)

  const handleShare = async () => {
    const text = [
      `My Week in Comedy on PlotSlop`,
      `${digest.stats.gamesPlayed} games played`,
      `${digest.stats.mvpsWon} MVPs won`,
      `${digest.stats.reactionsEarned} reactions earned`,
      digest.lineOfTheWeek ? `Line of the week: "${digest.lineOfTheWeek.quote}"` : '',
    ].filter(Boolean).join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Week in Comedy', text })
        return
      } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(text).catch(() => {})
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-surface)', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="w-full max-w-md mx-auto" style={{ padding: '32px 20px' }}>
          <div className="h-4 w-32 rounded skeleton-shimmer mb-2" style={{ background: 'var(--color-border)' }} />
          <div className="h-10 w-48 rounded skeleton-shimmer mb-6" style={{ background: 'var(--color-border)' }} />
          <div className="flex gap-3 mb-8" style={{ minHeight: 180 }}>
            <div className="flex-1 rounded-2xl skeleton-shimmer" style={{ background: 'var(--color-border)' }} />
            <div className="flex flex-col gap-3" style={{ width: '45%' }}>
              <div className="flex-1 rounded-2xl skeleton-shimmer" style={{ background: 'var(--color-border)' }} />
              <div className="flex-1 rounded-2xl skeleton-shimmer" style={{ background: 'var(--color-border)' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div {...ENTER_Y} transition={SPRING_GENTLE} style={{ minHeight: '100dvh', background: 'var(--color-surface)', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      <WeeklyDigest
        dateRange={digest.dateRange}
        stats={digest.stats}
        lineOfTheWeek={digest.lineOfTheWeek}
        funniestCharacter={digest.funniestCharacter}
        onShare={handleShare}
        onPlay={() => router.push('/host')}
      />
    </motion.div>
  )
}
