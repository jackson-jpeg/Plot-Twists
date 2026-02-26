'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player, Script } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'
import { successHaptic } from '@/hooks/useHaptics'

export interface JoinVotingProps {
  players: Player[]
  myPlayerId: string
  script: Script | null
  myCharacter: string | null
  onVote: (playerId: string) => void
}

export function JoinVoting({ players, myPlayerId, script, myCharacter, onVote }: JoinVotingProps) {
  const hasVoted = players.find(p => p.id === myPlayerId)?.hasSubmittedVote
  const votablePlayers = players.filter(p => p.role === 'PLAYER' && p.id !== myPlayerId)

  return (
    <motion.div key="voting" variants={VARIANTS.spotlight} initial="initial" animate="animate" exit="exit" className="container max-w-lg">
      <div className="card">
        <h1 className="text-3xl font-display text-center mb-2" style={{ color: 'var(--color-text-primary)' }}>🏆 Vote for MVP</h1>

        {/* Script title recap */}
        {script && (
          <p className="text-center text-sm mb-1 font-medium" style={{ color: 'var(--color-accent)' }}>
            {script.title}
          </p>
        )}

        {/* Your character reminder */}
        {myCharacter && (
          <motion.div
            className="text-center mb-4 px-3 py-2 rounded-lg mx-auto"
            style={{ background: 'var(--color-purple-bg)', maxWidth: 'fit-content' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>You played as </span>
            <span className="text-xs font-bold" style={{ color: 'var(--color-purple)' }}>{myCharacter}</span>
          </motion.div>
        )}

        {!myCharacter && <p className="text-center mb-6" style={{ color: 'var(--color-text-secondary)' }}>Who had the best performance?</p>}

        {hasVoted ? (
          <motion.div className="card text-center p-8" style={{ background: 'var(--color-highlight)' }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <motion.div className="text-6xl mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>✅</motion.div>
            <p className="text-xl font-display" style={{ color: 'var(--color-text-primary)' }}>Vote Submitted!</p>
            <p className="text-sm mt-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>Waiting for others...</p>
            {(() => {
              const allPlayers = players.filter(p => p.role === 'PLAYER')
              const voted = allPlayers.filter(p => p.hasSubmittedVote).length
              return (
                <>
                  <div className="h-1.5 rounded-full mb-2 overflow-hidden mx-auto" style={{ background: 'var(--color-surface-alt)', maxWidth: '200px' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: voted === allPlayers.length ? 'var(--color-success)' : 'linear-gradient(90deg, var(--color-purple), var(--color-accent))' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${allPlayers.length > 0 ? (voted / allPlayers.length) * 100 : 0}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    {voted}/{allPlayers.length} votes in
                  </p>
                </>
              )
            })()}
          </motion.div>
        ) : (
          <div className="stack-sm">
            {votablePlayers.map((player, i) => (
              <motion.button
                key={player.id}
                onClick={() => { successHaptic(); onVote(player.id) }}
                className="w-full p-4 rounded-xl text-left flex items-center gap-3 cursor-pointer transition-colors"
                style={{
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
                }}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                whileHover={{ scale: 1.02, borderColor: 'var(--color-purple)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="player-avatar">{player.nickname[0]?.toUpperCase()}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
                    {player.level != null && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-purple-bg)', color: 'var(--color-purple)' }}>
                        Lv.{player.level}
                      </span>
                    )}
                  </div>
                  {player.assignedCharacter && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>as {player.assignedCharacter}</div>
                  )}
                </div>
                <span className="text-lg">🗳️</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
