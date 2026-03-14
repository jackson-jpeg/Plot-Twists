'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGGER } from '@/lib/motion'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { PlayerProfile, Leaderboard } from '@/components/PlayerProfile'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { AccountUpgradeCard } from '@/components/AccountUpgradeCard'
import { StatsSkeleton, Skeleton } from '@/components/EmptyState'
import { CreditHeaderBadge, useCreditBalance } from '@/components/CreditBadge'
import dynamic from 'next/dynamic'
const AccountSettings = dynamic(() => import('@/components/AccountSettings').then(m => ({ default: m.AccountSettings })), { ssr: false, loading: () => <div className="rounded-xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}><div className="animate-pulse" style={{ width: 200, height: 24, borderRadius: 6, background: 'var(--color-surface-alt)' }} /><div className="animate-pulse mt-4" style={{ width: '80%', height: 14, borderRadius: 6, background: 'var(--color-surface-alt)' }} /></div> })
const PurchaseCreditsModal = dynamic(() => import('@/components/PurchaseCreditsModal').then(m => ({ default: m.PurchaseCreditsModal })), { ssr: false, loading: () => null })
import { ReferralCard } from '@/components/ReferralCard'
import { XPBar } from '@/components/XPBar'
import { WeeklyChallenges } from '@/components/WeeklyChallenges'
import { Button, Card, Avatar, PageContainer } from '@/components/ui'
import type { PaymentTransaction, PlayerStats, Progression, LevelInfo, WeeklyChallenge as WeeklyChallengeType } from '@/lib/types'
import { getApiBaseUrl } from '@/lib/api'
import { isAdminUser } from '@/lib/admin'
import { isIOSNative } from '@/lib/platform'
import { getAuthHeaders } from '@/lib/authHeaders'
import { SignInButton } from '@clerk/nextjs'

type ProfileTab = 'profile' | 'leaderboard'

export default function ProfilePage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const { user, loading: authLoading, signOut, getPlayerId, isConfigured, getToken } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [accountExpanded, setAccountExpanded] = useState(false)
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyChallengeType[]>([])
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
    socket.emit('get_progression', playerId, (response) => {
      if (response.success && response.levelInfo) {
        setLevelInfo(response.levelInfo)
      }
    })
    socket.emit('get_weekly_challenges', (response) => {
      if (response.success && response.challenges) {
        setWeeklyChallenges(response.challenges)
      }
    })
  }, [socket, isConnected, playerId])

  const fetchTransactions = useCallback(async () => {
    if (!user || user.isAnonymous) return
    setLoadingTransactions(true)
    setTransactionError(null)
    try {
      const headers = await getAuthHeaders(getToken)
      const res = await fetch(`${getApiBaseUrl()}/api/stripe/transactions`, { headers })
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
      const headers = await getAuthHeaders(getToken)
      const res = await fetch(`${getApiBaseUrl()}/api/stripe/portal-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (data.url) {
        if (isIOSNative()) {
          import('@capacitor/browser').then(({ Browser }) => {
            Browser.open({ url: data.url })
          }).catch(() => {
            setPortalError('Visit plot-twists.com/profile to manage billing')
          })
        } else {
          window.open(data.url, '_blank')
        }
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
      <PageContainer size="narrow" style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="pt-4 pb-8 space-y-6">
          <div className="flex flex-col items-center gap-3 pt-8">
            <Skeleton variant="circle" width={80} height={80} />
            <Skeleton variant="text" width="40%" height={28} />
            <Skeleton variant="text" width="55%" height={14} />
          </div>
          <StatsSkeleton />
        </div>
      </PageContainer>
    )
  }

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'profile', label: 'My Profile' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ]

  const heroStats = stats && stats.gamesPlayed > 0 ? [
    { label: 'Games', value: stats.gamesPlayed, highlight: false },
    { label: 'MVP Wins', value: stats.gamesWon, highlight: true },
    { label: 'Votes', value: stats.totalVotesReceived, highlight: false },
  ] : null

  return (
    <PageContainer size="medium" style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Purchase Credits Modal */}
      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />

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

      <div className="pt-8 pb-8">
        {/* Admin link (top right, if admin) */}
        {user && isAdminUser({ email: user.email, phoneNumber: user.phoneNumber }) && (
          <div className="flex justify-end mb-2">
            <motion.button
              onClick={() => router.push('/admin')}
              style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)' }}
              whileTap={{ scale: 0.95 }}
            >
              Admin →
            </motion.button>
          </div>
        )}

        {/* Profile Hero — centered avatar + name */}
        {heroStats ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div style={{ marginBottom: '12px' }}>
                <Avatar name={stats!.nickname} size="lg" style={{ width: 80, height: 80, fontSize: '32px' }} />
              </div>
              <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                {stats!.nickname}
              </h1>
              {levelInfo && (
                <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
                  Level {levelInfo.level} — {levelInfo.title || 'Comedy Rookie'}
                </p>
              )}
            </div>

            {/* XP Progress — compact horizontal */}
            {levelInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-bold shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                    Lv. {levelInfo.level}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${levelInfo.progressPercent}%`,
                        background: 'var(--color-success)',
                      }}
                    />
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                    {levelInfo.currentXP}/{levelInfo.xpForNextLevel}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Credits row */}
            <motion.div
              className="flex items-center justify-center gap-3 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span
                className="px-3 py-1.5 rounded-full text-sm font-semibold"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                {creditBalance ? `${creditBalance.total} credit${creditBalance.total !== 1 ? 's' : ''}` : '— credits'}
              </span>
              <Button variant="primary" size="sm" onClick={() => setShowPurchaseModal(true)}>
                Buy More
              </Button>
            </motion.div>

            {/* Stat cards — 3 in a row */}
            <div className="flex gap-3 mb-6">
              {heroStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="flex-1 text-center"
                  style={{
                    padding: '16px 8px',
                    borderRadius: '12px',
                    border: stat.highlight ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: stat.highlight ? 'var(--color-accent-light)' : 'var(--color-surface)',
                  }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * STAGGER }}
                >
                  <div className="font-display" style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: stat.highlight ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    marginBottom: '2px',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Current Streak Banner */}
            {stats!.currentWinStreak >= 2 && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6"
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex items-center justify-between p-3"
                  style={{
                    background: 'linear-gradient(to right, var(--color-accent-light), var(--color-danger-light))',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ color: 'var(--color-accent)', fontSize: '24px' }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2c-1 4-4 6-4 10a6 6 0 0012 0c0-4-3-6-4-10-1 2-3 3-4 0z" fill="currentColor" /></svg>
                    </motion.span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-accent-dark)' }}>On Fire!</p>
                      <p style={{ fontSize: '12px', color: 'var(--color-accent)' }}>
                        {stats!.currentWinStreak} game win streak
                      </p>
                    </div>
                  </div>
                  <span className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {stats!.currentWinStreak}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Weekly Challenges */}
            {weeklyChallenges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <WeeklyChallenges challenges={weeklyChallenges} />
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Fallback header when no stats */
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <div className="flex flex-col items-center mb-6">
              <div style={{ marginBottom: '12px' }}>
                <Avatar name="?" size="lg" style={{ width: 80, height: 80, fontSize: '32px' }} />
              </div>
              <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Your Profile
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
                Stats, achievements, and settings
              </p>
            </div>
          </motion.div>
        )}

        {/* Profile / Leaderboard tab nav */}
        <div className="flex gap-2 mb-5" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--color-surface)' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  boxShadow: isActive ? '0 1px 3px rgba(42, 39, 34, 0.08)' : 'none',
                }}
              >
                {tab.label}
              </button>
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
              transition={{ duration: 0.15 }}
            >
              <Card variant="surface" padding="lg">
                {playerId ? (
                  <PlayerProfile playerId={playerId} hideHeader />
                ) : (
                  <div className="text-center py-12">
                    <p style={{ color: 'var(--color-text-secondary)' }}>Sign in to see your stats and achievements.</p>
                  </div>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <Card variant="surface" padding="lg">
                <Leaderboard />
              </Card>
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

        {/* Account & Settings — collapsible */}
        {user && !user.isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6"
          >
            <div style={{ borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <button
                onClick={() => setAccountExpanded(!accountExpanded)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'white',
                      background: 'linear-gradient(to bottom right, var(--color-emerald), var(--color-success))',
                    }}
                  >
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || user.phoneNumber?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-display" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      Account & Settings
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {user.email || user.phoneNumber || 'Manage your account'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!accountExpanded && creditBalance && (
                    <span className="hidden sm:block" style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {creditBalance.total} script{creditBalance.total !== 1 ? 's' : ''}
                    </span>
                  )}
                  <motion.span
                    style={{ fontSize: '16px', color: 'var(--color-text-tertiary)' }}
                    animate={{ rotate: accountExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                    <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                      {/* Auth status */}
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                          Signed in as <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{user.displayName || user.email || user.phoneNumber}</span>
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleSignOut}>
                          Sign Out
                        </Button>
                      </div>

                      {/* Credit wallet */}
                      <div style={{ borderRadius: '10px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', padding: '12px' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-accent)' }}><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M2 8h20M7 4v4M12 4v4M17 4v4" stroke="currentColor" strokeWidth="1.8" /></svg>
                            <div>
                              <p className="font-display" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {creditBalance ? `${creditBalance.total} Script${creditBalance.total !== 1 ? 's' : ''}` : 'Loading...'}
                              </p>
                              {creditBalance && (
                                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                  {creditBalance.free} free + {creditBalance.banked} banked
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="primary" size="sm" onClick={() => setShowPurchaseModal(true)}>
                            Buy More
                          </Button>
                        </div>
                      </div>

                      {/* Payment History */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-display" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                            Payment History
                          </h3>
                          {!isIOSNative() && (
                            <Button variant="secondary" size="sm" onClick={openCustomerPortal} loading={portalLoading}>
                              View Receipts
                            </Button>
                          )}
                        </div>
                        {portalError && (
                          <p className="text-right" style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px' }}>{portalError}</p>
                        )}

                        {transactionError ? (
                          <div className="py-3 text-center">
                            <p style={{ fontSize: '14px', color: 'var(--color-danger)', marginBottom: '8px' }}>{transactionError}</p>
                            <button
                              onClick={fetchTransactions}
                              style={{ fontSize: '14px', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Try again
                            </button>
                          </div>
                        ) : loadingTransactions ? (
                          <div className="py-4">
                            <LoadingSpinner size="sm" variant="dots" text="Loading..." />
                          </div>
                        ) : transactions.length === 0 ? (
                          <p className="text-center py-3" style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
                            No transactions yet.
                          </p>
                        ) : (
                          <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                            {transactions.slice(0, 5).map(txn => (
                              <div key={txn.id} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <div className="flex items-center gap-3">
                                  <span style={{ fontSize: '14px', fontWeight: 500, color: txn.type === 'purchase' ? 'var(--color-success)' : txn.type === 'refund' ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                                    {txn.type === 'purchase' ? '+' : txn.type === 'refund' ? '←' : txn.type === 'failed' ? '×' : '…'}
                                  </span>
                                  <div>
                                    <p style={{ fontWeight: 500, fontSize: '14px', color: txn.type === 'purchase' ? 'var(--color-success)' : txn.type === 'refund' ? 'var(--color-accent)' : txn.type === 'failed' ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                                      {txn.type === 'purchase' ? txn.packageLabel : txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                      {new Date(txn.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p style={{ fontWeight: 600, fontSize: '14px', color: txn.creditsAdded > 0 ? 'var(--color-success)' : txn.creditsAdded < 0 ? 'var(--color-danger)' : 'var(--color-text-disabled)' }}>
                                    {txn.creditsAdded > 0 ? '+' : ''}{txn.creditsAdded} credits
                                  </p>
                                  {txn.amountCents !== 0 && (
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
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
                      <div className="text-center pt-2" style={{ fontSize: '12px', color: 'var(--color-text-disabled)' }}>
                        <Link href="/privacy" style={{ color: 'var(--color-text-tertiary)', textDecoration: 'none' }}>Privacy Policy</Link>
                        {' '}&middot;{' '}
                        <Link href="/terms" style={{ color: 'var(--color-text-tertiary)', textDecoration: 'none' }}>Terms of Service</Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Guest sign-in prompt */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-center"
            style={{ padding: '24px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Create an Account
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Save your stats, compete on leaderboards, and sync across devices.
            </p>
            <SignInButton mode="redirect">
              <Button variant="primary" size="lg" fullWidth>
                Create Free Account
              </Button>
            </SignInButton>
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}
