'use client'

import React, { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useVotingStore } from '@/stores/votingStore'

/**
 * The visible half of Chunk 2 item 4.
 *
 * Voting has always closed itself on a timer, and the room was never told. Players saw
 * "Waiting for all players to cast their votes..." with no indication that the wait was bounded,
 * so a stalled round was indistinguishable from a broken one — and the only way to find out
 * which was to keep waiting. Showing the deadline turns a hang into a countdown.
 *
 * Driven off an ABSOLUTE server timestamp, so a client that reconnects mid-vote joins the
 * room's clock rather than starting a fresh one, and clock drift shows up as a second or two
 * rather than a full extra round.
 */
export function VotingCountdown() {
  const deadline = useVotingStore((s) => s.votingDeadline)
  const prefersReducedMotion = useReducedMotion()
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!deadline) {
      setRemaining(null)
      return
    }
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    tick()
    // 250ms rather than 1000ms: on a 1s interval the displayed number can sit up to a second
    // behind the real deadline, which reads as a stuck timer right at the moment it matters.
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [deadline])

  if (remaining === null) return null

  const urgent = remaining <= 5

  return (
    <motion.div
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '6px',
        marginTop: '10px',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        letterSpacing: '0.06em',
        color: urgent ? 'var(--color-stage-red)' : 'rgba(250, 247, 240, 0.45)',
      }}
    >
      <motion.span
        animate={urgent && !prefersReducedMotion ? { opacity: [1, 0.35, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        style={{ fontWeight: 700, fontSize: '15px' }}
      >
        {remaining}s
      </motion.span>
      <span>{remaining === 0 ? 'closing votes' : 'until votes close'}</span>
    </motion.div>
  )
}
