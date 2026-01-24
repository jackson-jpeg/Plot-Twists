'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { PlayerProfile, Leaderboard } from '@/components/PlayerProfile'
import { AuthModal } from '@/components/AuthModal'

export default function ProfilePage() {
  const router = useRouter()
  const { isConnected } = useSocket()
  const { user, loading: authLoading, signOut, getPlayerId, isConfigured } = useAuth()
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const playerId = getPlayerId()

  const handleSignOut = async () => {
    await signOut()
  }

  if (!isConnected || authLoading) {
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
          <p className="text-xl text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-8">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

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

      {/* Right side buttons */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <motion.button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          {showLeaderboard ? '👤 Profile' : '🏅 Leaderboard'}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto pt-16"
      >
        {/* Auth Status Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-xl p-4 mb-6 backdrop-blur-sm"
        >
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-white">{user.displayName || 'Player'}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                  👤
                </div>
                <div>
                  <p className="font-semibold text-white">Guest Player</p>
                  <p className="text-sm text-gray-400">
                    {isConfigured
                      ? 'Sign in to sync across devices'
                      : 'Stats saved locally'}
                  </p>
                </div>
              </div>
              {isConfigured && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Main Content */}
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

        {/* Account Benefits (for guests) */}
        {!user && isConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30"
          >
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span>✨</span> Why Create an Account?
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Sync your stats across all devices
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Compete on global leaderboards
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Never lose your achievements
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Share your game replays with friends
              </li>
            </ul>
            <button
              onClick={() => setShowAuthModal(true)}
              className="mt-4 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Create Free Account
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
