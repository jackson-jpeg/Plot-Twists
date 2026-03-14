'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SPRING, SPRING_GENTLE, STAGGER } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SpinnerIcon } from '@/components/GameIcons'
import { Avatar } from '@/components/ui'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'

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
      exit={{ opacity: 0 }}
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
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '28px',
            color: 'var(--color-cream)',
            marginBottom: '6px',
          }}
        >
          Who stole the show?
        </p>

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
              fontSize: '15px',
              fontWeight: 600,
              color: 'rgba(250, 247, 240, 0.5)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
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
            key={player.id}
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
              <Avatar name={player.nickname} size="md" highlighted={player.hasSubmittedVote} />
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
                initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, rotate: -180 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                transition={{ ...SPRING, delay: 0.15 }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--color-stage-red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {/* White check mark */}
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
                  <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                animate={prefersReducedMotion ? {} : { opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '2px solid #c8bfaf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SpinnerIcon size={14} color="#c8bfaf" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom hint */}
      <motion.p
        className="text-center mt-8"
        style={{
          color: 'rgba(250, 247, 240, 0.35)',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Waiting for all players to cast their votes...
      </motion.p>
    </motion.div>
  )
}
