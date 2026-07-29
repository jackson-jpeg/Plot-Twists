/**
 * Shared game helpers used by multiple handler modules.
 * Contains startScriptGeneration and pushOnStateChange, extracted from server.ts.
 */

import type { Server as SocketIOServer } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents, Room, Script } from '@/lib/types'
import { SocketRateLimiter } from '../middleware/rateLimiter'
import { getFilteredContent, getGreenRoomQuestion } from '@/lib/content'
import { generateScript } from '../services/scriptGeneration.service'
import { enhanceScriptWithAudio, getAmbienceTrack } from '../services/audio.service'
import { resetReactionCounts, preGenerateTwistsForRoom } from '../services/audience.service'
import { generateTitleCard } from '../services/image.service'
import { startTeleprompterSync } from '../services/teleprompter.service'
import { deductCreditOrReject } from '../socket/helpers'
import { addBankedCredits, getCredits } from '../services/credit.service'
import { sendPushToUser } from '../services/push.service'
import * as roomService from '../services/room.service'
import { logger } from '@/lib/logger'
import { toPublicPlayer, toPublicPlayers, findByPublicId } from '../socket/serialize'

// Rate limiter for script generation (moved from server.ts)
export const scriptGenerationLimiter = new SocketRateLimiter(20, 10 * 60 * 1000) // 20 scripts per 10 minutes

// Helper: fire-and-forget push notifications to host on key state transitions
export function pushOnStateChange(room: Room, newState: string) {
  if (!room.hostUid) return

  const messages: Record<string, { title: string; body: string }> = {
    PERFORMING: { title: 'Showtime!', body: 'The script is ready — get on stage.' },
    VOTING: { title: 'Vote for MVP!', body: 'Who stole the show?' },
    RESULTS: { title: 'Results are in!', body: 'See who won this round.' },
  }

  const msg = messages[newState]
  if (!msg) return

  sendPushToUser(room.hostUid, msg.title, msg.body, { roomCode: room.code }).catch(() => {})
}

