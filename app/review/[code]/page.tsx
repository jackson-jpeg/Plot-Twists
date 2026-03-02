'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { DirectorsReview } from '@/components/DirectorsReview'
import { withTimeout } from '@/lib/socketTimeout'
import { MOTION } from '@/lib/animations'
import { CAST_COLORS } from '@/lib/avatarColors'
import type { SavedGame } from '@/lib/types'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const code = params.code as string

  const [game, setGame] = useState<SavedGame | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGame = useCallback(() => {
    if (!socket || !code) return
    setLoading(true)
    withTimeout<{ success: boolean; game?: SavedGame; error?: string }>(
      (cb) => socket.emit('get_game_details', code, cb)
    ).then((response) => {
      setLoading(false)
      if (response.success && response.game) {
        setGame(response.game)
      } else {
        setError(response.error || 'Game not found')
      }
    }).catch(() => {
      setLoading(false)
      setError('Request timed out — please try again')
    })
  }, [socket, code])

  useEffect(() => {
    if (isConnected) fetchGame()
  }, [isConnected, fetchGame])

  const handleShare = async () => {
    if (!game?.directorsReview) return
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `"${game.title}" — ${game.directorsReview.rating}/5 stars\n"${game.directorsReview.review}"\n\n${url}`

    if (navigator.share) {
      try {
        await navigator.share({ title: `Director's Review: ${game.title}`, text, url })
        return
      } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(text).catch(() => {})
  }

  // Loading skeleton
  if (!isConnected || loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'var(--color-cinematic-gradient, linear-gradient(180deg, #0f1a26 0%, #0a0f14 100%))' }}
      >
        <div className="w-full max-w-md mx-auto" style={{ padding: '32px 20px' }}>
          <div className="h-4 w-24 rounded animate-pulse mb-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="rounded-2xl animate-pulse" style={{ height: 380, background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !game) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'var(--color-cinematic-gradient, linear-gradient(180deg, #0f1a26 0%, #0a0f14 100%))' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
          style={{ padding: '32px 20px' }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
          <h1
            className="font-display"
            style={{ fontSize: '24px', color: 'white', marginBottom: '8px' }}
          >
            Review Not Found
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '24px' }}>
            {error || 'This review may have expired or been removed.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setError(null); fetchGame() }}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                background: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // No review available
  if (!game.directorsReview) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'var(--color-cinematic-gradient, linear-gradient(180deg, #0f1a26 0%, #0a0f14 100%))' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
          style={{ padding: '32px 20px' }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
          <h1
            className="font-display"
            style={{ fontSize: '24px', color: 'white', marginBottom: '8px' }}
          >
            No Review Yet
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '24px' }}>
            The AI Director hasn&apos;t reviewed &ldquo;{game.title}&rdquo; yet.
          </p>
          <button
            onClick={() => router.push(`/replay/${code}`)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              background: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Watch Replay Instead
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh"
      style={{
        background: 'var(--color-cinematic-gradient, linear-gradient(180deg, #0f1a26 0%, #0a0f14 100%))',
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="w-full max-w-md mx-auto" style={{ padding: 'calc(32px + env(safe-area-inset-top, 0px)) 20px 32px' }}>
        {/* Director's Review */}
        <DirectorsReview
          review={game.directorsReview}
          showTitle={game.title}
          date={new Date(game.playedAt).toISOString()}
          onShare={handleShare}
        />

        {/* Cast section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...MOTION.gentle }}
        >
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '12px',
          }}>
            Cast
          </p>
          <div className="flex flex-wrap gap-2">
            {game.players.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center gap-2 rounded-full"
                style={{
                  padding: '6px 14px 6px 6px',
                  background: 'rgba(255,255,255,0.06)',
                  border: player.isWinner ? '1px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 28,
                    height: 28,
                    background: CAST_COLORS[i % CAST_COLORS.length],
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  {player.nickname[0]?.toUpperCase()}
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                    {player.character}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginLeft: '6px' }}>
                    {player.nickname}
                    {player.isWinner && ' · MVP'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Watch Replay link */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...MOTION.gentle }}
        >
          <button
            onClick={() => router.push(`/replay/${code}`)}
            className="w-full flex items-center justify-center gap-2"
            style={{
              padding: '14px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 600,
              background: 'transparent',
              color: 'var(--color-accent)',
              border: '1px solid rgba(245,158,66,0.3)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 2l10 6-10 6V2z" />
            </svg>
            Watch Replay
          </button>
        </motion.div>
      </div>
    </div>
  )
}
