'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { AdminRoomInfo } from '@/lib/types'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'
import { useState, useCallback } from 'react'

interface AdminRoomsProps {
  rooms: AdminRoomInfo[]
  socket: Socket<ServerToClientEvents, ClientToServerEvents>
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
  onRefresh: () => void
}

const STATE_COLORS: Record<string, string> = {
  LOBBY: 'var(--color-accent)',
  SELECTION: 'var(--color-purple)',
  LOADING: 'var(--color-warning)',
  PERFORMING: 'var(--color-success)',
  VOTING: 'var(--color-pink)',
  RESULTS: 'var(--color-emerald)',
}

const STATE_ICONS: Record<string, string> = {
  LOBBY: '🚪',
  SELECTION: '🃏',
  LOADING: '⏳',
  PERFORMING: '🎭',
  VOTING: '🗳️',
  RESULTS: '🏆',
}

function formatRelativeTime(timestamp: number): string {
  const secs = Math.floor((Date.now() - timestamp) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export function AdminRooms({ rooms, socket, onToast, onRefresh }: AdminRoomsProps) {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
  const [kickingPlayer, setKickingPlayer] = useState<string | null>(null)
  const [closingRoom, setClosingRoom] = useState<string | null>(null)
  const [confirmClose, setConfirmClose] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleKick = useCallback((roomCode: string, playerId: string, playerName: string) => {
    setKickingPlayer(playerId)
    socket.emit('admin_kick_player', roomCode, playerId, (response) => {
      setKickingPlayer(null)
      if (response.success) {
        onToast(`Kicked ${playerName}`, 'success')
        onRefresh()
      } else {
        onToast(response.error || 'Failed to kick player', 'error')
      }
    })
  }, [socket, onToast, onRefresh])

  const handleCloseRoom = useCallback((roomCode: string) => {
    setClosingRoom(roomCode)
    socket.emit('admin_close_room', roomCode, (response) => {
      setClosingRoom(null)
      setConfirmClose(null)
      if (response.success) {
        onToast(`Room ${roomCode} closed`, 'success')
        onRefresh()
      } else {
        onToast(response.error || 'Failed to close room', 'error')
      }
    })
  }, [socket, onToast, onRefresh])

  const copyRoomCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }, [])

  if (rooms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
      >
        <p className="text-4xl mb-3">🏠</p>
        <p className="text-[var(--color-text-secondary)] font-display font-semibold mb-1">No active rooms</p>
        <p className="text-xs text-[var(--color-text-disabled)]">Rooms will appear here when players create them</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-1 mb-1 text-xs text-[var(--color-text-disabled)]">
        <span>{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{rooms.reduce((sum, r) => sum + r.playerCount + r.spectatorCount, 0)} total users</span>
      </div>

      {rooms.map((room, i) => {
        const isExpanded = expandedRoom === room.code
        const totalOccupants = room.playerCount + room.spectatorCount
        return (
          <motion.div
            key={room.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm"
          >
            {/* Room header row */}
            <button
              onClick={() => setExpandedRoom(isExpanded ? null : room.code)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{STATE_ICONS[room.gameState] || '❓'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-base text-[var(--color-text-primary)]">{room.code}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${STATE_COLORS[room.gameState] || 'var(--color-text-tertiary)'} 15%, transparent)`,
                        color: STATE_COLORS[room.gameState] || 'var(--color-text-tertiary)',
                      }}
                    >
                      {room.gameState}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--color-text-disabled)] uppercase">{room.gameMode}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                    <span>Host: {room.hostNickname}</span>
                    {room.scriptTitle && <span className="truncate max-w-[200px]">"{room.scriptTitle}"</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {/* Occupant count pill */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-surface-alt)] text-xs">
                  <span className="font-semibold text-[var(--color-text-primary)]">{totalOccupants}</span>
                  <span className="text-[var(--color-text-disabled)]">
                    {totalOccupants === 1 ? 'user' : 'users'}
                  </span>
                </div>
                {/* Age */}
                {room.createdAt && (
                  <span className="text-[10px] text-[var(--color-text-disabled)] hidden sm:inline">
                    {formatRelativeTime(room.createdAt)}
                  </span>
                )}
                <motion.span
                  className="text-sm text-[var(--color-text-disabled)]"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.span>
              </div>
            </button>

            {/* Expanded detail */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="border-t border-[var(--color-border)] p-4">
                    {/* Room meta */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      <div className="text-xs">
                        <span className="text-[var(--color-text-disabled)]">Players</span>
                        <p className="font-semibold text-[var(--color-text-primary)]">{room.playerCount}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-[var(--color-text-disabled)]">Spectators</span>
                        <p className="font-semibold text-[var(--color-text-primary)]">{room.spectatorCount}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-[var(--color-text-disabled)]">Mode</span>
                        <p className="font-semibold text-[var(--color-text-primary)]">{room.gameMode}</p>
                      </div>
                      {room.createdAt && (
                        <div className="text-xs">
                          <span className="text-[var(--color-text-disabled)]">Created</span>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {new Date(room.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Player list with kick */}
                    {room.players.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                          Players in Room
                        </h4>
                        <div className="space-y-1">
                          {room.players.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-surface-alt)]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm">{player.isHost ? '👑' : player.role === 'SPECTATOR' ? '👁' : '🎭'}</span>
                                <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{player.nickname}</span>
                                <span className="text-[10px] text-[var(--color-text-disabled)] uppercase">{player.role}</span>
                              </div>
                              {!player.isHost && (
                                <motion.button
                                  onClick={() => handleKick(room.code, player.id, player.nickname)}
                                  disabled={kickingPlayer === player.id}
                                  className="text-[11px] font-medium px-2 py-1 rounded-md transition-colors shrink-0"
                                  style={{
                                    color: 'var(--color-danger)',
                                    backgroundColor: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {kickingPlayer === player.id ? 'Kicking...' : 'Kick'}
                                </motion.button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Room actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                      {/* Copy room code */}
                      <motion.button
                        onClick={() => copyRoomCode(room.code)}
                        className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {copiedCode === room.code ? '✓ Copied' : '📋 Copy Code'}
                      </motion.button>

                      <div className="flex-1" />

                      {/* Close room */}
                      {confirmClose === room.code ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[var(--color-danger)] font-medium">Close room?</span>
                          <motion.button
                            onClick={() => handleCloseRoom(room.code)}
                            disabled={closingRoom === room.code}
                            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg text-white transition-colors"
                            style={{ backgroundColor: 'var(--color-danger)' }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {closingRoom === room.code ? 'Closing...' : 'Confirm'}
                          </motion.button>
                          <motion.button
                            onClick={() => setConfirmClose(null)}
                            className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
                            whileTap={{ scale: 0.97 }}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button
                          onClick={() => setConfirmClose(room.code)}
                          className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            color: 'var(--color-danger)',
                            backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
                          }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Close Room
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
