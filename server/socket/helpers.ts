/**
 * Shared socket handler helpers
 * Extracted from server.ts to reduce duplication
 */

import type { Server as SocketIOServer } from 'socket.io'
import type { Room, Player, ClientToServerEvents, ServerToClientEvents } from '../../lib/types'
import { isValidRoomCode } from '../utils/validation'
import { isAdminUser } from '../../lib/admin'
import * as roomService from '../services/room.service'
import { checkAndDeductCredit, getCredits } from '../services/credit.service'
import { logger } from '../../lib/logger'

const dev = process.env.NODE_ENV !== 'production'

export type SocketIOServer_ = SocketIOServer<ClientToServerEvents, ServerToClientEvents>

/** Validate room exists and return it, or emit error and return null */
export function validateRoom(roomCode: string, socket: { emit: (event: 'game_error_message', message: string) => void }): Room | null {
  if (!roomCode || !isValidRoomCode(roomCode)) {
    socket.emit('game_error_message', 'Invalid room code')
    return null
  }
  const room = roomService.getRoomFromCache(roomCode.toUpperCase())
  if (!room) {
    socket.emit('game_error_message', 'Room not found')
    return null
  }
  return room
}

/** Verify socket is a member of the room (player or host) */
export function requireRoomMember(room: Room, socket: { id: string }): boolean {
  if (room.host.socketId === socket.id) return true
  for (const player of room.players.values()) {
    if (player.socketId === socket.id) return true
  }
  return false
}

/** Verify socket is the host */
export function requireHost(room: Room, socket: { id: string }): boolean {
  return room.host.socketId === socket.id
}

/** Check if socket belongs to an admin user */
export function isAdminSocket(socket: { data: Record<string, unknown> }): boolean {
  const email = socket.data.email as string | null | undefined
  const phone = socket.data.phoneNumber as string | null | undefined
  return isAdminUser({ email, phoneNumber: phone })
}

/** Find a player in a room by their socket ID */
export function findPlayerBySocketId(room: Room, socketId: string): Player | undefined {
  for (const player of room.players.values()) {
    if (player.socketId === socketId) return player
  }
  return undefined
}

/** Find a player ID and player in a room by socket ID */
export function findPlayerEntryBySocketId(room: Room, socketId: string): { id: string; player: Player } | undefined {
  for (const [id, player] of room.players.entries()) {
    if (player.socketId === socketId) return { id, player }
  }
  return undefined
}

/**
 * Credit gate: deduct 1 credit from host before generating a script/sequel.
 * Returns true if deduction succeeded, false if blocked.
 * On failure, emits the appropriate error/insufficient_credits event.
 */
export async function deductCreditOrReject(
  room: Room,
  io: SocketIOServer_,
  fallbackState?: string
): Promise<boolean> {
  if (room.hostUid) {
    try {
      const creditResult = await checkAndDeductCredit(room.hostUid)
      if (!creditResult.success) {
        logger.info(`Insufficient credits for host ${room.hostUid} in room ${room.code}`)
        io.to(room.code).emit('insufficient_credits', { needed: 1, available: 0 })
        return false
      }
      // Emit updated balance to host
      const balance = await getCredits(room.hostUid)
      const hostSocket = io.sockets.sockets.get(room.host.socketId)
      if (hostSocket) {
        hostSocket.emit('credit_balance', balance)
      }
    } catch (creditError) {
      logger.error(`Credit check failed for host ${room.hostUid}:`, creditError)
      io.to(room.code).emit('game_error_message', 'Failed to verify credits. Please try again.')
      return false
    }
  } else if (!dev) {
    logger.warn(`Operation blocked: no hostUid for room ${room.code}`)
    io.to(room.code).emit('game_error_message', 'Authentication required to generate scripts.')
    return false
  }
  return true
}