// Helper function to start script generation
export async function startScriptGeneration(room: Room, io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
  // Guard against double-invocation race condition (two players submitting final card simultaneously)
  // IMPORTANT: Set LOADING state atomically before any async work to prevent concurrent callers
  if (room.gameState === 'LOADING' || room.gameState === 'PERFORMING') {
    logger.warn(`Script generation skipped: room ${room.code} already in ${room.gameState}`)
    return
  }

  room.gameState = 'LOADING'
  io.to(room.code).emit('game_state_change', 'LOADING')

  // Rate limiting for script generation (use host socket ID)
  const hostSocketId = room.host.socketId
  if (!scriptGenerationLimiter.check(hostSocketId)) {
    logger.warn(`Script generation rate limit exceeded for room ${room.code}`)
    io.to(room.code).emit('game_error_message', 'Too many script generation requests. Please wait a moment.')
    room.gameState = 'SELECTION'
    room.selections.clear()
    for (const player of room.players.values()) {
      player.hasSubmittedSelection = false
    }
    io.to(room.code).emit('game_state_change', 'SELECTION')
    io.to(room.code).emit('players_update', toPublicPlayers(room))
    const content = getFilteredContent(room.isMature)
    io.to(room.code).emit('available_cards', content)
    roomService.updateRoom(room)
    return
  }

  // Credit gate: deduct 1 credit from host before generating
  const creditOk = await deductCreditOrReject(room, io)
  if (!creditOk) {
    room.gameState = 'SELECTION'
    room.selections.clear()
    for (const player of room.players.values()) {
      player.hasSubmittedSelection = false
    }
    io.to(room.code).emit('game_state_change', 'SELECTION')
    io.to(room.code).emit('players_update', toPublicPlayers(room))
    const content = getFilteredContent(room.isMature)
    io.to(room.code).emit('available_cards', content)
    roomService.updateRoom(room)
    return
  }

  // Get all player selections
  const allSelections = Array.from(room.selections.values())
  if (allSelections.length === 0) {
    logger.error(`No selections found for room ${room.code}, cannot generate script`)
    io.to(room.code).emit('game_error_message', 'No card selections found. Please try again.')
    room.gameState = 'SELECTION'
    io.to(room.code).emit('game_state_change', 'SELECTION')
    return
  }

  // For fairness in multiplayer, randomly pick setting and circumstance from all player selections
  // (Each player picked their own, so we combine them randomly)
  const randomSettingIndex = Math.floor(Math.random() * allSelections.length)
  const randomCircumstanceIndex = Math.floor(Math.random() * allSelections.length)

  const chosenSetting = allSelections[randomSettingIndex].setting
  const chosenCircumstance = allSelections[randomCircumstanceIndex].circumstance

  logger.info(`Randomly selected setting: "${chosenSetting}" (from player ${randomSettingIndex + 1})`)
  logger.info(`Randomly selected circumstance: "${chosenCircumstance}" (from player ${randomCircumstanceIndex + 1})`)

  // Send green room trivia based on chosen setting
  const triviaQuestion = getGreenRoomQuestion(chosenSetting)
  io.to(room.code).emit('green_room_prompt', triviaQuestion)

  try {
    // Collect characters from PLAYER role selections only (exclude spectators)
    const playerIds = Array.from(room.players.values())
      .filter(p => p.role === 'PLAYER')
      .map(p => p.id)

    const playerSelections = allSelections.filter((_, index) => {
      const playerId = Array.from(room.selections.keys())[index]
      return playerIds.includes(playerId)
    })

    let characters = playerSelections.map(s => s.character)

    logger.info(`${room.gameMode} mode: ${characters.length} player${characters.length > 1 ? 's' : ''}`)
    logger.debug(`   Characters: ${characters.join(', ')}`)
    logger.debug(`   Setting: "${chosenSetting}"`)
    logger.debug(`   Circumstance: "${chosenCircumstance}"`)
    if (room.gameMode === 'SOLO') {
      logger.debug(`   Note: AI will invent a hilarious Co-Star character to play opposite the human player`)
    }

    // Generate script with customization and streaming progress
    const script = await generateScript(
      characters,
      chosenSetting,
      chosenCircumstance,
      room.isMature,
      room.gameMode,
      undefined, // No previous script
      room.scriptCustomization,
      (progress) => io.to(room.code).emit('script_generation_progress', progress)
    )

    // Enhance with audio metadata if audio is enabled
    const finalScript = room.audioSettings
      ? enhanceScriptWithAudio(script, room.audioSettings, chosenSetting)
      : script

    room.script = finalScript
    room.gameState = 'PERFORMING'
    room.currentLineIndex = 0

    // Assign characters from selections so voting/history have character names
    for (const [pid, sel] of room.selections.entries()) {
      const player = room.players.get(pid)
      if (player && sel.character) player.assignedCharacter = sel.character
    }

    // Reset audience interaction for new performance
    if (room.audienceInteraction) {
      resetReactionCounts(room.audienceInteraction)
    }

    // Pre-generate AI plot twists in background
    preGenerateTwistsForRoom(
      room.code,
      finalScript,
      chosenSetting,
      room.isMature,
      room.scriptCustomization?.comedyStyle
    )

    // Store setting for later twist generation
    room.setting = chosenSetting
    roomService.updateRoom(room)

    io.to(room.code).emit('script_ready', finalScript)
    io.to(room.code).emit('game_state_change', 'PERFORMING')

    // Generate poster in background (non-blocking)
    generateTitleCard(finalScript.title, finalScript.synopsis, chosenSetting, characters)
      .then((imageUrl) => {
        if (imageUrl) {
          if (room.script) room.script.imageUrl = imageUrl
          io.to(room.code).emit('script_image_update', imageUrl)
        }
      })
      .catch((err) => logger.error('[Image Service] Background generation error:', err))

    // Start ambience if enabled
    if (room.audioSettings?.ambienceEnabled) {
      const ambienceTrack = getAmbienceTrack(chosenSetting)
      io.to(room.code).emit('ambience_start', ambienceTrack)
    }

    // Start teleprompter sync
    startTeleprompterSync(room, io)
  } catch (error) {
    logger.error('Script generation failed:', error)
    io.to(room.code).emit('game_error', {
      code: 'SCRIPT_GENERATION_FAILED',
      message: 'Failed to generate script. Please try again.',
      recoverable: true,
      action: { type: 'RETRY', event: 'retry_script_generation' },
    })

    // Refund the deducted credit
    if (room.hostUid) {
      try {
        await addBankedCredits(room.hostUid, 1, 0)
        const balance = await getCredits(room.hostUid)
        const hostSocket = io.sockets.sockets.get(room.host.socketId)
        if (hostSocket) hostSocket.emit('credit_balance', balance)
        logger.info(`[Credits] Refunded 1 credit to host ${room.hostUid} after script generation failure in room ${room.code}`)
      } catch (refundErr) {
        logger.error(`[Credits] Failed to refund credit for room ${room.code}:`, refundErr)
      }
    }

    // Reset game state to SELECTION so players can try again
    room.gameState = 'SELECTION'
    room.selections.clear()
    roomService.updateRoom(room)

    // Reset all player submission flags
    for (const player of room.players.values()) {
      player.hasSubmittedSelection = false
    }

    io.to(room.code).emit('game_state_change', 'SELECTION')
    io.to(room.code).emit('players_update', toPublicPlayers(room))

    // Send cards again
    const content = getFilteredContent(room.isMature)
    io.to(room.code).emit('available_cards', content)
  }
}
