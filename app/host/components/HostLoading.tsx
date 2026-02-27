'use client'

import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { RoomSettings } from '@/lib/types'
import { VARIANTS, MOTION, STAGGER } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { TypewriterIcon, CheckCircleIcon, SpinnerIcon, PendingCircleIcon, RetryIcon, WarningIcon } from '@/components/GameIcons'

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
  settings: RoomSettings
  loadingProgress: number
  loadingPhase: string
  scriptTitlePreview: string | null
  greenRoomQuestion: string
  scriptGenerationTimedOut: boolean
  onRetry: () => void
  onBackToLobby: () => void
}

export function HostLoading({
  settings, loadingProgress, loadingPhase, scriptTitlePreview,
  greenRoomQuestion, scriptGenerationTimedOut, onRetry, onBackToLobby,
}: HostLoadingProps) {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const stepStatuses = getStepStatus(loadingProgress)

  return (
    <motion.div
      key="loading"
      variants={VARIANTS.pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full mx-auto px-5"
      style={{ maxWidth: isDesktop ? '640px' : '100%' }}
    >
      {/* Centered typewriter icon */}
      <motion.div
        className="flex justify-center mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={MOTION.dramatic}
      >
        <TypewriterIcon size={isDesktop ? 72 : 64} color="var(--color-text-tertiary)" />
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="font-display font-bold text-center mb-2"
        style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-title)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        Writing your script...
      </motion.h1>

      <motion.p
        className="text-center mb-8"
        style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-caption)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        Claude is crafting your scene
      </motion.p>

      {/* Script title reveal — blur to clear */}
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
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div>
          <div
            className="relative overflow-hidden"
            style={{
              height: '6px',
              borderRadius: '3px',
              background: 'var(--color-surface-alt)',
            }}
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
        className="space-y-3 mb-8"
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
              {status === 'done' && <CheckCircleIcon size={22} color="var(--color-success)" />}
              {status === 'active' && <SpinnerIcon size={22} color="#F59E42" />}
              {status === 'pending' && <PendingCircleIcon size={22} />}
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

      {settings.gameMode === 'SOLO' && (
        <motion.div
          className="p-4 rounded-xl mb-8"
          style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
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
            style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-accent-2)', marginBottom: '10px' }}>Green Room</h3>
            <p className="text-lg italic" style={{ color: 'var(--color-text-primary)' }}>&ldquo;{greenRoomQuestion}&rdquo;</p>
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
              Discuss with your fellow performers while the script is being written
            </p>
          </motion.div>
        )}
        {scriptGenerationTimedOut && (
          <motion.div
            className="mt-4 p-5 rounded-xl"
            style={{ background: 'var(--color-highlight-pink)', border: '2px solid var(--color-danger)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <WarningIcon size={20} color="var(--color-danger)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-danger)' }}>Taking longer than expected</h3>
            </div>
            <p className="mb-4" style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
              Script generation is taking longer than usual. You can wait, retry, or go back.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <motion.button
                onClick={onRetry}
                className="flex items-center gap-2"
                style={{ padding: '10px 20px', borderRadius: 'var(--radius-button)', border: 'none', background: 'var(--color-accent)', color: 'white', fontWeight: 600, fontSize: 'var(--text-caption)', cursor: 'pointer' }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                <RetryIcon size={16} color="currentColor" /><span>Retry</span>
              </motion.button>
              <motion.button
                onClick={onBackToLobby}
                className="flex items-center gap-2"
                style={{ padding: '10px 20px', borderRadius: 'var(--radius-button)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 'var(--text-caption)', cursor: 'pointer' }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>Back to Lobby</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
