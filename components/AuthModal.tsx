'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { PhoneAuthForm } from './PhoneAuthForm'
import { analytics } from '@/lib/analytics'
import { MOTION } from '@/lib/animations'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup' | 'reset'
}

// Generate a fun random display name for new signups
function generateFunName(): string {
  const adjectives = ['Improv', 'Witty', 'Snappy', 'Clever', 'Zany', 'Quirky', 'Daring', 'Bold', 'Epic', 'Swift']
  const nouns = ['Raptor', 'Phoenix', 'Tiger', 'Falcon', 'Otter', 'Panda', 'Dragon', 'Koala', 'Jaguar', 'Hawk']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}-${noun}-${num}`
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle, sendPasswordResetEmail, isConfigured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let result
      if (mode === 'signin') {
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password, generateFunName())
      }

      if (result.success) {
        if (mode === 'signup') analytics.signupCompleted('email')
        onClose()
        resetForm()
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)

    try {
      const result = await signInWithGoogle()
      if (result.success) {
        analytics.signupCompleted('google')
        onClose()
        resetForm()
      } else {
        setError(result.error || 'Google sign in failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await sendPasswordResetEmail(email)
      if (result.success) {
        setResetSent(true)
      } else {
        setError(result.error || 'Failed to send reset email')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setAuthMethod('email')
    setResetSent(false)
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError(null)
    setResetSent(false)
  }

  const handlePhoneAuthSuccess = () => {
    onClose()
    resetForm()
  }

  const handleClose = () => {
    resetForm()
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
                  {mode === 'reset' ? 'RESET PASSWORD' : 'ADMIT ONE'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-[var(--color-gold)]/70 hover:text-[var(--color-gold)] text-2xl transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Perforated Edge */}
          <div className="ticket-perforation" />

          {/* Tab Bar */}
          {mode !== 'reset' && (
            <div className="flex mx-6 border-b border-dashed border-[var(--color-border)]">
              {[
                { id: 'signup' as const, label: 'New Player' },
                { id: 'signin' as const, label: 'Veteran' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setMode(tab.id); setError(null) }}
                  className={`flex-1 py-3 font-display font-semibold text-[15px] -mb-px border-b-2 transition-colors ${
                    mode === tab.id
                      ? 'text-[var(--color-purple-deeper)] border-[var(--color-purple-deeper)]'
                      : 'text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {mode === 'reset' && (
            <p className="mx-6 py-4 text-sm text-[var(--color-text-secondary)] border-b border-dashed border-[var(--color-border)]">
              Enter your email to receive a password reset link
            </p>
          )}

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
                {error?.includes('different sign-in method') && (
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full mt-3 p-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google instead
                  </button>
                )}
              </motion.div>
            )}

            {/* Reset Mode - Success State */}
            {mode === 'reset' && resetSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="text-5xl mb-4">📧</div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  We&apos;ve sent a password reset link to <span className="text-[var(--color-purple-deeper)] font-semibold">{email}</span>
                </p>
                <button
                  onClick={() => { setMode('signin'); setResetSent(false); setError(null) }}
                  className="w-full p-3 rounded-lg font-display font-semibold text-[15px] min-h-[44px] bg-[var(--color-purple-deeper)] hover:bg-[var(--color-purple-hover)] text-[var(--color-gold)] transition-colors"
                >
                  Back to Sign In
                </button>
              </motion.div>
            ) : mode === 'reset' ? (
              /* Reset Mode - Form */
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input w-full"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-3 rounded-lg font-display font-semibold text-[15px] min-h-[44px] bg-[var(--color-purple-deeper)] hover:bg-[var(--color-purple-hover)] text-[var(--color-gold)] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Please wait...' : 'Send Reset Link'}
                  </button>
                </form>

                <p className="text-center mt-4 text-sm text-[var(--color-text-secondary)]">
                  Remember your password?{' '}
                  <button
                    onClick={() => { setMode('signin'); setError(null) }}
                    className="font-medium text-[var(--color-purple-deeper)] hover:text-[var(--color-purple-hover)] transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            ) : (
              /* Sign In / Sign Up Mode */
              <>
                {/* Google Sign In */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full p-3 rounded-lg font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-50 mb-4 min-h-[44px] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] text-[var(--color-text-primary)] border-2 border-[var(--color-border)]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-[var(--color-border)]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[var(--color-bg)] text-[var(--color-text-tertiary)]">or</span>
                  </div>
                </div>

                {/* Email/Phone Toggle */}
                <div className="flex gap-2 mb-4">
                  {[
                    { id: 'email' as const, label: 'Email' },
                    { id: 'phone' as const, label: 'Phone' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setAuthMethod(opt.id); setError(null) }}
                      className={`flex-1 p-2 rounded-lg font-medium text-sm min-h-[44px] border-2 transition-colors ${
                        authMethod === opt.id
                          ? 'bg-[var(--color-purple-deeper)] text-[var(--color-gold)] border-[var(--color-purple-deeper)]'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-purple-deeper)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {authMethod === 'email' ? (
                    <motion.div
                      key="email-form"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {/* Email/Password Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="label">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="input w-full"
                            required
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label mb-0">Password</label>
                            {mode === 'signin' && (
                              <button
                                type="button"
                                onClick={() => { setMode('reset'); setError(null) }}
                                className="text-sm text-[var(--color-purple-deeper)] hover:text-[var(--color-purple-hover)] transition-colors"
                              >
                                Forgot password?
                              </button>
                            )}
                          </div>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                            className="input w-full"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full p-3 rounded-lg font-display font-semibold text-[15px] min-h-[44px] bg-[var(--color-purple-deeper)] hover:bg-[var(--color-purple-hover)] text-[var(--color-gold)] transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Please wait...' : mode === 'signin' ? 'Take Your Seat' : 'Join the Show'}
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="phone-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <PhoneAuthForm onSuccess={handlePhoneAuthSuccess} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
