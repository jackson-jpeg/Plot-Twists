'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { PhoneAuthForm } from './PhoneAuthForm'
import { MOTION } from '@/lib/animations'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { isConfigured } = useAuth()
  const [error] = useState<string | null>(null)

  const handlePhoneAuthSuccess = () => {
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  // Show friendly guest mode card if Firebase isn't configured
  if (!isConfigured) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ y: -100, opacity: 0, rotateX: -10 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: 100, opacity: 0 }}
            transition={MOTION.bouncy}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-bg)] border-2 border-dashed border-[var(--color-border)]"
          >
            {/* Header */}
            <div className="bg-[var(--color-purple-deeper)] px-6 py-4 text-center">
              <div className="font-script text-[11px] tracking-[0.15em] uppercase text-[var(--color-gold)]/70 mb-1">
                Plot Twists Presents
              </div>
              <div className="font-display text-2xl font-bold text-[var(--color-gold)] tracking-wide">
                GUEST PASS
              </div>
            </div>

            <div className="ticket-perforation" />

            {/* Content */}
            <div className="p-6 text-center">
              <div className="text-5xl mb-3">🎭</div>
              <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-2">
                Play as Guest
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2 leading-relaxed">
                Jump right in! No account needed.
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-6 leading-relaxed">
                Your stats will be saved locally on this device.
              </p>
              <button
                onClick={handleClose}
                className="w-full font-display font-semibold text-base py-3 px-6 rounded-lg bg-[var(--color-purple-deeper)] hover:bg-[var(--color-purple-hover)] text-[var(--color-gold)] transition-colors min-h-[44px]"
              >
                Enter the Show
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ y: -100, opacity: 0, rotateX: -10 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: 100, opacity: 0 }}
          transition={MOTION.bouncy}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-bg)] border-2 border-dashed border-[var(--color-border)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-[var(--color-purple-deeper)] to-[var(--color-purple-dark)] px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-script text-[11px] tracking-[0.15em] uppercase text-[var(--color-gold)]/70 mb-0.5">
                  Plot Twists
                </div>
                <h2
                  id="auth-modal-title"
                  className="font-display text-[22px] font-bold text-[var(--color-gold)] tracking-wide m-0"
                >
                  ADMIT ONE
                </h2>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-[var(--color-gold)]/70 hover:text-[var(--color-gold)] text-2xl transition-colors"
              >
                x
              </button>
            </div>
          </div>

          {/* Perforated Edge */}
          <div className="ticket-perforation" />

          {/* Content */}
          <div className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg mb-4 text-sm bg-[var(--color-danger-light)] border border-[var(--color-danger)] text-[var(--color-danger)]"
                role="alert"
              >
                {error}
              </motion.div>
            )}

            <p className="text-sm text-[var(--color-text-secondary)] mb-4 text-center">
              Sign in or create an account with your phone number
            </p>

            <PhoneAuthForm onSuccess={handlePhoneAuthSuccess} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
