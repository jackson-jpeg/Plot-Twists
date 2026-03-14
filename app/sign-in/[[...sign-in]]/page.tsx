'use client'

import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { SPRING_GENTLE } from '@/lib/motion'

export default function SignInPage() {
  const router = useRouter()

  return (
    <main
      className="flex items-center justify-center"
      style={{ minHeight: '100dvh', padding: '24px 16px', background: 'var(--color-bg)' }}
    >
      <div className="w-full" style={{ maxWidth: '420px' }}>
        <motion.button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 mb-6"
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </motion.button>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={SPRING_GENTLE}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
                <circle cx="10" cy="12" r="7" stroke="var(--color-text-tertiary)" strokeWidth="2" />
                <circle cx="7.5" cy="11" r="1" fill="var(--color-text-tertiary)" />
                <circle cx="12.5" cy="11" r="1" fill="var(--color-text-tertiary)" />
                <path d="M7.5 14.5c1.5 1.5 3.5 1.5 5 0" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="18" cy="14" r="7" stroke="var(--color-text-tertiary)" strokeWidth="2" />
                <circle cx="15.5" cy="13" r="1" fill="var(--color-text-tertiary)" />
                <circle cx="20.5" cy="13" r="1" fill="var(--color-text-tertiary)" />
                <path d="M15.5 16.5c1.5 1 3.5 1 5 0" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1
              className="font-display"
              style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)' }}>
              Sign in to continue
            </p>
          </div>

          {/* Clerk Form */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="p-4">
              <SignIn
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    cardBox: 'w-full shadow-none',
                    card: 'bg-transparent shadow-none p-0',
                  },
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
