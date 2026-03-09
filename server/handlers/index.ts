import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { DISCONNECT_GRACE_PERIOD } from '../utils/constants'
import { startScriptGeneration } from './game.helpers'
import * as roomService from '../services/room.service'
import * as matchmakingService from '../services/matchmaking.service'
import { logger } from '@/lib/logger'

// Handler module imports
import { registerRoomHandlers } from './room.handler'
import { registerSelectionHandlers } from './selection.handler'
import { registerGameHandlers } from './game.handler'
import { registerVotingHandlers } from './voting.handler'
import { registerAudienceHandlers } from './audience.handler'
import { registerCardpackHandlers } from './cardpack.handler'
import { registerAudioHandlers } from './audio.handler'
import { registerUserHandlers } from './user.handler'
import { registerAdminHandlers } from './admin.handler'

export function registerAllHandlers(io: AppServer) {
  io.on('connection', (socket: AppSocket) => {
    const ctx: HandlerContext = {
      userId: socket.data.userId ?? socket.data.uid ?? null,
      socketId: socket.id,
      isAdmin: socket.data.isAdmin ?? false,
      io,
    }

    logger.info('Client connected:', socket.id)

    // Register all handler modules
    registerRoomHandlers(io, socket, ctx)
    registerSelectionHandlers(io, socket, ctx)
    registerGameHandlers(io, socket, ctx)
    registerVotingHandlers(io, socket, ctx)
    registerAudienceHandlers(io, socket, ctx)
    registerCardpackHandlers(io, socket, ctx)
    registerAudioHandlers(io, socket, ctx)
    registerUserHandlers(io, socket, ctx)
    registerAdminHandlers(io, socket, ctx)

    // Handle disconnect
    socket.on('disconnect', withErrorHandler(socket, 'disconnect', (reason) => {
      logger.info('Client disconnected:', socket.id, 'Reason:', reason)

      // Give a grace period before removing players (helps with reconnections)
      setTimeout(() => {
        // Check if socket reconnected (if it's connected again, don't remove)
        const reconnected = io.sockets.sockets.get(socket.id)
        if (reconnected && reconnected.connected) {
          logger.debug('Socket reconnected, not removing player:', socket.id)
          return
        }

        // Find and remove player from rooms
        for (const [code, room] of roomService.getRoomEntries()) {
          for (const [playerId, player] of room.players.entries()) {
            if (player.socketId === socket.id) {
              logger.info(`Removing player ${player.nickname} from room ${code}`)
              roomService.removePlayer(room, playerId)
              io.to(code).emit('player_left', playerId)
              io.to(code).emit('players_update', Array.from(room.players.values()))

              // If a player disconnected during SELECTION, re-check if remaining players have all submitted
              if (room.gameState === 'SELECTION' && !player.isHost) {
                const remainingPlayers = Array.from(room.players.values()).filter(p => p.role === 'PLAYER' && !p.isHost)
                const allSubmitted = remainingPlayers.length > 0 && remainingPlayers.every(p => p.hasSubmittedSelection)
                if (allSubmitted && room.players.size > 1) {
                  logger.info(`All remaining players submitted after disconnect, starting script generation for room ${code}`)
                  startScriptGeneration(room, io).catch(err => logger.error(`Script generation error after disconnect in room ${code}:`, err))
                }
              }

              // If host left and room is still in lobby, allow others to continue
              // Only delete room if it's empty or has been too long
              if (player.isHost && room.gameState === 'LOBBY' && room.players.size === 0) {
                logger.info(`Deleting empty room ${code}`)
                roomService.clearAllRoomTimeouts(code)
                matchmakingService.cleanupRoom(code)
                roomService.deleteRoom(code)
              } else if (player.isHost) {
                // Host left during game - notify players with specific event and cleanup timeouts
                logger.info(`Host disconnected from room ${code}`)
                roomService.clearAllRoomTimeouts(code)
                io.to(code).emit('host_disconnected', { message: 'The host has left the game. You can wait for them to reconnect or return to the home page.' })
              }
              break
            }
          }
        }
      }, DISCONNECT_GRACE_PERIOD) // Grace period — brief network blips shouldn't remove players mid-performance
    }))
  })
}
