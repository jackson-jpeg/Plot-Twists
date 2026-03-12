'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { UserMenu } from '@/components/UserMenu'
import { LandingPage } from '@/components/LandingPage'
import { XPBar } from '@/components/XPBar'
import { PosterShowcase } from '@/components/PosterShowcase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCreditBalance } from '@/components/CreditBadge'
import { Skeleton } from '@/components/EmptyState'
import { Button, Card, PageContainer } from '@/components/ui'
import { SPRING_GENTLE } from '@/lib/motion'
import type { LevelInfo, PlayerStats } from '@/lib/types'

function MarqueeStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div
      className="rounded-[22px] border px-4 py-4 text-center"
      style={{
        background: 'rgba(255,255,255,0.72)',
        borderColor: 'var(--color-border)',
      }}
    >
      <p
        className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </p>
      <p className="mt-2 font-display text-[2rem]" style={{ color: accent ?? 'var(--color-text-primary)' }}>
        {value}
      </p>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { socket, isConnected } = useSocket()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const [mounted, setMounted] = useState(false)
  const [creditsPurchased, setCreditsPurchased] = useState(false)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const creditBalance = useCreditBalance()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!socket || !isConnected || !user?.uid) return
    socket.emit('get_progression', user.uid, (response) => {
      if (response.success && response.levelInfo) setLevelInfo(response.levelInfo)
    })
    socket.emit('get_player_stats', user.uid, (response) => {
      if (response.success && response.stats) setPlayerStats(response.stats)
    })
  }, [socket, isConnected, user?.uid])

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
      <PageContainer size="wide">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5">
          <div className="flex items-center justify-between">
            <Skeleton variant="rect" width={180} height={30} />
            <Skeleton variant="circle" width={44} height={44} />
          </div>
          <Skeleton variant="card" width="100%" height={420} />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton variant="card" width="100%" height={140} />
            <Skeleton variant="card" width="100%" height={140} />
            <Skeleton variant="card" width="100%" height={140} />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  const firstName = user.displayName?.split(' ')[0]

  return (
    <PageContainer
      size="full"
      style={{
        padding: 'calc(18px + env(safe-area-inset-top, 0px)) 16px calc(96px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <AnimatePresence>
        {creditsPurchased ? (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed left-1/2 z-[60] -translate-x-1/2 rounded-[18px] border px-6 py-3 text-sm font-semibold"
            style={{
              top: 'calc(16px + env(safe-area-inset-top, 0px))',
              background: 'var(--color-success)',
              color: 'white',
              borderColor: 'rgba(255,255,255,0.18)',
              boxShadow: '0 18px 40px rgba(15,159,98,0.28)',
            }}
          >
            Credits added to your account.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <motion.div
          className="flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_GENTLE}
        >
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--color-text-tertiary)' }}>
              Control booth
            </p>
            <p className="mt-1 font-display text-[1.8rem]" style={{ color: 'var(--color-text-primary)' }}>
              {firstName ? `${firstName}, your next hit is waiting` : 'Your next hit is waiting'}
            </p>
          </div>
          <UserMenu />
        </motion.div>

        <PosterShowcase
          eyebrow="Featured mashups"
          viewerLabel={firstName ? `${firstName}'s home screen` : 'Signed in'}
          title={<>Greenlight tonight&apos;s weirdest blockbuster.</>}
          description="Jump back in with a clearer fantasy: pick the mashup, build the cast, and turn your friends into a live trailer with zero prep."
          primaryAction={(
            <Button variant="primary" size="lg" onClick={() => router.push('/host')}>
              Host a game
            </Button>
          )}
          secondaryAction={(
            <Button variant="secondary" size="lg" onClick={() => router.push('/join')}>
              Join a room
            </Button>
          )}
          footer={levelInfo ? <XPBar levelInfo={levelInfo} compact /> : (
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
              Start a room, pull a mashup, and let the script land like a reveal trailer.
            </div>
          )}
        />

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_GENTLE, delay: 0.12 }}
            className="grid gap-4"
          >
            <Card variant="elevated">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent)' }}>
                Quick start
              </p>
              <div className="mt-4 grid gap-3">
                <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/host')}>
                  Start host mode
                </Button>
                <Button variant="secondary" size="lg" fullWidth onClick={() => router.push('/host?mode=solo')}>
                  Play solo
                </Button>
                <Button variant="secondary" size="lg" fullWidth onClick={() => router.push('/join')}>
                  Enter a room code
                </Button>
              </div>
            </Card>

            <Card variant="elevated">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-tertiary)' }}>
                Your box office
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MarqueeStat label="Games" value={playerStats?.gamesPlayed ?? 0} />
                <MarqueeStat label="MVPs" value={playerStats?.gamesWon ?? 0} accent="var(--color-accent)" />
                <MarqueeStat label="Credits" value={creditBalance?.total ?? 0} accent="var(--color-accent-2)" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_GENTLE, delay: 0.18 }}
          >
            <Card
              variant="elevated"
              className="h-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,246,236,0.9) 100%)',
              }}
            >
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent-2)' }}>
                Why this flow is better
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  'Poster-first examples make the joke format legible in a glance.',
                  'Host, join, and solo paths are all framed like production choices instead of generic utility buttons.',
                  'Your progression and replay energy now sit downstream of the same marquee identity.',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[20px] border px-4 py-4"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'rgba(255,255,255,0.72)',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                <Link href="/privacy" className="hover:underline">Privacy</Link>
                {' '}·{' '}
                <Link href="/terms" className="hover:underline">Terms</Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  )
}
