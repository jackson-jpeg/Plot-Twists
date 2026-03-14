'use client'

import { motion } from 'framer-motion'
import type { SavedGame } from '@/lib/types'
import { SPRING_GENTLE } from '@/lib/motion'
import { Card } from '@/components/ui'

interface ReplayCardProps {
  game: SavedGame
  index: number
  onClick: () => void
}

export function ReplayCard({ game, index, onClick }: ReplayCardProps) {
  const playerCount = game.players?.length ?? 0
  const date = new Date(game.playedAt)
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const winner = game.winner

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_GENTLE, delay: index * 0.05 }}
    >
      <Card
        variant="surface"
        padding="md"
        className="cursor-pointer"
        onClick={onClick}
        style={{
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          background: 'rgba(255,255,255,0.05)',
          borderColor: 'rgba(240,236,228,0.1)',
        }}
      >
        <div className="flex gap-3">
          {/* Poster thumbnail */}
          {game.script?.imageUrl && (
            <div
              className="flex-shrink-0 rounded-lg overflow-hidden"
              style={{ width: 64, height: 80, background: 'rgba(255,255,255,0.06)' }}
            >
              <img
                src={game.script.imageUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3
              className="font-display truncate"
              style={{ fontSize: '16px', fontWeight: 700, color: '#f0ece4', marginBottom: '4px' }}
            >
              {game.title || 'Untitled'}
            </h3>

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '13px', color: 'rgba(240,236,228,0.45)' }}>
              <span>{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{dateStr}</span>
              {game.gameMode && (
                <>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>{game.gameMode === 'SOLO' ? 'Solo' : game.gameMode === 'HEAD_TO_HEAD' ? 'H2H' : 'Ensemble'}</span>
                </>
              )}
            </div>

            {/* Winner */}
            {winner && (
              <div className="flex items-center gap-1 mt-1.5" style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--color-accent)' }}>⭐</span>
                <span style={{ color: 'rgba(240,236,228,0.7)', fontWeight: 600 }}>{winner.playerName}</span>
              </div>
            )}
          </div>

          {/* View count */}
          {game.views > 0 && (
            <div className="flex-shrink-0 text-right" style={{ fontSize: '12px', color: 'rgba(240,236,228,0.4)' }}>
              {game.views} view{game.views !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
