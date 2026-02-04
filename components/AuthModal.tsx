'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { PhoneAuthForm } from './PhoneAuthForm'

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
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-md overflow-hidden"
            style={{
              background: '#FFFBF0',
              border: '2px dashed #D1D5DB',
              borderRadius: '16px',
            }}
          >
            {/* Ticket Header */}
            <div
              style={{
                background: '#581C87',
                padding: '16px 24px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-script)',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(250, 204, 21, 0.7)',
                  marginBottom: '4px',
                }}
              >
                Plot Twists Presents
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#FACC15',
                  letterSpacing: '0.05em',
                }}
              >
                GUEST PASS
              </div>
            </div>

            {/* Perforated Edge */}
            <div className="ticket-perforation" />

            {/* Content */}
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎭</div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#2A2722',
                  marginBottom: '8px',
                }}
              >
                Play as Guest
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '14px',
                  color: '#6B6560',
                  marginBottom: '8px',
                  lineHeight: 1.5,
                }}
              >
                Jump right in! No account needed.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '12px',
                  color: '#9B9590',
                  marginBottom: '24px',
                  lineHeight: 1.5,
                }}
              >
                Your stats will be saved locally on this device.
              </p>
              <button
                onClick={handleClose}
                className="w-full font-semibold transition-colors"
                style={{
                  background: '#581C87',
                  color: '#FACC15',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 600,
                  minHeight: '44px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#6B21A8'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#581C87'}
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
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-md overflow-hidden"
          style={{
            background: '#FFFBF0',
            border: '2px dashed #D1D5DB',
            borderRadius: '16px',
            backgroundImage: 'radial-gradient(circle, #E8E4DD 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* Ticket Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #581C87, #7C3AED)',
              padding: '16px 24px',
              position: 'relative',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-script)',
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(250, 204, 21, 0.7)',
                    marginBottom: '2px',
                  }}
                >
                  Plot Twists
                </div>
                <h2
                  id="auth-modal-title"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#FACC15',
                    letterSpacing: '0.05em',
                    margin: 0,
                  }}
                >
                  {mode === 'reset' ? 'RESET PASSWORD' : 'ADMIT ONE'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="flex items-center justify-center transition-colors"
                style={{
                  color: 'rgba(250, 204, 21, 0.7)',
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FACC15'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(250, 204, 21, 0.7)'}
              >
                ×
              </button>
            </div>
          </div>

          {/* Perforated Edge */}
          <div className="ticket-perforation" />

          {/* Tab Bar */}
          {mode !== 'reset' && (
            <div className="flex" style={{ borderBottom: '1px dashed #D1D5DB', margin: '0 24px' }}>
              <button
                onClick={() => { setMode('signup'); setError(null) }}
                className="flex-1 py-3 font-semibold transition-colors"
                style={{
                  color: mode === 'signup' ? '#581C87' : '#9B9590',
                  borderBottom: mode === 'signup' ? '2px solid #581C87' : '2px solid transparent',
                  marginBottom: '-1px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  background: 'transparent',
                  border: 'none',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: '2px',
                  borderBottomColor: mode === 'signup' ? '#581C87' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                New Player
              </button>
              <button
                onClick={() => { setMode('signin'); setError(null) }}
                className="flex-1 py-3 font-semibold transition-colors"
                style={{
                  color: mode === 'signin' ? '#581C87' : '#9B9590',
                  borderBottom: mode === 'signin' ? '2px solid #581C87' : '2px solid transparent',
                  marginBottom: '-1px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  background: 'transparent',
                  border: 'none',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: '2px',
                  borderBottomColor: mode === 'signin' ? '#581C87' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                Veteran
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <p
              className="pb-4"
              style={{
                color: '#6B6560',
                borderBottom: '1px dashed #D1D5DB',
                margin: '0 24px',
                paddingTop: '16px',
                fontFamily: 'var(--font-ui)',
                fontSize: '14px',
              }}
            >
              Enter your email to receive a password reset link
            </p>
          )}

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg mb-4 text-sm"
                style={{
                  background: '#FFEAEA',
                  border: '1px solid #D77A7A',
                  color: '#B91C1C',
                }}
                role="alert"
              >
                {error}
                {error?.includes('different sign-in method') && (
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full mt-3 p-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
                    style={{
                      background: 'white',
                      color: '#2A2722',
                      border: '1px solid #D1D5DB',
                      cursor: 'pointer',
                    }}
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
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#2A2722',
                    marginBottom: '8px',
                  }}
                >
                  Check your email
                </h3>
                <p style={{ color: '#6B6560', marginBottom: '24px', fontSize: '14px' }}>
                  We&apos;ve sent a password reset link to <span style={{ color: '#581C87', fontWeight: 600 }}>{email}</span>
                </p>
                <button
                  onClick={() => { setMode('signin'); setResetSent(false); setError(null) }}
                  className="w-full p-3 rounded-lg font-semibold transition-colors"
                  style={{
                    background: '#581C87',
                    color: '#FACC15',
                    minHeight: '44px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6B21A8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#581C87'}
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
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: '#6B6560', fontFamily: 'var(--font-ui)' }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full p-3 rounded-lg outline-none transition-all"
                      style={{
                        background: 'white',
                        color: '#2A2722',
                        border: '2px solid #D1D5DB',
                        minHeight: '44px',
                        fontFamily: 'var(--font-ui)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#581C87'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 28, 135, 0.15)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    style={{
                      background: '#581C87',
                      color: '#FACC15',
                      minHeight: '44px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontSize: '15px',
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#6B21A8')}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#581C87'}
                  >
                    {loading ? 'Please wait...' : 'Send Reset Link'}
                  </button>
                </form>

                <p className="text-center mt-4 text-sm" style={{ color: '#6B6560' }}>
                  Remember your password?{' '}
                  <button
                    onClick={() => { setMode('signin'); setError(null) }}
                    className="font-medium transition-colors"
                    style={{ color: '#581C87', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#6B21A8'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#581C87'}
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
                  className="w-full p-3 rounded-lg font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-50 mb-4"
                  style={{
                    background: 'white',
                    color: '#2A2722',
                    minHeight: '44px',
                    border: '2px solid #D1D5DB',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
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
                    <div className="w-full" style={{ borderTop: '1px dashed #D1D5DB' }}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2" style={{ background: '#FFFBF0', color: '#9B9590', fontFamily: 'var(--font-ui)' }}>or</span>
                  </div>
                </div>

                {/* Email/Phone Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => { setAuthMethod('email'); setError(null) }}
                    className="flex-1 p-2 rounded-lg font-medium text-sm transition-colors"
                    style={{
                      background: authMethod === 'email' ? '#581C87' : 'white',
                      color: authMethod === 'email' ? '#FACC15' : '#6B6560',
                      minHeight: '44px',
                      border: authMethod === 'email' ? '2px solid #581C87' : '2px solid #D1D5DB',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui)',
                    }}
                    onMouseEnter={(e) => authMethod !== 'email' && (e.currentTarget.style.borderColor = '#581C87')}
                    onMouseLeave={(e) => authMethod !== 'email' && (e.currentTarget.style.borderColor = '#D1D5DB')}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => { setAuthMethod('phone'); setError(null) }}
                    className="flex-1 p-2 rounded-lg font-medium text-sm transition-colors"
                    style={{
                      background: authMethod === 'phone' ? '#581C87' : 'white',
                      color: authMethod === 'phone' ? '#FACC15' : '#6B6560',
                      minHeight: '44px',
                      border: authMethod === 'phone' ? '2px solid #581C87' : '2px solid #D1D5DB',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui)',
                    }}
                    onMouseEnter={(e) => authMethod !== 'phone' && (e.currentTarget.style.borderColor = '#581C87')}
                    onMouseLeave={(e) => authMethod !== 'phone' && (e.currentTarget.style.borderColor = '#D1D5DB')}
                  >
                    Phone
                  </button>
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
                          <label
                            className="block text-sm font-medium mb-1"
                            style={{ color: '#6B6560', fontFamily: 'var(--font-ui)' }}
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full p-3 rounded-lg outline-none transition-all"
                            style={{
                              background: 'white',
                              color: '#2A2722',
                              border: '2px solid #D1D5DB',
                              minHeight: '44px',
                              fontFamily: 'var(--font-ui)',
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#581C87'
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 28, 135, 0.15)'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#D1D5DB'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                            required
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label
                              className="block text-sm font-medium"
                              style={{ color: '#6B6560', fontFamily: 'var(--font-ui)' }}
                            >
                              Password
                            </label>
                            {mode === 'signin' && (
                              <button
                                type="button"
                                onClick={() => { setMode('reset'); setError(null) }}
                                className="text-sm transition-colors"
                                style={{ color: '#581C87', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#6B21A8'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#581C87'}
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
                            className="w-full p-3 rounded-lg outline-none transition-all"
                            style={{
                              background: 'white',
                              color: '#2A2722',
                              border: '2px solid #D1D5DB',
                              minHeight: '44px',
                              fontFamily: 'var(--font-ui)',
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#581C87'
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 28, 135, 0.15)'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#D1D5DB'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full p-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                          style={{
                            background: '#581C87',
                            color: '#FACC15',
                            minHeight: '44px',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-display)',
                            fontSize: '15px',
                          }}
                          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#6B21A8')}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#581C87'}
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
