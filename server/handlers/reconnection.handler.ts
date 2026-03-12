// server/handlers/reconnection.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import * as roomService from '../services/room.service'
import { logger } from '@/lib/logger'

export function registerReconnectionHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  socket.on('rejoin_room', withErrorHandler(socket, 'rejoin_room', async (roomCode: string, playerSessionId: string, callback) => {
    if (!roomCode || !playerSessionId) {
      callback({ success: false, error: 'Missing roomCode or playerSessionId' })
      return
    }

    const upperCode = roomCode.toUpperCase()
    const room = roomService.getRoomFromCache(upperCode)
    if (!room) {
      callback({ success: false, error: 'Room not found' })
      return
    }

    // Find player by stable client session first, then legacy userId fallback.
    const found = roomService.findPlayerInRoomBySessionId(upperCode, playerSessionId)
      ?? roomService.findPlayerInRoomByUserId(upperCode, playerSessionId)
    if (!found) {
      callback({ success: false, error: 'Player not found in room' })
      return
    }

    const { playerId, player } = found

    // Reconnect: cancel grace timer, update socketId, mark connected
    const result = roomService.markPlayerReconnected(upperCode, playerId, socket.id)
    if (!result) {
      callback({ success: false, error: 'Reconnection failed' })
      return
    }
    result.player.sessionId = socket.data.playerSessionId ?? result.player.sessionId

    // Join socket to the room channel
    socket.join(upperCode)

    // Update handler context
    ctx.socketId = socket.id
    ctx.userId = player.uid ?? ctx.userId

    logger.info(`Player ${player.nickname} reconnected to room ${upperCode} (new socket: ${socket.id})`)

    // Notify room of reconnection
    io.to(upperCode).emit('player_reconnected', { name: player.nickname, socketId: socket.id })
    io.to(upperCode).emit('players_update', Array.from(room.players.values()))

    // If host reconnected during PERFORMING and room was paused due to disconnect, auto-resume
    if (player.isHost && room.gameState === 'PERFORMING' && room.isPaused) {
      room.isPaused = false
      roomService.updateRoom(room)
      io.to(upperCode).emit('performance_resumed')
      logger.info(`Auto-resumed performance in room ${upperCode} after host reconnect`)
    }

    // Build state snapshot for the client
    const snapshot = {
      gameState: room.gameState,
      players: Array.from(room.players.values()),
      script: room.script ?? null,
      currentLineIndex: room.currentLineIndex,
      scriptImageUrl: room.script?.imageUrl ?? null,
      myPlayerId: playerId,
      roomCode: upperCode,
      assignedCharacter: player.assignedCharacter,
      myRole: player.role,
      hasSubmittedSelection: player.hasSubmittedSelection,
      selection: room.selections.get(playerId) ?? undefined,
      spectatorMessages: room.audienceInteraction?.spectatorMessages ?? [],
      votingStatus: { hasVoted: !!room.votes.get(playerId) },
      results: null,
      roomSettings: {
        isMature: room.isMature,
        gameMode: room.gameMode,
        scriptCustomization: room.scriptCustomization,
        cardPackId: room.cardPackId,
        audioSettings: room.audioSettings,
        audienceInteractionEnabled: Boolean(room.audienceInteraction),
        isPublic: room.isPublic,
        publicTitle: room.publicTitle,
      },
    }

    callback({ success: true, snapshot })
  }))
}
