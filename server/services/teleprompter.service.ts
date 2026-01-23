import type { Server as SocketIOServer } from 'socket.io'
import type { Room, ServerToClientEvents, ClientToServerEvents } from '../../lib/types'
import { WORDS_PER_MINUTE } from '../utils/constants'

// Track teleprompter timeouts per room
const roomTimeouts = new Map<string, NodeJS.Timeout>()

/**
 * Start synchronized teleprompter for a room
 */
export function startTeleprompterSync(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  if (!room.script) {
    console.warn(`Cannot start teleprompter: no script for room ${room.code}`)
    return
  }

  console.log(`📜 Starting teleprompter for room ${room.code}`)

  const advanceLine = (lineIndex: number) => {
    // Check if paused
    if (room.isPaused) {
      console.log(`⏸️  Teleprompter paused for room ${room.code}`)
      return
    }

    // Check if we've reached the end
    if (!room.script || lineIndex >= room.script.lines.length - 1) {
      clearRoomTimeout(room.code)

      // Move to voting or results
      if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
        room.gameState = 'VOTING'
        io.to(room.code).emit('game_state_change', 'VOTING')
        console.log(`🗳️  Room ${room.code} moved to VOTING`)
      } else {
        room.gameState = 'RESULTS'
        io.to(room.code).emit('game_state_change', 'RESULTS')
        console.log(`🏁 Room ${room.code} moved to RESULTS`)
      }
      return
    }

    // Calculate reading time for current line
    const currentLine = room.script.lines[lineIndex]
    const wordCount = currentLine.text.split(' ').length
    const readingTimeMs = (wordCount / WORDS_PER_MINUTE) * 60 * 1000

    // Schedule next line
    const timeout = setTimeout(() => {
      if (!room.script) return

      room.currentLineIndex++
      io.to(room.code).emit('sync_teleprompter', room.currentLineIndex)
      advanceLine(room.currentLineIndex)
    }, readingTimeMs)

    // Store timeout reference
    roomTimeouts.set(room.code, timeout)
  }

  // Start from line 0
  advanceLine(0)
}

/**
 * Resume teleprompter from current line
 */
export function resumeTeleprompter(
  room: Room,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  if (!room.script) {
    console.warn(`Cannot resume teleprompter: no script for room ${room.code}`)
    return
  }

  room.isPaused = false
  console.log(`▶️  Teleprompter resumed for room ${room.code}`)

  const advanceLine = (lineIndex: number) => {
    if (room.isPaused) return

    if (!room.script || lineIndex >= room.script.lines.length - 1) {
      clearRoomTimeout(room.code)

      if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
        room.gameState = 'VOTING'
        io.to(room.code).emit('game_state_change', 'VOTING')
      } else {
        room.gameState = 'RESULTS'
        io.to(room.code).emit('game_state_change', 'RESULTS')
      }
      return
    }

    const currentLine = room.script.lines[lineIndex]
    const wordCount = currentLine.text.split(' ').length
    const readingTimeMs = (wordCount / WORDS_PER_MINUTE) * 60 * 1000

    const timeout = setTimeout(() => {
      if (!room.script) return
      room.currentLineIndex++
      io.to(room.code).emit('sync_teleprompter', room.currentLineIndex)
      advanceLine(room.currentLineIndex)
    }, readingTimeMs)

    roomTimeouts.set(room.code, timeout)
  }

  advanceLine(room.currentLineIndex)
}

/**
 * Pause teleprompter
 */
export function pauseTeleprompter(room: Room): void {
  room.isPaused = true
  clearRoomTimeout(room.code)
  console.log(`⏸️  Script paused for room ${room.code}`)
}

/**
 * Jump to specific line in teleprompter
 */
export function jumpToLine(
  room: Room,
  lineIndex: number,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  if (!room.script) {
    console.warn(`Cannot jump: no script for room ${room.code}`)
    return
  }

  if (lineIndex < 0 || lineIndex >= room.script.lines.length) {
    console.warn(`Invalid line index ${lineIndex} for room ${room.code}`)
    return
  }

  // Clear existing timeout
  clearRoomTimeout(room.code)

  // Update line index
  room.currentLineIndex = lineIndex

  // Broadcast new line to all clients
  io.to(room.code).emit('sync_teleprompter', room.currentLineIndex)

  console.log(`⏭️  Jumped to line ${lineIndex} in room ${room.code}`)

  // If not paused, restart timer for new line
  if (!room.isPaused) {
    resumeTeleprompter(room, io)
  }
}

/**
 * Clear timeout for a room
 */
export function clearRoomTimeout(roomCode: string): void {
  const timeout = roomTimeouts.get(roomCode)
  if (timeout) {
    clearTimeout(timeout)
    roomTimeouts.delete(roomCode)
  }
}

/**
 * Cleanup all timeouts (for graceful shutdown)
 */
export function cleanupAllTimeouts(): void {
  for (const timeout of roomTimeouts.values()) {
    clearTimeout(timeout)
  }
  roomTimeouts.clear()
  console.log('✓ All teleprompter timeouts cleared')
}
