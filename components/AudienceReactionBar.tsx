'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import type { AudienceReactionType, AudienceReaction } from '@/lib/types'
import { tapHaptic } from '@/hooks/useHaptics'
import { SPRING, SPRING_BOUNCY, SPRING_GENTLE } from '@/lib/motion'

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
  applause: '\u{1F44F}',
  cringe: '\u{1F62C}',
  love: '\u{2764}\u{FE0F}',
  mindblown: '\u{1F92F}'
}

const REACTION_LABELS: Record<AudienceReactionType, string> = {
  laugh: 'Laugh',
  cheer: 'Cheer',
  gasp: 'Gasp',
  boo: 'Boo',
  applause: 'Clap',
  cringe: 'Cringe',
  love: 'Love',
  mindblown: 'Wow'
}

const COOLDOWN_DURATION = 2000

export function AudienceReactionBar({ roomCode, isPerforming, isHost = false }: AudienceReactionBarProps) {
  const { socket } = useSocket()
  const [reactionCounts, setReactionCounts] = useState<Record<AudienceReactionType, number>>({
    laugh: 0, cheer: 0, gasp: 0, boo: 0, applause: 0, cringe: 0, love: 0, mindblown: 0
  })
  const [floatingReactions, setFloatingReactions] = useState<AudienceReaction[]>([])
  const [cooldown, setCooldown] = useState(false)
  const [cooldownProgress, setCooldownProgress] = useState(0)
  const [burstType, setBurstType] = useState<AudienceReactionType | null>(null)
  const [bouncingCounts, setBouncingCounts] = useState<Set<AudienceReactionType>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const [lastReaction, setLastReaction] = useState<AudienceReactionType | null>(null)
  const prevCountsRef = useRef<Record<AudienceReactionType, number>>({
    laugh: 0, cheer: 0, gasp: 0, boo: 0, applause: 0, cringe: 0, love: 0, mindblown: 0
  })
  const cooldownStartRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (!socket) return
    const handleReactionReceived = (reaction: AudienceReaction) => {
      setFloatingReactions(prev => [...prev.slice(-20), reaction])
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id))
      }, 2000)
    }
    const handleReactionCounts = (counts: Record<AudienceReactionType, number>) => {
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
    setBurstType(type)
    setLastReaction(type)
    setMenuOpen(false)
    setTimeout(() => setBurstType(null), 400)
    setCooldown(true)
    startCooldownSweep()
    setTimeout(() => setCooldown(false), COOLDOWN_DURATION)
    tapHaptic()
    if (navigator.vibrate) navigator.vibrate(50)
  }, [socket, roomCode, cooldown, isPerforming, startCooldownSweep])

  // Close menu on tap outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [menuOpen])

  if (!isPerforming) return null

  const reactionTypes = Object.keys(REACTION_EMOJIS) as AudienceReactionType[]

  // --- HOST VIEW (unchanged: floating emojis + compact count bar) ---
  if (isHost) {
    return (
      <div className="relative">
        {/* Floating reactions overlay */}
        <div className="fixed right-4 w-48 sm:w-64 h-48 pointer-events-none overflow-hidden" style={{ top: 'calc(64px + env(safe-area-inset-top, 0px))', zIndex: 'var(--z-sticky)' }}>
          <AnimatePresence>
            {floatingReactions.map(reaction => {
              const size = 32 + Math.random() * 24
              const rotation = (Math.random() - 0.5) * 30
              return (
                <motion.div
                  key={reaction.id}
                  initial={{ opacity: 0, scale: 0.3, y: 50, x: Math.random() * 100, rotate: rotation }}
                  animate={{ opacity: 1, scale: 1, y: -100, rotate: rotation }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 2, scale: { duration: 0.3, ...SPRING_BOUNCY } }}
                  className="absolute"
                  style={{ fontSize: `${size}px` }}
                >
                  {REACTION_EMOJIS[reaction.type]}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Reaction counts badge */}
        <div className="fixed right-4 backdrop-blur-sm rounded-xl p-2 sm:p-3 flex gap-1.5 sm:gap-3" style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))', zIndex: 'var(--z-sticky)', background: 'var(--color-overlay)' }}>
          {reactionTypes.map(type => (
            <div key={type} className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl">{REACTION_EMOJIS[type]}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', minWidth: '20px', textAlign: 'center', transform: bouncingCounts.has(type) ? 'scale(1.3)' : 'scale(1)', transition: 'transform 0.3s' }}>
                {reactionCounts[type]}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- MOBILE / AUDIENCE VIEW (new FAB + popup grid) ---
  return (
    <div ref={menuRef} className="fixed" style={{ right: '16px', bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))', zIndex: 'var(--z-sticky)' }}>
      {/* Floating emojis that rise from the FAB when anyone reacts */}
      <div className="absolute bottom-16 right-0 w-16 h-32 pointer-events-none overflow-visible">
        <AnimatePresence>
          {floatingReactions.slice(-6).map(reaction => (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0.8],
                y: -80 - Math.random() * 40,
                x: (Math.random() - 0.5) * 40,
              }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute bottom-0 right-2 pointer-events-none"
              style={{ fontSize: '28px' }}
            >
              {REACTION_EMOJIS[reaction.type]}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction popup grid */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop blur for focus */}
            <motion.div
              className="fixed inset-0"
              style={{ zIndex: -1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />

            {/* Popup card */}
            <motion.div
              className="absolute bottom-16 right-0 rounded-2xl p-3 overflow-hidden"
              style={{
                background: 'rgba(30, 28, 25, 0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05)',
              }}
              initial={{ opacity: 0, scale: 0.8, y: 10, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={SPRING}
            >
              <div className="grid grid-cols-4 gap-2">
                {reactionTypes.map((type, i) => (
                  <motion.button
                    key={type}
                    onClick={() => sendReaction(type)}
                    disabled={cooldown}
                    className="flex flex-col items-center gap-1 rounded-xl p-2 active:scale-90 transition-transform disabled:opacity-40"
                    style={{
                      background: burstType === type ? 'rgba(255,255,255,0.15)' : 'transparent',
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, ...SPRING_GENTLE }}
                    aria-label={`Send ${REACTION_LABELS[type]} reaction`}
                  >
                    <span className="text-3xl leading-none select-none">{REACTION_EMOJIS[type]}</span>
                    <span className="text-[11px] font-medium leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {REACTION_LABELS[type]}
                    </span>
                  </motion.button>
                ))}
              </div>

              {cooldown && (
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${cooldownProgress}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB trigger button */}
      <motion.button
        onClick={() => setMenuOpen(prev => !prev)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: menuOpen
            ? 'rgba(245, 158, 66, 0.9)'
            : 'rgba(30, 28, 25, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: menuOpen
            ? '2px solid rgba(245, 158, 66, 0.6)'
            : '2px solid rgba(255, 255, 255, 0.12)',
          boxShadow: menuOpen
            ? '0 4px 20px rgba(245, 158, 66, 0.3)'
            : '0 4px 16px rgba(0, 0, 0, 0.3)',
        }}
        whileTap={{ scale: 0.9 }}
        animate={burstType ? { scale: [1, 1.2, 1] } : {}}
        transition={SPRING}
        aria-label={menuOpen ? 'Close reactions' : 'Open reactions'}
      >
        <span className="text-2xl select-none leading-none">
          {lastReaction ? REACTION_EMOJIS[lastReaction] : '\u{26A1}'}
        </span>

        {/* Cooldown ring around FAB */}
        {cooldown && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 56 56"
          >
            <circle
              cx="28"
              cy="28"
              r="25"
              fill="none"
              stroke="rgba(245, 158, 66, 0.6)"
              strokeWidth="3"
              strokeDasharray={`${(cooldownProgress / 100) * 157} 157`}
              strokeLinecap="round"
            />
          </svg>
        )}
      </motion.button>
    </div>
  )
}
