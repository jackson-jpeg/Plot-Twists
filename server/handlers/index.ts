import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { startScriptGeneration } from './game.helpers'
import { calculateResults, allBallotsIn } from '../services/voting.service'
import { scheduleHostMigration } from '../services/hostMigration.service'
import * as roomService from '../services/room.service'
import * as matchmakingService from '../services/matchmaking.service'
import { CONFIG } from '../utils/config'
import { logger } from '@/lib/logger'
import { toPublicPlayer, toPublicPlayers, findByPublicId } from '../socket/serialize'

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
import { registerReconnectionHandlers } from './reconnection.handler'

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
    registerReconnectionHandlers(io, socket, ctx)

    // Handle disconnect — grace period before removal
    socket.on('disconnect', withErrorHandler(socket, 'disconnect', (reason) => {
      logger.info('Client disconnected:', socket.id, 'Reason:', reason)

      // Find the player in any room by their socketId
      for (const [code, room] of roomService.getRoomEntries()) {
        for (const [playerId, player] of room.players.entries()) {
          if (player.socketId !== socket.id) continue

          // Mark player as disconnected immediately
          const result = roomService.markPlayerDisconnected(code, socket.id)
          if (!result) break

          logger.info(`Player ${player.nickname} disconnected from room ${code}, starting grace period`)
          io.to(code).emit('player_disconnected', { name: player.nickname })
          io.to(code).emit('players_update', toPublicPlayers(room))

          // Auto-pause if host disconnects during PERFORMING
          if (player.isHost && room.gameState === 'PERFORMING' && !room.isPaused) {
            room.isPaused = true
            roomService.updateRoom(room)
            io.to(code).emit('performance_paused', { reason: 'Host disconnected' })
            logger.info(`Auto-paused performance in room ${code} — host disconnected`)
          }

          // Chunk 2 item 4 — re-check the tally the moment someone drops, not 60s later.
          //
          // This check only existed after the grace period expired, and the grace period is
          // 60s (CONFIG.reconnection.gracePeriodMs) — the same order as VOTING_TIMEOUT, so it
          // rescued nothing that the timeout was not about to rescue anyway. The room sat on a
          // "waiting for votes" screen for a player who had already left the party.
          if (room.gameState === 'VOTING' && allBallotsIn(room)) {
            logger.info(`All remaining ballots are in after ${player.nickname} dropped from room ${code}, calculating results`)
            void calculateResults(room, io)
          }

          // Chunk 2 item 3 — the host leaving mid-game freezes the show. Start migration.
          if (player.isHost && room.gameState !== 'LOBBY') {
            scheduleHostMigration(room, io)
          }

          // Start grace period timer
          const gracePeriodMs = CONFIG.reconnection.gracePeriodMs
          const timer = setTimeout(() => {
            const removed = roomService.removePlayerAfterGrace(code, playerId)
            if (!removed) return // Player reconnected or already removed

	            logger.info(`Grace period expired — removing ${removed.player.nickname} from room ${code}`)
	            io.to(code).emit('player_left', removed.player.publicId)
	            io.to(code).emit('players_update', toPublicPlayers(removed.room))

	            if (removed.room.isPublic) {
	              matchmakingService.syncAutoStart(removed.room, io)
	              matchmakingService.broadcastPublicRooms(io)
	            }

            // Check SELECTION auto-start after removal
            if (removed.room.gameState === 'SELECTION' && !removed.player.isHost) {
              const remainingPlayers = Array.from(removed.room.players.values()).filter(p => p.role === 'PLAYER' && !p.isHost)
              const allSubmitted = remainingPlayers.length > 0 && remainingPlayers.every(p => p.hasSubmittedSelection)
              if (allSubmitted && removed.room.players.size > 1) {
                logger.info(`All remaining players submitted after grace expiry, starting script generation for room ${code}`)
                startScriptGeneration(removed.room, io).catch(err => logger.error(`Script generation error in room ${code}:`, err))
              }
            }

            if (removed.room.gameState === 'VOTING' && !removed.player.isHost) {
              if (allBallotsIn(removed.room)) {
                logger.info(`All remaining players voted after grace expiry in room ${code}, calculating results`)
                void calculateResults(removed.room, io)
              }
            }

            // Host removal — cleanup or notify
	            if (removed.player.isHost && removed.room.gameState === 'LOBBY' && removed.room.players.size === 0) {
	              logger.info(`Deleting empty room ${code}`)
	              roomService.clearAllRoomTimeouts(code)
	              matchmakingService.cleanupRoom(code)
	              roomService.deleteRoom(code)
	            } else if (removed.player.isHost) {
	              logger.info(`Host permanently left room ${code}`)
	              roomService.clearAllRoomTimeouts(code)
	              matchmakingService.cleanupRoom(code)
	              io.to(code).emit('host_disconnected', { message: 'The host has left the game. You can wait for them to reconnect or return to the home page.' })
	            }
          }, gracePeriodMs)

          roomService.setDisconnectTimer(code, playerId, timer)
          break
        }
      }
    }))
  })
}
