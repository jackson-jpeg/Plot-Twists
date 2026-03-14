'use client'

import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SPRING, SPRING_GENTLE, ENTER_Y } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { TypewriterIcon, CheckCircleIcon, SpinnerIcon, PendingCircleIcon, RetryIcon, WarningIcon } from '@/components/GameIcons'
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
      className="min-h-screen w-full px-5 py-10 flex flex-col items-center"
      style={{
        background: 'var(--color-theater-bg)',
        color: 'var(--color-theater-text)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="w-full" style={{ maxWidth: isDesktop ? '540px' : '100%' }}>
        {/* Typewriter icon */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_GENTLE}
        >
          <TypewriterIcon size={isDesktop ? 72 : 64} color="var(--color-theater-muted)" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="font-display font-bold text-center mb-2"
          style={{ fontSize: 'var(--text-title)', color: 'var(--color-theater-text)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.15 }}
        >
          Writing your script...
        </motion.h1>

        <motion.p
          className="text-center mb-8"
          style={{ fontSize: 'var(--text-caption)', color: 'var(--color-theater-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          Claude is crafting your scene
        </motion.p>

        {/* Script title reveal — blur to sharp over 2s */}
        <AnimatePresence>
          {scriptTitlePreview && (
            <motion.p
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 font-bold text-center font-display"
              style={{ color: 'var(--color-accent)', fontSize: isDesktop ? '24px' : '20px' }}
            >
              &ldquo;{scriptTitlePreview}&rdquo;
            </motion.p>
          )}
        </AnimatePresence>

        {/* Thin progress bar with shimmer */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="relative overflow-hidden rounded-full"
            style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
              transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
            />
            {loadingProgress < 100 && !prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        </motion.div>

        {/* Step list with stagger */}
        <motion.div
          className="space-y-3 mb-8"
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
                className="flex items-center gap-3"
                variants={{
                  initial: { opacity: 0, x: -12 },
                  animate: { opacity: 1, x: 0 },
                }}
                transition={SPRING}
              >
                {status === 'done' && <CheckCircleIcon size={22} color="var(--color-success)" />}
                {status === 'active' && <SpinnerIcon size={22} color="var(--color-accent)" />}
                {status === 'pending' && <PendingCircleIcon size={22} />}
                <span
                  className="text-sm font-medium"
                  style={{
                    color: status === 'done'
                      ? 'var(--color-success)'
                      : status === 'active'
                      ? 'var(--color-theater-text)'
                      : 'var(--color-theater-muted)',
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
            className="p-4 rounded-xl mb-8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.5 }}
          >
            <p className="text-sm" style={{ color: 'var(--color-theater-muted)' }}>
              Solo mode — AI characters are joining your performance
            </p>
          </motion.div>
        )}

        {/* Green Room / Timeout */}
        <AnimatePresence mode="wait">
          {greenRoomQuestion && !scriptGenerationTimedOut && (
            <motion.div
              className="mt-4 p-5 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={SPRING_GENTLE}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <h3
                className="font-display text-lg font-bold mb-2"
                style={{ color: 'var(--color-accent)' }}
              >
                Green Room
              </h3>
              <p className="text-lg italic" style={{ color: 'var(--color-theater-text)' }}>
                &ldquo;{greenRoomQuestion}&rdquo;
              </p>
              <p className="text-xs mt-3" style={{ color: 'var(--color-theater-muted)' }}>
                Discuss with your fellow performers while the script is being written
              </p>
            </motion.div>
          )}
          {scriptGenerationTimedOut && (
            <motion.div
              className="mt-4 p-5 rounded-xl"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '2px solid var(--color-danger)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={SPRING_GENTLE}
            >
              <div className="flex items-center gap-2 mb-3">
                <WarningIcon size={20} color="var(--color-danger)" />
                <h3 className="font-display text-lg font-bold" style={{ color: 'var(--color-danger)' }}>
                  Taking longer than expected
                </h3>
              </div>
              <p className="mb-4 text-sm" style={{ color: 'var(--color-theater-muted)' }}>
                Script generation is taking longer than usual. You can wait, retry, or go back.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<RetryIcon size={16} color="currentColor" />}
                  onClick={onRetry}
                >
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  onClick={onBackToLobby}
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Back to Lobby
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
