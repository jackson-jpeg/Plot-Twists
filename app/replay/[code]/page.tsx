'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { SavedGame, ScriptLine, TeleprompterSettings } from '@/lib/types'
import { SPRING_GENTLE, STAGGER } from '@/lib/motion'
import { useTeleprompterSettings } from '@/hooks/useTeleprompterSettings'
import dynamic from 'next/dynamic'
const TeleprompterSettingsPanel = dynamic(() => import('@/components/TeleprompterSettings').then(m => ({ default: m.TeleprompterSettings })), { ssr: false, loading: () => <div style={{ height: 40 }} /> })
import { getVisibleLines } from '@/lib/teleprompterUtils'
import React from 'react'
import { ReplayJsonLd } from '@/components/JsonLd'
import { analytics } from '@/lib/analytics'
import { withTimeout } from '@/lib/socketTimeout'

// Share button configuration
const SHARE_PLATFORMS = [
  {
    name: 'Twitter',
    icon: '𝕏',
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this hilarious improv scene: "${title}"`)}&url=${encodeURIComponent(url)}`
  },
  {
    name: 'Facebook',
    icon: '📘',
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    name: 'WhatsApp',
    icon: '💬',
    getUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`Check out this improv scene: "${title}" ${url}`)}`
  },
  {
    name: 'Reddit',
    icon: '🟠',
    getUrl: (url: string, title: string) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`I played "${title}" on Plot Twists!`)}`
  },
  {
    name: 'SMS',
    icon: '💬',
    getUrl: (url: string, title: string) =>
      `sms:?body=${encodeURIComponent(`Check out this improv scene: "${title}" ${url}`)}`
  }
]

