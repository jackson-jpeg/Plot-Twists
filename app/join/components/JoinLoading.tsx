'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { VARIANTS, MOTION, STAGGER } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { TypewriterIcon, CheckCircleIcon, SpinnerIcon, PendingCircleIcon, DoorIcon, WarningIcon } from '@/components/GameIcons'
import { Button } from '@/components/ui'
import { useScriptStore } from '@/stores/scriptStore'
import { useAudienceStore } from '@/stores/audienceStore'

function getStepStatus(progress: number): [string, string, string] {
  if (progress >= 80) return ['done', 'done', 'active']
  if (progress >= 30) return ['done', 'active', 'pending']
  return ['active', 'pending', 'pending']
}

const steps = [
  { label: 'Gathering everyone\u2019s cards' },
  { label: 'Assigning characters' },
  { label: 'Writing the script' },
]

export interface JoinLoadingProps {
  onLeave?: () => void
}

export function JoinLoading({ onLeave }: JoinLoadingProps) {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Store selectors
  const loadingProgress = useScriptStore((s) => s.generationProgress)
  const loadingPhase = useScriptStore((s) => s.generationPhase)
  const scriptTitlePreview = useScriptStore((s) => s.titlePreview)
  const loadingTimedOut = useScriptStore((s) => s.generationTimedOut)
  const greenRoomQuestion = useAudienceStore((s) => s.greenRoomQuestion)

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
      className="w-full mx-auto px-5"
      style={{ maxWidth: isDesktop ? '540px' : '100%', padding: '32px 20px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))', textAlign: 'center' }}
    >
      {/* Typewriter icon */}
      <motion.div
        className="flex justify-center mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={MOTION.dramatic}
      >
        <TypewriterIcon size={56} color="var(--color-text-tertiary)" />
      </motion.div>

      {/* Heading */}
      <motion.h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-title)',
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
        style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-tertiary)', marginBottom: '28px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        Claude is crafting your scene
      </motion.p>

      {/* Script title reveal */}
      <AnimatePresence>
        {scriptTitlePreview && (
          <motion.p
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)', scale: 1 }}
            transition={MOTION.dramatic}
            className="mb-6 font-bold text-center font-display"
            style={{ color: 'var(--color-accent)', fontSize: isDesktop ? '24px' : '20px' }}
          >
            &ldquo;{scriptTitlePreview}&rdquo;
          </motion.p>
        )}
      </AnimatePresence>

      {/* Theatrical progress bar */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div>
          <div
            className="relative overflow-hidden"
            style={{ height: '6px', borderRadius: '3px', background: 'var(--color-surface-alt)' }}
          >
            <motion.div
              style={{
                height: '100%',
                borderRadius: '3px',
                background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
              transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
            />
            {/* Shimmer effect */}
            {loadingProgress < 100 && !prefersReducedMotion && (
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  borderRadius: '3px',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Step list with stagger */}
      <motion.div
        className="flex flex-col gap-3 mb-6"
        style={{ textAlign: 'left' }}
        initial="initial"
        animate="animate"
        variants={{
          animate: { transition: { staggerChildren: STAGGER.slow } }
        }}
      >
        {steps.map((step, i) => {
          const status = stepStatuses[i]
          return (
            <motion.div
              key={step.label}
              className="flex items-center gap-3"
              variants={{
                initial: { opacity: 0, x: -12 },
                animate: { opacity: 1, x: 0 },
              }}
            >
              {status === 'done' && <CheckCircleIcon size={20} color="var(--color-success)" />}
              {status === 'active' && <SpinnerIcon size={20} color="var(--color-accent)" />}
              {status === 'pending' && <PendingCircleIcon size={20} />}
              <span
                style={{
                  fontSize: 'var(--text-caption)',
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
            </motion.div>
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
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-danger)' }}>
                Something may have gone wrong
              </span>
            </div>
            {onLeave && (
              <div className="flex justify-center" style={{ marginTop: '12px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<DoorIcon size={16} color="currentColor" />}
                  onClick={onLeave}
                  style={{ background: 'transparent' }}
                >
                  Leave Game
                </Button>
              </div>
            )}
          </motion.div>
        ) : isDelayed ? (
          <motion.div
            key="delayed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl"
            style={{ background: 'var(--color-warning-light, rgba(245,158,66,0.1))', border: '1px solid var(--color-warning, var(--color-accent))' }}
          >
            <p style={{ fontSize: 'var(--text-caption)', fontWeight: 500, color: 'var(--color-warning, var(--color-accent))' }}>
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
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-tertiary)' }}>
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
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-accent-2)', marginBottom: '8px' }}>
              While You Wait
            </h3>
            <p className="italic" style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-primary)' }}>
              &ldquo;{greenRoomQuestion}&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
