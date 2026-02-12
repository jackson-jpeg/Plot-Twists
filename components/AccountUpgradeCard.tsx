'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { PhoneAuthForm } from './PhoneAuthForm'
import { useConfetti } from '@/hooks/useConfetti'

interface AccountUpgradeCardProps {
  onSuccess?: () => void
}

export function AccountUpgradeCard({ onSuccess }: AccountUpgradeCardProps) {
  const { user } = useAuth()
  const confetti = useConfetti()
  const [showForm, setShowForm] = useState(false)
  const [success, setSuccess] = useState(false)

  // Only show for anonymous users
  if (!user?.isAnonymous) {
    return null
  }

  const handlePhoneSuccess = () => {
    setSuccess(true)
    confetti.fireWinnerConfetti()
    onSuccess?.()
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center"
        style={{
          background: 'linear-gradient(135deg, var(--color-highlight), var(--color-highlight-blue))',
          border: '2px solid var(--color-success)'
        }}
      >
        <motion.div
          className="text-6xl mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          🎉
        </motion.div>
        <h3 className="text-2xl font-display mb-2" style={{ color: 'var(--color-success)' }}>
          Account Upgraded!
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Your progress is now saved to your account
        </p>
      </motion.div>
    )
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
            Link your phone number to keep your stats, achievements, and compete on leaderboards
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              onClick={() => setShowForm(true)}
              className="w-full p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              style={{
                background: 'var(--color-purple)',
                color: 'white',
                border: 'none'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>📱</span>
              Link Phone Number
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button
              onClick={() => setShowForm(false)}
              className="text-sm mb-3 flex items-center gap-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span>←</span> Back
            </button>
            <PhoneAuthForm onSuccess={handlePhoneSuccess} mode="link" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
