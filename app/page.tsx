'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/UserMenu'
import { LandingPage } from '@/components/LandingPage'
import { UpgradeModal } from '@/components/UpgradeModal'

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
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
  const [mounted, setMounted] = useState(false)
  const [creditsPurchased, setCreditsPurchased] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      <main className="page-container items-center justify-center">
        <div className="skeleton skeleton-heading"></div>
        <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      </main>
    )
  }

  // Unauthenticated users see the landing page
  if (!user) {
    return <LandingPage />
  }

  // Anonymous users see the upgrade modal
  if (user.isAnonymous) {
    return <UpgradeModal />
  }

  return (
    <main className="page-container items-center justify-center home-nostalgic">
      {/* Credits purchased banner */}
      <AnimatePresence>
        {creditsPurchased && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-[var(--color-success,#4ade80)] text-black px-6 py-3 rounded-xl font-semibold text-[0.95rem] shadow-lg"
          >
            Credits added to your account!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with UserMenu */}
      <motion.div
        className="fixed top-4 right-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <UserMenu />
      </motion.div>

      <div className="container max-w-3xl">

        {/* Nostalgic header with doodles */}
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
          </div>

        </motion.div>

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

        {/* Explore Packs — mini ticket matching the aesthetic */}
        <motion.div
          className="flex justify-center mt-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100, damping: 15 }}
        >
          <motion.button
            onClick={() => router.push('/explore')}
            className="polaroid-card flex items-center gap-4 px-5 py-3 cursor-pointer relative overflow-visible"
            style={{ transform: 'rotate(-0.5deg)' }}
            whileHover={canHover ? { y: -6, rotate: 0, scale: 1.04 } : undefined}
            whileTap={{ scale: 0.98 }}
          >
            <div className="tape-piece tape-top-center" style={{ width: '40px', height: '14px', top: '-7px' }} />
            <motion.span
              className="text-3xl"
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🎴
            </motion.span>
            <div className="text-left">
              <div className="text-sm font-semibold text-[var(--color-text-primary)] font-display">Explore Packs</div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Browse community card packs</div>
            </div>
            <span className="text-lg text-[var(--color-text-disabled)]">→</span>
          </motion.button>
        </motion.div>

        {/* How it works — playbill style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <div className="text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-disabled)]">
              How it works
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { step: '1', icon: '🃏', title: 'Draw cards', desc: 'Pick a character, setting & wild card' },
              { step: '2', icon: '✍️', title: 'AI writes', desc: 'Get a custom comedy scene in seconds' },
              { step: '3', icon: '🎤', title: 'Perform & vote', desc: 'Act it out, then crown the MVP' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.1, type: 'spring', stiffness: 120, damping: 14 }}
                className="text-center"
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] font-display">{item.title}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 leading-snug">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </main>
  )
}
