'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthModal } from './AuthModal'

/**
 * Full-page component shown to returning anonymous users.
 * Prompts them to create a real account to continue playing.
 */
export function UpgradeModal() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <main className="page-container items-center justify-center home-nostalgic">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <div className="container max-w-3xl">
        <motion.div
          initial={{ y: -40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="bulletin-board-header"
        >
          <div className="header-polaroid">
            <h1 className="hero-title-nostalgic">
              Plot Twists
              <span className="title-emoji">🎭</span>
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 100, damping: 15 }}
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
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '0.5rem'
            }}>
              We&apos;ve updated!
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: 1.5
            }}>
              Sign in with your phone number to save your stats and get <strong>5 free scripts</strong> every week.
              Your previous game history will be transferred.
            </div>

            <button
              onClick={() => setShowAuthModal(true)}
              className="user-menu-btn user-menu-btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '1.1rem',
                borderRadius: '0.5rem'
              }}
            >
              Sign In with Phone
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
