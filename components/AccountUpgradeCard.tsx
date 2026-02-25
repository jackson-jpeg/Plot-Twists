'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { SignInButton } from '@clerk/nextjs'

interface AccountUpgradeCardProps {
  onSuccess?: () => void
}

export function AccountUpgradeCard({ onSuccess }: AccountUpgradeCardProps) {
  const { user } = useAuth()

  // Only show for unauthenticated users
  if (user) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{
        background: 'linear-gradient(135deg, var(--color-highlight), var(--color-highlight-pink))',
        border: '2px solid var(--color-accent)'
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="text-4xl">💾</span>
        <div className="flex-1">
          <h3 className="text-xl font-display mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Save Your Progress
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in to keep your stats, achievements, and compete on leaderboards
          </p>
        </div>
      </div>

      <SignInButton mode="redirect">
        <motion.button
          className="w-full p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          style={{
            background: 'var(--color-purple)',
            color: 'white',
            border: 'none'
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Sign In
        </motion.button>
      </SignInButton>
    </motion.div>
  )
}
