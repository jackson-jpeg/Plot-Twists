'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SPRING, SPRING_GENTLE, ENTER_Y } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { CheckCircleIcon, SpinnerIcon, PendingCircleIcon, DoorIcon, WarningIcon } from '@/components/GameIcons'
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

  // suppress unused warning — phase may be used by parent logic
  void loadingPhase

  return (
    <motion.div
      key="loading"
      {...ENTER_Y}
      exit={{ opacity: 0, y: -10 }}
      transition={SPRING_GENTLE}
      className="min-h-screen w-full flex flex-col items-center justify-center px-5 py-8"
      style={{
        background: 'var(--color-void, #08070b)',
        color: 'var(--color-theater-text)',
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="w-full flex flex-col items-center" style={{ maxWidth: isDesktop ? '540px' : '360px' }}>

        {/* Paper element */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_GENTLE, delay: 0.1 }}
          style={{
            width: '260px',
            background: 'var(--color-paper, #f4f0e8)',
            borderRadius: '4px 4px 0 0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            padding: '32px 24px 40px',
            color: '#1a1812',
            maskImage: 'linear-gradient(to bottom, #000 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 85%, transparent)',
          }}
        >
          {/* Studio watermark */}
          <p style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'rgba(26,24,18,0.35)',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            A Plot Twists Original
          </p>

          {/* Script title */}
          <div style={{ minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence>
              {scriptTitlePreview ? (
                <motion.p
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: isDesktop ? '28px' : '24px',
                    color: '#1a1812',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  {scriptTitlePreview}
                  <motion.span
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{ duration: 1, repeat: Infinity, times: [0, 0.49, 0.5, 1], ease: 'linear' }}
                    style={{ color: 'var(--color-stage-red, #e53e3e)', marginLeft: 2 }}
                  >|</motion.span>
                </motion.p>
              ) : (
                <motion.span
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{ duration: 1, repeat: Infinity, times: [0, 0.49, 0.5, 1], ease: 'linear' }}
                  style={{ color: 'var(--color-stage-red, #e53e3e)', fontSize: '28px' }}
                >|</motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Written by */}
          <p style={{
            fontSize: '10px',
            fontStyle: 'italic',
            color: 'rgba(26,24,18,0.4)',
            textAlign: 'center',
            marginTop: '20px',
          }}>
            written by Claude
          </p>
        </motion.div>

        {/* Below-paper content on dark background */}
        <div className="w-full" style={{ maxWidth: '320px', marginTop: '32px' }}>

          {/* Status label */}
          <motion.p
            className="text-center mb-4"
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Writing your scene...
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className="relative overflow-hidden rounded-full"
              style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.35)',
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
              />
              {loadingProgress < 100 && !prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>
          </motion.div>

          {/* Step list */}
          <motion.div
            className="flex flex-col gap-2 mb-5"
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.12 } }
            }}
          >
            {steps.map((step, i) => {
              const status = stepStatuses[i]
              return (
                <motion.div
                  key={step.label}
                  className="flex items-center gap-2"
                  variants={{
                    initial: { opacity: 0, x: -12 },
                    animate: { opacity: 1, x: 0 },
                  }}
                  transition={SPRING}
                >
                  {status === 'done' && <CheckCircleIcon size={16} color="rgba(255,255,255,0.5)" />}
                  {status === 'active' && <SpinnerIcon size={16} color="rgba(255,255,255,0.8)" />}
                  {status === 'pending' && <PendingCircleIcon size={16} />}
                  <span
                    style={{
                      fontSize: '12px',
                      color: status === 'done'
                        ? 'rgba(255,255,255,0.4)'
                        : status === 'active'
                        ? 'rgba(255,255,255,0.8)'
                        : 'rgba(255,255,255,0.2)',
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
                transition={SPRING}
                className="mb-5 p-3 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid var(--color-danger)',
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <WarningIcon size={16} color="var(--color-danger)" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-danger)' }}>
                    Something may have gone wrong
                  </span>
                </div>
                {onLeave && (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<DoorIcon size={14} color="currentColor" />}
                      onClick={onLeave}
                      style={{ border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px' }}
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
                transition={SPRING}
                className="mb-5 p-3 rounded-lg"
                style={{
                  background: 'rgba(245,158,66,0.06)',
                  border: '1px solid rgba(245,158,66,0.3)',
                }}
              >
                <p style={{ fontSize: '12px', color: 'rgba(245,158,66,0.8)', textAlign: 'center' }}>
                  Taking longer than expected — hang tight, the AI is crafting something special
                </p>
              </motion.div>
            ) : isSlow ? (
              <motion.div
                key="slow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-5"
              >
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  Complex scripts take a bit longer...
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Green Room */}
          <AnimatePresence mode="wait">
            {greenRoomQuestion && (
              <motion.div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={SPRING_GENTLE}
              >
                <h3
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: '8px',
                  }}
                >
                  While You Wait
                </h3>
                <p className="italic" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  &ldquo;{greenRoomQuestion}&rdquo;
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
