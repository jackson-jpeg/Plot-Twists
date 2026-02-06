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
  const [showHowItWorks, setShowHowItWorks] = useState(true)
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
            style={{
              position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--color-success, #4ade80)', color: '#000', padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.95rem', zIndex: 60,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
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

        {/* Compact How It Works with toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="how-it-works-compact"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="how-it-works-toggle"
          >
            <span className="text-2xl">✨</span>
            <span className="how-it-works-toggle-text">How it works</span>
            <motion.span
              className="text-xl"
              animate={{ rotate: showHowItWorks ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              ↓
            </motion.span>
          </button>

          <AnimatePresence>
            {showHowItWorks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="how-it-works-content">
                  <div className="tape-piece tape-top-left"></div>
                  <div className="tape-piece tape-top-right"></div>

                  <div className="how-it-works-grid">
                    <div className="how-it-works-step">
                      <div className="step-number">1</div>
                      <div className="step-text font-bold text-lg">Pick cards</div>
                      <div className="step-example">&quot;Darth Vader at a job interview&quot;</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">2</div>
                      <div className="step-text font-bold text-lg">AI writes scene</div>
                      <div className="step-example">Claude creates a 2-min comedy script</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">3</div>
                      <div className="step-text font-bold text-lg">Act it out</div>
                      <div className="step-example">Follow the teleprompter on your phone</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">4</div>
                      <div className="step-text font-bold text-lg">Vote MVP</div>
                      <div className="step-example">Best performance wins the round</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">5</div>
                      <div className="step-text font-bold text-lg">Laugh &amp; repeat</div>
                      <div className="step-example">Generate a sequel or new scene</div>
                    </div>
                  </div>

                  {/* Footer badges inside card */}
                  <div className="how-it-works-badges">
                    <span className="retro-badge-inline" style={{ transform: 'rotate(-1deg)' }}>No Acting Skills</span>
                    <span className="retro-badge-inline" style={{ transform: 'rotate(1deg)' }}>Theater Kids OK</span>
                    <span className="retro-badge-inline" style={{ transform: 'rotate(-0.5deg)' }}>1-6 Players</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </main>
  )
}
