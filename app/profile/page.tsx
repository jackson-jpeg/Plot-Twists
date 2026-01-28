'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { PlayerProfile, Leaderboard } from '@/components/PlayerProfile'
import { AuthModal } from '@/components/AuthModal'
import { LoadingSpinner } from '@/components/LoadingSpinner'

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
      <main className="page-container items-center justify-center">
        <LoadingSpinner size="lg" variant="theater" text="Loading your profile..." />
      </main>
    )
  }

  return (
    <main className="page-container home-nostalgic">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Back Button - styled as a ticket stub */}
      <motion.button
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-lg shadow-lg hover:shadow-xl transition-all"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ transform: 'rotate(-1deg)' }}
      >
        <span className="text-xl">←</span>
        <span className="font-medium text-[var(--color-text-primary)]">Home</span>
      </motion.button>

      {/* Toggle Button - styled like a ticket */}
      <motion.button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-lg shadow-lg hover:shadow-xl transition-all font-medium"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ transform: 'rotate(1deg)' }}
      >
        <span className="text-lg mr-2">{showLeaderboard ? '👤' : '🏅'}</span>
        <span className="text-[var(--color-text-primary)]">
          {showLeaderboard ? 'Profile' : 'Leaderboard'}
        </span>
      </motion.button>

      <div className="container max-w-2xl pt-20 pb-8 px-4">
        {/* Page Header - bulletin board style */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bulletin-board-header mb-6"
        >
          <div className="header-polaroid" style={{ transform: 'rotate(-1deg)' }}>
            <h1 className="hero-title-nostalgic text-3xl md:text-4xl">
              {showLeaderboard ? 'Hall of Fame' : 'Your Profile'}
              <span className="title-emoji text-4xl ml-2">
                {showLeaderboard ? '🏆' : '🎭'}
              </span>
            </h1>
          </div>
        </motion.div>

        {/* Auth Status Card - styled like a note card */}
        <motion.div
          initial={{ opacity: 0, y: -10, rotate: 0.5 }}
          animate={{ opacity: 1, y: 0 }}
          className="note-card mb-6"
        >
          <div className="tape-piece tape-top-center"></div>

          {user ? (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </motion.div>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {user.displayName || 'Player'}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
                </div>
              </div>
              <motion.button
                onClick={handleSignOut}
                className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Out
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">Guest Player</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {isConfigured
                      ? 'Sign in to sync across devices'
                      : 'Stats saved locally'}
                  </p>
                </div>
              </div>
              {isConfigured && (
                <motion.button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              )}
            </div>
          )}
        </motion.div>

        {/* Main Content - styled like a bulletin board card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={showLeaderboard ? 'leaderboard' : 'profile'}
            initial={{ opacity: 0, y: 20, rotate: showLeaderboard ? 1 : -1 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="polaroid-card"
          >
            <div className="tape-piece tape-top-left"></div>
            <div className="tape-piece tape-top-right"></div>

            <div className="p-6">
              {showLeaderboard ? (
                <Leaderboard />
              ) : playerId ? (
                <PlayerProfile playerId={playerId} />
              ) : (
                <div className="text-center py-12">
                  <LoadingSpinner variant="dots" text="Loading profile..." />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Account Benefits (for guests) - styled like a sticky note */}
        {!user && isConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 20, rotate: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sticky-note-large mt-6"
          >
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-[var(--color-text-primary)]">
              <span>✨</span> Why Create an Account?
            </h3>
            <ul className="space-y-2 text-[var(--color-text-secondary)] text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Sync your stats across all devices
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Compete on global leaderboards
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Never lose your achievements
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Share your game replays with friends
              </li>
            </ul>
            <motion.button
              onClick={() => setShowAuthModal(true)}
              className="mt-4 w-full py-3 btn-primary font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Free Account
            </motion.button>
          </motion.div>
        )}

        {/* Decorative elements */}
        <motion.div
          className="sticky-note fixed bottom-8 right-8 hidden md:block"
          initial={{ opacity: 0, rotate: 10, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 12, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          Keep playing<br/>to unlock<br/>achievements!
        </motion.div>
      </div>
    </main>
  )
}
