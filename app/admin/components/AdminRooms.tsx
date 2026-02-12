'use client'

import { motion } from 'framer-motion'
import type { AdminRoomInfo } from '@/lib/types'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'
import { useState } from 'react'

interface AdminRoomsProps {
  rooms: AdminRoomInfo[]
  socket: Socket<ServerToClientEvents, ClientToServerEvents>
}

const STATE_COLORS: Record<string, string> = {
  LOBBY: 'var(--color-accent)',
  SELECTION: 'var(--color-purple)',
  LOADING: 'var(--color-warning)',
  PERFORMING: 'var(--color-success)',
  VOTING: 'var(--color-pink)',
  RESULTS: 'var(--color-emerald)',
}

export function AdminRooms({ rooms, socket }: AdminRoomsProps) {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
  const [kickingPlayer, setKickingPlayer] = useState<string | null>(null)

  const handleKick = (roomCode: string, playerId: string) => {
    setKickingPlayer(playerId)
    socket.emit('admin_kick_player', roomCode, playerId, (response) => {
      setKickingPlayer(null)
      if (!response.success) {
        alert(response.error || 'Failed to kick player')
      }
    })
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🏠</p>
        <p className="text-[var(--color-text-secondary)] font-handwritten">No active rooms</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rooms.map((room, i) => (
        <motion.div
          key={room.code}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
        >
          <button
            onClick={() => setExpandedRoom(expandedRoom === room.code ? null : room.code)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-lg text-[var(--color-text-primary)]">{room.code}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${STATE_COLORS[room.gameState] || 'var(--color-text-tertiary)'} 15%, transparent)`,
                  color: STATE_COLORS[room.gameState] || 'var(--color-text-tertiary)',
                }}
              >
                {room.gameState}
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">{room.gameMode}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
              <span>{room.playerCount} player{room.playerCount !== 1 ? 's' : ''}</span>
              {room.spectatorCount > 0 && (
                <span className="text-xs text-[var(--color-text-tertiary)]">+{room.spectatorCount} spectator{room.spectatorCount !== 1 ? 's' : ''}</span>
              )}
              <span className="text-lg text-[var(--color-text-tertiary)]">{expandedRoom === room.code ? '−' : '+'}</span>
            </div>
          </button>

          {expandedRoom === room.code && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="border-t border-[var(--color-border)] p-4"
            >
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-[var(--color-text-tertiary)]">Host:</span>{' '}
                  <span className="text-[var(--color-text-primary)] font-medium">{room.hostNickname}</span>
                </div>
                {room.createdAt && (
                  <div>
                    <span className="text-[var(--color-text-tertiary)]">Created:</span>{' '}
                    <span className="text-[var(--color-text-primary)]">
                      {new Date(room.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] italic">
                Kick actions available when viewing full room state (connect to room for player list)
              </p>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
