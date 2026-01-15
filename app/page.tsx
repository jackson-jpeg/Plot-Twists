'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

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
          initial={{ y: -40, opacity: 0, rotate: -1 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 12,
            delay: 0.1
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
            transition={{ delay: 0.4 }}
          >
            <span className="doodle-text">Pick one!</span>
            <svg viewBox="0 0 100 40" className="arrow-svg">
              <path d="M 10 20 Q 50 10, 90 20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M 85 15 L 95 20 L 85 25" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>

        {/* Game buttons styled like tickets */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.35,
            type: "spring",
            stiffness: 80,
            damping: 12
          }}
          className="ticket-container"
        >
          <motion.button
            onClick={() => router.push('/host')}
            className="game-ticket ticket-host"
            whileHover={{ y: -4, rotate: 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="ticket-stub">🎬</div>
            <div className="ticket-main">
              <div className="ticket-title">Host a Game</div>
              <div className="ticket-subtitle">Start the show</div>
            </div>
            <div className="ticket-notch"></div>
          </motion.button>

          <motion.button
            onClick={() => router.push('/join')}
            className="game-ticket ticket-join"
            whileHover={{ y: -4, rotate: 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="ticket-stub">🎮</div>
            <div className="ticket-main">
              <div className="ticket-title">Join Game</div>
              <div className="ticket-subtitle">Jump into action</div>
            </div>
            <div className="ticket-notch"></div>
          </motion.button>
        </motion.div>

        {/* Info card with scrapbook aesthetic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="scrapbook-card"
        >
          <div className="tape-piece tape-top-left"></div>
          <div className="tape-piece tape-top-right"></div>

          <div className="scrapbook-content">
            <h3 className="scrapbook-title">
              How it works ✨
            </h3>
            <ol className="scrapbook-list">
              <li>Pick random prompt cards</li>
              <li>AI generates hilarious scenes</li>
              <li>Act them out with friends</li>
              <li>Vote for the MVP</li>
              <li>Cry-laugh at the chaos</li>
            </ol>
          </div>

          {/* Handwritten note in corner */}
          <motion.div
            className="sticky-note"
            initial={{ opacity: 0, rotate: 5, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 8, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            Best with<br/>2-6 players!
          </motion.div>
        </motion.div>

        {/* Footer badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="home-badges"
        >
          <span className="retro-badge">No Acting Skills Required</span>
          <span className="retro-badge">Theater Kids Welcome</span>
          <span className="retro-badge">100% Chaos Guaranteed</span>
        </motion.div>
      </div>
    </main>
  )
}
