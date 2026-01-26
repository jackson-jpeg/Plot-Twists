'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Achievement } from '@/lib/types'

interface AchievementCelebrationProps {
  achievement: Achievement | null
  onComplete: () => void
}

const rarityColors = {
  common: {
    bg: 'from-gray-600 to-gray-800',
    border: 'border-gray-500',
    glow: 'shadow-gray-500/50',
    text: 'text-gray-300',
    particle: '#9CA3AF'
  },
  rare: {
    bg: 'from-blue-600 to-blue-800',
    border: 'border-blue-400',
    glow: 'shadow-blue-500/50',
    text: 'text-blue-300',
    particle: '#60A5FA'
  },
  epic: {
    bg: 'from-purple-600 to-purple-800',
    border: 'border-purple-400',
    glow: 'shadow-purple-500/50',
    text: 'text-purple-300',
    particle: '#A78BFA'
  },
  legendary: {
    bg: 'from-yellow-500 to-orange-600',
    border: 'border-yellow-400',
    glow: 'shadow-yellow-500/50',
    text: 'text-yellow-300',
    particle: '#FBBF24'
  }
}

// Particle component for celebration effect
function Particle({ color, delay, index }: { color: string; delay: number; index: number }) {
  const angle = (index / 20) * Math.PI * 2
  const distance = 100 + Math.random() * 100
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{
        x: x,
        y: y,
        scale: 0,
        opacity: 0
      }}
      transition={{
        duration: 1,
        delay: delay,
        ease: 'easeOut'
      }}
    />
  )
}

// Star burst effect
function StarBurst({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <Particle key={i} color={color} delay={i * 0.02} index={i} />
      ))}
    </div>
  )
}

export function AchievementCelebration({ achievement, onComplete }: AchievementCelebrationProps) {
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => {
    if (achievement) {
      setShowParticles(true)
      const timer = setTimeout(() => {
        setShowParticles(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [achievement])

  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => {
        onComplete()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onComplete])

  if (!achievement) return null

  const colors = rarityColors[achievement.rarity]

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop glow */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Main celebration card */}
          <motion.div
            className="relative pointer-events-auto"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, y: -100, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
          >
            {/* Particle effects */}
            {showParticles && <StarBurst color={colors.particle} />}

            {/* Glowing ring */}
            <motion.div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${colors.bg} blur-xl`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Card content */}
            <motion.div
              className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl p-8 border-2 ${colors.border} shadow-2xl ${colors.glow}`}
              style={{ minWidth: '320px' }}
            >
              {/* Achievement unlocked header */}
              <motion.div
                className="text-center mb-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.span
                  className="text-sm font-bold uppercase tracking-widest text-white/80"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Achievement Unlocked!
                </motion.span>
              </motion.div>

              {/* Icon with animation */}
              <motion.div
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 10,
                  delay: 0.2
                }}
              >
                <motion.div
                  className="text-6xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  {achievement.icon}
                </motion.div>
              </motion.div>

              {/* Achievement name */}
              <motion.h2
                className="text-2xl font-bold text-white text-center mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {achievement.name}
              </motion.h2>

              {/* Description */}
              <motion.p
                className="text-white/70 text-center text-sm mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {achievement.description}
              </motion.p>

              {/* Rarity badge */}
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
              >
                <span
                  className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.text} bg-black/30 border ${colors.border}`}
                >
                  {achievement.rarity}
                </span>
              </motion.div>

              {/* Click to dismiss hint */}
              <motion.p
                className="text-white/40 text-xs text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Click anywhere to dismiss
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Click handler to dismiss early */}
          <div
            className="absolute inset-0 pointer-events-auto cursor-pointer"
            onClick={onComplete}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Queue system for multiple achievements
interface AchievementQueueProps {
  achievements: Achievement[]
  onAllComplete: () => void
}

export function AchievementQueue({ achievements, onAllComplete }: AchievementQueueProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleComplete = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onAllComplete()
    }
  }

  if (achievements.length === 0) return null

  return (
    <AchievementCelebration
      achievement={achievements[currentIndex]}
      onComplete={handleComplete}
    />
  )
}

// Hook for managing achievement celebrations
export function useAchievementCelebration() {
  const [queue, setQueue] = useState<Achievement[]>([])

  const celebrate = (achievement: Achievement) => {
    setQueue(prev => [...prev, achievement])
  }

  const celebrateMultiple = (achievements: Achievement[]) => {
    setQueue(prev => [...prev, ...achievements])
  }

  const clearQueue = () => {
    setQueue([])
  }

  return {
    queue,
    celebrate,
    celebrateMultiple,
    clearQueue,
    CelebrationComponent: () => (
      <AchievementQueue
        achievements={queue}
        onAllComplete={clearQueue}
      />
    )
  }
}
