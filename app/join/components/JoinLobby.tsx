'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { PlayerRole } from '@/lib/types'
import { ENTER_Y, SPRING_GENTLE, SPRING_BOUNCY } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { EyeIcon, CrownIcon, CheckCircleIcon } from '@/components/GameIcons'
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt'
import { AutoStartCountdown } from './AutoStartCountdown'
import { getAvatarColor } from '@/lib/avatarColors'
import { Avatar, Badge } from '@/components/ui'
import { useGameStore } from '@/stores/gameStore'
import { useSelectionStore } from '@/stores/selectionStore'

export interface JoinLobbyProps {
  myPlayerId: string
  myRole: PlayerRole
  autoStartCountdown?: number | null
}

export function JoinLobby({ myPlayerId, myRole, autoStartCountdown }: JoinLobbyProps) {
  const prefersReducedMotion = useReducedMotion()
  const isSpectator = myRole === 'SPECTATOR'
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Store selectors
  const players = useGameStore((s) => s.players)
  const selectedPackName = useSelectionStore((s) => s.selectedPackName)

  return (
    <motion.div
      key="lobby"
      {...ENTER_Y}
      exit={{ opacity: 0, y: -10 }}
      transition={SPRING_GENTLE}
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: '100dvh',
        padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 24px',
        background: `radial-gradient(ellipse 500px 200px at 50% 0%, rgba(201,162,77,0.03), transparent), var(--color-void)`,
      }}
    >
      <div className="w-full text-center" style={{ maxWidth: isDesktop ? '520px' : '448px' }}>
        {/* Success icon */}
        <motion.div
          className="flex justify-center mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...SPRING_BOUNCY, delay: 0.1 }}
        >
          {isSpectator ? (
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 64, height: 64, background: 'rgba(124, 159, 217, 0.12)' }}
            >
              <EyeIcon size={32} color="var(--color-accent-2)" />
            </div>
          ) : (
            <CheckCircleIcon size={64} color="var(--color-success)" />
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '40px',
            fontWeight: 400,
            fontStyle: 'italic',
            // Explicit theater ink: the light-mode text tokens render
            // near-black on this dark surface under a light color-scheme.
            color: isSpectator ? '#7C9FD9' : 'rgba(240,236,228,0.95)',
            marginBottom: '8px',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isSpectator ? 'Spectator Mode' : "You're In!"}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          style={{ fontSize: '16px', color: 'rgba(240,236,228,0.62)', marginBottom: '24px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isSpectator ? 'Sit back and enjoy the show! You can vote at the end.' : (
            <>Waiting for host to start<motion.span animate={prefersReducedMotion ? {} : { opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>...</motion.span></>
          )}
        </motion.p>

        {/* Card pack badge */}
        {selectedPackName && (
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: 'var(--color-ink)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{selectedPackName}</span>
          </motion.div>
        )}

        {/* Player list */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: 'var(--color-text-tertiary)',
            marginBottom: '10px',
            textAlign: 'left',
          }}>
            Cast ({players.length})
          </p>

          <div className="flex flex-wrap gap-2">
            {players.map((player, i) => {
              const isMe = player.publicId === myPlayerId
              const isHost = player.isHost
              return (
                <motion.div
                  key={player.publicId}
                  className="inline-flex items-center gap-2"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    background: 'var(--color-ink)',
                    border: isHost
                      ? '1.5px solid var(--color-stage-gold)'
                      : isMe
                        ? '1.5px solid var(--color-accent)'
                        : '1px solid rgba(255,255,255,0.10)',
                    fontSize: '14px',
                    fontWeight: 600,
                    // Explicit theater ink (the light-scheme text token
                    // rendered near-black on the ink chip).
                    color: isHost
                      ? 'var(--color-stage-gold)'
                      : 'rgba(240,236,228,0.88)',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.05, ...SPRING_GENTLE }}
                >
                  {isHost && <span style={{ fontSize: '10px' }}>&#9733;</span>}
                  {player.role === 'SPECTATOR' && <EyeIcon size={14} color="var(--color-text-tertiary)" />}
                  <span>{player.nickname}</span>
                  {isMe && (
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: 'rgba(201,162,77,0.18)',
                      color: 'var(--color-stage-gold)',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}>
                      YOU
                    </span>
                  )}
                  {player.level != null && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>Lv.{player.level}</span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Decorative dots */}
        <motion.div
          className="flex justify-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        </motion.div>

        {/* Auto-start countdown */}
        {autoStartCountdown != null && autoStartCountdown > 0 && (
          <div className="mb-4 flex justify-center">
            <AutoStartCountdown seconds={autoStartCountdown} />
          </div>
        )}

        {/* Push permission */}
        <PushPermissionPrompt />
      </div>
    </motion.div>
  )
}
