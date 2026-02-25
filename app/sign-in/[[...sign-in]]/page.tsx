'use client'

import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { MOTION } from '@/lib/animations'

export default function SignInPage() {
  return (
    <main className="page-container items-center justify-center home-nostalgic">
      <div className="container max-w-md">
        <motion.div
          initial={{ y: -40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={MOTION.gentle}
          className="bulletin-board-header mb-6"
        >
          <div className="header-polaroid" style={{ transform: 'rotate(-1deg)' }}>
            <h1 className="hero-title-nostalgic text-3xl">
              Welcome Back
              <span className="title-emoji">🎭</span>
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center"
        >
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full shadow-none',
                card: 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm',
                headerTitle: 'font-display text-[var(--color-text-primary)]',
                headerSubtitle: 'text-[var(--color-text-secondary)]',
                socialButtonsBlockButton: 'border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)]',
                formButtonPrimary: 'bg-[var(--color-purple)] hover:bg-[var(--color-purple-hover)]',
                formFieldInput: 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-primary)]',
                formFieldLabel: 'text-[var(--color-text-secondary)]',
                footerActionLink: 'text-[var(--color-accent)]',
                identityPreviewEditButton: 'text-[var(--color-accent)]',
                dividerLine: 'bg-[var(--color-border)]',
                dividerText: 'text-[var(--color-text-tertiary)]',
              },
            }}
          />
        </motion.div>
      </div>
    </main>
  )
}
