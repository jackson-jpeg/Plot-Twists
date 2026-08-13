'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SPRING, SPRING_GENTLE, STAGGER } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Avatar } from '@/components/ui'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { VotingCountdown } from '@/components/VotingCountdown'

export function HostVoting() {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  const players = useGameStore((s) => s.players)
  const script = useScriptStore((s) => s.script)

  const nonHostPlayers = players.filter(p => !p.isHost)
  const votedCount = nonHostPlayers.filter(p => p.hasSubmittedVote).length

  return (
    <motion.div
      key="voting"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={SPRING_GENTLE}
      className="w-full mx-auto px-5"
      style={{
        maxWidth: isDesktop ? '900px' : '100%',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--color-void)',
        minHeight: '100vh',
        paddingTop: '40px',
      }}
    >
      {/* Heading */}
      <motion.div
        className="mb-8 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <p
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--color-stage-gold)',
            marginBottom: '12px',
          }}
        >
          The house votes
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: isDesktop ? '40px' : '32px',
            letterSpacing: '-0.015em',
            lineHeight: 1.05,
            color: 'rgba(240,236,228,0.95)',
            marginBottom: '14px',
          }}
        >
          Who stole the show?
        </h1>

        {/* Vote count badge */}
        <motion.span
          aria-live="polite"
          aria-atomic="true"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 600,
            background: votedCount === nonHostPlayers.length
              ? 'var(--color-stage-red)'
              : 'rgba(250, 247, 240, 0.12)',
            color: 'var(--color-cream)',
            border: '1px solid rgba(250, 247, 240, 0.2)',
            letterSpacing: '0.02em',
          }}
        >
          {votedCount}/{nonHostPlayers.length} voted
        </motion.span>

        <div><VotingCountdown /></div>
      </motion.div>

      {/* Scene Recap */}
      {script && (
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'rgba(240,236,228,0.6)',
            }}
          >
            {script.title}
          </p>
        </motion.div>
      )}

      {/* Ballot slips grid */}
      <div className={`grid gap-4 ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {nonHostPlayers.map((player, i) => (
          <motion.div
            key={player.publicId}
            className="flex items-center justify-between p-4 rounded-sm"
            style={{
              background: 'var(--color-cream)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
              position: 'relative',
            }}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, rotateY: -90 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, rotateY: 0 }}
            transition={{ delay: i * STAGGER, ...SPRING_GENTLE }}
          >
            {/* Left: avatar + name */}
            <div className="flex items-center gap-3">
              <Avatar
                name={player.nickname}
                size="md"
                // Ink monogram on the paper slip — the surface's accents are
                // gold (chrome) and stamp red; the store-orange gradient was
                // a third voice (Avatar accepts style overrides).
                style={{
                  background: '#1a1812',
                  color: 'var(--color-cream)',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 400,
                }}
              />
              <div>
                <span
                  className="font-semibold"
                  style={{ color: '#1a1812', fontSize: '15px', display: 'block' }}
                >
                  {player.nickname}
                </span>
                {player.assignedCharacter && (
                  <div style={{ fontSize: '12px', color: '#6b6455' }}>{player.assignedCharacter}</div>
                )}
              </div>
            </div>

            {/* Right: vote status circle / check */}
            {player.hasSubmittedVote ? (
              <motion.div
                aria-label="Voted"
                initial={prefersReducedMotion ? { opacity: 0 } : { scale: 1.6, rotate: 4, opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, rotate: -7, opacity: 1 }}
                transition={{ ...SPRING, delay: 0.1 }}
                style={{
                  fontFamily: 'var(--font-code)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-stage-red)',
                  border: '2px solid var(--color-stage-red)',
                  borderRadius: '3px',
                  padding: '3px 7px',
                  flexShrink: 0,
                  opacity: 0.9,
                }}
              >
                Voted
              </motion.div>
            ) : (
              <motion.div
                aria-label="Still deciding"
                animate={
                  prefersReducedMotion
                    ? {}
                    : { borderColor: ['#cfc6b4', '#a89f8d', '#cfc6b4'] }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontFamily: 'var(--font-code)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#6f6759',
                  border: '2px dashed #cfc6b4',
                  borderRadius: '3px',
                  padding: '3px 7px',
                  flexShrink: 0,
                }}
              >
                · · ·
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom hint */}
      <motion.p
        className="text-center mt-8"
        style={{
          color: 'rgba(240,236,228,0.6)',
          fontSize: '14px',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        The house is still deciding.
      </motion.p>
    </motion.div>
  )
}
