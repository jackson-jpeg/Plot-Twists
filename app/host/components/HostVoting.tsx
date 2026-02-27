'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Player, Script } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'
import { CheckCircleIcon, SpinnerIcon } from '@/components/GameIcons'

export interface HostVotingProps {
  players: Player[]
  script: Script | null
}

export function HostVoting({ players, script }: HostVotingProps) {
  const prefersReducedMotion = useReducedMotion()
  const nonHostPlayers = players.filter(p => !p.isHost)
  const votedCount = nonHostPlayers.filter(p => p.hasSubmittedVote).length

  return (
    <motion.div key="voting" variants={VARIANTS.spotlight} initial="initial" animate="animate" exit="exit" className="w-full max-w-4xl mx-auto px-5">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h1
            className="text-3xl sm:text-4xl font-display font-bold"
            style={{ color: 'var(--color-text-primary)' }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Vote for MVP
          </motion.h1>
          <motion.p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-tertiary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Who stole the show?
          </motion.p>
        </div>
        <motion.span
          className="text-sm font-semibold px-3 py-1.5 rounded-full shrink-0"
          style={{
            background: votedCount === nonHostPlayers.length ? 'var(--color-success)' : 'var(--color-surface-alt)',
            color: votedCount === nonHostPlayers.length ? 'white' : 'var(--color-text-secondary)'
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {votedCount}/{nonHostPlayers.length} voted
        </motion.span>
      </div>

      {/* Scene Recap */}
      {script && (
        <motion.div
          className="mb-6 p-4 rounded-lg"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <div>
              <h4 className="text-lg font-bold font-display" style={{ color: 'var(--color-accent)' }}>{script.title}</h4>
              {script.synopsis && (
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{script.synopsis}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Player cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {nonHostPlayers.map((player, i) => (
          <motion.div
            key={player.id}
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: player.hasSubmittedVote ? 'rgba(245, 158, 66, 0.06)' : 'var(--color-surface-alt)',
              border: player.hasSubmittedVote ? '2px solid var(--color-accent)' : '1px solid var(--color-border)'
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full font-display font-bold shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  fontSize: '18px',
                  background: player.hasSubmittedVote ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: player.hasSubmittedVote ? 'white' : 'var(--color-text-primary)',
                  border: player.hasSubmittedVote ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {player.nickname[0]?.toUpperCase()}
              </div>
              <div>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
                {player.assignedCharacter && (
                  <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{player.assignedCharacter}</div>
                )}
              </div>
            </div>
            {player.hasSubmittedVote ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                <CheckCircleIcon size={24} color="var(--color-accent)" />
              </motion.div>
            ) : (
              <motion.div animate={prefersReducedMotion ? {} : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <SpinnerIcon size={20} color="var(--color-text-tertiary)" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom hint */}
      <motion.p
        className="text-center text-xs mt-6"
        style={{ color: 'var(--color-text-tertiary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Waiting for all players to cast their votes...
      </motion.p>
    </motion.div>
  )
}
