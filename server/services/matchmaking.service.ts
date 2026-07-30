/**
 * Matchmaking Service — Public rooms and Quick Play
 */

import { dealCards } from './cardCatalog.service'
import type { Server as SocketIOServer } from 'socket.io'
import type {
  Room,
  GameMode,
  PublicRoomListing,
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../lib/types'
import * as roomService from './room.service'
import { MAX_PLAYERS, MIN_PLAYERS } from '../utils/constants'
import { logger } from '../../lib/logger'

// Socket.IO room name for public room watchers
const PUBLIC_ROOMS_CHANNEL = 'public_rooms_watchers'

// Auto-start thresholds per mode. This used to be a second, local copy of the floor; it is now an
// alias for the shared one, so a change to the seat range cannot land in the lobby and silently
// miss matchmaking.
const AUTO_START_THRESHOLD: Record<GameMode, number> = MIN_PLAYERS

// Active countdowns
const activeCountdowns = new Map<string, NodeJS.Timeout>()

/**
 * Get public rooms available to join (in LOBBY state, not full)
 */
export function getPublicRooms(filters?: { gameMode?: GameMode; isMature?: boolean }): PublicRoomListing[] {
  const rooms = roomService.getActiveRooms()
  const listings: PublicRoomListing[] = []

  for (const room of rooms) {
    if (!room.isPublic) continue
    if (room.gameState !== 'LOBBY') continue

    const playerCount = Array.from(room.players.values()).filter(p => p.role === 'PLAYER').length
    const maxPlayers = MAX_PLAYERS[room.gameMode]
    if (playerCount >= maxPlayers) continue

    // Apply filters
    if (filters?.gameMode && room.gameMode !== filters.gameMode) continue
    if (filters?.isMature !== undefined && room.isMature !== filters.isMature) continue

    listings.push({
      code: room.code,
      hostNickname: room.host.nickname,
      gameMode: room.gameMode,
      playerCount,
      maxPlayers,
      isMature: room.isMature,
      publicTitle: room.publicTitle,
      cardPackName: room.cardPackId,
      createdAt: room.createdAt,
    })
  }

  // Sort by newest first
  return listings.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Find an existing public room matching criteria, or return null
 */
export function findMatchingRoom(gameMode: GameMode, isMature: boolean): Room | null {
  const rooms = roomService.getActiveRooms()

  for (const room of rooms) {
    if (!room.isPublic) continue
    if (room.gameState !== 'LOBBY') continue
    if (room.gameMode !== gameMode) continue
    if (room.isMature !== isMature) continue

    const playerCount = Array.from(room.players.values()).filter(p => p.role === 'PLAYER').length
    const maxPlayers = MAX_PLAYERS[room.gameMode]
    if (playerCount >= maxPlayers) continue

    return room
  }

  return null
}

/**
 * Check if a room should auto-start based on player count
 */
export function checkAutoStart(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  if (!room.isPublic || !room.autoStart) return
  if (room.gameState !== 'LOBBY') return

  const playerCount = Array.from(room.players.values()).filter(p => p.role === 'PLAYER').length
  const threshold = AUTO_START_THRESHOLD[room.gameMode]

  if (playerCount >= threshold && !activeCountdowns.has(room.code)) {
    startAutoCountdown(room, io)
  }
}

export function getRequiredPlayersForMode(gameMode: GameMode): number {
  return AUTO_START_THRESHOLD[gameMode]
}

export function syncAutoStart(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  if (!room.isPublic || !room.autoStart || room.gameState !== 'LOBBY') return

  const playerCount = Array.from(room.players.values()).filter(p => p.role === 'PLAYER' && !p.isHost).length
  const threshold = AUTO_START_THRESHOLD[room.gameMode]

  if (playerCount >= threshold) {
    checkAutoStart(room, io)
    return
  }

  if (activeCountdowns.has(room.code)) {
    cancelAutoCountdown(room.code)
    io.to(room.code).emit('auto_start_countdown', 0)
  }
}

/**
 * Start a 30-second auto-start countdown
 */
function startAutoCountdown(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  let seconds = 30

  logger.info(`[Matchmaking] Auto-start countdown started for room ${room.code}`)

  const interval = setInterval(() => {
    seconds--
    io.to(room.code).emit('auto_start_countdown', seconds)

    if (seconds <= 0) {
      clearInterval(interval)
      activeCountdowns.delete(room.code)

      // Trigger start_game logic
      if (room.gameState === 'LOBBY') {
        room.gameState = 'SELECTION'
        room.lastActivity = Date.now()
        roomService.updateRoom(room)
        io.to(room.code).emit('game_state_change', 'SELECTION')

        dealCards(room)
          .then((cards) => io.to(room.code).emit('available_cards', cards))
          .catch((err) => logger.error(`[Matchmaking] Failed to deal cards for room ${room.code}:`, err))

        logger.info(`[Matchmaking] Auto-started game in room ${room.code}`)
      }
    }
  }, 1000)

  activeCountdowns.set(room.code, interval)
}

/**
 * Cancel an active countdown (e.g., if players leave)
 */
export function cancelAutoCountdown(roomCode: string): void {
  const interval = activeCountdowns.get(roomCode)
  if (interval) {
    clearInterval(interval)
    activeCountdowns.delete(roomCode)
    logger.info(`[Matchmaking] Cancelled auto-start for room ${roomCode}`)
  }
}

/**
 * Broadcast updated public rooms to all watchers
 */
export function broadcastPublicRooms(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  const rooms = getPublicRooms()
  io.to(PUBLIC_ROOMS_CHANNEL).emit('public_rooms_update', rooms)
}

/**
 * Subscribe a socket to public room updates
 */
export function subscribeToPublicRooms(socket: { join: (room: string) => void }): void {
  socket.join(PUBLIC_ROOMS_CHANNEL)
}

/**
 * Unsubscribe a socket from public room updates
 */
export function unsubscribeFromPublicRooms(socket: { leave: (room: string) => void }): void {
  socket.leave(PUBLIC_ROOMS_CHANNEL)
}

/**
 * Clean up countdowns for a room (on room deletion)
 */
export function cleanupRoom(roomCode: string): void {
  cancelAutoCountdown(roomCode)
}
