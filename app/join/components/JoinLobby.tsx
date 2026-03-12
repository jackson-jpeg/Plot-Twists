'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { PlayerRole } from '@/lib/types'
import { SPRING_GENTLE, SPRING_BOUNCY, STAGGER } from '@/lib/motion'
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={SPRING_GENTLE}
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: '100dvh',
        padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 24px',
        background: 'radial-gradient(circle at top, rgba(255,79,184,0.18), transparent 24%), radial-gradient(circle at 85% 20%, rgba(63,124,255,0.16), transparent 22%), var(--gradient-page)',
      }}
    >
      <div
        className="w-full text-center rounded-[30px] border px-5 py-6"
        style={{
          maxWidth: isDesktop ? '560px' : '448px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,245,236,0.88) 100%)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-3)',
        }}
      >
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
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 700,
            color: isSpectator ? 'var(--color-accent-2)' : 'var(--color-success)',
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
          style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isSpectator ? 'Sit back and enjoy the show! You can vote at the end.' : (
            <>Backstage doors are open<motion.span animate={prefersReducedMotion ? {} : { opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>...</motion.span></>
          )}
        </motion.p>

        {/* Card pack badge */}
        {selectedPackName && (
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'var(--color-highlight)', border: '1px solid var(--color-border)' }}
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
            Players ({players.length})
          </p>

          <div className="flex flex-col gap-2">
            {players.map((player, i) => {
              const isMe = player.id === myPlayerId
              return (
                <motion.div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: isMe ? 'rgba(255, 90, 54, 0.08)' : 'rgba(255,255,255,0.62)',
                    border: isMe ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                    boxShadow: isMe ? '0 16px 36px rgba(255, 90, 54, 0.14)' : 'none',
                  }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * STAGGER, ...SPRING_GENTLE }}
                >
                  {/* Avatar */}
                  <Avatar name={player.nickname} size="sm" highlighted={isMe} />

                  {/* Name + badges */}
                  <div className="flex items-center gap-2 flex-1">
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '15px',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {player.nickname}
                    </span>
                    {isMe && (
                      <Badge variant="accent" size="sm">YOU</Badge>
                    )}
                    {player.level != null && (
                      <Badge variant="accent" size="sm">Lv.{player.level}</Badge>
                    )}
                  </div>

                  {/* Role indicator */}
                  {player.isHost && (
                    <Badge variant="accent" size="sm">HOST</Badge>
                  )}
                  {player.role === 'SPECTATOR' && <EyeIcon size={16} color="var(--color-text-tertiary)" />}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          className="mb-6 rounded-[22px] border px-4 py-4 text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, #2c0714 0%, #1a0f31 100%)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.52)' }}>
            Backstage note
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: 'white' }}>
            When the host starts, your phone turns into your cue card and teleprompter.
          </p>
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
