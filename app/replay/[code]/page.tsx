'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { SavedGame } from '@/lib/types'
import Head from 'next/head'

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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const fetchGame = useCallback(() => {
    if (!socket || !shareCode) return

    setLoading(true)
    socket.emit('get_game_details', shareCode, (response) => {
      setLoading(false)
      if (response.success && response.game) {
        setGame(response.game)
      } else {
        setError(response.error || 'Game not found')
      }
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      angry: '#D77A7A',
      happy: '#82B682',
      confused: '#E8A75D',
      whispering: '#7C9FD9',
      neutral: '#9B9590'
    }
    return colors[mood] || colors.neutral
  }

  if (!isConnected || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            🎬
          </motion.div>
          <p className="text-xl text-gray-400">Loading replay...</p>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-gray-800/50 rounded-2xl p-8 max-w-md"
        >
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-2xl font-bold text-white mb-2">Script Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This replay may have expired or been removed.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    )
  }

  const currentLine = game.script.lines[currentLineIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="text-center">
            <h1 className="font-bold text-white">{game.title}</h1>
            <p className="text-sm text-gray-400">
              {new Date(game.playedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
              aria-label="Share options"
            >
              🔗 Share
            </button>

            {/* Share dropdown menu */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-20"
                >
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? '✓' : '📋'} {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <div className="border-t border-gray-700" />
                  {SHARE_PLATFORMS.map(platform => (
                    <button
                      key={platform.name}
                      onClick={() => handleSocialShare(platform)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
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
          className="bg-gray-800/50 rounded-xl p-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm text-gray-400 mb-2">Synopsis</h2>
              <p className="text-gray-300 italic">"{game.synopsis}"</p>
            </div>
            <div>
              <h2 className="text-sm text-gray-400 mb-2">Cast</h2>
              <div className="flex flex-wrap gap-2">
                {game.players.map(player => (
                  <span
                    key={player.id}
                    className={`px-3 py-1 rounded-full text-sm ${
                      player.isWinner
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {player.isWinner && '👑 '}
                    {player.character} ({player.nickname})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 flex gap-4 text-sm text-gray-400">
            <span>🏛️ {game.setting}</span>
            <span>⚡ {game.circumstance}</span>
          </div>
        </motion.div>

        {/* Script Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 rounded-xl p-6"
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Line {currentLineIndex + 1} of {game.script.lines.length}</span>
              <span>{Math.round((currentLineIndex / game.script.lines.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-600"
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
              <h3 className="text-xl font-bold text-white mb-3">{currentLine.speaker}</h3>
              <p className="text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
                "{currentLine.text}"
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentLineIndex(Math.max(0, currentLineIndex - 1))}
              disabled={currentLineIndex === 0}
              className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-700 rounded-full transition-colors"
            >
              ⏮️
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-colors"
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={() => setCurrentLineIndex(Math.min(game.script.lines.length - 1, currentLineIndex + 1))}
              disabled={currentLineIndex === game.script.lines.length - 1}
              className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-700 rounded-full transition-colors"
            >
              ⏭️
            </button>
          </div>
        </motion.div>

        {/* Full Script (collapsible) */}
        <motion.details
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 rounded-xl overflow-hidden"
        >
          <summary className="p-4 cursor-pointer text-white font-semibold hover:bg-gray-700/30 transition-colors">
            📜 View Full Script
          </summary>
          <div className="p-4 pt-0 max-h-96 overflow-y-auto">
            {game.script.lines.map((line, index) => (
              <div
                key={index}
                onClick={() => {
                  setCurrentLineIndex(index)
                  setIsPlaying(false)
                }}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  index === currentLineIndex
                    ? 'bg-purple-600/30 border border-purple-500'
                    : 'hover:bg-gray-700/50'
                }`}
              >
                <span className="font-semibold text-white">{line.speaker}:</span>
                <span className="text-gray-300 ml-2">"{line.text}"</span>
              </div>
            ))}
          </div>
        </motion.details>

        {/* Stats */}
        {game.winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-6 text-center"
          >
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-xl font-bold text-yellow-300">MVP: {game.winner.playerName}</h3>
            <p className="text-yellow-400/80">as {game.winner.character}</p>
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
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            🎭 Play Again with Same Settings
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
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
