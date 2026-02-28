'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { UserMenu } from '@/components/UserMenu'
import { LandingPage } from '@/components/LandingPage'
import { XPBar } from '@/components/XPBar'
import { MOTION } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCreditBalance } from '@/components/CreditBadge'
import type { LevelInfo, PlayerStats } from '@/lib/types'

function HostIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M12 26h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 22v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function JoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="8" y="4" width="16" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 22h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SoloPersonIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="20" r="8" stroke="var(--color-accent)" strokeWidth="2" />
      <path d="M14 44c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TheaterMasksIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="10" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
      <circle cx="12.5" cy="11" r="1" fill="currentColor" />
      <path d="M7.5 14.5c1.5 1.5 3.5 1.5 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="14" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="15.5" cy="13" r="1" fill="currentColor" />
      <circle cx="20.5" cy="13" r="1" fill="currentColor" />
      <path d="M15.5 16.5c1.5 1 3.5 1 5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronRightIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2l2.47 5.01L18 7.75l-4 3.9.94 5.5L10 14.27l-4.94 2.88.94-5.5-4-3.9 5.53-.74L10 2z" fill="currentColor" />
    </svg>
  )
}

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { socket, isConnected } = useSocket()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const canHover = isDesktop
  const [mounted, setMounted] = useState(false)
  const [creditsPurchased, setCreditsPurchased] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const creditBalance = useCreditBalance()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch progression & stats for authenticated users
  useEffect(() => {
    if (!socket || !isConnected || !user?.uid) return
    socket.emit('get_progression', user.uid, (response) => {
      if (response.success && response.levelInfo) setLevelInfo(response.levelInfo)
    })
    socket.emit('get_player_stats', user.uid, (response) => {
      if (response.success && response.stats) setPlayerStats(response.stats)
    })
  }, [socket, isConnected, user?.uid])

  // Handle Stripe return: show banner and clean up URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('credits') === 'purchased') {
      setCreditsPurchased(true)
      window.history.replaceState({}, '', '/')
      const timer = setTimeout(() => setCreditsPurchased(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!mounted || loading) {
    return (
      <main className="flex flex-col" style={{ alignItems: 'flex-start', minHeight: '100dvh', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="w-full mx-auto px-5" style={{ width: '100%', padding: '0 20px', maxWidth: isDesktop ? '720px' : '448px' }}>
          {/* Top bar skeleton */}
          <div className="flex items-center justify-between" style={{ paddingTop: '16px' }}>
            <div className="animate-pulse" style={{ width: 140, height: 28, borderRadius: 8, background: 'var(--color-surface-alt)' }} />
            <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--color-surface-alt)' }} />
          </div>
          {/* Greeting skeleton */}
          <div style={{ marginTop: 24 }}>
            <div className="animate-pulse" style={{ width: 220, height: 40, borderRadius: 8, background: 'var(--color-surface-alt)' }} />
            <div className="animate-pulse mt-2" style={{ width: 200, height: 16, borderRadius: 6, background: 'var(--color-surface-alt)' }} />
          </div>
          {/* Solo card skeleton */}
          <div className="animate-pulse mt-6" style={{ width: '100%', height: 160, borderRadius: 16, background: 'var(--color-surface-alt)' }} />
          {/* Friends cards skeleton */}
          <div className="flex gap-3 mt-6">
            <div className="animate-pulse flex-1" style={{ height: 140, borderRadius: 16, background: 'var(--color-surface-alt)' }} />
            <div className="animate-pulse flex-1" style={{ height: 140, borderRadius: 16, background: 'var(--color-surface-alt)' }} />
          </div>
        </div>
      </main>
    )
  }

  // Unauthenticated users see the landing page
  if (!user) {
    return <LandingPage />
  }

  const firstName = user?.displayName?.split(' ')[0]
  const userInitial = (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()

  return (
    <main className="flex flex-col" style={{ alignItems: 'flex-start', minHeight: '100dvh', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Credits purchased banner */}
      <AnimatePresence>
        {creditsPurchased && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl font-semibold text-[0.95rem] shadow-lg"
            style={{
              top: 'calc(16px + env(safe-area-inset-top, 0px))',
              background: 'var(--color-success)',
              color: '#fff',
            }}
            role="status"
            aria-live="polite"
          >
            Credits added to your account!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full mx-auto px-5" style={{ width: '100%', padding: '0 20px', maxWidth: isDesktop ? '720px' : '448px' }}>
        {/* Top bar: branding left, avatar right */}
        <motion.div
          className="flex items-center justify-between"
          style={{ paddingTop: '16px' }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
        >
          <div className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <TheaterMasksIcon />
            <span className="font-display font-bold" style={{ fontSize: '17px' }}>Plot Twists</span>
          </div>
          <UserMenu />
        </motion.div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
          style={{ marginTop: '24px' }}
        >
          <h1
            className="font-display"
            style={{
              fontSize: firstName ? 'clamp(36px, 9vw, 44px)' : 'clamp(40px, 10vw, 48px)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {firstName ? `Hey, ${firstName}` : 'Plot Twists'}
          </h1>
          {levelInfo && (
            <motion.div
              className="mt-3"
              style={{ maxWidth: '280px' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <XPBar levelInfo={levelInfo} compact />
            </motion.div>
          )}
        </motion.div>

        {/* Action cards — full-width rows matching Paper */}
        <div className="flex flex-col gap-3" style={{ marginTop: '24px' }}>
          <motion.button
            onClick={() => router.push('/host')}
            className="w-full flex items-center gap-4"
            style={{
              padding: '20px',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ...MOTION.gentle }}
            whileHover={canHover ? { y: -2, scale: 1.01 } : undefined}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="flex items-center justify-center shrink-0 rounded-2xl"
              style={{ width: 48, height: 48, background: 'rgba(245, 158, 66, 0.1)', color: 'var(--color-accent)' }}
            >
              <HostIcon />
            </div>
            <div className="flex-1">
              <h2 className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Host a Game
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                Create a room and run the show
              </p>
            </div>
            <div style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
              <ChevronRightIcon />
            </div>
          </motion.button>

          <motion.button
            onClick={() => router.push('/join')}
            className="w-full flex items-center gap-4"
            style={{
              padding: '20px',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...MOTION.gentle }}
            whileHover={canHover ? { y: -2, scale: 1.01 } : undefined}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="flex items-center justify-center shrink-0 rounded-2xl"
              style={{ width: 48, height: 48, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-purple, #8B5CF6)' }}
            >
              <JoinIcon />
            </div>
            <div className="flex-1">
              <h2 className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Join a Game
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                Enter a room code and play
              </p>
            </div>
            <div style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
              <ChevronRightIcon />
            </div>
          </motion.button>
        </div>

        {/* Play Solo button */}
        <motion.button
          onClick={() => router.push('/host?mode=solo')}
          className="w-full flex items-center justify-center gap-2"
          style={{
            marginTop: '16px',
            padding: '16px',
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ...MOTION.gentle }}
          whileHover={canHover ? { scale: 1.02 } : undefined}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="20" height="20" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <circle cx="28" cy="20" r="8" stroke="currentColor" strokeWidth="4" />
            <path d="M14 44c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          Play Solo
        </motion.button>

        {/* Stats row — matching Paper design */}
        <motion.div
          className="flex gap-3"
          style={{ marginTop: '24px' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {[
            { label: 'GAMES', value: playerStats?.gamesPlayed ?? 0, color: 'var(--color-text-primary)' },
            { label: 'MVPS', value: playerStats?.gamesWon ?? 0, color: 'var(--color-accent)' },
            { label: 'CREDITS', value: creditBalance?.total ?? 0, color: 'var(--color-text-primary)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 text-center"
              style={{
                padding: '16px 8px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
              }}
            >
              <div className="font-display font-bold" style={{ fontSize: '24px', color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <div className="mt-6 mb-4 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <Link href="/privacy" className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}>Privacy</Link>
          {' '}&middot;{' '}
          <Link href="/terms" className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}>Terms</Link>
        </div>
      </div>
    </main>
  )
}
