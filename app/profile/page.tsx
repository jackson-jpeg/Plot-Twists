'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { PlayerProfile, Leaderboard } from '@/components/PlayerProfile'
import { AuthModal } from '@/components/AuthModal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { AccountUpgradeCard } from '@/components/AccountUpgradeCard'
import { AccountSettings } from '@/components/AccountSettings'
import { CreditHeaderBadge } from '@/components/CreditBadge'
import { PurchaseCreditsModal } from '@/components/PurchaseCreditsModal'
import type { PaymentTransaction, PlayerStats } from '@/lib/types'
import { getApiBaseUrl } from '@/lib/api'

type ProfileTab = 'profile' | 'leaderboard'

export default function ProfilePage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const { user, loading: authLoading, signOut, getPlayerId, isConfigured } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [accountExpanded, setAccountExpanded] = useState(false)
  const [stats, setStats] = useState<PlayerStats | null>(null)

  const playerId = getPlayerId()

  // Fetch player stats at top level for the hero section
  useEffect(() => {
    if (!socket || !isConnected || !playerId) return
    socket.emit('get_player_stats', playerId, (response) => {
      if (response.success && response.stats) {
        setStats(response.stats)
      }
    })
  }, [socket, isConnected, playerId])

  const fetchTransactions = useCallback(async () => {
    if (!user || user.isAnonymous) return
    setLoadingTransactions(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/stripe/transactions?userId=${user.uid}`)
      const data = await res.json()
      if (data.transactions) setTransactions(data.transactions)
    } catch { /* ignore */ }
    setLoadingTransactions(false)
  }, [user])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const openCustomerPortal = async () => {
    if (!user) return
    setPortalLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/stripe/portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch { /* ignore */ }
    setPortalLoading(false)
  }

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

  const tabRotations = [-1, 0.5]
  const tabs: { id: ProfileTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'My Profile', icon: '🎭' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  ]

  return (
    <main className="page-container home-nostalgic">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Purchase Credits Modal */}
      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />

      {/* A. Fixed top bar */}
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

      {/* Credit balance pill (right) */}
      {user && !user.isAnonymous && (
        <motion.div
          className="fixed top-4 right-4 z-50"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <CreditHeaderBadge onClick={() => setShowPurchaseModal(true)} />
        </motion.div>
      )}

      <div className="container max-w-2xl pt-20 pb-8 px-4">
        {/* B. Profile Hero — fallback header when no stats */}
        {(!stats || stats.gamesPlayed === 0) && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bulletin-board-header mb-6"
          >
            <div className="header-polaroid" style={{ transform: 'rotate(-1deg)' }}>
              <h1 className="hero-title-nostalgic text-3xl md:text-4xl">
                Your Profile
                <span className="title-emoji text-4xl ml-2">🎭</span>
              </h1>
            </div>
          </motion.div>
        )}

        {/* Profile Hero — full stats */}
        {stats && stats.gamesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-pink)] flex items-center justify-center text-3xl font-bold text-white shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {stats.nickname[0]?.toUpperCase()}
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-display">{stats.nickname}</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Playing since {new Date(stats.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Current Streak Banner */}
            {stats.currentWinStreak >= 2 && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-xl p-3 flex items-center justify-between mb-4"
                style={{
                  background: 'linear-gradient(to right, var(--color-accent-light), var(--color-danger-light))',
                  border: '1px solid var(--color-accent)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-accent-dark)' }}>On Fire!</p>
                    <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
                      {stats.currentWinStreak} game win streak
                    </p>
                  </div>
                </div>
                <span className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {stats.currentWinStreak}
                </span>
              </motion.div>
            )}

            {/* Stat cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '🎮', label: 'Games', value: stats.gamesPlayed },
                { icon: '🏆', label: 'Wins', value: stats.gamesWon },
                { icon: '📈', label: 'Win Rate', value: `${Math.round(stats.winRate)}%` },
                { icon: '🔥', label: 'Best Streak', value: stats.bestWinStreak },
              ].map((stat, i) => {
                const rotations = [-1, 1, -0.5, 1.5]
                return (
                  <motion.div
                    key={stat.label}
                    className="polaroid-card p-3 text-center relative"
                    style={{ transform: `rotate(${rotations[i]}deg)` }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.05, rotate: 0 }}
                  >
                    <div className="tape-piece tape-top-center" style={{ width: '36px', height: '14px', top: '-7px' }} />
                    <div className="text-xl mb-0.5">{stat.icon}</div>
                    <div className="text-lg font-bold text-[var(--color-text-primary)] font-display">{stat.value}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{stat.label}</div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* C. Profile / Leaderboard tab nav — paper tabs */}
        <div className="flex gap-1 border-b border-[var(--color-border)] pb-0 relative mb-5">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-lg font-medium transition-all border border-b-0 relative -mb-px ${
                  isActive
                    ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] z-10'
                    : 'bg-[var(--color-surface-alt)] border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
                style={{
                  transform: isActive ? 'rotate(0deg) translateY(-2px)' : `rotate(${tabRotations[index]}deg)`,
                  boxShadow: isActive ? 'var(--shadow-2)' : 'none'
                }}
                whileHover={!isActive ? { y: -2, rotate: 0 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon} {tab.label}
              </motion.button>
            )
          })}
        </div>

        {/* D. Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="polaroid-card"
            >
              <div className="tape-piece tape-top-left"></div>
              <div className="tape-piece tape-top-right"></div>

              <div className="p-6">
                {playerId ? (
                  <PlayerProfile playerId={playerId} hideHeader />
                ) : (
                  <div className="text-center py-12">
                    <LoadingSpinner variant="dots" text="Loading profile..." />
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20, rotate: 1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="polaroid-card"
            >
              <div className="tape-piece tape-top-left"></div>
              <div className="tape-piece tape-top-right"></div>

              <div className="p-6">
                <Leaderboard />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account Upgrade Card for Anonymous Users */}
        {user?.isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <AccountUpgradeCard />
          </motion.div>
        )}

        {/* E. Account & Settings — collapsible note card */}
        {user && !user.isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6"
          >
            <div className="note-card overflow-hidden">
              <div className="tape-piece tape-top-center"></div>

              <button
                onClick={() => setAccountExpanded(!accountExpanded)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                    style={{ background: 'linear-gradient(to bottom right, var(--color-emerald), var(--color-success))' }}
                  >
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || user.phoneNumber?.[0] || '?'}
                  </motion.div>
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)] text-sm">
                      Account & Settings
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {user.email || user.phoneNumber || 'Manage your account'}
                    </p>
                  </div>
                </div>
                <motion.span
                  className="text-lg text-[var(--color-text-tertiary)]"
                  animate={{ rotate: accountExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ↓
                </motion.span>
              </button>

              <AnimatePresence>
                {accountExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="border-t border-[var(--color-border)] p-4 space-y-4">
                      {/* Auth status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[var(--color-text-secondary)]">
                            Signed in as {user.displayName || user.email || user.phoneNumber}
                          </span>
                        </div>
                        <motion.button
                          onClick={handleSignOut}
                          className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Sign Out
                        </motion.button>
                      </div>

                      {/* Credit wallet details */}
                      <div className="flex items-center justify-between rounded-lg p-3 bg-[var(--color-surface-alt)]">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎬</span>
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">Script Credits</span>
                        </div>
                        <motion.button
                          onClick={() => setShowPurchaseModal(true)}
                          className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors bg-[var(--color-accent)] text-white"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Buy More
                        </motion.button>
                      </div>

                      {/* Payment History */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                            <span>🧾</span> Payment History
                          </h3>
                          <motion.button
                            onClick={openCustomerPortal}
                            disabled={portalLoading}
                            className="text-xs px-2.5 py-1 rounded-lg transition-colors bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {portalLoading ? 'Opening...' : 'View Receipts'}
                          </motion.button>
                        </div>

                        {loadingTransactions ? (
                          <p className="text-sm text-center py-3 text-[var(--color-text-tertiary)]">
                            Loading...
                          </p>
                        ) : transactions.length === 0 ? (
                          <p className="text-sm text-center py-3 text-[var(--color-text-tertiary)]">
                            No transactions yet.
                          </p>
                        ) : (
                          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                            {transactions.slice(0, 5).map(txn => (
                              <div key={txn.id} className="transaction-row">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">
                                    {txn.type === 'purchase' ? '💳' : txn.type === 'refund' ? '↩️' : txn.type === 'failed' ? '❌' : '⏱️'}
                                  </span>
                                  <div>
                                    <p className={`font-medium text-sm transaction-type-${txn.type}`}>
                                      {txn.type === 'purchase' ? txn.packageLabel : txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-tertiary)]">
                                      {new Date(txn.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-sm" style={{ color: txn.creditsAdded > 0 ? 'var(--color-success)' : txn.creditsAdded < 0 ? 'var(--color-danger)' : 'var(--color-text-disabled)' }}>
                                    {txn.creditsAdded > 0 ? '+' : ''}{txn.creditsAdded} credits
                                  </p>
                                  {txn.amountCents !== 0 && (
                                    <p className="text-xs text-[var(--color-text-tertiary)]">
                                      ${Math.abs(txn.amountCents / 100).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Account Settings */}
                      <AccountSettings />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Guest sign-in prompt */}
        {!user && isConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="note-card mt-6 p-6 text-center"
          >
            <div className="tape-piece tape-top-center"></div>
            <h3 className="text-lg font-bold mb-2 text-[var(--color-text-primary)] font-display">
              Create an Account
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Save your stats, compete on leaderboards, and sync across devices.
            </p>
            <motion.button
              onClick={() => setShowAuthModal(true)}
              className="btn btn-primary w-full py-3 font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Free Account
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  )
}
