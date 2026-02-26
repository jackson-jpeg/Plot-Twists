'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player, PlayerRole } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt'
import { AutoStartCountdown } from '@/app/play/components/AutoStartCountdown'

export interface JoinLobbyProps {
  players: Player[]
  myPlayerId: string
  myRole: PlayerRole
  selectedPackName: string | null
  autoStartCountdown?: number | null
}

export function JoinLobby({ players, myPlayerId, myRole, selectedPackName, autoStartCountdown }: JoinLobbyProps) {
  return (
    <motion.div key="lobby" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
      <div className="card">
        <div className="text-6xl mb-6">{myRole === 'SPECTATOR' ? '👁️' : '🎉'}</div>
        <h1 className="text-4xl font-display mb-4" style={{ color: 'var(--color-success)' }}>
          {myRole === 'SPECTATOR' ? 'Spectator Mode' : "You're In!"}
        </h1>
        <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          {myRole === 'SPECTATOR' ? 'Sit back and enjoy the show! You can vote at the end.' : (
            <>Waiting for host to start<motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>...</motion.span></>
          )}
        </p>
        {selectedPackName && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'var(--color-highlight)', border: '1px solid var(--color-border)' }}>
            <span>📦</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{selectedPackName}</span>
          </motion.div>
        )}
        <div className="stack-sm">
          {players.map((player) => {
            const isMe = player.id === myPlayerId
            return (
            <div key={player.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: isMe ? 'var(--color-highlight)' : 'var(--color-surface-alt)', border: isMe ? '1px solid var(--color-accent)' : '1px solid transparent' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold" style={{ background: isMe ? 'var(--color-purple)' : 'var(--color-accent)', color: 'white' }}>
                {player.nickname[0]?.toUpperCase()}
              </div>
              <span className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                {player.nickname}
                {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-purple-bg)', color: 'var(--color-purple)' }}>You</span>}
                {player.level != null && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-purple-bg)', color: 'var(--color-purple)' }}>
                    Lv.{player.level}
                  </span>
                )}
                {player.isHost && '👑'}
                {player.role === 'SPECTATOR' && <span title="Spectator">👁️</span>}
              </span>
            </div>
            )
          })}
        </div>
        {autoStartCountdown != null && autoStartCountdown > 0 && (
          <div className="mt-4 flex justify-center">
            <AutoStartCountdown seconds={autoStartCountdown} />
          </div>
        )}
        <PushPermissionPrompt />
      </div>
    </motion.div>
  )
}
