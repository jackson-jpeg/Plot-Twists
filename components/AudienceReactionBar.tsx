'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { AudienceReactionType, AudienceReaction } from '@/lib/types'

interface AudienceReactionBarProps {
  roomCode: string
  isPerforming: boolean
  isHost?: boolean
}

const REACTION_EMOJIS: Record<AudienceReactionType, string> = {
  laugh: '\u{1F602}',
  cheer: '\u{1F389}',
  gasp: '\u{1F631}',
  boo: '\u{1F44E}',
  applause: '\u{1F44F}'
}

const REACTION_LABELS: Record<AudienceReactionType, string> = {
  laugh: 'Laugh',
  cheer: 'Cheer',
  gasp: 'Gasp',
  boo: 'Boo',
  applause: 'Applause'
}

const COOLDOWN_DURATION = 2000

export function AudienceReactionBar({ roomCode, isPerforming, isHost = false }: AudienceReactionBarProps) {
  const { socket } = useSocket()
  const [reactionCounts, setReactionCounts] = useState<Record<AudienceReactionType, number>>({
    laugh: 0,
    cheer: 0,
    gasp: 0,
    boo: 0,
    applause: 0
  })
  const [floatingReactions, setFloatingReactions] = useState<AudienceReaction[]>([])
  const [cooldown, setCooldown] = useState(false)
  const [cooldownProgress, setCooldownProgress] = useState(0)
  const [burstType, setBurstType] = useState<AudienceReactionType | null>(null)
  const [bouncingCounts, setBouncingCounts] = useState<Set<AudienceReactionType>>(new Set())
  const prevCountsRef = useRef<Record<AudienceReactionType, number>>({
    laugh: 0,
    cheer: 0,
    gasp: 0,
    boo: 0,
    applause: 0
  })
  const cooldownStartRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  // Cooldown sweep animation via requestAnimationFrame
  const startCooldownSweep = useCallback(() => {
    cooldownStartRef.current = performance.now()
    setCooldownProgress(0)

    const tick = () => {
      const elapsed = performance.now() - cooldownStartRef.current
      const progress = Math.min((elapsed / COOLDOWN_DURATION) * 100, 100)
      setCooldownProgress(progress)

      if (progress < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setCooldownProgress(0)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // Cleanup raf on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Handle incoming reactions
  useEffect(() => {
    if (!socket) return

    const handleReactionReceived = (reaction: AudienceReaction) => {
      // Add to floating reactions
      setFloatingReactions(prev => [...prev.slice(-20), reaction])

      // Remove after animation
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id))
      }, 2000)
    }

    const handleReactionCounts = (counts: Record<AudienceReactionType, number>) => {
      // Detect which counts increased and trigger bounce
      const newBouncing = new Set<AudienceReactionType>()
      for (const type of Object.keys(counts) as AudienceReactionType[]) {
        if (counts[type] > prevCountsRef.current[type]) {
          newBouncing.add(type)
        }
      }

      if (newBouncing.size > 0) {
        setBouncingCounts(newBouncing)
        setTimeout(() => setBouncingCounts(new Set()), 300)
      }

      prevCountsRef.current = { ...counts }
      setReactionCounts(counts)
    }

    socket.on('audience_reaction_received', handleReactionReceived)
    socket.on('audience_reaction_counts', handleReactionCounts)

    return () => {
      socket.off('audience_reaction_received', handleReactionReceived)
      socket.off('audience_reaction_counts', handleReactionCounts)
    }
  }, [socket])

  const sendReaction = useCallback((type: AudienceReactionType) => {
    if (!socket || cooldown || !isPerforming) return

    socket.emit('send_audience_reaction', roomCode, type)

    // Burst animation
    setBurstType(type)
    setTimeout(() => setBurstType(null), 400)

    // Visual cooldown feedback
    setCooldown(true)
    startCooldownSweep()
    setTimeout(() => setCooldown(false), COOLDOWN_DURATION)

    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [socket, roomCode, cooldown, isPerforming, startCooldownSweep])

  if (!isPerforming) return null

  return (
    <div className="relative">
      {/* Floating reactions overlay (for host view) */}
      {isHost && (
        <div className="fixed top-16 right-4 w-48 sm:w-64 h-48 pointer-events-none overflow-hidden" style={{ zIndex: 'var(--z-sticky)' }}>
          <AnimatePresence>
            {floatingReactions.map(reaction => {
              const size = 32 + Math.random() * 24 // 32–56px
              const rotation = (Math.random() - 0.5) * 30 // -15 to 15 deg
              return (
                <motion.div
                  key={reaction.id}
                  initial={{ opacity: 0, scale: 0.3, y: 50, x: Math.random() * 100, rotate: rotation }}
                  animate={{ opacity: 1, scale: 1, y: -100, rotate: rotation }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 2, scale: { duration: 0.3, type: 'spring', stiffness: 400, damping: 15 } }}
                  className="absolute"
                  style={{ fontSize: `${size}px` }}
                >
                  {REACTION_EMOJIS[reaction.type]}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Reaction counts (for host view) */}
      {isHost && (
        <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-2 sm:p-3 flex gap-1.5 sm:gap-3" style={{ zIndex: 'var(--z-sticky)' }}>
          {(Object.keys(REACTION_EMOJIS) as AudienceReactionType[]).map(type => (
            <div key={type} className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl">{REACTION_EMOJIS[type]}</span>
              <span className={`reaction-count-badge ${bouncingCounts.has(type) ? 'reaction-count-bounce' : ''}`}>
                {reactionCounts[type]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reaction buttons (for audience) */}
      {!isHost && (
        <div className="fixed left-0 right-0 flex justify-center" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', zIndex: 'var(--z-sticky)' }}>
          <div className="bg-black/80 backdrop-blur-sm rounded-full px-2 sm:px-4 py-2 flex gap-1 sm:gap-2">
            {(Object.keys(REACTION_EMOJIS) as AudienceReactionType[]).map(type => (
              <button
                key={type}
                onClick={() => sendReaction(type)}
                disabled={cooldown}
                className={`reaction-btn reaction-btn-${type} ${burstType === type ? 'reaction-btn-burst' : ''} disabled:cursor-not-allowed`}
                title={REACTION_LABELS[type]}
                aria-label={`Send ${REACTION_LABELS[type]} reaction`}
              >
                {REACTION_EMOJIS[type]}
                {cooldown && (
                  <div
                    className="reaction-cooldown-sweep"
                    style={{ '--sweep-progress': `${cooldownProgress}%` } as React.CSSProperties}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
