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
      <main className="page-container has-tab-bar items-center justify-center">
        <div className="container max-w-3xl" style={{ width: '100%' }}>
          {/* Header skeleton */}
          <div className="text-center mb-6">
            <div className="skeleton mx-auto" style={{ width: 200, height: 32, borderRadius: 8 }} />
            <div className="skeleton mx-auto mt-3" style={{ width: 260, height: 16, borderRadius: 6 }} />
          </div>
          {/* Ticket buttons skeleton */}
          <div className="flex gap-4 justify-center mb-6">
            <div className="skeleton" style={{ width: '45%', height: 100, borderRadius: 16 }} />
            <div className="skeleton" style={{ width: '45%', height: 100, borderRadius: 16 }} />
          </div>
          {/* Quick play row skeleton */}
          <div className="flex gap-3 justify-center">
            <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 20 }} />
            <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 20 }} />
          </div>
        </div>
      </main>
    )
  }

  // Unauthenticated users see the landing page
  if (!user) {
    return <LandingPage />
  }

  return (
    <main className="page-container has-tab-bar items-center justify-center home-nostalgic">
      {/* Credits purchased banner */}
      <AnimatePresence>
        {creditsPurchased && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed left-1/2 -translate-x-1/2 z-[60] bg-[var(--color-success)] text-black px-6 py-3 rounded-xl font-semibold text-[0.95rem] shadow-lg"
            style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
            role="status"
          >
            Credits added to your account!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with UserMenu */}
      <motion.div
        className="fixed right-4 z-50"
        style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <UserMenu />
      </motion.div>

      <div className="container max-w-3xl">

        {/* Personalized header */}
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0
          }}
          className="bulletin-board-header"
        >
          <div className="header-polaroid">
            {user?.displayName ? (
              <>
                <h1 className="hero-title-nostalgic">
                  Hey, {user.displayName.split(' ')[0]}
                  <span className="title-emoji">🎭</span>
                </h1>
                <div className="polaroid-caption">
                  Ready for another show?
                </div>
              </>
            ) : (
              <>
                <h1 className="hero-title-nostalgic">
                  Plot Twists
                  <span className="title-emoji">🎭</span>
                </h1>
                <div className="polaroid-caption">
                  Turn any group into comedy gold with AI-powered improv
                </div>
                <div className="polaroid-explainer">
                  1-6 players. 15 minutes of pure chaos. Zero acting skills required.
                </div>
              </>
            )}
            {levelInfo && (
              <motion.div
                className="mt-3 max-w-xs mx-auto"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <XPBar levelInfo={levelInfo} compact />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Quick stats for returning users */}
        {playerStats && playerStats.gamesPlayed > 0 && (
          <motion.div
            className="flex justify-center gap-3 mt-2 mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {[
              { label: 'Games', value: playerStats.gamesPlayed },
              { label: 'MVPs', value: playerStats.gamesWon },
              { label: 'Streak', value: playerStats.currentWinStreak },
            ].map(stat => (
              <div
                key={stat.label}
                className="px-3 py-1.5 rounded-full text-center"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.value}</div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Game buttons styled like tickets with distinct colors */}
        <div className="ticket-container">
          <motion.button
            onClick={() => router.push('/host')}
            className="game-ticket ticket-host ticket-purple"
            initial={{ x: -100, opacity: 0, rotate: -5 }}
            animate={{ x: 0, opacity: 1, rotate: -1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            whileHover={canHover ? { y: -8, rotate: 0, scale: 1.03 } : undefined}
            whileTap={{ scale: 0.98, y: -4 }}
          >
            <motion.div
              className="ticket-stub"
              whileHover={canHover ? { rotate: [-5, 5, -5, 0] } : undefined}
              transition={{ duration: 0.5 }}
            >
              <span className="text-5xl">🎬</span>
            </motion.div>
            <div className="ticket-main">
              <div className="ticket-title ticket-title-large">Host a Game</div>
              <div className="ticket-subtitle">Start the show</div>
            </div>
            <div className="ticket-notch"></div>
          </motion.button>

          <motion.button
            onClick={() => router.push('/join')}
            className="game-ticket ticket-join ticket-pink"
            initial={{ x: 100, opacity: 0, rotate: 5 }}
            animate={{ x: 0, opacity: 1, rotate: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            whileHover={canHover ? { y: -8, rotate: 0, scale: 1.03 } : undefined}
            whileTap={{ scale: 0.98, y: -4 }}
          >
            <motion.div
              className="ticket-stub"
              whileHover={canHover ? { rotate: [5, -5, 5, 0] } : undefined}
              transition={{ duration: 0.5 }}
            >
              <span className="text-5xl">🎮</span>
            </motion.div>
            <div className="ticket-main">
              <div className="ticket-title ticket-title-large">Join Game</div>
              <div className="ticket-subtitle">Join the fun</div>
            </div>
            <div className="ticket-notch"></div>
          </motion.button>
        </div>

        {/* Quick Play & Explore buttons */}
        <div className="flex justify-center gap-3 mt-4">
          <motion.button
            onClick={() => router.push('/play')}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[var(--color-purple)] text-white shadow-sm cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={playerStats && playerStats.gamesPlayed > 0
              ? { opacity: 1, y: 0, boxShadow: ['0 0 0 0 rgba(168, 85, 247, 0.2)', '0 0 12px 4px rgba(168, 85, 247, 0.3)', '0 0 0 0 rgba(168, 85, 247, 0.2)'] }
              : { opacity: 1, y: 0 }
            }
            transition={playerStats && playerStats.gamesPlayed > 0
              ? { opacity: { delay: 0.4 }, y: { delay: 0.4, type: 'spring', stiffness: 100, damping: 15 }, boxShadow: { duration: 2, repeat: Infinity, delay: 1 } }
              : { delay: 0.4, type: 'spring', stiffness: 100, damping: 15 }
            }
            whileHover={canHover ? { y: -3, scale: 1.03 } : undefined}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-lg">⚡</span>
            <span className="text-sm font-semibold">Quick Play</span>
          </motion.button>

          <motion.button
            onClick={() => router.push('/explore')}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 100, damping: 15 }}
            whileHover={canHover ? { y: -3, scale: 1.03, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } : undefined}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-lg">🎴</span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Explore Packs</span>
          </motion.button>
        </div>

        {/* How it works — hidden for returning users */}
        {(!playerStats || playerStats.gamesPlayed === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-sm"
          >
            <div className="grid grid-cols-3 gap-4 sm:gap-6 items-start">
              {[
                { num: '1', emoji: '🃏', title: 'Draw cards', desc: 'Character + setting + a wild twist' },
                { num: '2', emoji: '✨', title: 'AI writes the scene', desc: 'A custom comedy script in seconds' },
                { num: '3', emoji: '🎭', title: 'Perform & vote', desc: 'Act it out, crown the MVP' },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.1, type: 'spring', stiffness: 120, damping: 14 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl mb-2">{step.emoji}</div>
                  <div className="inline-flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-purple)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {step.num}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] font-display">{step.title}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-snug">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <Link href="/privacy" className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}>Privacy</Link>
          {' '}&middot;{' '}
          <Link href="/terms" className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}>Terms</Link>
        </div>

      </div>
    </main>
  )
}
