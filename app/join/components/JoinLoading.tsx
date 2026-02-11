'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
}

export function JoinLoading({ loadingProgress, greenRoomQuestion }: JoinLoadingProps) {
  const stage = getCurrentLoadingStage(loadingProgress)

  return (
    <motion.div key="loading" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
      <div className="card">
        <h1 className="text-3xl font-display mb-6" style={{ color: 'var(--color-text-primary)' }}>Get Ready!</h1>
        <AnimatePresence mode="wait">
          <motion.div key={stage.icon} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }} transition={MOTION.gentle} className="text-8xl mb-4">{stage.icon}</motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p key={stage.message} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-xl mb-8 font-display" style={{ color: 'var(--color-text-primary)' }}>{stage.message}</motion.p>
        </AnimatePresence>
        <div className="progress mb-8 relative">
          <motion.div className="progress-bar progress-bar-shimmer" initial={{ width: '0%' }} animate={{ width: `${Math.min(loadingProgress, 100)}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
        </div>
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
