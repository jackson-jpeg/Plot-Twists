'use client'

import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { RoomSettings } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'
import { TypewriterIcon, CheckCircleIcon, SpinnerIcon, PendingCircleIcon, RetryIcon, WarningIcon } from '@/components/GameIcons'

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
  const stepStatuses = getStepStatus(loadingProgress)

  return (
    <motion.div key="loading" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-2xl">

      {/* Centered typewriter icon */}
      <motion.div
        className="flex justify-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TypewriterIcon size={64} color="var(--color-text-tertiary)" />
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="text-3xl sm:text-4xl font-display font-bold text-center mb-2"
        style={{ color: 'var(--color-text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        Writing your script
      </motion.h1>

      <motion.p
        className="text-sm text-center mb-8"
        style={{ color: 'var(--color-text-tertiary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        AI is crafting a scene based on your cards. This usually takes 10-15 seconds.
      </motion.p>

      {scriptTitlePreview && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg mb-6 font-bold text-center font-display"
          style={{ color: 'var(--color-accent)' }}
        >
          &ldquo;{scriptTitlePreview}&rdquo;
        </motion.p>
      )}

      {/* Progress bar */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="progress relative flex-1">
            <motion.div
              className="progress-bar progress-bar-shimmer"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
              transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
            />
          </div>
          <span className="text-sm font-mono tabular-nums" style={{ color: 'var(--color-text-tertiary)', minWidth: '3ch' }}>
            {Math.round(Math.min(loadingProgress, 100))}%
          </span>
        </div>
      </motion.div>

      {/* Step list */}
      <motion.div
        className="space-y-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        {steps.map((step, i) => {
          const status = stepStatuses[i]
          return (
            <div key={step.label} className="flex items-center gap-3">
              {status === 'done' && <CheckCircleIcon size={22} color="var(--color-success)" />}
              {status === 'active' && <SpinnerIcon size={22} color="#F59E42" />}
              {status === 'pending' && <PendingCircleIcon size={22} />}
              <span
                className="text-sm font-medium"
                style={{
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

      {settings.gameMode === 'SOLO' && (
        <motion.div
          className="card p-4 mb-8"
          style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Solo mode -- AI characters are joining your performance
          </p>
        </motion.div>
      )}

      {/* Green Room / Timeout */}
      <AnimatePresence mode="wait">
        {greenRoomQuestion && !scriptGenerationTimedOut && (
          <motion.div
            className="card card-accent-2 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ boxShadow: '0 0 0 1px var(--color-accent-2)' }}
          >
            <h3 className="font-display text-lg mb-3" style={{ color: 'var(--color-accent-2)' }}>Green Room</h3>
            <p className="text-lg italic" style={{ color: 'var(--color-text-primary)' }}>&ldquo;{greenRoomQuestion}&rdquo;</p>
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
              Discuss with your fellow performers while the script is being written
            </p>
          </motion.div>
        )}
        {scriptGenerationTimedOut && (
          <motion.div
            className="card mt-4"
            style={{ background: 'var(--color-highlight-pink)', border: '2px solid var(--color-danger)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <WarningIcon size={20} color="var(--color-danger)" />
              <h3 className="font-display text-lg" style={{ color: 'var(--color-danger)' }}>Taking longer than expected</h3>
            </div>
            <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Script generation is taking longer than usual. You can wait, retry, or go back.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <motion.button onClick={onRetry} className="btn btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <RetryIcon size={16} color="currentColor" /><span>Retry</span>
              </motion.button>
              <motion.button onClick={onBackToLobby} className="btn btn-ghost" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <span>&larr;</span><span>Back to Lobby</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
