'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RoomSettings } from '@/lib/types'
import { VARIANTS, MOTION } from '@/lib/animations'

const loadingStages = [
  { percent: 0, message: 'Gathering inspiration...', icon: '🎬' },
  { percent: 10, message: 'Connecting to AI...', icon: '🔌' },
  { percent: 20, message: 'Assembling characters...', icon: '🎭' },
  { percent: 40, message: 'Writing dialogue...', icon: '✍️' },
  { percent: 60, message: 'Adding comedic timing...', icon: '😂' },
  { percent: 80, message: 'Polishing the script...', icon: '✨' },
  { percent: 95, message: 'Almost ready...', icon: '🎪' },
]

function getCurrentLoadingStage(progress: number, phase: string) {
  if (phase) {
    const icon = progress < 20 ? '🔌' : progress < 40 ? '🎭' : progress < 80 ? '✍️' : progress < 95 ? '✨' : '🎪'
    return { percent: progress, message: phase, icon }
  }
  for (let i = loadingStages.length - 1; i >= 0; i--) {
    if (progress >= loadingStages[i].percent) return loadingStages[i]
  }
  return loadingStages[0]
}

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
  const stage = getCurrentLoadingStage(loadingProgress, loadingPhase)

  return (
    <motion.div key="loading" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-2xl text-center">
      <motion.h1 className="hero-title mb-12" animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }}>🎬 Writing Script</motion.h1>
      <div className="card">
        <AnimatePresence mode="wait">
          <motion.div key={stage.icon} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }} transition={MOTION.gentle} className="text-8xl mb-6">{stage.icon}</motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p key={stage.message} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-xl mb-8 font-display" style={{ color: 'var(--color-text-primary)' }}>{stage.message}</motion.p>
        </AnimatePresence>

        {scriptTitlePreview && (
          <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-lg mb-4 font-bold" style={{ color: 'var(--color-accent-1)' }}>&ldquo;{scriptTitlePreview}&rdquo;</motion.p>
        )}

        {settings.gameMode === 'SOLO' && (
          <motion.div className="card p-4 mb-8" style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>🎭 Solo mode: AI characters are joining your performance</p>
          </motion.div>
        )}

        <div className="progress mb-8 relative">
          <motion.div className="progress-bar progress-bar-shimmer" initial={{ width: '0%' }} animate={{ width: `${Math.min(loadingProgress, 100)}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
        </div>

        <AnimatePresence mode="wait">
          {greenRoomQuestion && !scriptGenerationTimedOut && (
            <motion.div className="card card-accent-2 mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h3 className="font-display text-lg mb-3" style={{ color: 'var(--color-accent-2)' }}>💭 While You Wait</h3>
              <p className="italic" style={{ color: 'var(--color-text-primary)' }}>"{greenRoomQuestion}"</p>
            </motion.div>
          )}
          {scriptGenerationTimedOut && (
            <motion.div className="card mt-8" style={{ background: 'var(--color-highlight-pink)', border: '2px solid var(--color-danger)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h3 className="font-display text-lg mb-3" style={{ color: 'var(--color-danger)' }}>⏰ Taking longer than expected</h3>
              <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Script generation is taking longer than usual. You can wait, retry, or go back.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <motion.button onClick={onRetry} className="btn btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><span>🔄</span><span>Retry</span></motion.button>
                <motion.button onClick={onBackToLobby} className="btn btn-ghost" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><span>←</span><span>Back to Lobby</span></motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
