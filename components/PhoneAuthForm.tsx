'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OTPInput } from './OTPInput'
import { useAuth } from '@/contexts/AuthContext'
import { getApiBaseUrl } from '@/lib/api'

interface PhoneAuthFormProps {
  onSuccess: () => void
  mode?: 'signin' | 'link'
}

// Common country codes
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: '+44', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: '+61', country: 'AU', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: '+49', country: 'DE', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: '+33', country: 'FR', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: '+81', country: 'JP', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: '+86', country: 'CN', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: '+91', country: 'IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: '+55', country: 'BR', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: '+52', country: 'MX', flag: '\u{1F1F2}\u{1F1FD}' },
]

export function PhoneAuthForm({ onSuccess, mode = 'signin' }: PhoneAuthFormProps) {
  const { signInWithCustomToken, user } = useAuth()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Format as (XXX) XXX-XXXX for US numbers
    if (countryCode === '+1') {
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    return digits
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setPhoneNumber(formatted)
  }

  const getFullPhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '')
    return `${countryCode}${digits}`
  }

  const validatePhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Please enter a valid phone number')
      return false
    }
    return true
  }

  const handleSendCode = async () => {
    setError(null)

    if (!validatePhoneNumber()) return

    setLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: getFullPhoneNumber() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStep('code')
        setResendCountdown(60)
      } else {
        setError(data.error || 'Failed to send verification code')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (codeOverride?: string) => {
    const codeToVerify = codeOverride || verificationCode
    setError(null)

    if (codeToVerify.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)

    try {
      const fullPhone = getFullPhoneNumber()

      // For link mode, get the current user's ID token so the server can attach the phone
      let idToken: string | undefined
      if (mode === 'link' && user) {
        const { getFirebaseAuth } = await import('@/lib/firebase')
        const auth = getFirebaseAuth()
        if (auth?.currentUser) {
          idToken = await auth.currentUser.getIdToken()
        }
      }

      const res = await fetch(`${getApiBaseUrl()}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhone,
          code: codeToVerify,
          ...(mode === 'link' && idToken ? { mode: 'link', idToken } : {}),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success && data.customToken) {
        const result = await signInWithCustomToken(data.customToken)
        if (result.success) {
          onSuccess()
        } else {
          setError(result.error || 'Sign-in failed')
        }
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCountdown > 0) return

    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: getFullPhoneNumber() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setResendCountdown(60)
        setVerificationCode('')
      } else {
        setError(data.error || 'Failed to resend code')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep('phone')
    setVerificationCode('')
    setError(null)
  }

  return (
    <div className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg text-sm bg-[var(--color-danger-light)] border border-[var(--color-danger)] text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div>
              <label
                className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]"
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Country code"
                  className="w-24 p-3 rounded-lg outline-none cursor-pointer bg-[var(--color-surface)] text-[var(--color-text-primary)] border-2 border-[var(--color-border)] focus:border-[var(--color-purple-deeper)] focus:ring-2 focus:ring-[var(--color-purple-deeper)]/15 transition-colors"
                  style={{ minHeight: '44px' }}
                  disabled={loading}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(555) 123-4567"
                  aria-label="Phone number"
                  className="flex-1 p-3 rounded-lg outline-none bg-[var(--color-surface)] text-[var(--color-text-primary)] border-2 border-[var(--color-border)] focus:border-[var(--color-purple-deeper)] focus:ring-2 focus:ring-[var(--color-purple-deeper)]/15 transition-colors"
                  style={{ minHeight: '44px', fontFamily: 'var(--font-ui)' }}
                  disabled={loading}
                />
              </div>
            </div>

            <motion.button
              onClick={handleSendCode}
              disabled={loading || !phoneNumber}
              className="w-full p-3 rounded-lg font-display font-semibold text-[15px] flex items-center justify-center gap-2 bg-[var(--color-purple-deeper)] hover:bg-[var(--color-purple-hover)] text-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ minHeight: '44px' }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⏳
                  </motion.span>
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </motion.button>

            <p className="text-xs text-center text-[var(--color-text-disabled)]">
              We&apos;ll send a 6-digit code to verify your phone number
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="code-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <button
              onClick={handleBack}
              className="text-sm flex items-center gap-1 text-[var(--color-purple-deeper)] hover:text-[var(--color-purple-hover)] bg-transparent border-none cursor-pointer transition-colors"
              disabled={loading}
              aria-label="Change phone number"
            >
              <span>←</span> Change phone number
            </button>

            <div className="text-center">
              <p className="mb-1 text-[var(--color-text-secondary)]">Enter the code sent to</p>
              <p className="font-semibold text-[var(--color-text-primary)]">{getFullPhoneNumber()}</p>
            </div>

            <OTPInput
              value={verificationCode}
              onChange={setVerificationCode}
              onComplete={handleVerifyCode}
              disabled={loading}
              error={!!error}
            />

            <motion.button
              onClick={() => handleVerifyCode()}
              disabled={loading || verificationCode.length !== 6}
              className="w-full p-3 rounded-lg font-display font-semibold text-[15px] flex items-center justify-center gap-2 bg-[var(--color-purple-deeper)] hover:bg-[var(--color-purple-hover)] text-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ minHeight: '44px' }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⏳
                  </motion.span>
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </motion.button>

            <div className="text-center">
              {resendCountdown > 0 ? (
                <p className="text-sm text-[var(--color-text-disabled)]">
                  Resend code in {resendCountdown}s
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm font-medium text-[var(--color-purple-deeper)] hover:text-[var(--color-purple-hover)] bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Resend Code
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
