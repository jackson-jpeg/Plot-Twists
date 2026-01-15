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
    <main className="page-container items-center justify-center">
      <div className="container max-w-3xl text-center">
        <motion.div
          initial={{ y: -40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.1
          }}
          className="mb-12"
        >
          <motion.h1
            className="hero-title mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Plot Twists 🎭
          </motion.h1>

          <motion.p
            className="hero-subtitle mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            AI-powered improv comedy game
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3 text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div style={{
              width: '32px',
              height: '2px',
              background: 'var(--color-accent)'
            }}></div>
            <span className="font-medium">Powered by Claude</span>
            <div style={{
              width: '32px',
              height: '2px',
              background: 'var(--color-accent)'
            }}></div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.35,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          className="stack-lg mb-12"
        >
          <motion.button
            onClick={() => router.push('/host')}
            className="btn btn-primary btn-large w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>🎬</span>
            <span>Host a Game</span>
          </motion.button>

          <motion.button
            onClick={() => router.push('/join')}
            className="btn btn-secondary btn-large w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>🎮</span>
            <span>Join Game</span>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card card-accent"
        >
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            Pick characters, settings, and scenarios. Claude writes hilarious scripts.
            Perform together. Vote for MVP.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <p style={{
            fontSize: '14px',
            color: 'var(--color-text-tertiary)',
            fontStyle: 'italic'
          }}>
            Best experienced with 2-6 players
          </p>
        </motion.div>
      </div>
    </main>
  )
}
