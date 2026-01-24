'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { SavedGame } from '@/lib/types'

interface GameHistoryProps {
  playerId?: string
  limit?: number
  showTitle?: boolean
}

export function GameHistory({ playerId, limit = 10, showTitle = true }: GameHistoryProps) {
  const { socket } = useSocket()
  const [games, setGames] = useState<SavedGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null)
  const [sharingGameId, setSharingGameId] = useState<string | null>(null)

  const fetchHistory = useCallback(() => {
    if (!socket || !playerId) {
      setLoading(false)
      return
    }

    setLoading(true)
    socket.emit('get_game_history', playerId, limit, (response) => {
      setLoading(false)
      if (response.success && response.games) {
        setGames(response.games)
      } else {
        setError(response.error || 'Failed to load history')
      }
    })
  }, [socket, playerId, limit])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleShare = (gameId: string) => {
    if (!socket) return

    setSharingGameId(gameId)
    socket.emit('share_game', gameId, (response) => {
      setSharingGameId(null)
      if (response.success && response.shareUrl) {
        navigator.clipboard.writeText(response.shareUrl)
        // Show toast or feedback
      }
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="inline-block text-3xl mb-2"
        >
          🎬
        </motion.div>
        <p>Loading history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>{error}</p>
        <button onClick={fetchHistory} className="mt-2 text-purple-400 hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-5xl mb-4">🎭</div>
        <p>No games yet!</p>
        <p className="text-sm mt-1">Your performance history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📜</span> Game History
        </h2>
      )}

      <div className="space-y-3">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-800/50 rounded-xl overflow-hidden"
          >
            {/* Game Header - Always visible */}
            <button
              onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
              className="w-full p-4 text-left hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {game.winner?.playerId === playerId ? '🏆' : '🎬'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{game.title}</h3>
                    <p className="text-sm text-gray-400">
                      {formatDate(game.playedAt)} • {formatDuration(game.duration)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                    {game.gameMode.replace('_', ' ')}
                  </span>
                  <motion.span
                    animate={{ rotate: expandedGameId === game.id ? 180 : 0 }}
                    className="text-gray-400"
                  >
                    ▼
                  </motion.span>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedGameId === game.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 border-t border-gray-700/50 space-y-4">
                    {/* Synopsis */}
                    <div>
                      <p className="text-sm text-gray-300 italic">"{game.synopsis}"</p>
                    </div>

                    {/* Setting & Circumstance */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Setting:</span>
                        <p className="text-gray-300">{game.setting}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Circumstance:</span>
                        <p className="text-gray-300">{game.circumstance}</p>
                      </div>
                    </div>

                    {/* Cast */}
                    <div>
                      <span className="text-gray-500 text-sm">Cast:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {game.players.map(player => (
                          <div
                            key={player.id}
                            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                              player.isWinner
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {player.isWinner && <span>👑</span>}
                            <span className="font-medium">{player.character}</span>
                            <span className="text-gray-500">({player.nickname})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-sm">
                      {game.audienceReactionCount > 0 && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <span>😂</span>
                          <span>{game.audienceReactionCount} reactions</span>
                        </div>
                      )}
                      {game.plotTwistsUsed.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <span>🌀</span>
                          <span>{game.plotTwistsUsed.length} plot twists</span>
                        </div>
                      )}
                      {game.views > 0 && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <span>👁</span>
                          <span>{game.views} views</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleShare(game.id)}
                        disabled={sharingGameId === game.id}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {sharingGameId === game.id ? 'Sharing...' : game.isPublic ? '📋 Copy Link' : '🔗 Share'}
                      </button>
                      <button
                        onClick={() => {/* TODO: View full script */}}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        📄 View Script
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
