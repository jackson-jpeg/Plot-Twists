'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Player, PlayerRole } from '@/lib/types'
import { VARIANTS, MOTION } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { EyeIcon, CrownIcon, CheckCircleIcon } from '@/components/GameIcons'
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt'
import { AutoStartCountdown } from '@/app/play/components/AutoStartCountdown'

export interface JoinLobbyProps {
  players: Player[]
  myPlayerId: string
  myRole: PlayerRole
  selectedPackName: string | null
  autoStartCountdown?: number | null
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

export function JoinLobby({ players, myPlayerId, myRole, selectedPackName, autoStartCountdown }: JoinLobbyProps) {
  const prefersReducedMotion = useReducedMotion()
  const isSpectator = myRole === 'SPECTATOR'
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  return (
    <motion.div
      key="lobby"
      variants={VARIANTS.pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh', padding: '24px 16px', background: 'var(--color-bg)' }}
    >
      <div className="w-full text-center" style={{ maxWidth: isDesktop ? '520px' : '448px' }}>
        {/* Success icon */}
        <motion.div
          className="flex justify-center mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
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
            <>Waiting for host to start<motion.span animate={prefersReducedMotion ? {} : { opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>...</motion.span></>
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
                    background: isMe ? 'rgba(245, 158, 66, 0.06)' : 'var(--color-surface-alt)',
                    border: isMe ? '1.5px solid var(--color-accent)' : '1px solid transparent',
                  }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05, ...MOTION.gentle }}
                >
                  {/* Avatar */}
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{
                      width: '36px',
                      height: '36px',
                      background: getAvatarColor(player.nickname),
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '15px',
                    }}
                  >
                    {player.nickname[0]?.toUpperCase()}
                  </div>

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
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'rgba(245, 158, 66, 0.12)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        YOU
                      </span>
                    )}
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

                  {/* Role indicator */}
                  {player.isHost && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#8B5CF6',
                    }}>
                      HOST
                    </span>
                  )}
                  {player.role === 'SPECTATOR' && <EyeIcon size={16} color="var(--color-text-tertiary)" />}
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
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-border)' }} />
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
