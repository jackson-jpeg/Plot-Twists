'use client'

import React, { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SPRING_GENTLE, SPRING_BOUNCY, STAGGER } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { successHaptic } from '@/hooks/useHaptics'
import { Avatar, Badge } from '@/components/ui'
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  // Store selectors
  const players = useGameStore((s) => s.players)
  const roomCode = useGameStore((s) => s.roomCode)
  const script = useScriptStore((s) => s.script)

  const myPlayer = players.find(p => p.publicId === myPlayerId)
  const hasVoted = myPlayer?.hasSubmittedVote
  const isSpectator = myPlayer?.role === 'SPECTATOR'
  const votablePlayers = players.filter(p => p.role === 'PLAYER' && p.publicId !== myPlayerId)

  const handleVote = useCallback((playerId: string) => {
    socketManager.emit('submit_vote', roomCode, playerId)
  }, [roomCode])

  const handleSelectAndSubmit = (playerId: string) => {
    if (isVoting) return
    setSelectedPlayerId(playerId)
    setIsVoting(true)
    successHaptic()
    handleVote(playerId)
  }

  return (
    <motion.div
      key="voting"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={SPRING_GENTLE}
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: '100dvh',
        padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 24px',
        background: 'var(--color-void)',
      }}
    >
      <div className="w-full" style={{ maxWidth: isDesktop ? '720px' : '448px' }}>

        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '26px',
              color: 'var(--color-cream)',
              marginBottom: '6px',
            }}
          >
            Who stole the show?
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(250, 247, 240, 0.45)',
              letterSpacing: '0.04em',
            }}
          >
            {isSpectator ? 'Cast your vote' : (myCharacter ? `You played as ${myCharacter}` : 'Cast your vote')}
          </p>
          {script?.title && (
            <p
              style={{
                fontSize: '12px',
                color: 'rgba(250, 247, 240, 0.3)',
                marginTop: '4px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.03em',
              }}
            >
              {script.title}
            </p>
          )}
        </motion.div>

        {votablePlayers.length === 0 && !hasVoted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'var(--color-cream)',
              borderRadius: '4px',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1812' }}>
              No other players to vote for
            </p>
            <p style={{ fontSize: '14px', color: '#6b6455', marginTop: '6px' }}>
              Waiting for results...
            </p>
          </motion.div>

        ) : hasVoted ? (
          /* Vote submitted state */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div
              style={{
                background: 'var(--color-cream)',
                borderRadius: '4px',
                padding: '36px 24px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {/* Check mark */}
              <motion.div
                className="flex justify-center mb-4"
                initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
                transition={SPRING_BOUNCY}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--color-stage-red)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden="true">
                    <path d="M2 10L9.5 17.5L24 2" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>

              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '20px',
                  color: '#1a1812',
                  marginBottom: '6px',
                }}
              >
                Your ballot has been cast
              </p>
              <p style={{ fontSize: '13px', color: '#6b6455', marginBottom: '20px' }}>
                Waiting for others...
              </p>

              {/* Progress bar */}
              {(() => {
                const allPlayers = players.filter(p => p.role === 'PLAYER')
                const voted = allPlayers.filter(p => p.hasSubmittedVote).length
                return (
                  <>
                    <div
                      className="mx-auto rounded-full overflow-hidden"
                      style={{ height: '5px', maxWidth: '200px', background: '#e0d8cc' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: voted === allPlayers.length
                            ? 'var(--color-stage-red)'
                            : '#9e9080',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${allPlayers.length > 0 ? (voted / allPlayers.length) * 100 : 0}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <p style={{ fontSize: '12px', color: '#9e9080', marginTop: '8px' }}>
                      {voted}/{allPlayers.length} votes in
                    </p>
                  </>
                )
              })()}
            </div>
          </motion.div>

        ) : (
          /* Ballot slips — one per votable player */
          <div className={`flex ${isDesktop ? 'flex-row flex-wrap' : 'flex-col'} gap-3`}>
            {votablePlayers.map((player, i) => {
              const isSelected = selectedPlayerId === player.publicId
              return (
                <motion.button
                  key={player.publicId}
                  onClick={() => handleSelectAndSubmit(player.publicId)}
                  aria-label={`Vote for ${player.nickname}`}
                  className={`flex items-center gap-3 p-4 text-left ${isDesktop ? 'flex-1 min-w-[280px]' : 'w-full'}`}
                  style={{
                    background: 'var(--color-cream)',
                    borderRadius: '4px',
                    border: isSelected
                      ? '2px solid var(--color-stage-red)'
                      : '2px solid transparent',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                    transform: isSelected ? 'translateX(8px)' : 'translateX(0)',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * STAGGER, ...SPRING_GENTLE }}
                  whileHover={!prefersReducedMotion ? { x: 4 } : undefined}
                  whileTap={!prefersReducedMotion ? { scale: 0.98 } : undefined}
                >
                  {/* Avatar */}
                  <Avatar name={player.nickname} size="md" />

                  {/* Name + character */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontWeight: 700, color: '#1a1812', fontSize: '16px' }}>
                        {player.nickname}
                      </span>
                      {player.level != null && (
                        <Badge variant="accent" size="sm">Lv.{player.level}</Badge>
                      )}
                    </div>
                    {player.assignedCharacter && (
                      <div style={{ fontSize: '13px', color: '#6b6455', marginTop: '2px' }}>
                        as {player.assignedCharacter}
                      </div>
                    )}
                  </div>

                  {/* Vote circle — empty by default, fills red when selected */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isSelected ? 'var(--color-stage-red)' : 'transparent',
                      border: isSelected ? '2px solid var(--color-stage-red)' : '2px solid #c8bfaf',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    {isSelected && (
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
                        <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </motion.button>
              )
            })}

            {/* Submit button (shown once a player is selected) */}
            {selectedPlayerId && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_GENTLE}
              >
                <button
                  onClick={() => {}}
                  disabled
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '4px',
                    background: 'var(--color-stage-red)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'default',
                    letterSpacing: '0.02em',
                  }}
                >
                  Cast Vote
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
