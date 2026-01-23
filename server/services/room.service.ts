import type { Room } from '../../lib/types'
import { ROOM_CODE_LENGTH, ROOM_CODE_CHARS, ROOM_CLEANUP_INTERVAL, ROOM_INACTIVITY_TIMEOUT } from '../utils/constants'

/**
 * In-memory room storage
 * TODO: Replace with Redis for persistence in production
 */
export const rooms = new Map<string, Room>()

/**
 * Generate a unique 4-letter room code
 */
export function generateRoomCode(): string {
  let code = ''
  do {
    code = ''
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length))
    }
  } while (rooms.has(code))
  return code
}

/**
 * Get room by code
 */
export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase())
}

/**
 * Update room last activity timestamp
 */
export function updateRoomActivity(room: Room): void {
  room.lastActivity = Date.now()
}

/**
 * Delete room
 */
export function deleteRoom(code: string): boolean {
  return rooms.delete(code)
}

/**
 * Start cleanup interval for inactive rooms
 */
export function startRoomCleanup(): void {
  setInterval(() => {
    const now = Date.now()
    let cleanedCount = 0

    for (const [code, room] of rooms.entries()) {
      if (now - room.lastActivity > ROOM_INACTIVITY_TIMEOUT) {
        console.log(`🧹 Cleaning up inactive room: ${code}`)
        rooms.delete(code)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive room(s)`)
    }
  }, ROOM_CLEANUP_INTERVAL)

  console.log('✓ Room cleanup service started')
}

/**
 * Get active room count
 */
export function getActiveRoomCount(): number {
  return rooms.size
}

/**
 * Get total player count across all rooms
 */
export function getTotalPlayerCount(): number {
  let count = 0
  for (const room of rooms.values()) {
    count += room.players.size
  }
  return count
}
