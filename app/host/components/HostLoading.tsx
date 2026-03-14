'use client'

import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SPRING, SPRING_GENTLE, ENTER_Y } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { CheckCircleIcon, SpinnerIcon, PendingCircleIcon, RetryIcon, WarningIcon } from '@/components/GameIcons'
import { Button } from '@/components/ui'
import { useGameStore } from '@/stores/gameStore'
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

export interface HostLoadingProps {
  onRetry: () => void
  onBackToLobby: () => void
}

export function HostLoading({ onRetry, onBackToLobby }: HostLoadingProps) {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  const settings = useGameStore((s) => s.settings)
  const loadingProgress = useScriptStore((s) => s.generationProgress)
  const scriptTitlePreview = useScriptStore((s) => s.titlePreview)
  const scriptGenerationTimedOut = useScriptStore((s) => s.generationTimedOut)
  const greenRoomQuestion = useAudienceStore((s) => s.greenRoomQuestion)

  const stepStatuses = getStepStatus(loadingProgress)

  return (
    <motion.div
      key="loading"
      {...ENTER_Y}
      transition={SPRING_GENTLE}
      className="min-h-screen w-full flex flex-col items-center justify-center px-5 py-10"
      style={{
        background: 'var(--color-void, #08070b)',
        color: 'var(--color-theater-text)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
            position: 'relative',
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
            className="mb-6"
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
            className="space-y-2 mb-6"
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

          {settings?.gameMode === 'SOLO' && (
            <motion.div
              className="p-3 rounded-lg mb-6"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.5 }}
            >
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                Solo mode — AI characters are joining your performance
              </p>
            </motion.div>
          )}

          {/* Green Room / Timeout */}
          <AnimatePresence mode="wait">
            {greenRoomQuestion && !scriptGenerationTimedOut && (
              <motion.div
                className="p-4 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={SPRING_GENTLE}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <h3
                  className="font-display text-sm font-bold mb-2"
                  style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}
                >
                  Green Room
                </h3>
                <p className="italic text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  &ldquo;{greenRoomQuestion}&rdquo;
                </p>
                <p style={{ fontSize: '11px', marginTop: '8px', color: 'rgba(255,255,255,0.3)' }}>
                  Discuss with your fellow performers while the script is being written
                </p>
              </motion.div>
            )}
            {scriptGenerationTimedOut && (
              <motion.div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid var(--color-danger)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={SPRING_GENTLE}
              >
                <div className="flex items-center gap-2 mb-2">
                  <WarningIcon size={16} color="var(--color-danger)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>
                    Taking longer than expected
                  </span>
                </div>
                <p className="mb-3" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  Script generation is taking longer than usual. You can wait, retry, or go back.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<RetryIcon size={14} color="currentColor" />}
                    onClick={onRetry}
                  >
                    Retry
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    onClick={onBackToLobby}
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    Back to Lobby
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
