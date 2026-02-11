'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'

export interface HostVotingProps {
  players: Player[]
}

export function HostVoting({ players }: HostVotingProps) {
  const nonHostPlayers = players.filter(p => !p.isHost)

  return (
    <motion.div key="voting" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-4xl text-center">
      <motion.h1 className="hero-title mb-12" initial={{ y: -20 }} animate={{ y: 0 }}>🗳️ Voting Time</motion.h1>
      <div className="card">
        <h2 className="text-2xl font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>Players are voting for MVP...</h2>
        <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>Who had the best performance?</p>
        <div className="grid gap-4 md:grid-cols-2">
          {nonHostPlayers.map((player, i) => (
            <motion.div
              key={player.id} className="card split"
              style={{
                background: player.hasSubmittedVote ? 'var(--color-highlight)' : 'var(--color-surface-alt)',
                border: player.hasSubmittedVote ? '2px solid var(--color-success)' : '1px solid var(--color-border)'
              }}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <div className="player-avatar">{player.nickname[0]?.toUpperCase()}</div>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
              </div>
              {player.hasSubmittedVote ? (
                <span className="badge badge-success">✓ Voted</span>
              ) : (
                <motion.span className="badge badge-warning" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>Voting...</motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
