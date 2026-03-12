// server/handlers/selection.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { validateCardSelection } from '../utils/validation'
import { getFilteredContent } from '@/lib/content'
import { requireHost } from '../socket/helpers'
import { notifyGameStarting } from '../services/notification.service'
import { startScriptGeneration } from './game.helpers'
import * as roomService from '../services/room.service'
import { getRequiredPlayersForMode } from '../services/matchmaking.service'
import { logger } from '@/lib/logger'

export function registerSelectionHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Submit card selections
  socket.on('submit_cards', withErrorHandler(socket, 'submit_cards', (roomCode, selections, callback) => {
    try {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }

      // Only allow submissions during SELECTION phase
      if (room.gameState !== 'SELECTION') {
        callback({ success: false, error: 'Card selection is not active' })
        return
      }

      // Validate and sanitize card selections
      const validatedSelections = validateCardSelection(selections)
      if (!validatedSelections) {
        callback({ success: false, error: 'Invalid card selections' })
        return
      }

      // Find player by socket ID
      let playerId: string | undefined
      let playerRole: string | undefined
      for (const [id, player] of room.players.entries()) {
        if (player.socketId === socket.id) {
          playerId = id
          playerRole = player.role
          break
        }
      }

      if (!playerId) {
        callback({ success: false, error: 'Player not found' })
        return
      }

      // Only players (not spectators) can submit card selections
      if (playerRole === 'SPECTATOR') {
        callback({ success: false, error: 'Spectators cannot submit card selections' })
        return
      }

      room.selections.set(playerId, validatedSelections)
      const player = room.players.get(playerId)
      if (player) {
        player.hasSubmittedSelection = true
      }
      room.lastActivity = Date.now()
      roomService.updateRoom(room)

      io.to(roomCode).emit('players_update', Array.from(room.players.values()))

      logger.debug(`Player ${playerId} submitted selections for room ${roomCode}`)
      callback({ success: true })

      // Solo mode: Start immediately when the host (as player) submits
      if (room.gameMode === 'SOLO') {
        const hostPlayer = room.players.get(playerId)
        if (hostPlayer && hostPlayer.isHost && hostPlayer.hasSubmittedSelection) {
          startScriptGeneration(room, io).catch(err => logger.error(`Script generation error in room ${room.code}:`, err))
        }
        return
      }

      // Ensemble/Head-to-Head: Check if all players have submitted (exclude spectators)
      const allSubmitted = Array.from(room.players.values())
        .filter(p => p.role === 'PLAYER')
        .every(p => p.hasSubmittedSelection)

      if (allSubmitted && room.players.size > 1) {
        startScriptGeneration(room, io).catch(err => logger.error(`Script generation error in room ${room.code}:`, err))
      }
    } catch (error) {
      logger.error('Error submitting cards:', error)
      callback({ success: false, error: 'Failed to submit selections' })
    }
  }))

  // Start game
  socket.on('start_game', withErrorHandler(socket, 'start_game', (roomCode) => {
    const room = roomService.getRoomFromCache(roomCode)
    if (!room) return
    if (!requireHost(room, socket)) return

    if (room.gameState !== 'LOBBY') {
      socket.emit('error', 'Game can only be started from the lobby')
      return
    }

    const activePlayers = Array.from(room.players.values()).filter((player) =>
      room.gameMode === 'SOLO' ? player.isHost : (player.role === 'PLAYER' && !player.isHost)
    )
    const requiredPlayers = getRequiredPlayersForMode(room.gameMode)
    if (activePlayers.length < requiredPlayers) {
      socket.emit('error', `Need at least ${requiredPlayers} player${requiredPlayers === 1 ? '' : 's'} to start ${room.gameMode.toLowerCase().replaceAll('_', '-')}`)
      return
    }

    room.gameState = 'SELECTION'
    room.lastActivity = Date.now()
    roomService.updateRoom(room)
    io.to(roomCode).emit('game_state_change', 'SELECTION')

    // Notify players that the game has started
    notifyGameStarting(room).catch(() => {})

    // Send available cards to all players
    const content = getFilteredContent(room.isMature)
    io.to(roomCode).emit('available_cards', content)
  }))
}
