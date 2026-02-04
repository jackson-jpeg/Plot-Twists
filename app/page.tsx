'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from '@/components/AuthModal'

export default function Home() {
  const router = useRouter()
  const { user, loading, isConfigured } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup')

  // Determine if user is a guest (not authenticated or anonymous)
  const isGuest = !user || user.isAnonymous

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <main className="page-container items-center justify-center">
        <div className="skeleton skeleton-heading"></div>
        <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      </main>
    )
  }

  return (
    <main className="page-container items-center justify-center home-nostalgic">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* Header Auth Buttons */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Show auth buttons only when not loading and user is guest */}
        {!loading && isGuest && isConfigured && (
          <>
            <motion.button
              onClick={() => {
                setAuthModalMode('signin')
                setShowAuthModal(true)
              }}
              className="auth-header-btn auth-header-btn-secondary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Log In
            </motion.button>
            <motion.button
              onClick={() => {
                setAuthModalMode('signup')
                setShowAuthModal(true)
              }}
              className="auth-header-btn auth-header-btn-primary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up Free
            </motion.button>
          </>
        )}

        {/* Profile Button - always visible */}
        <motion.button
          onClick={() => router.push('/profile')}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          title="Your Profile & Stats"
        >
          {user && !user.isAnonymous && user.displayName ? (
            <span className="text-xl">{user.displayName.charAt(0).toUpperCase()}</span>
          ) : (
            <span className="text-2xl">👤</span>
          )}
        </motion.button>
      </div>

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
            whileHover={{
              y: -8,
              rotate: 0,
              scale: 1.03
            }}
            whileTap={{ scale: 0.98, y: -4 }}
          >
            <motion.div
              className="ticket-stub"
              whileHover={{ rotate: [-5, 5, -5, 0] }}
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
            whileHover={{
              y: -8,
              rotate: 0,
              scale: 1.03
            }}
            whileTap={{ scale: 0.98, y: -4 }}
          >
            <motion.div
              className="ticket-stub"
              whileHover={{ rotate: [5, -5, 5, 0] }}
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

        {/* Account Benefits Section - shown to guests only */}
        {isGuest && isConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="account-benefits-section"
            style={{ transform: 'rotate(0.5deg)' }}
          >
            <div className="tape-top-center"></div>
            <div className="benefits-header">
              <h2 className="benefits-title">Level Up Your Experience</h2>
            </div>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <div className="benefit-content">
                  <div className="benefit-label">Track Your Stats</div>
                  <div className="benefit-description">See wins, games played, MVP awards</div>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🏆</span>
                <div className="benefit-content">
                  <div className="benefit-label">Compete on Leaderboards</div>
                  <div className="benefit-description">Rise through the ranks</div>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">☁️</span>
                <div className="benefit-content">
                  <div className="benefit-label">Save Your Progress</div>
                  <div className="benefit-description">Sync across all devices</div>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎬</span>
                <div className="benefit-content">
                  <div className="benefit-label">Share Replays</div>
                  <div className="benefit-description">Save and share your best scenes</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setAuthModalMode('signup')
                setShowAuthModal(true)
              }}
              className="benefits-cta"
            >
              Create Free Account
            </button>
            <div className="benefits-footnote">
              Takes 30 seconds. No credit card required.
            </div>
          </motion.div>
        )}

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
                      <div className="step-text">Pick cards</div>
                      <div className="step-example">"Darth Vader at a job interview"</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">2</div>
                      <div className="step-text">AI writes scene</div>
                      <div className="step-example">Claude creates a 2-min comedy script</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">3</div>
                      <div className="step-text">Act it out</div>
                      <div className="step-example">Follow the teleprompter on your phone</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">4</div>
                      <div className="step-text">Vote MVP</div>
                      <div className="step-example">Best performance wins the round</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">5</div>
                      <div className="step-text">Laugh & repeat</div>
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

          {/* Handwritten note - clickable */}
          <motion.div
            className="sticky-note"
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            style={{ cursor: 'pointer' }}
            initial={{ opacity: 0, rotate: 5, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 8, scale: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Click to<br/>learn more!
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
