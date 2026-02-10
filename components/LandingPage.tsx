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

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
    analytics.landingCtaClicked(mode)
  }

  return (
    <main className="page-container items-center justify-center home-nostalgic">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      <div className="container max-w-3xl">
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
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

        {/* Scene Preview — staggered polaroid cards */}
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
                <div className="text-3xl mb-2">{scene.emoji}</div>
                <p className="text-xs text-[var(--color-text-secondary)] font-handwritten leading-snug">
                  &ldquo;{scene.scenario}&rdquo;
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA section — note card style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 100, damping: 15 }}
          className="flex justify-center mt-6"
        >
          <div className="note-card relative max-w-[420px] w-full text-center p-8">
            <div className="tape-piece tape-top-left" />
            <div className="tape-piece tape-top-right" />

            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-display mb-2">
              Sign up to get 5 free scripts
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              No credit card required. Start hosting games in seconds.
            </p>

            <button
              onClick={() => openAuth('signup')}
              className="btn btn-primary w-full py-3 text-lg font-semibold mb-3"
            >
              Create Account
            </button>

            <p className="text-sm text-[var(--color-text-secondary)]">
              Already have an account?{' '}
              <button
                onClick={() => openAuth('signin')}
                className="text-[var(--color-primary)] hover:underline bg-transparent border-none cursor-pointer text-sm p-0"
              >
                Log in
              </button>
            </p>
          </div>
        </motion.div>

        {/* Social proof badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-3 mt-5 flex-wrap"
        >
          <span className="retro-badge-inline" style={{ transform: 'rotate(-1deg)' }}>Party Game</span>
          <span className="retro-badge-inline" style={{ transform: 'rotate(1deg)' }}>AI-Powered</span>
          <span className="retro-badge-inline" style={{ transform: 'rotate(-0.5deg)' }}>Free to Start</span>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="how-it-works-compact mt-8 -rotate-[0.5deg]"
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
