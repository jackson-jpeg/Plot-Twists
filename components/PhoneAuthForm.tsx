'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OTPInput } from './OTPInput'
import { useAuth } from '@/contexts/AuthContext'
import { createRecaptchaVerifier } from '@/lib/firebase'
import { getFirebaseErrorMessage } from '@/lib/authErrors'
import { isCapacitorNative } from '@/lib/platform'
import { getApiBaseUrl } from '@/lib/api'

interface PhoneAuthFormProps {
  onSuccess: () => void
  mode?: 'signin' | 'link'
}

// Common country codes
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
]

export function PhoneAuthForm({ onSuccess, mode = 'signin' }: PhoneAuthFormProps) {
  const { sendPhoneCode, verifyPhoneCode, linkWithPhone, signInWithCustomToken } = useAuth()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recaptchaVerifierRef = useRef<any>(null)
  // Use unique ID to avoid conflicts when multiple forms exist
  const uniqueId = useId()
  const recaptchaContainerId = `recaptcha-container-${uniqueId.replace(/:/g, '')}`

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  // In Capacitor WKWebView, reCAPTCHA doesn't work — use server-side auth
  const isNative = typeof window !== 'undefined' && isCapacitorNative()
  const [serverSessionInfo, setServerSessionInfo] = useState<string | null>(null)

  // Initialize reCAPTCHA verifier (skip in Capacitor)
  useEffect(() => {
    if (isNative) {
      setRecaptchaReady(true) // No reCAPTCHA needed in native
      return
    }

    let cancelled = false

    const initRecaptcha = async () => {
      if (step === 'phone' && !recaptchaVerifierRef.current) {
        // Small delay to ensure DOM element exists after AnimatePresence renders
        await new Promise(resolve => setTimeout(resolve, 100))
        if (cancelled) return
        const verifier = await createRecaptchaVerifier(recaptchaContainerId)
        recaptchaVerifierRef.current = verifier
        setRecaptchaReady(!!verifier)
      }
    }
    initRecaptcha()

    return () => {
      cancelled = true
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear()
        } catch {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null
        setRecaptchaReady(false)
      }
    }
  }, [step, recaptchaContainerId, isNative])

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

    const fullPhone = getFullPhoneNumber()

    // Capacitor native: use server-side SMS flow
    if (isNative) {
      setLoading(true)
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/send-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: fullPhone }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setServerSessionInfo(data.sessionInfo || null)
          setVerificationId('server-side')
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
      return
    }

    // Web: standard reCAPTCHA flow
    if (!recaptchaVerifierRef.current) {
      // Try to re-initialize before giving up
      const verifier = await createRecaptchaVerifier(recaptchaContainerId)
      recaptchaVerifierRef.current = verifier
      setRecaptchaReady(!!verifier)
      if (!verifier) {
        setError('reCAPTCHA failed to load. Check browser console for details, then refresh.')
        return
      }
    }

    setLoading(true)

    try {
      const result = await sendPhoneCode(fullPhone, recaptchaVerifierRef.current)

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId)
        setStep('code')
        setResendCountdown(60)
      } else {
        setError(result.error || 'Failed to send verification code')
        // Recreate reCAPTCHA verifier after error
        const verifier = await createRecaptchaVerifier(recaptchaContainerId)
        recaptchaVerifierRef.current = verifier
        setRecaptchaReady(!!verifier)
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err))
      // Recreate reCAPTCHA verifier after error
      const verifier = await createRecaptchaVerifier(recaptchaContainerId)
      recaptchaVerifierRef.current = verifier
      setRecaptchaReady(!!verifier)
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

    if (!verificationId) {
      setError('Verification session expired. Please request a new code.')
      return
    }

    setLoading(true)

    try {
      // Capacitor native: verify via server, then sign in with custom token
      if (isNative) {
        const fullPhone = getFullPhoneNumber()
        const res = await fetch(`${getApiBaseUrl()}/api/auth/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: fullPhone,
            code: codeToVerify,
            sessionInfo: serverSessionInfo,
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
        return
      }

      // Web: standard Firebase verification
      const verifyFn = mode === 'link' ? linkWithPhone : verifyPhoneCode
      const result = await verifyFn(verificationId, codeToVerify)

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCountdown > 0) return

    setError(null)

    // Capacitor native: resend via server
    if (isNative) {
      setLoading(true)
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/send-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: getFullPhoneNumber() }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setServerSessionInfo(data.sessionInfo || null)
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
      return
    }

    // Web: recreate reCAPTCHA verifier for resend
    recaptchaVerifierRef.current = await createRecaptchaVerifier(recaptchaContainerId)

    if (!recaptchaVerifierRef.current) {
      setError('Failed to initialize reCAPTCHA. Please refresh the page.')
      return
    }

    setLoading(true)

    try {
      const result = await sendPhoneCode(getFullPhoneNumber(), recaptchaVerifierRef.current)

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId)
        setResendCountdown(60)
        setVerificationCode('')
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err))
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
      {/* Hidden reCAPTCHA container - positioned off-screen for safer invisible placement (skipped in Capacitor) */}
      {!isNative && <div id={recaptchaContainerId} style={{ position: 'absolute', left: '-9999px' }} />}

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

            {!recaptchaReady && !isNative && (
              <p className="text-[10px] text-center text-[var(--color-text-disabled)]">
                Initializing security check...
              </p>
            )}
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
