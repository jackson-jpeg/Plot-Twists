'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { PlayerProfile, Leaderboard } from '@/components/PlayerProfile'
import { AuthModal } from '@/components/AuthModal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { AccountUpgradeCard } from '@/components/AccountUpgradeCard'
import { StatsSkeleton, Skeleton } from '@/components/EmptyState'
import { AccountSettings } from '@/components/AccountSettings'
import { CreditHeaderBadge, useCreditBalance } from '@/components/CreditBadge'
import { PurchaseCreditsModal } from '@/components/PurchaseCreditsModal'
import { ReferralCard } from '@/components/ReferralCard'
import type { PaymentTransaction, PlayerStats } from '@/lib/types'
import { getApiBaseUrl } from '@/lib/api'
import { isAdminUser } from '@/lib/admin'
import { isIOSNative } from '@/lib/platform'

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
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [accountExpanded, setAccountExpanded] = useState(false)
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const creditBalance = useCreditBalance()

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
    setTransactionError(null)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/stripe/transactions?userId=${user.uid}`)
      const data = await res.json()
      if (data.transactions) setTransactions(data.transactions)
    } catch {
      setTransactionError('Failed to load transactions')
    }
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
    } catch {
      setPortalError('Could not open billing portal')
    }
    setPortalLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!isConnected || authLoading) {
    return (
      <main className="page-container home-nostalgic">
        <div className="container max-w-2xl xl:max-w-3xl pt-20 pb-8 px-4 space-y-6">
          <div className="flex items-center gap-4 mb-5">
            <Skeleton variant="circle" width={64} height={64} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="35%" height={14} />
            </div>
          </div>
          <StatsSkeleton />
        </div>
      </main>
    )
  }

  const tabs: { id: ProfileTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'My Profile', icon: '🎭' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  ]
  const tabRotations = [-1, 0.5]

  const heroStats = stats && stats.gamesPlayed > 0 ? [
    { icon: '🎮', label: 'Games', value: stats.gamesPlayed },
    { icon: '🏆', label: 'Wins', value: stats.gamesWon },
    { icon: '📈', label: 'Win Rate', value: `${Math.round(stats.winRate)}%` },
    { icon: '🔥', label: 'Best Streak', value: stats.bestWinStreak },
  ] : null

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

      {/* Fixed top bar */}
      <motion.button
        onClick={() => router.push('/')}
        className="fixed left-4 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-lg shadow-lg hover:shadow-xl transition-all"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))', transform: 'rotate(-1deg)' }}
      >
        <span className="text-xl">←</span>
        <span className="font-medium text-[var(--color-text-primary)]">Home</span>
      </motion.button>

      {/* Credit balance pill (right) */}
      {user && !user.isAnonymous && (
        <motion.div
          className="fixed right-4 z-50"
          style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <CreditHeaderBadge onClick={() => setShowPurchaseModal(true)} />
        </motion.div>
      )}

      <div className="container max-w-2xl xl:max-w-3xl pt-20 pb-8 px-4">
        {/* Profile Hero — full stats */}
        {heroStats ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Avatar + Name — polaroid-style card */}
            <motion.div
              className="flex items-center gap-4 mb-5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-pink)] flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-2 ring-[var(--color-border)]"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {stats!.nickname[0]?.toUpperCase()}
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-display">{stats!.nickname}</h1>
                  {user && isAdminUser({ email: user.email, phoneNumber: user.phoneNumber }) && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
                        color: 'var(--color-danger)',
                      }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] font-handwritten">
                  Playing since {new Date(stats!.joinedAt).toLocaleDateString()}
                </p>
                {user && isAdminUser({ email: user.email, phoneNumber: user.phoneNumber }) && (
                  <motion.button
                    onClick={() => router.push('/admin')}
                    className="mt-1 text-xs font-medium px-2 py-0.5 rounded-lg transition-colors hover:bg-[var(--color-surface-alt)]"
                    style={{ color: 'var(--color-accent)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Admin Dashboard →
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Current Streak Banner */}
            {stats!.currentWinStreak >= 2 && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 rounded-xl overflow-hidden border border-[var(--color-border)]"
              >
                <div className="flex items-center justify-between p-3"
                  style={{
                    background: 'linear-gradient(to right, var(--color-accent-light), var(--color-danger-light))',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.span
                      className="text-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      🔥
                    </motion.span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-accent-dark)' }}>On Fire!</p>
                      <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
                        {stats!.currentWinStreak} game win streak
                      </p>
                    </div>
                  </div>
                  <span className="text-3xl font-bold font-display" style={{ color: 'var(--color-accent)' }}>
                    {stats!.currentWinStreak}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Stat cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {heroStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 text-center"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                >
                  <div className="text-xl mb-0.5">{stat.icon}</div>
                  <div className="text-lg font-bold text-[var(--color-text-primary)] font-display">{stat.value}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Fallback header when no stats */
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

        {/* Profile / Leaderboard tab nav — paper tabs */}
        <div className="flex gap-1 border-b border-[var(--color-border)] pb-0 relative mb-5" role="tablist">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-lg font-medium transition-all border border-b-0 relative -mb-px text-sm ${
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

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm"
            >
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm"
            >
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

        {/* Referral Card */}
        {user && !user.isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <ReferralCard />
          </motion.div>
        )}

        {/* Account & Settings — collapsible note card */}
        {user && !user.isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6"
          >
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm">
              <button
                onClick={() => setAccountExpanded(!accountExpanded)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm"
                    style={{ background: 'linear-gradient(to bottom right, var(--color-emerald), var(--color-success))' }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || user.phoneNumber?.[0] || '?'}
                  </motion.div>
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)] text-sm font-display">
                      Account & Settings
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {user.email || user.phoneNumber || 'Manage your account'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Inline credit preview when collapsed */}
                  {!accountExpanded && creditBalance && (
                    <span className="text-xs text-[var(--color-text-tertiary)] hidden sm:block">
                      🎬 {creditBalance.total} script{creditBalance.total !== 1 ? 's' : ''}
                    </span>
                  )}
                  <motion.span
                    className="text-lg text-[var(--color-text-tertiary)]"
                    animate={{ rotate: accountExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    ↓
                  </motion.span>
                </div>
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
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          Signed in as <span className="font-medium text-[var(--color-text-primary)]">{user.displayName || user.email || user.phoneNumber}</span>
                        </span>
                        <motion.button
                          onClick={handleSignOut}
                          className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Sign Out
                        </motion.button>
                      </div>

                      {/* Credit wallet */}
                      <div className="rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🎬</span>
                            <div>
                              <p className="text-sm font-semibold text-[var(--color-text-primary)] font-display">
                                {creditBalance ? `${creditBalance.total} Script${creditBalance.total !== 1 ? 's' : ''}` : 'Loading...'}
                              </p>
                              {creditBalance && (
                                <p className="text-xs text-[var(--color-text-tertiary)]">
                                  {creditBalance.free} free + {creditBalance.banked} banked
                                </p>
                              )}
                            </div>
                          </div>
                          <motion.button
                            onClick={() => setShowPurchaseModal(true)}
                            className="btn btn-primary btn-small"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Buy More
                          </motion.button>
                        </div>
                      </div>

                      {/* Payment History */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2 font-display">
                            <span>🧾</span> Payment History
                          </h3>
                          {!isIOSNative() && (
                            <motion.button
                              onClick={openCustomerPortal}
                              disabled={portalLoading}
                              className="text-xs px-2.5 py-1 rounded-lg transition-colors bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {portalLoading ? 'Opening...' : 'View Receipts'}
                            </motion.button>
                          )}
                        </div>
                        {portalError && (
                          <p className="text-xs text-[var(--color-danger)] mt-1 text-right">{portalError}</p>
                        )}

                        {transactionError ? (
                          <div className="py-3 text-center">
                            <p className="text-sm text-[var(--color-danger)] mb-2">{transactionError}</p>
                            <button
                              onClick={fetchTransactions}
                              className="text-sm text-[var(--color-purple)] hover:underline"
                            >
                              Try again
                            </button>
                          </div>
                        ) : loadingTransactions ? (
                          <div className="py-4">
                            <LoadingSpinner size="sm" variant="dots" text="Loading..." />
                          </div>
                        ) : transactions.length === 0 ? (
                          <p className="text-sm text-center py-3 text-[var(--color-text-tertiary)] font-handwritten">
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

                      {/* Legal Links */}
                      <div className="text-center text-xs pt-2" style={{ color: 'var(--color-text-disabled)' }}>
                        <Link href="/privacy" className="hover:underline" style={{ color: 'var(--color-text-tertiary)' }}>Privacy Policy</Link>
                        {' '}&middot;{' '}
                        <Link href="/terms" className="hover:underline" style={{ color: 'var(--color-text-tertiary)' }}>Terms of Service</Link>
                      </div>
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-6 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm"
          >
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
