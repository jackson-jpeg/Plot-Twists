'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { VARIANTS, MOTION, STAGGER } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { CheckCircleIcon, SpinnerIcon } from '@/components/GameIcons'
import { Avatar, Badge, SectionHeader, Card } from '@/components/ui'
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
      variants={VARIANTS.spotlight}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full mx-auto px-5"
      style={{ maxWidth: isDesktop ? '900px' : '100%', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Top bar */}
      <motion.div
        className="mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <SectionHeader
          title="Vote for MVP"
          subtitle="Who stole the show?"
          align="left"
          badge={
            <motion.span
              aria-live="polite"
              aria-atomic="true"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Badge variant={votedCount === nonHostPlayers.length ? 'success' : 'default'} size="md"
                style={votedCount === nonHostPlayers.length ? { background: 'var(--color-success)', color: 'white' } : undefined}
              >
                {votedCount}/{nonHostPlayers.length} voted
              </Badge>
            </motion.span>
          }
        />
      </motion.div>

      {/* Scene Recap */}
      {script && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card style={{ background: 'var(--color-surface-alt)' }}>
            <h4 className="font-bold font-display" style={{ fontSize: '18px', color: 'var(--color-accent)' }}>{script.title}</h4>
            {script.synopsis && (
              <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>{script.synopsis}</p>
            )}
          </Card>
        </motion.div>
      )}

      {/* Player cards with card-flip animation */}
      <div className={`grid gap-4 ${isDesktop ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {nonHostPlayers.map((player, i) => (
          <motion.div
            key={player.id}
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: player.hasSubmittedVote ? 'rgba(245, 158, 66, 0.06)' : 'var(--color-surface-alt)',
              border: player.hasSubmittedVote ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
            }}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, rotateY: -90 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, rotateY: 0 }}
            transition={{ delay: i * STAGGER.slow, ...MOTION.gentle }}
          >
            <div className="flex items-center gap-3">
              <Avatar name={player.nickname} size="md" highlighted={player.hasSubmittedVote} />
              <div>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
                {player.assignedCharacter && (
                  <div style={{ fontSize: 'var(--text-label)', color: 'var(--color-text-tertiary)' }}>{player.assignedCharacter}</div>
                )}
              </div>
            </div>
            {player.hasSubmittedVote ? (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, rotate: -180 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                transition={{ ...MOTION.bouncy, delay: 0.15 }}
              >
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
        className="text-center mt-6"
        style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-caption)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Waiting for all players to cast their votes...
      </motion.p>
    </motion.div>
  )
}
