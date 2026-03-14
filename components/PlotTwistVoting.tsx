'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SPRING_GENTLE, SPRING_BOUNCY, STAGGER } from '@/lib/motion'
import { useSocket } from '@/contexts/SocketContext'
import type { PlotTwistOption } from '@/lib/types'
import { tapHaptic, successHaptic } from '@/hooks/useHaptics'

interface PlotTwistVotingProps {
  roomCode: string
  isHost?: boolean
}

// Circular countdown timer component
function CircularTimer({ timeRemaining, totalTime }: { timeRemaining: number, totalTime: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = timeRemaining / totalTime
  const strokeDashoffset = circumference * (1 - progress)

  // Color shifts from purple to red as time runs out
  const getTimerColor = () => {
    if (timeRemaining <= 3) return 'var(--color-danger)'
    if (timeRemaining <= 5) return 'var(--color-warning)'
    if (timeRemaining <= 8) return 'var(--color-gold)'
    return 'var(--color-purple)'
  }

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke={getTimerColor()}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          animate={{
            strokeDashoffset,
            stroke: getTimerColor()
          }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      {/* Pulsing number in center */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={timeRemaining <= 5 ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ duration: 0.5, repeat: timeRemaining <= 5 ? Infinity : 0 }}
      >
        <span
          className="text-3xl font-bold transition-colors duration-300"
          style={{ color: getTimerColor() }}
        >
          {timeRemaining}
        </span>
      </motion.div>
    </div>
  )
}

// Explosion particle effect
function ExplosionParticles({ show }: { show: boolean }) {
  if (!show) return null

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * 360,
    distance: 100 + Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.2
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `linear-gradient(135deg, var(--color-purple), var(--color-pink))`,
          }}
          initial={{ x: -particle.size / 2, y: -particle.size / 2, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance - particle.size / 2,
            y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance - particle.size / 2,
            opacity: 0,
            scale: 0.5,
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  )
}

