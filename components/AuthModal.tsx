'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SignIn } from '@clerk/nextjs'
import { MOTION } from '@/lib/animations'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: -100, opacity: 0, rotateX: -10 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: 100, opacity: 0 }}
          transition={MOTION.bouncy}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-bg)]"
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
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-[var(--color-gold)]/70 hover:text-[var(--color-gold)] text-2xl transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Perforated Edge */}
          <div className="ticket-perforation" />

          {/* Clerk Sign-In */}
          <div className="p-4 flex justify-center">
            <SignIn
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  cardBox: 'w-full shadow-none',
                  card: 'bg-transparent shadow-none p-0',
                  headerTitle: 'font-display text-[var(--color-text-primary)]',
                  headerSubtitle: 'text-[var(--color-text-secondary)]',
                  socialButtonsBlockButton: 'border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)]',
                  formButtonPrimary: 'bg-[var(--color-purple)] hover:bg-[var(--color-purple-hover)]',
                  formFieldInput: 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-primary)]',
                  formFieldLabel: 'text-[var(--color-text-secondary)]',
                  footerActionLink: 'text-[var(--color-accent)]',
                  dividerLine: 'bg-[var(--color-border)]',
                  dividerText: 'text-[var(--color-text-tertiary)]',
                },
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
