// server/handlers/game.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import type { NewGameOptions, Script, Player, CardSelection } from '@/lib/types'
import { calculateLineDisplayTime } from '../utils/timing'
import { VOTING_TIMEOUT } from '../utils/constants'
import { generateScript } from '../services/scriptGeneration.service'
import { startTeleprompterSync } from '../services/teleprompter.service'
import { calculateResults } from '../services/voting.service'
import { enhanceScriptWithAudio, getAmbienceTrack } from '../services/audio.service'
import { resetReactionCounts, preGenerateTwistsForRoom } from '../services/audience.service'
import { generateTitleCard } from '../services/image.service'
import { addBankedCredits, getCredits } from '../services/credit.service'
import { notifyVotingOpen } from '../services/notification.service'
import {
  requireHost,
  requireRoomMember,
  validateRoom,
  deductCreditOrReject,
} from '../socket/helpers'
import { startScriptGeneration, pushOnStateChange } from './game.helpers'
import * as roomService from '../services/room.service'
import { logger } from '@/lib/logger'

export function registerGameHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Retry script generation — re-generates with existing selections without going back to card selection
  socket.on('retry_script_generation', withErrorHandler(socket, 'retry_script_generation', async (roomCode) => {
    if (typeof roomCode !== 'string') return
    const room = roomService.getRoomFromCache(roomCode)
    if (!room) return
    if (!requireHost(room, socket)) return

    // Only allow retry from LOADING state (timed out) or SELECTION (fallback)
    if (room.gameState !== 'LOADING' && room.gameState !== 'SELECTION') {
      logger.warn(`Retry script generation rejected: room ${roomCode} in ${room.gameState}`)
      return
    }

    // Reset to allow startScriptGeneration to proceed
    room.gameState = 'SELECTION'
    const allSelections = Array.from(room.selections.values())
    if (allSelections.length === 0) {
      io.to(roomCode).emit('game_error_message', 'No card selections found. Please go back to lobby and try again.')
      io.to(roomCode).emit('game_state_change', 'SELECTION')
      return
    }

    logger.info(`Retrying script generation for room ${roomCode} with ${allSelections.length} existing selections`)
    await startScriptGeneration(room, io)
  }))

  // End performance — host manually triggers transition to voting/results
  socket.on('end_performance', withErrorHandler(socket, 'end_performance', (roomCode) => {
    if (typeof roomCode !== 'string') return
    const room = roomService.getRoomFromCache(roomCode)
    if (!room) return
    if (!requireHost(room, socket)) return
    if (room.gameState !== 'PERFORMING') return

    // Stop teleprompter auto-advance
    roomService.clearRoomTimeout(room.code)

    if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
      room.gameState = 'VOTING'
      io.to(room.code).emit('game_state_change', 'VOTING')

      // Notify players that voting is open
      notifyVotingOpen(room).catch(() => {})

      const votingTimeout = setTimeout(() => {
        if (room.gameState !== 'VOTING') return
        calculateResults(room, io)
      }, VOTING_TIMEOUT)
      votingTimeout.unref()
      roomService.setRoomTimeout(room.code, votingTimeout)
    } else {
      room.gameState = 'RESULTS'
      io.to(room.code).emit('game_state_change', 'RESULTS')
    }
    roomService.persistRoom(room)
    logger.info(`Host manually ended performance for room ${room.code}`)
  }))

  // Advance script line
  socket.on('advance_script_line', withErrorHandler(socket, 'advance_script_line', (roomCode) => {
    if (typeof roomCode !== 'string') return
    const room = roomService.getRoomFromCache(roomCode)
    if (!room || !room.script) return
    if (room.gameState !== 'PERFORMING') return
    if (!requireHost(room, socket)) return
    if (room.currentLineIndex >= room.script.lines.length - 1) return

    room.currentLineIndex++
    room.lastActivity = Date.now()
    roomService.updateRoom(room, true) // debounced - high frequency
    io.to(roomCode).emit('sync_teleprompter', {
      lineIndex: room.currentLineIndex,
      serverTimestamp: Date.now(),
      expectedDuration: calculateLineDisplayTime(room.script.lines[room.currentLineIndex])
    })
  }))

  // Pause script
  socket.on('pause_script', withErrorHandler(socket, 'pause_script', (roomCode) => {
    if (typeof roomCode !== 'string') return
    const room = roomService.getRoomFromCache(roomCode)
    if (!room || !room.script) return
    if (room.gameState !== 'PERFORMING') return
    if (!requireHost(room, socket)) return

    room.isPaused = true
    room.lastActivity = Date.now()

    // Clear the current timeout
    const timeout = roomService.getRoomTimeout(roomCode)
    if (timeout) {
      clearTimeout(timeout)
      roomService.clearRoomTimeout(roomCode)
    }

    roomService.updateRoom(room, true)
    logger.debug(`Script paused for room ${roomCode}`)
  }))

  // Resume script
  socket.on('resume_script', withErrorHandler(socket, 'resume_script', (roomCode) => {
    if (typeof roomCode !== 'string') return
    const room = roomService.getRoomFromCache(roomCode)
    if (!room || !room.script) return
    if (room.gameState !== 'PERFORMING') return
    if (!requireHost(room, socket)) return

    room.isPaused = false
    room.lastActivity = Date.now()

    roomService.updateRoom(room, true)
    logger.debug(`Script resumed for room ${roomCode}`)

    // Restart teleprompter from current line using the service
    startTeleprompterSync(room, io)
  }))

  // Jump to specific line (host control)
  socket.on('jump_to_line', withErrorHandler(socket, 'jump_to_line', (roomCode, lineIndex) => {
    if (typeof roomCode !== 'string' || typeof lineIndex !== 'number') return
    const room = roomService.getRoomFromCache(roomCode)
    if (!room || !room.script) return
    if (!requireHost(room, socket)) return

    // Validate line index
    if (lineIndex < 0 || lineIndex >= room.script.lines.length) return

    // Clear existing timeout
    const timeout = roomService.getRoomTimeout(roomCode)
    if (timeout) {
      clearTimeout(timeout)
      roomService.clearRoomTimeout(roomCode)
    }

    // Update line index
    room.currentLineIndex = lineIndex
    room.lastActivity = Date.now()

    // Broadcast new line to all clients with timestamp
    io.to(roomCode).emit('sync_teleprompter', {
      lineIndex: room.currentLineIndex,
      serverTimestamp: Date.now(),
      expectedDuration: calculateLineDisplayTime(room.script.lines[lineIndex])
    })

    logger.debug(`Jumped to line ${lineIndex} in room ${roomCode}`)

    // If not paused, restart timer for new line using the teleprompter service
    if (!room.isPaused) {
      startTeleprompterSync(room, io)
    }
  }))

  // Player jump to line (synced navigation - all clients move together)
  socket.on('player_jump_to_line', withErrorHandler(socket, 'player_jump_to_line', (roomCode, lineIndex) => {
    if (typeof roomCode !== 'string' || typeof lineIndex !== 'number') return
    const room = validateRoom(roomCode, socket)
    if (!room || room.gameState !== 'PERFORMING' || !room.script) return
    if (!requireRoomMember(room, socket)) return

    // Only players (not spectators) can navigate the teleprompter
    let isPlayer = requireHost(room, socket)
    if (!isPlayer) {
      for (const player of room.players.values()) {
        if (player.socketId === socket.id && player.role === 'PLAYER') {
          isPlayer = true
          break
        }
      }
    }
    if (!isPlayer) return

    // Validate line index
    if (lineIndex < 0 || lineIndex >= room.script.lines.length) return

    // Clear existing timeout, pause auto-advance briefly
    const timeout = roomService.getRoomTimeout(roomCode)
    if (timeout) {
      clearTimeout(timeout)
      roomService.clearRoomTimeout(roomCode)
    }

    room.currentLineIndex = lineIndex
    room.lastActivity = Date.now()

    // Broadcast to ALL clients (host + players)
    io.to(roomCode).emit('sync_teleprompter', {
      lineIndex,
      serverTimestamp: Date.now(),
      expectedDuration: calculateLineDisplayTime(room.script.lines[lineIndex])
    })

    logger.debug(`Player navigated to line ${lineIndex} in room ${roomCode}`)

    // Resume auto-advance from new position after brief delay
    const resumeTimeout = setTimeout(() => {
      if (room.gameState === 'PERFORMING' && !room.isPaused && room.script) {
        startTeleprompterSync(room, io)
      }
    }, 500)
    roomService.setRoomTimeout(room.code, resumeTimeout)
  }))

  // Request sequel
  socket.on('request_sequel', withErrorHandler(socket, 'request_sequel', async (roomCode) => {
    if (typeof roomCode !== 'string') return
    const room = roomService.getRoomFromCache(roomCode)
    if (!room || !room.script) {
      logger.info(`Cannot generate sequel: room or script not found for ${roomCode}`)
      return
    }
    if (!requireHost(room, socket)) return

    logger.info(`Sequel requested for room ${roomCode}`)

    // Credit gate: deduct 1 credit from host before generating sequel
    const creditOk = await deductCreditOrReject(room, io)
    if (!creditOk) return

    // Save the current script as previous
    const previousScript = room.script

    // Clear teleprompter timeout from previous round
    const prevTimeout = roomService.getRoomTimeout(roomCode)
    if (prevTimeout) {
      clearTimeout(prevTimeout)
      roomService.clearRoomTimeout(roomCode)
    }

    // Reset votes for the new round (Phase 5 fix)
    room.votes.clear()
    for (const player of room.players.values()) {
      player.hasSubmittedVote = false
    }

    // Set loading state
    room.gameState = 'LOADING'
    room.lastActivity = Date.now()
    io.to(roomCode).emit('game_state_change', 'LOADING')

    try {
      // Get player characters from selections
      const playerIds = Array.from(room.players.values())
        .filter(p => p.role === 'PLAYER')
        .map(p => p.id)

      const allSelections = Array.from(room.selections.values())
      const playerSelections = allSelections.filter((_, index) => {
        const playerId = Array.from(room.selections.keys())[index]
        return playerIds.includes(playerId)
      })

      const characters = playerSelections.map(s => s.character)

      // Use the same setting and circumstance from the previous script
      // Extract from selections (they're still in the room)
      const chosenSetting = playerSelections[0]?.setting || 'Unknown Setting'
      const chosenCircumstance = playerSelections[0]?.circumstance || 'Unknown Circumstance'

      logger.info(`Generating sequel with ${characters.length} character(s)`)

      // Generate sequel script with customization and streaming progress
      const sequelScript = await generateScript(
        characters,
        chosenSetting,
        chosenCircumstance,
        room.isMature,
        room.gameMode,
        previousScript as Script, // Pass the previous script
        room.scriptCustomization,
        (progress) => io.to(roomCode).emit('script_generation_progress', progress)
      )

      // Enhance with audio metadata if audio is enabled
      const finalScript = room.audioSettings
        ? enhanceScriptWithAudio(sequelScript, room.audioSettings, chosenSetting)
        : sequelScript

      // Update room with new script
      room.script = finalScript
      room.gameState = 'PERFORMING'
      room.currentLineIndex = 0
      room.isPaused = false

      // Reset audience interaction for new performance
      if (room.audienceInteraction) {
        resetReactionCounts(room.audienceInteraction)
      }

      // Pre-generate AI plot twists in background
      preGenerateTwistsForRoom(
        roomCode,
        finalScript,
        chosenSetting,
        room.isMature,
        room.scriptCustomization?.comedyStyle
      )

      // Store setting for later twist generation
      room.setting = chosenSetting
      roomService.updateRoom(room)

      // Broadcast new script to all clients
      io.to(roomCode).emit('script_ready', finalScript)
      io.to(roomCode).emit('game_state_change', 'PERFORMING')
      pushOnStateChange(room, 'PERFORMING')

      // Start ambience if enabled
      if (room.audioSettings?.ambienceEnabled) {
        const ambienceTrack = getAmbienceTrack(chosenSetting)
        io.to(roomCode).emit('ambience_start', ambienceTrack)
      }

      // Generate poster in background (non-blocking)
      generateTitleCard(finalScript.title, finalScript.synopsis, chosenSetting, characters)
        .then((imageUrl) => {
          if (imageUrl) {
            if (room.script) room.script.imageUrl = imageUrl
            io.to(roomCode).emit('script_image_update', imageUrl)
          }
        })
        .catch((err) => logger.error('[Image Service] Sequel poster generation error:', err))

      logger.info(`Sequel generated: "${finalScript.title}"`)

      // Start teleprompter sync
      startTeleprompterSync(room, io)
    } catch (error) {
      logger.error('Sequel generation failed:', error)
      io.to(roomCode).emit('game_error_message', 'Failed to generate sequel. Please try again.')

      // Refund the deducted credit
      if (room.hostUid) {
        try {
          await addBankedCredits(room.hostUid, 1, 0)
          const balance = await getCredits(room.hostUid)
          const hostSocket = io.sockets.sockets.get(room.host.socketId)
          if (hostSocket) hostSocket.emit('credit_balance', balance)
          logger.info(`[Credits] Refunded 1 credit to host ${room.hostUid} after sequel failure in room ${roomCode}`)
        } catch (refundErr) {
          logger.error(`[Credits] Failed to refund credit for room ${roomCode}:`, refundErr)
        }
      }

      // Reset to results state with clean vote/selection flags
      room.gameState = 'RESULTS'
      room.votes.clear()
      for (const player of room.players.values()) {
        player.hasSubmittedVote = false
      }
      if (room.audienceInteraction) {
        resetReactionCounts(room.audienceInteraction)
      }
      roomService.updateRoom(room)
      io.to(roomCode).emit('game_state_change', 'RESULTS')
    }
  }))

  // Request new game (keeps players in room, no page reload)
  socket.on('request_new_game', withErrorHandler(socket, 'request_new_game', (roomCode, options?: NewGameOptions) => {
    if (typeof roomCode !== 'string') return
    const room = roomService.getRoomFromCache(roomCode)
    if (!room) {
      logger.info(`Cannot start new game: room not found for ${roomCode}`)
      return
    }

    // Verify this is the host
    if (room.host.socketId !== socket.id) {
      logger.warn(`Non-host tried to start new game in room ${roomCode}`)
      return
    }

    logger.info(`New game requested for room ${roomCode}`)

    // Clear teleprompter timeout
    const timeout = roomService.getRoomTimeout(roomCode)
    if (timeout) {
      clearTimeout(timeout)
      roomService.clearRoomTimeout(roomCode)
    }

    // Clear any pending plot twist timeout
    roomService.clearPlotTwistTimeout(roomCode)

    // Reset room state
    room.gameState = 'LOBBY'
    room.script = undefined
    room.currentLineIndex = 0
    room.isPaused = false
    room.results = undefined
    room.directorsReview = undefined
    room.lastActivity = Date.now()

    // Clear votes
    room.votes.clear()

    // Reset player state
    for (const player of room.players.values()) {
      player.hasSubmittedVote = false
      player.hasSubmittedSelection = false
      player.assignedCharacter = undefined
    }

    // Optionally keep selections for quick replay
    if (!options?.keepSelections) {
      room.selections.clear()
    }

    // Reset audience interaction if enabled
    if (room.audienceInteraction) {
      resetReactionCounts(room.audienceInteraction)
      room.audienceInteraction.plotTwistHistory = []
    }

    roomService.updateRoom(room)

    // Notify all clients
    io.to(roomCode).emit('new_game_started', { keepSelections: options?.keepSelections || false })
    io.to(roomCode).emit('game_state_change', 'LOBBY')
    io.to(roomCode).emit('players_update', Array.from(room.players.values()))

    logger.info(`New game started in room ${roomCode}`)
  }))

  // Request resync after reconnection
  socket.on('request_resync', withErrorHandler(socket, 'request_resync', (roomCode: string, playerId: string, callback: (response: { success: boolean; gameState?: string; players?: Player[]; script?: Script; currentLineIndex?: number; hasSubmittedSelection?: boolean; assignedCharacter?: string; selection?: CardSelection; error?: string }) => void) => {
    if (typeof roomCode !== 'string' || typeof playerId !== 'string') return
    try {
      const upperCode = roomCode.toUpperCase()
      const room = roomService.getRoomFromCache(upperCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }

      // Find the player by persistent playerId, with fallback uid lookup
      // (Host sends user.uid but server stores host with id: uuidv4())
      let player = room.players.get(playerId)
      if (!player) {
        for (const p of room.players.values()) {
          if (p.uid === playerId) { player = p; break }
        }
      }
      if (!player) {
        callback({ success: false, error: 'Player not found in room' })
        return
      }

      // Verify the requesting socket owns this player (prevent session hijack)
      const socketUid = socket.data?.uid as string | undefined
      if (player.uid) {
        // Authenticated player — require matching uid
        if (!socketUid || socketUid !== player.uid) {
          callback({ success: false, error: 'Unauthorized resync' })
          return
        }
      } else if (player.socketId !== socket.id) {
        // Anonymous player — only allow resync from the same socket (no cross-session hijack)
        callback({ success: false, error: 'Cannot resync anonymous player from different session' })
        return
      }

      // Update the player's socket ID and re-join the Socket.IO room
      player.socketId = socket.id
      socket.join(upperCode)
      logger.info(`[Resync] Player ${player.nickname} (${playerId}) reconnected to room ${upperCode} with new socket ${socket.id}`)

      callback({
        success: true,
        gameState: room.gameState,
        players: Array.from(room.players.values()),
        script: room.script || undefined,
        currentLineIndex: room.currentLineIndex ?? 0,
        hasSubmittedSelection: player.hasSubmittedSelection ?? false,
        assignedCharacter: player.assignedCharacter || undefined,
        selection: room.selections.get(player.id) || undefined,
      })
    } catch (error) {
      logger.error('[Resync] Error:', error)
      callback({ success: false, error: 'Resync failed' })
    }
  }))
}
