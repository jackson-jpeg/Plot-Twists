'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { PlayerProfile, Leaderboard } from '@/components/PlayerProfile'

export default function ProfilePage() {
  const router = useRouter()
  const { isConnected } = useSocket()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    // Get or create player ID from localStorage
    let id = localStorage.getItem('plottwists_player_id')
    if (!id) {
      id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('plottwists_player_id', id)
    }
    setPlayerId(id)
  }, [])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            🎭
          </motion.div>
          <p className="text-xl text-gray-400">Connecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-8">
      {/* Back Button */}
      <motion.button
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-50"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4 }}
      >
        <span>←</span>
        <span>Home</span>
      </motion.button>

      {/* Leaderboard Toggle */}
      <motion.button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="fixed top-4 right-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors z-50"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        {showLeaderboard ? '👤 Profile' : '🏅 Leaderboard'}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto pt-16"
      >
        {showLeaderboard ? (
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <Leaderboard />
          </div>
        ) : playerId ? (
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <PlayerProfile playerId={playerId} />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Loading profile...
          </div>
        )}
      </motion.div>
    </div>
  )
}
