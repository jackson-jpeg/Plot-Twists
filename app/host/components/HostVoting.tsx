'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player, Script } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'

export interface HostVotingProps {
  players: Player[]
  script: Script | null
}

export function HostVoting({ players, script }: HostVotingProps) {
  const nonHostPlayers = players.filter(p => !p.isHost)
  const votedCount = nonHostPlayers.filter(p => p.hasSubmittedVote).length

  return (
    <motion.div key="voting" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-4xl text-center">
      <motion.h1 className="hero-title mb-8" initial={{ y: -20 }} animate={{ y: 0 }}>🗳️ Voting Time</motion.h1>

      {/* Scene Recap */}
      {script && (
        <motion.div
          className="card mb-6 text-left"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎬</span>
            <h3 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>The Scene</h3>
          </div>
          <div className="mb-3">
            <h4 className="text-lg font-bold font-display" style={{ color: 'var(--color-accent)' }}>{script.title}</h4>
            {script.synopsis && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{script.synopsis}</p>
            )}
          </div>
          {nonHostPlayers.some(p => p.assignedCharacter) && (
            <div className="flex flex-wrap gap-2">
              {nonHostPlayers.filter(p => p.assignedCharacter).map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
                >
                  <div className="player-avatar" style={{ width: '24px', height: '24px', fontSize: '11px' }}>{player.nickname[0]?.toUpperCase()}</div>
                  <span style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>as</span>
                  <span className="font-medium" style={{ color: 'var(--color-purple)' }}>{player.assignedCharacter}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display" style={{ color: 'var(--color-text-primary)' }}>Who had the best performance?</h2>
          <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{
            background: votedCount === nonHostPlayers.length ? 'var(--color-success)' : 'var(--color-surface-alt)',
            color: votedCount === nonHostPlayers.length ? 'white' : 'var(--color-text-secondary)'
          }}>
            {votedCount}/{nonHostPlayers.length} voted
          </span>
        </div>
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
                <div>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
                  {player.assignedCharacter && (
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>as {player.assignedCharacter}</div>
                  )}
                </div>
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
