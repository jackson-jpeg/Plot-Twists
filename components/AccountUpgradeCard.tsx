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
  const { user, linkWithGoogle, linkWithEmail } = useAuth()
  const confetti = useConfetti()
  const [method, setMethod] = useState<'choice' | 'email' | 'phone' | null>('choice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Only show for anonymous users
  if (!user?.isAnonymous) {
    return null
  }

  const handleGoogleLink = async () => {
    setError(null)
    setLoading(true)

    try {
      const result = await linkWithGoogle()
      if (result.success) {
        setSuccess(true)
        confetti.fireWinnerConfetti()
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to link Google account')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await linkWithEmail(email, password)
      if (result.success) {
        setSuccess(true)
        confetti.fireWinnerConfetti()
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to link email')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
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
            Link an account to keep your stats, achievements, and compete on leaderboards
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-banner text-sm"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {method === 'choice' && (
          <motion.div
            key="choice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Google */}
            <motion.button
              onClick={handleGoogleLink}
              disabled={loading}
              className="w-full p-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Linking...' : 'Link with Google'}
            </motion.button>

            {/* Email */}
            <motion.button
              onClick={() => setMethod('email')}
              disabled={loading}
              className="w-full p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>✉️</span>
              Link with Email
            </motion.button>

            {/* Phone */}
            <motion.button
              onClick={() => setMethod('phone')}
              disabled={loading}
              className="w-full p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>📱</span>
              Link with Phone
            </motion.button>
          </motion.div>
        )}

        {method === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => { setMethod('choice'); setError(null) }}
              disabled={loading}
              className="text-sm mb-3 flex items-center gap-1 disabled:opacity-50"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span>←</span> Back
            </button>
            <form onSubmit={handleEmailLink} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="form-input"
              />
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  minLength={6}
                  required
                  className="form-input"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  At least 6 characters
                </p>
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full p-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                style={{ background: 'var(--color-purple)' }}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Linking...' : 'Link Email'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {method === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => { setMethod('choice'); setError(null) }}
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
