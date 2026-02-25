'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Player, PlayerRole } from '@/lib/types'
import { VARIANTS } from '@/lib/animations'
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt'

export interface JoinLobbyProps {
  players: Player[]
  myRole: PlayerRole
  selectedPackName: string | null
}

export function JoinLobby({ players, myRole, selectedPackName }: JoinLobbyProps) {
  return (
    <motion.div key="lobby" variants={VARIANTS.pageTransition} initial="initial" animate="animate" exit="exit" className="container max-w-lg text-center">
      <div className="card">
        <div className="text-6xl mb-6">{myRole === 'SPECTATOR' ? '👁️' : '🎉'}</div>
        <h1 className="text-4xl font-display mb-4" style={{ color: 'var(--color-success)' }}>
          {myRole === 'SPECTATOR' ? 'Spectator Mode' : "You're In!"}
        </h1>
        <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          {myRole === 'SPECTATOR' ? 'Sit back and enjoy the show! You can vote at the end.' : 'Waiting for game to start...'}
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
          {players.map((player) => (
            <div key={player.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-surface-alt)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold" style={{ background: 'var(--color-accent)', color: 'white' }}>
                {player.nickname[0]?.toUpperCase()}
              </div>
              <span className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                {player.nickname}
                {player.isHost && '👑'}
                {player.role === 'SPECTATOR' && <span title="Spectator">👁️</span>}
              </span>
            </div>
          ))}
        </div>
        <PushPermissionPrompt />
      </div>
    </motion.div>
  )
}