export default function ReplayPage() {
  const params = useParams()
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const shareCode = params.code as string

  const [game, setGame] = useState<SavedGame | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const scriptViewerRef = React.useRef<HTMLDivElement | null>(null)

  // Teleprompter settings hook
  const {
    settings: teleprompterSettings,
    setPreset: setTeleprompterPreset,
    setCustom: setTeleprompterCustom,
    toggleAutoScroll: toggleTeleprompterAutoScroll,
    isLoading: teleprompterSettingsLoading
  } = useTeleprompterSettings()

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const fetchGame = useCallback(() => {
    if (!socket || !shareCode) return

    setLoading(true)
    withTimeout<{ success: boolean; game?: SavedGame; error?: string }>(
      (cb) => socket.emit('get_game_details', shareCode, cb)
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
  }, [socket, shareCode])

  useEffect(() => {
    if (isConnected) {
      fetchGame()
    }
  }, [isConnected, fetchGame])

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || !game) return

    const timer = setTimeout(() => {
      if (currentLineIndex < game.script.lines.length - 1) {
        setCurrentLineIndex(prev => prev + 1)
      } else {
        setIsPlaying(false)
      }
    }, 3000) // 3 seconds per line

    return () => clearTimeout(timer)
  }, [isPlaying, currentLineIndex, game])

  // Auto-scroll to current line in full script view
  useEffect(() => {
    if (!teleprompterSettings.autoScroll || !scriptViewerRef.current) return

    const currentLineElement = scriptViewerRef.current.querySelector(`[data-line-index="${currentLineIndex}"]`)
    if (currentLineElement) {
      currentLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentLineIndex, teleprompterSettings.autoScroll])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleNativeShare = async () => {
    if (!game) return
    analytics.replayShared('native_share')
    if (navigator.share) {
      try {
        await navigator.share({
          title: `"${game.title}" - Plot Twists`,
          text: `Check out this hilarious improv scene: "${game.title}"`,
          url: shareUrl,
        })
        setShowShareMenu(false)
        return
      } catch {
        // User cancelled or share failed, fall through to dropdown
      }
    }
    setShowShareMenu(!showShareMenu)
  }

  const handleSocialShare = (platform: typeof SHARE_PLATFORMS[number]) => {
    if (!game) return
    const url = platform.getUrl(shareUrl, game.title)
    window.open(url, '_blank', 'width=600,height=400')
    setShowShareMenu(false)
  }

  const handleRematch = () => {
    // Navigate to home with rematch settings from this game
    const params = new URLSearchParams({
      rematch: 'true',
      mode: game?.gameMode || 'HEAD_TO_HEAD',
      cardPack: game?.cardPackUsed || 'standard',
      style: game?.comedyStyle || 'witty'
    })
    router.push(`/?${params.toString()}`)
  }

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      angry: 'var(--color-danger, #D77A7A)',
      happy: 'var(--color-success, #82B682)',
      confused: 'var(--color-warning, #E8A75D)',
      whispering: 'var(--color-accent-2, #7C9FD9)',
      neutral: 'var(--color-text-tertiary, #9B9590)'
    }
    return colors[mood] || colors.neutral
  }

  if (!isConnected || loading) {
    return (
      <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
        {/* Skeleton header */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 60, height: 20, borderRadius: 6 }} />
            <div className="text-center">
              <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 160, height: 20, borderRadius: 6, margin: '0 auto 6px' }} />
              <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 80, height: 14, borderRadius: 6, margin: '0 auto' }} />
            </div>
            <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 70, height: 30, borderRadius: 8 }} />
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Cast skeleton */}
          <div className="rounded-xl p-6" style={{ background: 'var(--color-surface-alt)' }}>
            <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: '60%', height: 16, borderRadius: 6, marginBottom: 12 }} />
            <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: '90%', height: 14, borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: '75%', height: 14, borderRadius: 6 }} />
          </div>
          {/* Script player skeleton */}
          <div className="rounded-xl p-6" style={{ background: 'var(--color-surface-alt)' }}>
            <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: '100%', height: 8, borderRadius: 4, marginBottom: 24 }} />
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 80, height: 24, borderRadius: 12 }} />
              <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 120, height: 20, borderRadius: 6 }} />
              <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: '80%', height: 28, borderRadius: 6 }} />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 44, height: 44, borderRadius: '50%' }} />
              <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 100, height: 44, borderRadius: 22 }} />
              <div className="skeleton-shimmer" style={{ background: 'var(--color-surface-alt)', width: 44, height: 44, borderRadius: '50%' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center rounded-2xl p-8 max-w-md"
          style={{ background: 'var(--color-surface-alt)' }}
        >
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Script Not Found</h1>
          <p className="mb-6" style={{ color: 'var(--color-text-tertiary)' }}>{error || 'This replay may have expired or been removed.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {error?.includes('timed out') && (
              <button
                onClick={() => { setError(null); fetchGame(); }}
                className="px-6 py-3 text-white rounded-lg font-semibold transition-colors"
                style={{ background: 'var(--color-accent)' }}
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-lg font-semibold transition-colors text-[var(--color-text-primary)]"
              style={{ background: 'var(--color-surface)' }}
            >
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentLine = game.script.lines[currentLineIndex]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      <ReplayJsonLd
        title={game.title}
        synopsis={game.synopsis}
        url={shareUrl}
        playedAt={game.playedAt}
      />
      {/* Header */}
      <div className="p-4 backdrop-blur-sm sticky top-0 z-10" style={{ background: 'var(--color-surface-elevated)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 py-2 px-3 -ml-3 rounded-lg transition-colors text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Go back"
          >
            <span aria-hidden="true">←</span> Back
          </button>
          <div className="text-center">
            <h1 className="font-bold text-[var(--color-text-primary)]">{game.title}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {new Date(game.playedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={handleNativeShare}
              className="px-3 py-1.5 text-[var(--color-text-primary)] rounded-lg text-sm transition-colors"
              style={{ background: 'var(--color-surface-alt)' }}
              aria-label="Share options"
            >
              🔗 Share
            </button>

            {/* Share dropdown menu */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-20"
                  style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-elevated)' }}
                >
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] transition-colors flex items-center gap-2"
                  >
                    {copied ? '✓' : '📋'} {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <div className="border-t border-[var(--color-border)]" />
                  {SHARE_PLATFORMS.map(platform => (
                    <button
                      key={platform.name}
                      onClick={() => handleSocialShare(platform)}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] transition-colors flex items-center gap-2"
                    >
                      {platform.icon} {platform.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Cast & Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6"
          style={{ background: 'var(--color-surface-alt)' }}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Synopsis</h2>
              <p className="italic" style={{ color: 'var(--color-text-secondary)' }}>"{game.synopsis}"</p>
            </div>
            <div>
              <h2 className="text-sm mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Cast</h2>
              <div className="flex flex-wrap gap-2">
                {game.players.map(player => (
                  <span
                    key={player.id}
                    className="px-3 py-1 rounded-full text-sm"
                    style={player.isWinner
                      ? { background: 'var(--color-highlight)', color: 'var(--color-accent-dark)', border: '1px solid var(--color-accent)' }
                      : { background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }
                    }
                  >
                    {player.isWinner && '👑 '}
                    {player.character} ({player.nickname})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>🏛️ {game.setting}</span>
            <span>⚡ {game.circumstance}</span>
          </div>
        </motion.div>

        {/* Script Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-6"
          style={{ background: 'var(--color-surface-alt)' }}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              <span>Line {currentLineIndex + 1} of {game.script.lines.length}</span>
              <span>{Math.round((currentLineIndex / game.script.lines.length) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <motion.div
                className="h-full"
                style={{ background: 'var(--color-accent)' }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentLineIndex + 1) / game.script.lines.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Current Line */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLineIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-8"
            >
              <div
                className="inline-block px-4 py-1 rounded-full text-sm mb-4"
                style={{
                  backgroundColor: `${getMoodColor(currentLine.mood)}20`,
                  color: getMoodColor(currentLine.mood),
                  border: `1px solid ${getMoodColor(currentLine.mood)}60`
                }}
              >
                {currentLine.mood}
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>{currentLine.speaker}</h3>
              <p className="text-2xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                "{currentLine.text}"
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentLineIndex(Math.max(0, currentLineIndex - 1))}
              disabled={currentLineIndex === 0}
              className="p-3 disabled:opacity-50 rounded-full transition-colors"
              style={{ background: 'var(--color-surface-alt)' }}
              aria-label="Previous line"
            >
              ⏮️
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-3 text-white rounded-full font-semibold transition-colors"
              style={{ background: 'var(--color-accent)' }}
              aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={() => setCurrentLineIndex(Math.min(game.script.lines.length - 1, currentLineIndex + 1))}
              disabled={currentLineIndex === game.script.lines.length - 1}
              className="p-3 disabled:opacity-50 rounded-full transition-colors"
              style={{ background: 'var(--color-surface-alt)' }}
              aria-label="Next line"
            >
              ⏭️
            </button>
          </div>
        </motion.div>

        {/* Teleprompter Settings & Full Script (collapsible) */}
        <motion.details
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--color-surface-alt)' }}
        >
          <summary className="p-4 cursor-pointer text-[var(--color-text-primary)] font-semibold transition-colors flex items-center justify-between">
            <span>📜 View Full Script</span>
            <div onClick={(e) => e.stopPropagation()}>
              <TeleprompterSettingsPanel
                settings={teleprompterSettings}
                onPresetChange={setTeleprompterPreset}
                onCustomChange={setTeleprompterCustom}
                onAutoScrollToggle={toggleTeleprompterAutoScroll}
                disabled={teleprompterSettingsLoading}
                compact
              />
            </div>
          </summary>
          <div ref={scriptViewerRef} className="p-4 pt-0 max-h-96 overflow-y-auto">
            <AnimatePresence mode="sync">
              {getVisibleLines(game.script.lines, currentLineIndex, teleprompterSettings).map(({ line, originalIndex }) => (
                <motion.div
                  key={originalIndex}
                  data-line-index={originalIndex}
                  onClick={() => {
                    setCurrentLineIndex(originalIndex)
                    setIsPlaying(false)
                  }}
                  className="p-3 rounded-lg mb-2 cursor-pointer transition-colors"
                  style={originalIndex === currentLineIndex
                    ? { background: 'var(--color-accent-light, rgba(245, 158, 66, 0.1))', border: '1px solid var(--color-accent)' }
                    : {}
                  }
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{line.speaker}:</span>
                  <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>"{line.text}"</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.details>

        {/* Stats */}
        {game.winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-6 text-center"
            style={{ background: 'linear-gradient(to right, var(--color-highlight), var(--color-accent-light))', border: '1px solid var(--color-accent)' }}
          >
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-accent-dark)' }}>MVP: {game.winner.playerName}</h3>
            <p style={{ color: 'var(--color-accent)' }}>as {game.winner.character}</p>
          </motion.div>
        )}

        {/* Rematch Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={handleRematch}
            className="px-8 py-4 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
            style={{ background: 'var(--color-accent)' }}
          >
            🎭 Play Again with Same Settings
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 text-[var(--color-text-primary)] rounded-lg font-semibold transition-colors"
            style={{ background: 'var(--color-surface-alt)' }}
          >
            🏠 Back to Home
          </button>
        </motion.div>
      </div>

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  )
}
