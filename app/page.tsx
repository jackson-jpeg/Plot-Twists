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
import type { LevelInfo, PlayerStats } from '@/lib/types'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}

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
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
  const [mounted, setMounted] = useState(false)
  const [creditsPurchased, setCreditsPurchased] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)

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
        <div className="container max-w-md" style={{ width: '100%', padding: '0 20px' }}>
          {/* Top bar skeleton */}
          <div className="flex items-center justify-between" style={{ paddingTop: '16px' }}>
            <div className="skeleton" style={{ width: 140, height: 28, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 20 }} />
          </div>
          {/* Greeting skeleton */}
          <div style={{ marginTop: 24 }}>
            <div className="skeleton" style={{ width: 220, height: 40, borderRadius: 8 }} />
            <div className="skeleton mt-2" style={{ width: 200, height: 16, borderRadius: 6 }} />
          </div>
          {/* Solo card skeleton */}
          <div className="skeleton mt-6" style={{ width: '100%', height: 160, borderRadius: 16 }} />
          {/* Friends cards skeleton */}
          <div className="flex gap-3 mt-6">
            <div className="skeleton flex-1" style={{ height: 140, borderRadius: 16 }} />
            <div className="skeleton flex-1" style={{ height: 140, borderRadius: 16 }} />
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
          >
            Credits added to your account!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container max-w-md" style={{ width: '100%', padding: '0 20px' }}>
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
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
            What are you in the mood for?
          </p>
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

        {/* Play Solo card */}
        <motion.button
          onClick={() => router.push('/play')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '24px',
            padding: '24px',
            background: '#2A2722',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            position: 'relative',
            overflow: 'hidden',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...MOTION.gentle }}
          whileHover={canHover ? { y: -3, scale: 1.01 } : undefined}
          whileTap={{ scale: 0.98 }}
        >
          <div style={{ flex: 1 }}>
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
              Play solo
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: '16px', maxWidth: '220px' }}>
              Pick cards, get a script, perform it. Just you and the AI.
            </p>
            <div className="flex items-center gap-3">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 20px',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Start now
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>~3 min</span>
            </div>
          </div>
          <div style={{ flexShrink: 0, marginLeft: '12px', opacity: 0.5 }}>
            <SoloPersonIcon />
          </div>
        </motion.button>

        {/* WITH FRIENDS section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{ marginTop: '28px', marginBottom: '12px' }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
            }}
          >
            With Friends
          </span>
        </motion.div>

        <div className="flex gap-3">
          <motion.button
            onClick={() => router.push('/host')}
            className="flex-1"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '20px',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '16px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              textAlign: 'left',
            }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, ...MOTION.gentle }}
            whileHover={canHover ? { y: -3, scale: 1.02 } : undefined}
            whileTap={{ scale: 0.97 }}
          >
            <HostIcon />
            <span className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Host</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', lineHeight: 1.3 }}>Cast to TV, run the show</span>
          </motion.button>

          <motion.button
            onClick={() => router.push('/join')}
            className="flex-1"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '20px',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '16px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              textAlign: 'left',
            }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, ...MOTION.gentle }}
            whileHover={canHover ? { y: -3, scale: 1.02 } : undefined}
            whileTap={{ scale: 0.97 }}
          >
            <JoinIcon />
            <span className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Join</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', lineHeight: 1.3 }}>Enter a room code</span>
          </motion.button>
        </div>

        {/* LAST GAME section */}
        {playerStats && playerStats.gamesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: '28px' }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-tertiary)',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              Last Game
            </span>
            <Link
              href="/profile"
              className="flex items-center gap-3"
              style={{
                padding: '16px 20px',
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '16px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#fff',
                }}
              >
                <StarIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-semibold" style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>
                  {playerStats.gamesPlayed} game{playerStats.gamesPlayed !== 1 ? 's' : ''} played
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                  {playerStats.gamesWon > 0 ? `${playerStats.gamesWon} MVP win${playerStats.gamesWon !== 1 ? 's' : ''}` : 'Keep playing to earn MVP!'}
                </div>
              </div>
              <div style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                <ChevronRightIcon />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Explore card packs row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ marginTop: playerStats && playerStats.gamesPlayed > 0 ? '12px' : '28px' }}
        >
          <Link
            href="/explore"
            className="flex items-center gap-3"
            style={{
              padding: '14px 20px',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '16px',
              textDecoration: 'none',
            }}
          >
            <div style={{ color: 'var(--color-text-secondary)' }}>
              <ClockIcon />
            </div>
            <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Explore card packs
            </span>
            <div style={{ color: 'var(--color-text-tertiary)' }}>
              <ChevronRightIcon />
            </div>
          </Link>
        </motion.div>

        {/* How it works -- for new users */}
        {(!playerStats || playerStats.gamesPlayed === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 rounded-2xl p-6"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-1)',
            }}
          >
            <div className="grid grid-cols-3 gap-4 items-start">
              {[
                { num: '1', title: 'Draw cards', desc: 'Character + setting + a wild twist' },
                { num: '2', title: 'AI writes', desc: 'A custom comedy script in seconds' },
                { num: '3', title: 'Perform', desc: 'Act it out, crown the MVP' },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.1, ...MOTION.gentle }}
                  className="text-center"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '16px',
                      background: 'var(--color-text-primary)',
                    }}
                  >
                    <span
                      className="font-display"
                      style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-bg)' }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{step.title}</span>
                  <p className="text-xs leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats bar at bottom */}
        {playerStats && playerStats.gamesPlayed > 0 && (
          <motion.div
            className="flex items-center justify-center"
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--color-border)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { label: 'Games', value: playerStats.gamesPlayed },
              { label: 'MVPs', value: playerStats.gamesWon },
              { label: 'Streak', value: playerStats.currentWinStreak },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center">
                {i > 0 && (
                  <div
                    style={{
                      width: '1px',
                      height: '28px',
                      background: 'var(--color-border)',
                      margin: '0 24px',
                    }}
                  />
                )}
                <div className="text-center">
                  <div className="font-display font-bold" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

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
