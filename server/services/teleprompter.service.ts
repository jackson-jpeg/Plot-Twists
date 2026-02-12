/**
 * Teleprompter Sync Service
 * Manages auto-advancing teleprompter lines with smart timing.
 */

import type { Server as SocketIOServer } from 'socket.io'
import type { Room } from '../../lib/types'
import { calculateLineDisplayTime } from '../utils/timing'
import * as roomService from './room.service'
import { logger } from '../../lib/logger'

/**
 * Start auto-advancing the teleprompter for a room.
 * Uses smart timing based on line length, punctuation, and mood.
 */
export function startTeleprompterSync(room: Room, io: SocketIOServer): void {
  if (!room.script) return

  // Calculate reading time for each line individually using smart timing
  const advanceLine = (lineIndex: number) => {
    // Check if paused
    if (room.isPaused) {
      logger.debug(`Teleprompter paused for room ${room.code}`)
      return
    }

    if (!room.script || lineIndex >= room.script.lines.length - 1) {
      // Clear timeout reference
      roomService.clearRoomTimeout(room.code)

      // Move to voting or results
      if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
        room.gameState = 'VOTING'
        io.to(room.code).emit('game_state_change', 'VOTING')
      } else {
        room.gameState = 'RESULTS'
        io.to(room.code).emit('game_state_change', 'RESULTS')
      }
      return
    }

    // Calculate time using smart timing (punctuation, mood, etc.)
    const currentLine = room.script.lines[lineIndex]
    const readingTimeMs = calculateLineDisplayTime(currentLine)

    // Schedule next line advance based on current line's reading time
    const timeout = setTimeout(() => {
      if (!room.script) return
      room.currentLineIndex++
      // Emit with timestamp for client sync
      io.to(room.code).emit('sync_teleprompter', {
        lineIndex: room.currentLineIndex,
        serverTimestamp: Date.now(),
        expectedDuration: room.script.lines[room.currentLineIndex]
          ? calculateLineDisplayTime(room.script.lines[room.currentLineIndex])
          : undefined
      })
      advanceLine(room.currentLineIndex)
    }, readingTimeMs)

    // Store timeout reference for this room
    roomService.setRoomTimeout(room.code, timeout)
  }

  // Start with the first line (index 0)
  advanceLine(0)
}
