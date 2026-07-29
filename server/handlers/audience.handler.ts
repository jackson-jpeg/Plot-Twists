// server/handlers/audience.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { SocketRateLimiter } from '../middleware/rateLimiter'
import type { SoundEffectType, Script, Player } from '@/lib/types'
import { sanitizeInput as sanitizeUserInput } from '../utils/validation'
import { PLOT_TWIST_VOTING_DURATION } from '../utils/constants'
import {
  canSendReaction,
  recordReaction,
  startPlotTwist,
  votePlotTwist,
  finalizePlotTwist,
  regenerateTwistsForRoom,
  generateAITwistInjection,
  recordSpectatorMessage,
} from '../services/audience.service'
import {
  validateRoom,
  requireRoomMember,
} from '../socket/helpers'
import * as roomService from '../services/room.service'
import { seatKey } from '../utils/clientIdentity'
import { logger } from '@/lib/logger'

// Rate limiters (moved from server.ts)
const reactionLimiter = new SocketRateLimiter(60, 60 * 1000) // 60 reactions per minute
const spectatorMessageLimiter = new SocketRateLimiter(20, 60 * 1000) // 20 messages per minute

export function registerAudienceHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Send audience reaction
  socket.on('send_audience_reaction', withErrorHandler(socket, 'send_audience_reaction', (roomCode, reactionType) => {
    // Chunk 3 item 1, with a deliberate difference from the other limiters.
    //
    // These are keyed on the SEAT (roomCode + publicId), not on `rateLimitKey`. The point of
    // re-keying was to survive reconnection, and a seat does. But an IP does NOT belong here:
    // the whole premise of this game is eight people in one room sharing one wifi, so an
    // IP-keyed reaction limit would put the entire party in one 60/min bucket and silence the
    // loudest moment of the night. That is a worse outcome than the abuse it would prevent —
    // reactions are counters and a bounded message buffer, not an allocation vector.
    if (!reactionLimiter.check(seatKey(socket, roomCode))) {
      return
    }

    // Validate reaction type
    if (typeof reactionType !== 'string' || !['laugh', 'gasp', 'cheer', 'love', 'mindblown'].includes(reactionType)) return

    const room = validateRoom(roomCode, socket)
    if (!room || !room.audienceInteraction) return
    if (!requireRoomMember(room, socket)) return

    // Find sender
    let sender: Player | undefined
    for (const player of room.players.values()) {
      if (player.socketId === socket.id) {
        sender = player
        break
      }
    }
    if (!sender) return

    // Check cooldown and record reaction
    if (!canSendReaction(sender.id)) return

    const reaction = recordReaction(
      room.audienceInteraction,
      reactionType,
      sender.id,
      sender.nickname,
      room.currentLineIndex
    )

    if (reaction) {
      room.lastActivity = Date.now()
      // Broadcast to all clients
      io.to(roomCode).emit('audience_reaction_received', reaction)
      io.to(roomCode).emit('audience_reaction_counts', room.audienceInteraction.reactionCounts)
    }
  }))

  // Send spectator message (chat/heckle)
  socket.on('send_spectator_message', withErrorHandler(socket, 'send_spectator_message', (roomCode, text, isPreset) => {
    if (!spectatorMessageLimiter.check(seatKey(socket, roomCode))) return
    const room = validateRoom(roomCode, socket)
    if (!room || !room.audienceInteraction) return
    if (!requireRoomMember(room, socket)) return

    // Find sender
    let sender: Player | undefined
    for (const player of room.players.values()) {
      if (player.socketId === socket.id) {
        sender = player
        break
      }
    }
    if (!sender) return

    const sanitizedText = sanitizeUserInput(text, 200)
    if (!sanitizedText) return

    const message = recordSpectatorMessage(
      room.audienceInteraction,
      sanitizedText,
      sender.id,
      sender.nickname,
      isPreset
    )

    if (message) {
      room.lastActivity = Date.now()
      io.to(roomCode).emit('spectator_message_received', message)
    }
  }))

  // Start a plot twist vote (or auto-apply in solo mode)
  socket.on('start_plot_twist', withErrorHandler(socket, 'start_plot_twist', (roomCode) => {
    const room = roomService.getRoomFromCache(roomCode)
    if (!room || !room.audienceInteraction) return
    if (room.gameState !== 'PERFORMING') return

    // Only host can start plot twists
    if (room.host.socketId !== socket.id) return

    // Check if there's already an active twist
    if (room.audienceInteraction.activePlotTwist?.isActive) return

    // Use pre-generated AI twists if available (pass roomCode)
    const twist = startPlotTwist(room.audienceInteraction, PLOT_TWIST_VOTING_DURATION, roomCode)
    room.lastActivity = Date.now()

    // Emit dramatic sound effect when twist starts
    io.to(roomCode).emit('play_sound_effect', 'plot_twist_trigger' as SoundEffectType)

    // --- SOLO MODE: skip voting, pick a random twist and inject immediately ---
    if (room.gameMode === 'SOLO') {
      const winningTwist = finalizePlotTwist(room.audienceInteraction)
      if (winningTwist) {
        io.to(roomCode).emit('play_sound_effect', 'plot_twist_reveal' as SoundEffectType)
        io.to(roomCode).emit('plot_twist_result', winningTwist)

        const speakers = room.script?.lines.map(l => l.speaker).filter((v, i, a) => a.indexOf(v) === i) || []
        const setting = room.setting || ''
        const recentDialogue = room.script?.lines.slice(
          Math.max(0, room.currentLineIndex - 5),
          room.currentLineIndex + 1
        ) || []

        // Generate AI injection in background (don't block)
        generateAITwistInjection(
          winningTwist,
          speakers,
          {
            setting,
            characters: speakers,
            recentDialogue,
            scriptPosition: room.currentLineIndex / (room.script?.lines.length || 1) < 0.33 ? 'early' :
              room.currentLineIndex / (room.script?.lines.length || 1) < 0.66 ? 'mid' : 'late',
            comedyStyle: room.scriptCustomization?.comedyStyle,
            isMature: room.isMature
          }
        ).then(injectedLines => {
          const latestRoom = roomService.getRoomFromCache(roomCode)
          if (latestRoom?.script && latestRoom.gameState === 'PERFORMING' && injectedLines.length > 0) {
            const insertIndex = Math.min(latestRoom.currentLineIndex + 1, latestRoom.script.lines.length)
            latestRoom.script.lines.splice(insertIndex, 0, ...injectedLines)
            io.to(roomCode).emit('plot_twist_injected', insertIndex, injectedLines)
            roomService.updateRoom(latestRoom)

            regenerateTwistsForRoom(
              roomCode,
              latestRoom.script as Script,
              latestRoom.currentLineIndex,
              setting,
              latestRoom.isMature,
              latestRoom.scriptCustomization?.comedyStyle
            )
          }
        }).catch(error => {
          logger.error(`Solo plot twist injection failed for room ${roomCode}:`, error)
          io.to(roomCode).emit('game_error_message', 'Plot twist failed — the show goes on!')
        })
      }
      return
    }

    // --- MULTIPLAYER: broadcast vote to audience, finalize after timeout ---
    io.to(roomCode).emit('plot_twist_started', twist)

    // Set timeout to finalize and inject
    const timeout = setTimeout(async () => {
      try {
        // Re-fetch room from cache to avoid stale closure data
        const currentRoom = roomService.getRoomFromCache(roomCode)
        if (!currentRoom?.audienceInteraction) return
        if (currentRoom.gameState !== 'PERFORMING') return

        const winningTwist = finalizePlotTwist(currentRoom.audienceInteraction)
        if (winningTwist) {
          // Emit reveal sound effect
          io.to(roomCode).emit('play_sound_effect', 'plot_twist_reveal' as SoundEffectType)
          io.to(roomCode).emit('plot_twist_result', winningTwist)

          // Get context for AI injection
          const speakers = currentRoom.script?.lines.map(l => l.speaker).filter((v, i, a) => a.indexOf(v) === i) || []
          const setting = currentRoom.setting || ''
          const recentDialogue = currentRoom.script?.lines.slice(
            Math.max(0, currentRoom.currentLineIndex - 5),
            currentRoom.currentLineIndex + 1
          ) || []

          // Generate AI-powered character reactions (with fallback)
          const injectedLines = await generateAITwistInjection(
            winningTwist,
            speakers,
            {
              setting,
              characters: speakers,
              recentDialogue,
              scriptPosition: currentRoom.currentLineIndex / (currentRoom.script?.lines.length || 1) < 0.33 ? 'early' :
                currentRoom.currentLineIndex / (currentRoom.script?.lines.length || 1) < 0.66 ? 'mid' : 'late',
              comedyStyle: currentRoom.scriptCustomization?.comedyStyle,
              isMature: currentRoom.isMature
            }
          )

          // Re-fetch again after async AI call to get latest state
          const latestRoom = roomService.getRoomFromCache(roomCode)
          if (latestRoom?.script && latestRoom.gameState === 'PERFORMING' && injectedLines.length > 0) {
            const insertIndex = Math.min(latestRoom.currentLineIndex + 1, latestRoom.script.lines.length)
            latestRoom.script.lines.splice(insertIndex, 0, ...injectedLines)
            io.to(roomCode).emit('plot_twist_injected', insertIndex, injectedLines)
            roomService.updateRoom(latestRoom)

            // Regenerate twist options in background for next time
            regenerateTwistsForRoom(
              roomCode,
              latestRoom.script as Script,
              latestRoom.currentLineIndex,
              setting,
              latestRoom.isMature,
              latestRoom.scriptCustomization?.comedyStyle
            )
          }
        }
      } catch (error) {
        logger.error(`Plot twist injection failed for room ${roomCode}:`, error)
        io.to(roomCode).emit('game_error_message', 'Plot twist failed — the show goes on!')
      } finally {
        roomService.clearPlotTwistTimeout(roomCode)
      }
    }, PLOT_TWIST_VOTING_DURATION)

    roomService.setPlotTwistTimeout(roomCode, timeout)
  }))

  // Vote on a plot twist option
  socket.on('vote_plot_twist', withErrorHandler(socket, 'vote_plot_twist', (roomCode, optionId) => {
    if (typeof optionId !== 'string' || !optionId) return
    const room = validateRoom(roomCode, socket)
    if (!room || !room.audienceInteraction) return
    if (!requireRoomMember(room, socket)) return

    // Find voter
    let voterId: string | undefined
    for (const [id, player] of room.players.entries()) {
      if (player.socketId === socket.id) {
        voterId = id
        break
      }
    }
    if (!voterId) return

    const result = votePlotTwist(room.audienceInteraction, optionId, voterId)
    if (result.success && result.newCount !== undefined) {
      room.lastActivity = Date.now()
      io.to(roomCode).emit('plot_twist_vote_update', optionId, result.newCount)
    }
  }))
}