export function PlotTwistVoting({ roomCode, isHost = false }: PlotTwistVotingProps) {
  const { socket } = useSocket()
  const [isActive, setIsActive] = useState(false)
  const [options, setOptions] = useState<PlotTwistOption[]>([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(15)
  const [hasVoted, setHasVoted] = useState(false)
  const [winningTwist, setWinningTwist] = useState<string | null>(null)
  const [showParticles, setShowParticles] = useState(false)
  const [screenShake, setScreenShake] = useState(false)

  // Haptic feedback helper
  const triggerHaptic = useCallback((pattern: number[]) => {
    successHaptic()
    if (navigator.vibrate) navigator.vibrate(pattern)
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleTwistStarted = (twist: { id: string, options: PlotTwistOption[], expiresAt: number }) => {
      const duration = Math.ceil((twist.expiresAt - Date.now()) / 1000)
      setOptions(twist.options)
      setTimeRemaining(duration)
      setTotalTime(duration)
      setIsActive(true)
      setHasVoted(false)
      setWinningTwist(null)

      // Dramatic haptic on twist start
      triggerHaptic([100, 50, 100, 50, 200])
    }

    const handleVoteUpdate = (optionId: string, newCount: number) => {
      setOptions(prev => prev.map(o =>
        o.id === optionId ? { ...o, votes: newCount } : o
      ))
    }

    const handleTwistResult = (twist: string) => {
      setWinningTwist(twist)
      setIsActive(false)
      setShowParticles(true)
      setScreenShake(true)

      // Strong haptic on reveal
      triggerHaptic([200, 100, 200])

      // Reset shake after animation
      setTimeout(() => setScreenShake(false), 500)

      // Clear particles and result after showing
      setTimeout(() => {
        setShowParticles(false)
      }, 1000)

      setTimeout(() => {
        setWinningTwist(null)
        setOptions([])
      }, 5000)
    }

    socket.on('plot_twist_started', handleTwistStarted)
    socket.on('plot_twist_vote_update', handleVoteUpdate)
    socket.on('plot_twist_result', handleTwistResult)

    return () => {
      socket.off('plot_twist_started', handleTwistStarted)
      socket.off('plot_twist_vote_update', handleVoteUpdate)
      socket.off('plot_twist_result', handleTwistResult)
    }
  }, [socket, triggerHaptic])

  // Countdown timer with haptic feedback
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        // Haptic pulse for final 5 seconds
        if (prev <= 6 && prev > 1) {
          triggerHaptic([50])
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, timeRemaining, triggerHaptic])

  const startPlotTwist = () => {
    if (!socket || !isHost) return
    socket.emit('start_plot_twist', roomCode)

    // Dramatic haptic when triggering
    triggerHaptic([100, 50, 100, 50, 200])
  }

  const voteTwist = (optionId: string) => {
    if (!socket || hasVoted) return
    socket.emit('vote_plot_twist', roomCode, optionId)
    setHasVoted(true)

    // Vote confirmation haptic
    triggerHaptic([50, 50, 50])
  }

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0)

  return (
    <>
      {/* Voting UI */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 'var(--z-modal)' }}
          >
            <motion.div
              className="rounded-2xl p-6 max-w-md w-full"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={SPRING_GENTLE}
            >
              <div className="text-center mb-6">
                <motion.h2
                  className="text-3xl font-black text-transparent bg-clip-text mb-2"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--color-purple), var(--color-pink))' }}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  PLOT TWIST!
                </motion.h2>
                <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>Vote for chaos!</p>

                {/* Circular countdown timer */}
                <CircularTimer timeRemaining={timeRemaining} totalTime={totalTime} />
              </div>

              <div className="space-y-3">
                {options.map((option, index) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => voteTwist(option.id)}
                      disabled={hasVoted}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * STAGGER }}
                      whileHover={!hasVoted ? { scale: 1.02, x: 4 } : {}}
                      whileTap={!hasVoted ? { scale: 0.98 } : {}}
                      className={`w-full p-4 rounded-xl text-left relative overflow-hidden transition-all ${
                        hasVoted
                          ? 'cursor-default'
                          : 'cursor-pointer border-2 border-transparent'
                      }`}
                      style={{
                        background: 'var(--color-surface-alt)',
                        ...(hasVoted ? {} : { borderColor: 'transparent' }),
                      }}
                      onPointerDown={e => { if (!hasVoted) (e.currentTarget.style.borderColor = 'var(--color-purple-border)') }}
                      onPointerUp={e => { if (!hasVoted) (e.currentTarget.style.borderColor = 'transparent') }}
                      onPointerLeave={e => { if (!hasVoted) (e.currentTarget.style.borderColor = 'transparent') }}
                    >
                      {/* Vote progress bar */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="absolute inset-y-0 left-0"
                        style={{ background: 'linear-gradient(to right, var(--color-purple-bg), var(--color-pink-bg))' }}
                        transition={SPRING_BOUNCY}
                      />

                      <div className="relative z-10 flex justify-between items-center">
                        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{option.text}</span>
                        <span className="font-bold ml-2 min-w-[2ch] text-right" style={{ color: 'var(--color-purple)' }}>
                          {option.votes}
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {hasVoted && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-4"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Vote recorded! Waiting for results...
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winning Twist Announcement with dramatic reveal */}
      <AnimatePresence>
        {winningTwist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 'var(--z-modal)' }}
          >
            {/* Explosion particles */}
            <ExplosionParticles show={showParticles} />

            <motion.div
              className="rounded-2xl p-5 sm:p-8 max-w-md w-full text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(to right, var(--color-purple-dark), var(--color-pink-dark))' }}
              initial={{ scale: 0, rotate: -10 }}
              animate={{
                scale: 1,
                rotate: 0,
                x: screenShake ? [0, -10, 10, -10, 10, 0] : 0,
              }}
              transition={{
                scale: SPRING_GENTLE,
                rotate: SPRING_GENTLE,
                x: { duration: 0.5 }
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...SPRING_GENTLE, delay: 0.2 }}
                className="text-6xl mb-4"
              >
                🎭
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-white mb-4"
              >
                PLOT TWIST!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, ...SPRING_GENTLE }}
                className="text-white text-xl font-medium"
              >
                {winningTwist}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
