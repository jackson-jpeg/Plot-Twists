'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { VARIANTS, MOTION } from '@/lib/animations'

const loadingStages = [
  { percent: 0, message: 'Gathering inspiration...', icon: '🎬' },
  { percent: 20, message: 'Assembling characters...', icon: '🎭' },
  { percent: 40, message: 'Writing dialogue...', icon: '✍️' },
  { percent: 60, message: 'Adding comedic timing...', icon: '😂' },
  { percent: 80, message: 'Polishing the script...', icon: '✨' },
  { percent: 95, message: 'Almost ready...', icon: '🎪' },
]

function getCurrentLoadingStage(progress: number) {
  for (let i = loadingStages.length - 1; i >= 0; i--) {
    if (progress >= loadingStages[i].percent) return loadingStages[i]
  }
  return loadingStages[0]
}

export interface JoinLoadingProps {
  loadingProgress: number
  greenRoomQuestion: string
  loadingTimedOut?: boolean
  onLeave?: () => void
}

export function JoinLoading({ loadingProgress, greenRoomQuestion, loadingTimedOut, onLeave }: JoinLoadingProps) {
  const stage = getCurrentLoadingStage(loadingProgress)
  const prefersReducedMotion = useReducedMotion()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const isDelayed = elapsed >= 60
  const isSlow = elapsed >= 30 && !isDelayed

  return (
    <motion.div key="loading" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
      <div className="card">
        <h1 className="text-3xl font-display mb-6" style={{ color: 'var(--color-text-primary)' }}>Get Ready!</h1>
        <AnimatePresence mode="wait">
          <motion.div key={stage.icon} initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, rotate: -180 }} animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }} exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0, rotate: 180 }} transition={MOTION.gentle} className="text-8xl mb-4">{stage.icon}</motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p key={stage.message} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-xl mb-8 font-display" style={{ color: 'var(--color-text-primary)' }}>{stage.message}</motion.p>
        </AnimatePresence>
        <div className="progress mb-8 relative">
          <motion.div className="progress-bar progress-bar-shimmer" initial={{ width: '0%' }} animate={{ width: `${Math.min(loadingProgress, 100)}%` }} transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }} />
        </div>

        {/* Timeout indicators */}
        <AnimatePresence mode="wait">
          {loadingTimedOut ? (
            <motion.div
              key="timed-out"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg text-center"
              style={{ background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)' }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-danger)' }}>
                Something may have gone wrong with script generation.
              </p>
              {onLeave && (
                <button onClick={onLeave} className="btn btn-ghost" style={{ minHeight: '44px' }}>
                  🚪 Leave Game
                </button>
              )}
            </motion.div>
          ) : isDelayed ? (
            <motion.div
              key="delayed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg"
              style={{ background: 'var(--color-warning-light, rgba(245,158,66,0.1))', border: '1px solid var(--color-warning, #F59E42)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--color-warning, #F59E42)' }}>
                ⏱️ Taking longer than expected — hang tight, the AI is crafting something special
              </p>
            </motion.div>
          ) : isSlow ? (
            <motion.div
              key="slow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Complex scripts take a bit longer...
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {greenRoomQuestion && (
            <motion.div className="card card-accent-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h3 className="font-display text-lg mb-3" style={{ color: 'var(--color-accent-2)' }}>💭 While You Wait</h3>
              <p className="text-base italic" style={{ color: 'var(--color-text-primary)' }}>"{greenRoomQuestion}"</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
