/**
 * Teleprompter Sync Service
 * Manages auto-advancing teleprompter lines with smart timing.
 */

import type { Server as SocketIOServer } from 'socket.io'
import type { Room } from '../../lib/types'
import { calculateLineDisplayTime } from '../utils/timing'
import { VOTING_TIMEOUT } from '../utils/constants'
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

        // Set voting timeout — auto-calculate results if not all players vote in time
        // This prevents the game from getting stuck if a player disconnects mid-vote
        const votingTimeout = setTimeout(() => {
          if (room.gameState !== 'VOTING') return // Already resolved
          logger.info(`Voting timeout reached for room ${room.code}, auto-calculating results`)
          // Dynamic import to avoid circular dependency
          import('./voting.service').then(({ calculateResults }) => {
            calculateResults(room, io)
          }).catch(err => logger.error(`Voting timeout error for room ${room.code}:`, err))
        }, VOTING_TIMEOUT)
        votingTimeout.unref()
        roomService.setRoomTimeout(room.code, votingTimeout)
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

  // Start from the room's current line (supports resume after pause/reconnect)
  advanceLine(room.currentLineIndex)
}
