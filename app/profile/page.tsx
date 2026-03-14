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
const AccountSettings = dynamic(() => import('@/components/AccountSettings').then(m => ({ default: m.AccountSettings })), { ssr: false, loading: () => <div style={{ borderRadius: '12px', padding: '24px', background: 'var(--color-ink)', border: '1px solid rgba(255,255,255,0.06)' }}><div className="animate-pulse" style={{ width: 200, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} /><div className="animate-pulse mt-4" style={{ width: '80%', height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} /></div> })
const PurchaseCreditsModal = dynamic(() => import('@/components/PurchaseCreditsModal').then(m => ({ default: m.PurchaseCreditsModal })), { ssr: false, loading: () => null })
import { ReferralCard } from '@/components/ReferralCard'
import { XPBar } from '@/components/XPBar'
import { WeeklyChallenges } from '@/components/WeeklyChallenges'
import { Button } from '@/components/ui'
import type { PaymentTransaction, PlayerStats, Progression, LevelInfo, WeeklyChallenge as WeeklyChallengeType } from '@/lib/types'
import { getApiBaseUrl } from '@/lib/api'
import { isAdminUser } from '@/lib/admin'
import { isIOSNative, isCapacitorNative } from '@/lib/platform'
import { useStandaloneMode } from '@/hooks/useStandaloneMode'
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
  const isStandalone = useStandaloneMode()
  const [installDismissed, setInstallDismissed] = useState(false)
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<{ prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null)

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

  useEffect(() => {
    try {
      if (localStorage.getItem('install-dismissed') === 'true') {
        setInstallDismissed(true)
      }
    } catch { /* localStorage unavailable */ }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredInstallPrompt(e as unknown as { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> })
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

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

  const handleInstall = async () => {
    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt()
    }
  }

  if (!isConnected || authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-void)', padding: '0 16px', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', paddingTop: '48px' }}>
          <div style={{ marginBottom: '32px' }}>
            <Skeleton variant="text" width="50%" height={36} />
            <Skeleton variant="text" width="65%" height={16} />
          </div>
          <StatsSkeleton />
        </div>
      </div>
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
    <div style={{ minHeight: '100vh', background: 'var(--color-void)', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
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

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>
        {/* Admin link */}
        {user && isAdminUser({ email: user.email, phoneNumber: user.phoneNumber }) && (
          <div className="flex justify-end" style={{ paddingTop: '12px' }}>
            <motion.button
              onClick={() => router.push('/admin')}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-stage-red)',
                fontFamily: 'var(--font-mono)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              Admin
            </motion.button>
          </div>
        )}

        {/* Page Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ paddingTop: '40px', marginBottom: '32px' }}
        >
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '36px',
            fontWeight: 400,
            color: 'var(--color-cream)',
            marginBottom: '6px',
            letterSpacing: '-0.01em',
          }}>
            Your Playbill
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.02em',
          }}>
            Stats, achievements, and settings
          </p>
        </motion.div>

        {/* Hero stats for returning players */}
        {heroStats && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '28px' }}
          >
            {/* Name + Level */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '28px',
                fontWeight: 400,
                color: 'var(--color-paper)',
                marginBottom: '4px',
              }}>
                {stats!.nickname}
              </h2>
              {levelInfo && (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                  Level {levelInfo.level} — {levelInfo.title || 'Comedy Rookie'}
                </p>
              )}
            </div>

            {/* XP Progress */}
            {levelInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{ marginBottom: '16px' }}
              >
                <div className="flex items-center gap-3">
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-stage-gold)',
                    flexShrink: 0,
                  }}>
                    Lv. {levelInfo.level}
                  </span>
                  <div className="flex-1" style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '3px',
                        width: `${levelInfo.progressPercent}%`,
                        background: 'var(--color-stage-gold)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                    {levelInfo.currentXP}/{levelInfo.xpForNextLevel}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Credits row */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ marginBottom: '20px' }}
            >
              <span style={{
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--color-cream)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {creditBalance ? `${creditBalance.total} credit${creditBalance.total !== 1 ? 's' : ''}` : '-- credits'}
              </span>
              <button
                onClick={() => setShowPurchaseModal(true)}
                style={{
                  padding: '4px 14px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  background: 'var(--color-stage-gold)',
                  color: 'var(--color-void)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Buy More
              </button>
            </motion.div>

            {/* Stat cards — 3 in a row */}
            <div className="flex gap-3" style={{ marginBottom: '20px' }}>
              {heroStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="flex-1 text-center"
                  style={{
                    padding: '14px 8px',
                    borderRadius: '10px',
                    border: stat.highlight
                      ? '1px solid var(--color-stage-gold)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: stat.highlight
                      ? 'rgba(201,162,77,0.08)'
                      : 'rgba(255,255,255,0.03)',
                  }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * STAGGER }}
                >
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '24px',
                    color: stat.highlight ? 'var(--color-stage-gold)' : 'var(--color-cream)',
                    marginBottom: '2px',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)' }}>
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
                style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(194,59,34,0.3)',
                  background: 'rgba(194,59,34,0.08)',
                  marginBottom: '20px',
                }}
              >
                <div className="flex items-center justify-between" style={{ padding: '12px 16px' }}>
                  <div className="flex items-center gap-3">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ color: 'var(--color-stage-red)', fontSize: '20px' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2c-1 4-4 6-4 10a6 6 0 0012 0c0-4-3-6-4-10-1 2-3 3-4 0z" fill="currentColor" /></svg>
                    </motion.span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-stage-red)', fontFamily: 'var(--font-mono)' }}>On Fire!</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        {stats!.currentWinStreak} game win streak
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    color: 'var(--color-stage-red)',
                  }}>
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
                style={{ marginBottom: '20px' }}
              >
                <WeeklyChallenges challenges={weeklyChallenges} />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Tab nav */}
        <div className="flex gap-2" style={{ marginBottom: '20px' }} role="tablist">
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
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isActive ? 600 : 400,
                  border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? 'var(--color-cream)' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.15s ease',
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
              {playerId ? (
                <PlayerProfile playerId={playerId} hideHeader />
              ) : (
                <div className="text-center" style={{ padding: '48px 0' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                    Sign in to see your stats and achievements.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <div style={{
                borderRadius: '12px',
                padding: '20px',
                background: 'var(--color-ink)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
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
            style={{ marginTop: '24px' }}
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
            style={{ marginTop: '24px' }}
          >
            <ReferralCard />
          </motion.div>
        )}

        {/* Install prompt card — dark subtle */}
        {!isStandalone && !installDismissed && !isCapacitorNative() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'var(--color-ink)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)', fontFamily: 'var(--font-mono)' }}>
                  Install Plot Twists
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                  Add to home screen for the best experience
                </p>
              </div>
              <button
                onClick={handleInstall}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--color-cream)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Install
              </button>
            </div>
          </motion.div>
        )}

        {/* Account & Settings — collapsible dark card */}
        {user && !user.isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ marginTop: '24px' }}
          >
            <div style={{
              borderRadius: '12px',
              background: 'var(--color-ink)',
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setAccountExpanded(!accountExpanded)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-void)',
                    background: 'var(--color-stage-gold)',
                  }}>
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || user.phoneNumber?.[0] || '?'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-cream)', fontFamily: 'var(--font-mono)' }}>
                      Account & Settings
                    </p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                      {user.email || user.phoneNumber || 'Manage your account'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!accountExpanded && creditBalance && (
                    <span className="hidden sm:block" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                      {creditBalance.total} script{creditBalance.total !== 1 ? 's' : ''}
                    </span>
                  )}
                  <motion.span
                    style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)' }}
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
                    <div className="space-y-4" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {/* Auth status */}
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                          Signed in as <span style={{ fontWeight: 500, color: 'var(--color-cream)' }}>{user.displayName || user.email || user.phoneNumber}</span>
                        </span>
                        <button
                          onClick={handleSignOut}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.5)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Sign Out
                        </button>
                      </div>

                      {/* Credit wallet */}
                      <div style={{
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: '12px',
                      }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-stage-gold)' }}><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M2 8h20M7 4v4M12 4v4M17 4v4" stroke="currentColor" strokeWidth="1.8" /></svg>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)', fontFamily: 'var(--font-mono)' }}>
                                {creditBalance ? `${creditBalance.total} Script${creditBalance.total !== 1 ? 's' : ''}` : 'Loading...'}
                              </p>
                              {creditBalance && (
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                  {creditBalance.free} free + {creditBalance.banked} banked
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPurchaseModal(true)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                              background: 'var(--color-stage-gold)',
                              color: 'var(--color-void)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Buy More
                          </button>
                        </div>
                      </div>

                      {/* Payment History */}
                      <div>
                        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                          <h3 style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-cream)', fontFamily: 'var(--font-mono)' }}>
                            Payment History
                          </h3>
                          {!isIOSNative() && (
                            <button
                              onClick={openCustomerPortal}
                              disabled={portalLoading}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.5)',
                                border: 'none',
                                cursor: 'pointer',
                                opacity: portalLoading ? 0.5 : 1,
                              }}
                            >
                              {portalLoading ? 'Loading...' : 'View Receipts'}
                            </button>
                          )}
                        </div>
                        {portalError && (
                          <p className="text-right" style={{ fontSize: '12px', color: 'var(--color-stage-red)', marginTop: '4px' }}>{portalError}</p>
                        )}

                        {transactionError ? (
                          <div className="py-3 text-center">
                            <p style={{ fontSize: '13px', color: 'var(--color-stage-red)', marginBottom: '8px' }}>{transactionError}</p>
                            <button
                              onClick={fetchTransactions}
                              style={{ fontSize: '13px', color: 'var(--color-stage-gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Try again
                            </button>
                          </div>
                        ) : loadingTransactions ? (
                          <div className="py-4">
                            <LoadingSpinner size="sm" variant="dots" text="Loading..." />
                          </div>
                        ) : transactions.length === 0 ? (
                          <p className="text-center py-3" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                            No transactions yet.
                          </p>
                        ) : (
                          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
                            {transactions.slice(0, 5).map(txn => (
                              <div key={txn.id} className="flex items-center justify-between" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-3">
                                  <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-mono)', color: txn.type === 'purchase' ? '#4ade80' : txn.type === 'refund' ? 'var(--color-stage-gold)' : 'var(--color-stage-red)' }}>
                                    {txn.type === 'purchase' ? '+' : txn.type === 'refund' ? '<-' : txn.type === 'failed' ? 'x' : '...'}
                                  </span>
                                  <div>
                                    <p style={{ fontWeight: 500, fontSize: '13px', color: 'var(--color-cream)' }}>
                                      {txn.type === 'purchase' ? txn.packageLabel : txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                                    </p>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                      {new Date(txn.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-mono)', color: txn.creditsAdded > 0 ? '#4ade80' : txn.creditsAdded < 0 ? 'var(--color-stage-red)' : 'rgba(255,255,255,0.2)' }}>
                                    {txn.creditsAdded > 0 ? '+' : ''}{txn.creditsAdded} credits
                                  </p>
                                  {txn.amountCents !== 0 && (
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
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
                      <div className="text-center" style={{ paddingTop: '8px', fontSize: '12px' }}>
                        <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Privacy Policy</Link>
                        {' '}&middot;{' '}
                        <Link href="/terms" style={{ color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Terms of Service</Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Guest sign-in prompt — subtle dark card */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              marginTop: '24px',
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'var(--color-ink)',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
                  Save your progress
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                  Create a free account to sync stats across devices
                </p>
              </div>
              <SignInButton mode="redirect">
                <button
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.08)',
                    color: 'var(--color-cream)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Create Account
                </button>
              </SignInButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
