'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OTPInput } from './OTPInput'
import { useAuth } from '@/contexts/AuthContext'
import { createRecaptchaVerifier } from '@/lib/firebase'
import { getFirebaseErrorMessage } from '@/lib/authErrors'

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
  const { sendPhoneCode, verifyPhoneCode, linkWithPhone } = useAuth()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
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

  // Initialize reCAPTCHA verifier
  useEffect(() => {
    const initRecaptcha = async () => {
      if (step === 'phone' && !recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = await createRecaptchaVerifier(recaptchaContainerId)
      }
    }
    initRecaptcha()

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear()
        } catch {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null
      }
    }
  }, [step])

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

    if (!recaptchaVerifierRef.current) {
      setError('reCAPTCHA not initialized. Please refresh the page.')
      return
    }

    setLoading(true)

    try {
      const result = await sendPhoneCode(getFullPhoneNumber(), recaptchaVerifierRef.current)

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId)
        setStep('code')
        setResendCountdown(60)
      } else {
        setError(result.error || 'Failed to send verification code')
        // Recreate reCAPTCHA verifier after error
        recaptchaVerifierRef.current = await createRecaptchaVerifier(recaptchaContainerId)
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err))
      // Recreate reCAPTCHA verifier after error
      recaptchaVerifierRef.current = await createRecaptchaVerifier(recaptchaContainerId)
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

    // Recreate reCAPTCHA verifier for resend
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
      {/* Hidden reCAPTCHA container */}
      <div id={recaptchaContainerId} />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 p-3 bg-gray-800 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
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
                  className="flex-1 p-3 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <motion.button
              onClick={handleSendCode}
              disabled={loading || !phoneNumber}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

            <p className="text-xs text-gray-500 text-center">
              We'll send a 6-digit code to verify your phone number
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
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
              disabled={loading}
            >
              <span>←</span> Change phone number
            </button>

            <div className="text-center">
              <p className="text-gray-300 mb-1">Enter the code sent to</p>
              <p className="text-white font-semibold">{getFullPhoneNumber()}</p>
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
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                <p className="text-gray-500 text-sm">
                  Resend code in {resendCountdown}s
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium disabled:opacity-50"
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
