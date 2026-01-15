'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

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
              The party game where AI writes your chaos
            </div>
          </div>

          {/* Hand-drawn arrow annotation */}
          <motion.div
            className="doodle-arrow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <span className="doodle-text">Pick one!</span>
            <svg viewBox="0 0 100 40" className="arrow-svg">
              <path d="M 10 20 Q 50 10, 90 20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M 85 15 L 95 20 L 85 25" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
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
              <div className="ticket-subtitle">Jump into action</div>
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
                      <div className="step-text">Pick cards</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">2</div>
                      <div className="step-text">AI writes scene</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">3</div>
                      <div className="step-text">Act it out</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">4</div>
                      <div className="step-text">Vote MVP</div>
                    </div>
                    <div className="how-it-works-step">
                      <div className="step-number">5</div>
                      <div className="step-text">Laugh & repeat</div>
                    </div>
                  </div>

                  {/* Footer badges inside card */}
                  <div className="how-it-works-badges">
                    <span className="retro-badge-inline" style={{ transform: 'rotate(-1deg)' }}>No Acting Skills</span>
                    <span className="retro-badge-inline" style={{ transform: 'rotate(1deg)' }}>Theater Kids OK</span>
                    <span className="retro-badge-inline" style={{ transform: 'rotate(-0.5deg)' }}>2-6 Players</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Handwritten note */}
          <motion.div
            className="sticky-note"
            initial={{ opacity: 0, rotate: 5, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 8, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            Click to<br/>learn more!
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
