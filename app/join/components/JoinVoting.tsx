'use client'

import React, { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { VARIANTS, MOTION } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { successHaptic } from '@/hooks/useHaptics'
import { CheckCircleIcon } from '@/components/GameIcons'
import { getAvatarColor } from '@/lib/avatarColors'
import { Avatar, Badge, Card, SectionHeader } from '@/components/ui'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { socketManager } from '@/lib/socketManager'

export interface JoinVotingProps {
  myPlayerId: string
  myCharacter: string | null
}

export function JoinVoting({ myPlayerId, myCharacter }: JoinVotingProps) {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const [isVoting, setIsVoting] = useState(false)

  // Store selectors
  const players = useGameStore((s) => s.players)
  const roomCode = useGameStore((s) => s.roomCode)
  const script = useScriptStore((s) => s.script)

  const myPlayer = players.find(p => p.id === myPlayerId)
  const hasVoted = myPlayer?.hasSubmittedVote
  const isSpectator = myPlayer?.role === 'SPECTATOR'
  const votablePlayers = players.filter(p => p.role === 'PLAYER' && p.id !== myPlayerId)

  const handleVote = useCallback((playerId: string) => {
    socketManager.emit('submit_vote', roomCode, playerId)
  }, [roomCode])

  return (
    <motion.div
      key="voting"
      variants={VARIANTS.spotlight}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh', padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 24px', background: 'var(--color-bg)' }}
    >
      <div className="w-full" style={{ maxWidth: isDesktop ? '720px' : '448px' }}>
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-center mb-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M20 2L25 14.5L38 16.5L28.5 25.5L31 38.5L20 32.5L9 38.5L11.5 25.5L2 16.5L15 14.5L20 2Z" fill="var(--color-accent)" />
            </svg>
          </div>
          <SectionHeader
            title="Vote for MVP"
            subtitle={script?.title ?? undefined}
            align="center"
          />
        </motion.div>

        {/* Your character reminder */}
        {myCharacter && (
          <motion.div
            className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-lg mx-auto"
            style={{ background: 'var(--color-accent-light, rgba(245, 158, 66, 0.1))', width: 'fit-content' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>You played as</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)' }}>{myCharacter}</span>
          </motion.div>
        )}

        {!myCharacter && !hasVoted && (
          <p className="text-center mb-6" style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            {isSpectator ? 'Vote for the best performer!' : 'Who had the best performance?'}
          </p>
        )}

        {votablePlayers.length === 0 && !hasVoted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card padding="lg" className="text-center">
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                No other players to vote for
              </p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
                Waiting for results...
              </p>
            </Card>
          </motion.div>
        ) : hasVoted ? (
          /* Vote submitted state */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
          <Card padding="lg" className="text-center" style={{ background: 'var(--color-highlight)' }}>
            <motion.div
              className="flex justify-center mb-4"
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
              transition={MOTION.bouncy}
            >
              <CheckCircleIcon size={56} color="var(--color-success)" />
            </motion.div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginBottom: '6px',
              }}
            >
              Vote Submitted!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Waiting for others...
            </p>
            {(() => {
              const allPlayers = players.filter(p => p.role === 'PLAYER')
              const voted = allPlayers.filter(p => p.hasSubmittedVote).length
              return (
                <>
                  <div
                    className="mx-auto rounded-full overflow-hidden"
                    style={{ height: '6px', maxWidth: '200px', background: 'var(--color-surface-alt)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: voted === allPlayers.length
                          ? 'var(--color-success)'
                          : 'var(--color-accent)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${allPlayers.length > 0 ? (voted / allPlayers.length) * 100 : 0}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs font-medium mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    {voted}/{allPlayers.length} votes in
                  </p>
                </>
              )
            })()}
          </Card>
          </motion.div>
        ) : (
          /* Player vote buttons */
          <div className={`flex ${isDesktop ? 'flex-row flex-wrap' : 'flex-col'} gap-3`}>
            {votablePlayers.map((player, i) => (
              <motion.button
                key={player.id}
                onClick={() => { if (isVoting) return; setIsVoting(true); successHaptic(); handleVote(player.id) }}
                aria-label={`Vote for ${player.nickname}`}
                className={`flex items-center gap-3 p-4 rounded-xl text-left ${isDesktop ? 'flex-1 min-w-[280px]' : 'w-full'}`}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, ...MOTION.gentle }}
                whileHover={{ scale: 1.02, borderColor: 'var(--color-accent)' }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Avatar */}
                <Avatar name={player.nickname} size="md" />

                {/* Name + character */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '16px' }}>
                      {player.nickname}
                    </span>
                    {player.level != null && (
                      <Badge variant="accent" size="sm">Lv.{player.level}</Badge>
                    )}
                  </div>
                  {player.assignedCharacter && (
                    <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                      as {player.assignedCharacter}
                    </div>
                  )}
                </div>

                {/* Vote arrow */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M7 4L13 10L7 16" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
