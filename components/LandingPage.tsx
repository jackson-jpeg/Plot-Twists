'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthModal } from './AuthModal'
import { analytics } from '@/lib/analytics'

const sceneExamples = [
  { emoji: '🦹', scenario: 'Darth Vader at a job interview', rotation: -3 },
  { emoji: '📝', scenario: 'Shakespeare at a yoga class', rotation: 2 },
  { emoji: '🕵️', scenario: 'A detective who only speaks in rhymes', rotation: -1.5 },
]

const socialBadges = [
  { label: 'Party Game', rotation: -1 },
  { label: 'AI-Powered', rotation: 1 },
  { label: 'Free to Start', rotation: -0.5 },
]

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  const openAuth = () => {
    setShowAuthModal(true)
    analytics.landingCtaClicked('phone')
  }

  return (
    <main className="page-container items-center justify-center home-nostalgic">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <div className="container max-w-3xl">
        {/* Hero header */}
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }} // Intentionally dreamy for hero entrance
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

        {/* Scene Preview — staggered polaroid cards with floating animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center gap-2 sm:gap-4 mt-8 mb-2 px-2 sm:px-4"
        >
          {sceneExamples.map((scene, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, rotate: scene.rotation + 5 }}
              animate={{ opacity: 1, y: 0, rotate: scene.rotation }}
              transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 120, damping: 14 }}
              whileHover={{ scale: 1.06, rotate: 0, y: -6 }}
              className="polaroid-card relative flex-1 min-w-0 max-w-[180px] cursor-default"
            >
              <div className="tape-piece tape-top-center" style={{ width: '36px', height: '14px', top: '-7px' }} />
              <div className="p-3 pt-4 text-center">
                <motion.div
                  className="text-3xl mb-2"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                >
                  {scene.emoji}
                </motion.div>
                <p className="text-xs text-[var(--color-text-secondary)] font-handwritten leading-snug">
                  &ldquo;{scene.scenario}&rdquo;
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA section — note card pinned at an angle */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 100, damping: 15 }}
          className="flex justify-center mt-6"
        >
          <motion.div
            className="note-card relative max-w-[420px] w-full text-center p-8"
            style={{ transform: 'rotate(0.5deg)' }}
            whileHover={{ rotate: 0, scale: 1.01 }}
          >
            <div className="tape-piece tape-top-left" />
            <div className="tape-piece tape-top-right" />

            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-display mb-2">
              Sign in to get 5 free scripts
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              No credit card required. Just your phone number to start hosting games.
            </p>

            <motion.button
              onClick={openAuth}
              className="btn btn-primary w-full py-3 text-lg font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In with Phone
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Social proof badges — staggered entrance */}
        <div className="flex justify-center gap-3 mt-5 flex-wrap">
          {socialBadges.map((badge, i) => (
            <motion.span
              key={badge.label}
              className="retro-badge-inline"
              style={{ transform: `rotate(${badge.rotation}deg)` }}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.08, type: 'spring', stiffness: 150, damping: 12 }}
            >
              {badge.label}
            </motion.span>
          ))}
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="how-it-works-compact mt-8 -rotate-[0.5deg]"
        >
          <div className="how-it-works-content">
            <div className="tape-piece tape-top-left"></div>
            <div className="tape-piece tape-top-right"></div>

            <div className="how-it-works-grid">
              {[
                { n: 1, text: 'Pick cards', ex: '"Darth Vader at a job interview"' },
                { n: 2, text: 'AI writes scene', ex: 'Claude creates a 2-min comedy script' },
                { n: 3, text: 'Act it out', ex: 'Follow the teleprompter on your phone' },
                { n: 4, text: 'Vote MVP', ex: 'Best performance wins the round' },
                { n: 5, text: 'Laugh & repeat', ex: 'Generate a sequel or new scene' },
              ].map((step) => (
                <div key={step.n} className="how-it-works-step">
                  <div className="step-number">{step.n}</div>
                  <div className="step-text font-bold text-lg">{step.text}</div>
                  <div className="step-example">{step.ex}</div>
                </div>
              ))}
            </div>

            <div className="how-it-works-badges">
              <span className="retro-badge-inline" style={{ transform: 'rotate(-1deg)' }}>No Acting Skills</span>
              <span className="retro-badge-inline" style={{ transform: 'rotate(1deg)' }}>Theater Kids OK</span>
              <span className="retro-badge-inline" style={{ transform: 'rotate(-0.5deg)' }}>1-6 Players</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
