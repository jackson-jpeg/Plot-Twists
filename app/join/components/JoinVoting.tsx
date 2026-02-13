'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'
import { successHaptic } from '@/hooks/useHaptics'

export interface JoinVotingProps {
  players: Player[]
  myPlayerId: string
  onVote: (playerId: string) => void
}

export function JoinVoting({ players, myPlayerId, onVote }: JoinVotingProps) {
  const hasVoted = players.find(p => p.id === myPlayerId)?.hasSubmittedVote

  return (
    <motion.div key="voting" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-lg">
      <div className="card">
        <h1 className="text-3xl font-display text-center mb-4" style={{ color: 'var(--color-text-primary)' }}>🏆 Vote for MVP</h1>
        <p className="text-center mb-8" style={{ color: 'var(--color-text-secondary)' }}>Who had the best performance?</p>

        {hasVoted ? (
          <motion.div className="card text-center p-8" style={{ background: 'var(--color-highlight)' }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="text-6xl mb-4">✓</div>
            <p className="text-xl font-display" style={{ color: 'var(--color-text-primary)' }}>Vote Submitted!</p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Waiting for others...</p>
          </motion.div>
        ) : (
          <div className="stack-sm">
            {players.filter(p => p.role === 'PLAYER' && p.id !== myPlayerId).map((player) => (
              <motion.button key={player.id} onClick={() => { successHaptic(); onVote(player.id) }} className="btn btn-secondary w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {player.nickname}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
