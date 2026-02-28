'use client'

import { motion } from 'framer-motion'
import type { PublicRoomListing } from '@/lib/types'

interface PublicRoomCardProps {
  room: PublicRoomListing
  index: number
  onJoin: () => void
}

const MODE_LABELS: Record<string, string> = {
  ENSEMBLE: 'Ensemble',
  HEAD_TO_HEAD: 'Head-to-Head',
  SOLO: 'Solo',
}

export function PublicRoomCard({ room, index, onJoin }: PublicRoomCardProps) {
  const spotsLeft = room.maxPlayers - room.playerCount
  const ageMinutes = Math.floor((Date.now() - room.createdAt) / 60000)
  const ageLabel = ageMinutes < 1 ? 'Just now' : `${ageMinutes}m ago`

  return (
    <motion.button
      onClick={onJoin}
      className="w-full text-left rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex items-center gap-4 hover:border-[var(--color-purple)]/50 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Mode icon */}
      <div className="text-2xl shrink-0">
        {room.gameMode === 'ENSEMBLE' ? '👥' : '⚔️'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {room.publicTitle || `${room.hostNickname}'s Game`}
          </span>
          {room.isMature && (
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
              18+
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span>{MODE_LABELS[room.gameMode] || room.gameMode}</span>
          <span>&middot;</span>
          <span>{ageLabel}</span>
        </div>
      </div>

      {/* Player count + join */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">
            {room.playerCount}/{room.maxPlayers}
          </div>
          <div className="text-[11px] text-[var(--color-text-tertiary)]">
            {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[var(--color-purple)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </motion.button>
  )
}
