'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Player, Script } from '@/lib/types'
import { VARIANTS, MOTION } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { successHaptic } from '@/hooks/useHaptics'
import { CheckCircleIcon } from '@/components/GameIcons'

export interface JoinVotingProps {
  players: Player[]
  myPlayerId: string
  script: Script | null
  myCharacter: string | null
  onVote: (playerId: string) => void
}

const AVATAR_COLORS = [
  '#3B5998', '#7B3F72', '#4A6741', '#8B6914', '#2D6A6A',
  '#6B4C3B', '#4B0082', '#8B4513', '#2F4F4F', '#3B3B3B',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function JoinVoting({ players, myPlayerId, script, myCharacter, onVote }: JoinVotingProps) {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const hasVoted = players.find(p => p.id === myPlayerId)?.hasSubmittedVote
  const votablePlayers = players.filter(p => p.role === 'PLAYER' && p.id !== myPlayerId)

  return (
    <motion.div
      key="voting"
      variants={VARIANTS.spotlight}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh', padding: '24px 16px', background: 'var(--color-bg)' }}
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
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '4px',
            }}
          >
            Vote for MVP
          </h1>
          {script && (
            <p style={{ fontSize: '14px', color: 'var(--color-accent)', fontWeight: 600 }}>
              {script.title}
            </p>
          )}
        </motion.div>

        {/* Your character reminder */}
        {myCharacter && (
          <motion.div
            className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-lg mx-auto"
            style={{ background: 'var(--color-purple-bg)', width: 'fit-content' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>You played as</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-purple)' }}>{myCharacter}</span>
          </motion.div>
        )}

        {!myCharacter && !hasVoted && (
          <p className="text-center mb-6" style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            Who had the best performance?
          </p>
        )}

        {hasVoted ? (
          /* Vote submitted state */
          <motion.div
            className="text-center p-8 rounded-xl"
            style={{ background: 'var(--color-highlight)', border: '1px solid var(--color-border)' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              className="flex justify-center mb-4"
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
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
                          : 'linear-gradient(90deg, var(--color-purple), var(--color-accent))',
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
          </motion.div>
        ) : (
          /* Player vote buttons */
          <div className={`flex ${isDesktop ? 'flex-row flex-wrap' : 'flex-col'} gap-3`}>
            {votablePlayers.map((player, i) => (
              <motion.button
                key={player.id}
                onClick={() => { successHaptic(); onVote(player.id) }}
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
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: '44px',
                    height: '44px',
                    background: getAvatarColor(player.nickname),
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '18px',
                  }}
                >
                  {player.nickname[0]?.toUpperCase()}
                </div>

                {/* Name + character */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '16px' }}>
                      {player.nickname}
                    </span>
                    {player.level != null && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '999px',
                          background: 'var(--color-purple-bg)',
                          color: 'var(--color-purple)',
                        }}
                      >
                        Lv.{player.level}
                      </span>
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
