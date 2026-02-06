'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthModal } from './AuthModal'

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
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

        {/* CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem'
          }}
        >
          <div style={{
            background: 'var(--color-surface)',
            border: '2px solid var(--color-border)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '0.5rem'
            }}>
              Sign up to get 5 free scripts
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '1.5rem'
            }}>
              No credit card required. Start hosting games in seconds.
            </div>

            <button
              onClick={() => openAuth('signup')}
              className="user-menu-btn user-menu-btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '1.1rem',
                marginBottom: '0.75rem',
                borderRadius: '0.5rem'
              }}
            >
              Create Account
            </button>

            <div style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)'
            }}>
              Already have an account?{' '}
              <button
                onClick={() => openAuth('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.875rem',
                  padding: 0
                }}
              >
                Log in
              </button>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="how-it-works-compact"
          style={{ transform: 'rotate(-0.5deg)', marginTop: '2rem' }}
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
