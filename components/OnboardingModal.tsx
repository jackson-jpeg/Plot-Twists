'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from './Modal'
import { MOTION } from '@/lib/animations'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'host' | 'join'
}

const STEPS = [
  {
    title: 'Welcome to Plot Twists!',
    icon: '🎭',
    content: (
      <div style={{ textAlign: 'center' }}>
        <motion.div
          style={{ fontSize: '80px', marginBottom: '16px' }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...MOTION.gentle, delay: 0.2 }}
        >
          🎭
        </motion.div>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '16px', maxWidth: '400px', margin: '0 auto' }}>
          The AI-powered improv party game where random cards become hilarious comedy scenes.
          No acting skills required!
        </p>
      </div>
    ),
  },
  {
    title: 'How It Works',
    icon: '🎬',
    content: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
        {[
          { icon: '🎴', label: 'Pick Cards', desc: 'Choose character, setting, and circumstance' },
          { icon: '🤖', label: 'AI Writes', desc: 'Claude generates a hilarious custom script' },
          { icon: '🎬', label: 'Perform', desc: 'Read your lines aloud for the group' },
          { icon: '🗳️', label: 'Vote MVP', desc: 'Everyone votes for the best performance' },
        ].map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            style={{
              textAlign: 'center',
              padding: '16px 12px',
              background: 'var(--color-surface)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{step.icon}</div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', fontSize: '14px' }}>
              {step.label}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              {step.desc}
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "You're Ready!",
    icon: '🚀',
    content: (
      <div style={{ textAlign: 'center' }}>
        <motion.div
          style={{ fontSize: '64px', marginBottom: '16px' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...MOTION.spring, delay: 0.2 }}
        >
          🚀
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px', margin: '0 auto' }}>
          {[
            "Don't overthink it — go with your gut!",
            'Commit fully to the character',
            'Watch the mood indicator for delivery cues',
          ].map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * i + 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--color-surface)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span style={{ color: 'var(--color-accent)' }}>✓</span>
              {tip}
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
]

export function OnboardingModal({ isOpen, onClose, mode = 'join' }: OnboardingModalProps) {
  const [step, setStep] = useState(0)

  const handleClose = () => {
    setStep(0)
    onClose()
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={STEPS[step].title} maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '280px' }}>
        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === step ? 'var(--color-accent)' : 'var(--color-border)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {STEPS[step].content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handlePrev}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: step > 0 ? 'pointer' : 'default',
              opacity: step > 0 ? 1 : 0,
              transition: 'all 0.2s',
              fontSize: '14px',
              minHeight: '44px',
            }}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: step === STEPS.length - 1
                ? 'linear-gradient(135deg, var(--color-purple), var(--color-pink))'
                : 'var(--color-accent)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s',
              minHeight: '44px',
            }}
          >
            {step === STEPS.length - 1 ? "Let's Play!" : 'Next'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
