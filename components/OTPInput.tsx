'use client'

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { motion } from 'framer-motion'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // Split value into individual digits
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  useEffect(() => {
    // Focus first empty input on mount
    const firstEmptyIndex = digits.findIndex(d => !d)
    if (firstEmptyIndex !== -1 && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex]?.focus()
    }
  }, [])

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        // Clear current digit
        const newValue = digits.map((d, i) => i === index ? '' : d).join('')
        onChange(newValue)
      } else if (index > 0) {
        // Move to previous input and clear it
        const newValue = digits.map((d, i) => i === index - 1 ? '' : d).join('')
        onChange(newValue)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      // Set digit and advance to next
      const newDigits = [...digits]
      newDigits[index] = e.key
      const newValue = newDigits.join('')
      onChange(newValue)
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
      // Auto-submit when complete
      if (newValue.replace(/\s/g, '').length === length && onComplete) {
        setTimeout(() => onComplete(newValue), 100)
      }
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, length)

    if (pastedDigits) {
      const newValue = pastedDigits.padEnd(length, '').slice(0, length)
      onChange(newValue)
      // Focus last filled input or last input
      const focusIndex = Math.min(pastedDigits.length, length - 1)
      inputRefs.current[focusIndex]?.focus()
      // Auto-submit when complete
      if (pastedDigits.length >= length && onComplete) {
        setTimeout(() => onComplete(newValue), 100)
      }
    }
  }

  const handleFocus = (index: number) => {
    setFocusedIndex(index)
    inputRefs.current[index]?.select()
  }

  const handleBlur = () => {
    setFocusedIndex(null)
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <motion.input
          key={index}
          ref={el => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={() => {}} // Controlled by keydown
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl outline-none transition-all"
          style={{
            background: disabled ? 'var(--color-surface-alt)' : 'var(--color-surface)',
            border: error
              ? '2px solid var(--color-danger)'
              : focusedIndex === index
              ? '2px solid var(--color-accent)'
              : '2px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            opacity: disabled ? 0.6 : 1,
            minWidth: '44px',
            minHeight: '48px',
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: focusedIndex === index ? -2 : 0
          }}
          transition={{ delay: index * 0.05 }}
          whileFocus={{ scale: 1.05 }}
        />
      ))}
    </div>
  )
}
