'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { VARIANTS, MOTION } from '@/lib/animations'
import { TypewriterIcon, CheckCircleIcon, SpinnerIcon, PendingCircleIcon, DoorIcon, WarningIcon } from '@/components/GameIcons'

function getStepStatus(progress: number): [string, string, string] {
  if (progress >= 80) return ['done', 'done', 'active']
  if (progress >= 30) return ['done', 'active', 'pending']
  return ['active', 'pending', 'pending']
}

const steps = [
  { label: 'Analyzing cards' },
  { label: 'Writing dialogue' },
  { label: 'Generating poster' },
]

export interface JoinLoadingProps {
  loadingProgress: number
  greenRoomQuestion: string
  loadingTimedOut?: boolean
  onLeave?: () => void
}

export function JoinLoading({ loadingProgress, greenRoomQuestion, loadingTimedOut, onLeave }: JoinLoadingProps) {
  const prefersReducedMotion = useReducedMotion()
  const stepStatuses = getStepStatus(loadingProgress)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const isDelayed = elapsed >= 60
  const isSlow = elapsed >= 30 && !isDelayed

  return (
    <motion.div
      key="loading"
      variants={VARIANTS.pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-lg mx-auto px-5"
      style={{ padding: '32px 20px', textAlign: 'center' }}
    >
      {/* Typewriter icon */}
      <motion.div
        className="flex justify-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TypewriterIcon size={56} color="var(--color-text-tertiary)" />
      </motion.div>

      {/* Heading */}
      <motion.h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '8px',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        Get Ready!
      </motion.h1>

      <motion.p
        style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginBottom: '28px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        AI is writing your script. This usually takes 10-15 seconds.
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative flex-1 overflow-hidden"
            style={{ height: '8px', borderRadius: '4px', background: 'var(--color-surface-alt)' }}
          >
            <motion.div
              style={{ height: '100%', borderRadius: '4px', background: 'var(--color-accent)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
              transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
            />
          </div>
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', minWidth: '3ch' }}
          >
            {Math.round(Math.min(loadingProgress, 100))}%
          </span>
        </div>
      </motion.div>

      {/* Step list */}
      <motion.div
        className="flex flex-col gap-3 mb-6"
        style={{ textAlign: 'left' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        {steps.map((step, i) => {
          const status = stepStatuses[i]
          return (
            <div key={step.label} className="flex items-center gap-3">
              {status === 'done' && <CheckCircleIcon size={20} color="var(--color-success)" />}
              {status === 'active' && <SpinnerIcon size={20} color="#F59E42" />}
              {status === 'pending' && <PendingCircleIcon size={20} />}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: status === 'done'
                    ? 'var(--color-success)'
                    : status === 'active'
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)',
                }}
              >
                {step.label}{status === 'active' ? '...' : ''}
              </span>
            </div>
          )
        })}
      </motion.div>

      {/* Timeout indicators */}
      <AnimatePresence mode="wait">
        {loadingTimedOut ? (
          <motion.div
            key="timed-out"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl text-center"
            style={{ background: 'var(--color-highlight-pink, rgba(239,68,68,0.08))', border: '1px solid var(--color-danger)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <WarningIcon size={18} color="var(--color-danger)" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-danger)' }}>
                Something may have gone wrong
              </span>
            </div>
            {onLeave && (
              <button
                onClick={onLeave}
                className="flex items-center gap-2 mx-auto"
                style={{
                  marginTop: '12px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <DoorIcon size={16} color="currentColor" />
                Leave Game
              </button>
            )}
          </motion.div>
        ) : isDelayed ? (
          <motion.div
            key="delayed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl"
            style={{ background: 'var(--color-warning-light, rgba(245,158,66,0.1))', border: '1px solid var(--color-warning, #F59E42)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--color-warning, #F59E42)' }}>
              Taking longer than expected — hang tight, the AI is crafting something special
            </p>
          </motion.div>
        ) : isSlow ? (
          <motion.div
            key="slow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
              Complex scripts take a bit longer...
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Green Room */}
      <AnimatePresence mode="wait">
        {greenRoomQuestion && (
          <motion.div
            className="p-5 rounded-xl"
            style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)', textAlign: 'left' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--color-accent-2)', marginBottom: '8px' }}>
              While You Wait
            </h3>
            <p className="italic" style={{ fontSize: '16px', color: 'var(--color-text-primary)' }}>
              &ldquo;{greenRoomQuestion}&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
