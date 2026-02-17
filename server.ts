import 'dotenv/config'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import express from 'express'
import cors from 'cors'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Room,
  Player,
  CardSelection,
  RoomSettings,
  Script,
  ScriptLine,
  AudienceReactionType,
  ScriptCustomization,
  AudioSettings,
  CardPack,
  SoundEffectType,
  NewGameOptions,
  AdminRoomInfo,
  AdminRoomPlayer,
  UserProfile
} from './lib/types'
import { calculateLineDisplayTime } from './server/utils/timing'
import { getFilteredContent, getGreenRoomQuestion } from './lib/content'
import { v4 as uuidv4 } from 'uuid'
import { configureSecurityMiddleware, validateEnvironment } from './server/middleware/security'
import { generateScript } from './server/services/scriptGeneration.service'
import { startTeleprompterSync } from './server/services/teleprompter.service'
import { calculateResults } from './server/services/voting.service'
import { extractJSON } from './server/utils/jsonExtractor'
import { SocketRateLimiter } from './server/middleware/rateLimiter'
import { sanitizeInput as sanitizeUserInput, isValidRoomCode, isValidNickname } from './server/utils/validation'
import { withErrorHandler } from './server/middleware/socketErrorHandler'

// Room Service (write-through Firestore cache)
import * as roomService from './server/services/room.service'

// Feature Services
import {
  initializeAudienceState,
  recordReaction,
  canSendReaction,
  startPlotTwist,
  votePlotTwist,
  finalizePlotTwist,
  generateTwistInjection,
  resetReactionCounts,
  preGenerateTwistsForRoom,
  regenerateTwistsForRoom,
  generateAITwistInjection,
  canSendSpectatorMessage,
  recordSpectatorMessage
} from './server/services/audience.service'
import {
  buildCustomizationPrompt,
  getMaxTokens,
  getLineCountRange,
  validateCustomization
} from './server/services/scriptCustomization.service'
import {
  listCardPacks,
  getCardPack,
  createCardPack,
  updateCardPack,
  deleteCardPack,
  rateCardPack,
  incrementDownloads,
  searchCardPacks,
  getFeaturedPacks,
  initializeCardPackService,
  STANDARD_PACK_ID
} from './server/services/cardpack.service'
import { initializeDatabase, getDatabase, Collections } from './server/db'
import {
  enhanceScriptWithAudio,
  validateAudioSettings,
  getSoundEffectUrl,
  getAmbienceTrack,
  createDefaultAudioSettings
} from './server/services/audio.service'
import {
  saveGame,
  getGame,
  getGameByShareCode,
  getPlayerGames,
  shareGame
} from './server/services/gameHistory.service'
import {
  getPlayerStats,
  recordGameResult,
  getLeaderboard
} from './server/services/playerStats.service'
import { generateTitleCard } from './server/services/image.service'
import { checkAndDeductCredit, getCredits, addBankedCredits, deductBankedCredits } from './server/services/credit.service'
import { getReferralInfo, redeemReferralCode } from './server/services/referral.service'
import { deleteUser, verifyIdToken } from './server/services/user.service'
import { authenticateRequest } from './server/middleware/auth'
import { recordTransaction, getUserTransactions } from './server/services/payment.service'
import { createSocketAuthMiddleware } from './server/middleware/socketAuth'
import { isAdminUser } from './lib/admin'
import { CREDIT_PACKAGES } from './lib/credits'
import { logger } from './lib/logger'

// Validate environment on startup
validateEnvironment()

const dev = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Timeouts are now managed by roomService


// Socket.io rate limiters
const roomCreationLimiter = new SocketRateLimiter(10, 5 * 60 * 1000) // 10 rooms per 5 minutes
const scriptGenerationLimiter = new SocketRateLimiter(20, 10 * 60 * 1000) // 20 scripts per 10 minutes
const joinRoomLimiter = new SocketRateLimiter(30, 60 * 1000) // 30 joins per minute
const reactionLimiter = new SocketRateLimiter(60, 60 * 1000) // 60 reactions per minute
const cardPackLimiter = new SocketRateLimiter(5, 60 * 1000) // 5 pack operations per minute


// Sanitize user input (use enhanced version from utils)
function sanitizeInput(input: string): string {
  return sanitizeUserInput(input, 50)
}

// Validate room exists and return it, or emit error and return null
function validateRoom(roomCode: string, socket: { emit: (event: 'error', message: string) => void }): Room | null {
  if (!roomCode || !isValidRoomCode(roomCode)) {
    socket.emit('error', 'Invalid room code')
    return null
  }
  const room = roomService.getRoomFromCache(roomCode.toUpperCase())
  if (!room) {
    socket.emit('error', 'Room not found')
    return null
  }
  return room
}

/** Verify socket is a member of the room (player or host) */
function requireRoomMember(room: Room, socket: { id: string }): boolean {
  if (room.host.socketId === socket.id) return true
  for (const player of room.players.values()) {
    if (player.socketId === socket.id) return true
  }
  return false
}

/** Verify socket is the host */
function requireHost(room: Room, socket: { id: string }): boolean {
  return room.host.socketId === socket.id
}

/** Check if socket belongs to an admin user */
function isAdminSocket(socket: { data: Record<string, unknown> }): boolean {
  const email = socket.data.email as string | null | undefined
  const phone = socket.data.phoneNumber as string | null | undefined
  return isAdminUser({ email, phoneNumber: phone })
}

// Room cleanup is now handled by roomService.startRoomCleanup()

// generateScript, startTeleprompterSync, calculateResults, and extractJSON
// are now imported from their respective service modules.
function getAllowedOrigins(): string[] {
  if (dev) return ['http://localhost:3000', 'http://localhost:3001']
  const origins = [
    'https://plot-twists.com',
    'https://www.plot-twists.com',
    'https://web-production-c7981.up.railway.app',
    'capacitor://localhost',
    'ionic://localhost'
  ]
  const envOrigins = process.env.ALLOWED_ORIGINS
  if (envOrigins) {
    envOrigins.split(',').forEach(o => { if (o.trim()) origins.push(o.trim()) })
  }
  return origins
}

const VERCEL_PREVIEW_REGEX = /^https:\/\/plot-twists(-[a-z0-9-]+)*\.vercel\.app$/

function isAllowedOrigin(origin: string): boolean {
  if (getAllowedOrigins().includes(origin)) return true
  if (!dev && VERCEL_PREVIEW_REGEX.test(origin)) return true
  return false
}

app.prepare().then(async () => {
  // Initialize database and services
  await initializeDatabase()
  await roomService.loadRoomsFromFirestore()
  roomService.startRoomCleanup()
  await initializeCardPackService()

  const expressApp = express()

  // Express-level CORS middleware (ensures ALL responses have CORS headers, not just Socket.IO)
  expressApp.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (isAllowedOrigin(origin)) return callback(null, true)
      logger.warn(`Express CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  // Configure security middleware
  configureSecurityMiddleware(expressApp)

  const server = createServer(expressApp)

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (isAllowedOrigin(origin)) return callback(null, true)
        logger.warn(`Socket.IO CORS blocked origin: ${origin}`)
        callback(new Error('Not allowed by CORS'))
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    allowUpgrades: true
  })

  logger.info(`Socket.IO configured for ${dev ? 'development' : 'production'} mode`)
  logger.info(`Transports: polling + websocket`)

  // Apply Firebase auth middleware to socket connections
  io.use(createSocketAuthMiddleware())

  io.on('connection', (socket) => {
    logger.info('Client connected:', socket.id)

    // Create room
    socket.on('create_room', (settings, callback) => {
      // Rate limiting
      if (!roomCreationLimiter.check(socket.id)) {
        logger.warn(`Rate limit exceeded for room creation: ${socket.id}`)
        callback({ success: false, error: 'Too many room creation attempts. Please try again later.' })
        return
      }

      try {
        const code = roomService.generateRoomCode()
        const isSoloMode = settings.gameMode === 'SOLO'
        const hostPlayer: Player = {
          id: uuidv4(),
          nickname: isSoloMode ? 'You' : 'Host',
          role: isSoloMode ? 'PLAYER' : 'HOST', // In Solo mode, host is the player
          isHost: true,
          socketId: socket.id
        }

        const room: Room = {
          code,
          host: hostPlayer,
          players: new Map([[hostPlayer.id, hostPlayer]]),
          gameState: 'LOBBY',
          gameMode: settings.gameMode || 'ENSEMBLE',
          isMature: settings.isMature || false,
          selections: new Map(),
          currentLineIndex: 0,
          isPaused: false,
          votes: new Map(),
          createdAt: Date.now(),
          lastActivity: Date.now(),
          // Feature 1: Audience Interaction
          audienceInteraction: settings.audienceInteractionEnabled ? initializeAudienceState() : undefined,
          // Feature 2: Script Customization
          scriptCustomization: settings.scriptCustomization || undefined,
          // Feature 3: Card Pack
          cardPackId: settings.cardPackId || STANDARD_PACK_ID,
          // Feature 4: Audio Settings
          audioSettings: settings.audioSettings || createDefaultAudioSettings()
        }

        // Store Firebase UID of host for credit deduction
        room.hostUid = socket.data.uid ?? undefined

        roomService.createRoom(room)
        socket.join(code)

        logger.info(`Room created: ${code} (host: ${room.hostUid || 'unknown'})`)
        callback({ success: true, code })
        socket.emit('room_created', code)
      } catch (error) {
        logger.error('Error creating room:', error)
        callback({ success: false, error: 'Failed to create room' })
      }
    })

    // Join room
    socket.on('join_room', (roomCode, nickname, callback) => {
      // Rate limiting
      if (!joinRoomLimiter.check(socket.id)) {
        logger.warn(`Rate limit exceeded for join room: ${socket.id}`)
        callback({ success: false, error: 'Too many join attempts. Please slow down.' })
        return
      }

      try {
        // Validate room code format
        if (!isValidRoomCode(roomCode)) {
          logger.info(`Invalid room code format: ${roomCode}`)
          callback({ success: false, error: 'Invalid room code format' })
          return
        }

        // Validate nickname
        if (!isValidNickname(nickname)) {
          logger.info(`Invalid nickname: ${nickname}`)
          callback({ success: false, error: 'Invalid nickname. Please use 1-50 characters.' })
          return
        }

        const upperRoomCode = roomCode.toUpperCase()
        logger.debug(`Join attempt - Room: ${upperRoomCode}, Nickname: ${nickname}`)
        logger.debug(`Available rooms: ${roomService.getActiveRoomCount()} active`)

        const room = roomService.getRoomFromCache(upperRoomCode)
        if (!room) {
          logger.info(`Room ${upperRoomCode} not found!`)
          callback({ success: false, error: 'Room not found' })
          return
        }

        // Check if game already started
        if (room.gameState !== 'LOBBY') {
          callback({ success: false, error: 'Game already in progress' })
          return
        }

        const sanitizedNickname = sanitizeInput(nickname)
        if (!sanitizedNickname) {
          logger.info(`Invalid nickname: ${nickname}`)
          callback({ success: false, error: 'Invalid nickname' })
          return
        }

        // Check player limits based on game mode
        const currentPlayerCount = Array.from(room.players.values()).filter(p => p.role === 'PLAYER').length
        const maxPlayers = room.gameMode === 'SOLO' ? 1 : room.gameMode === 'HEAD_TO_HEAD' ? 2 : 6
        const isRoomFull = currentPlayerCount >= maxPlayers

        // Check for duplicate nicknames
        const nicknameExists = Array.from(room.players.values()).some(p =>
          p.nickname.toLowerCase() === sanitizedNickname.toLowerCase()
        )
        if (nicknameExists) {
          callback({ success: false, error: 'Nickname already taken in this room' })
          return
        }

        // Join as SPECTATOR if room is full, otherwise as PLAYER
        const player: Player = {
          id: uuidv4(),
          nickname: sanitizedNickname,
          role: isRoomFull ? 'SPECTATOR' : 'PLAYER',
          isHost: false,
          socketId: socket.id,
          score: 0
        }

        roomService.addPlayer(room, player)
        socket.join(upperRoomCode)

        const playersList = Array.from(room.players.values())
        io.to(upperRoomCode).emit('player_joined', player)
        io.to(upperRoomCode).emit('players_update', playersList)

        const roomSettings: RoomSettings = {
          isMature: room.isMature,
          gameMode: room.gameMode
        }

        logger.info(`${player.role === 'SPECTATOR' ? 'Spectator' : 'Player'} "${sanitizedNickname}" (ID: ${player.id}) successfully joined room ${upperRoomCode}`)
        logger.debug(`Total players in room: ${playersList.length}`, playersList.map(p => p.nickname))

        callback({
          success: true,
          players: playersList,
          settings: roomSettings,
          role: player.role
        })
      } catch (error) {
        logger.error('Error joining room:', error)
        callback({ success: false, error: 'Failed to join room' })
      }
    })

    // Submit card selections
    socket.on('submit_cards', (roomCode, selections, callback) => {
      try {
        const room = roomService.getRoomFromCache(roomCode)
        if (!room) {
          callback({ success: false, error: 'Room not found' })
          return
        }

        // Find player by socket ID
        let playerId: string | undefined
        for (const [id, player] of room.players.entries()) {
          if (player.socketId === socket.id) {
            playerId = id
            break
          }
        }

        if (!playerId) {
          callback({ success: false, error: 'Player not found' })
          return
        }

        room.selections.set(playerId, selections)
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
            startScriptGeneration(room, io)
          }
          return
        }

        // Ensemble/Head-to-Head: Check if all players have submitted (exclude spectators)
        const allSubmitted = Array.from(room.players.values())
          .filter(p => p.role === 'PLAYER')
          .every(p => p.hasSubmittedSelection)

        if (allSubmitted && room.players.size > 1) {
          // Start script generation
          startScriptGeneration(room, io)
        }
      } catch (error) {
        logger.error('Error submitting cards:', error)
        callback({ success: false, error: 'Failed to submit selections' })
      }
    })

    // Start game
    socket.on('start_game', withErrorHandler(socket, 'start_game', (roomCode) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room) return
      if (!requireHost(room, socket)) return

      room.gameState = 'SELECTION'
      room.lastActivity = Date.now()
      roomService.updateRoom(room)
      io.to(roomCode).emit('game_state_change', 'SELECTION')

      // Send available cards to all players
      const content = getFilteredContent(room.isMature)
      io.to(roomCode).emit('available_cards', content)
    }))

    // Submit vote
    socket.on('submit_vote', withErrorHandler(socket, 'submit_vote', (roomCode, targetPlayerId) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room) return

      // Find voter by socket ID
      let voterId: string | undefined
      for (const [id, player] of room.players.entries()) {
        if (player.socketId === socket.id) {
          voterId = id
          break
        }
      }

      if (!voterId) return

      room.votes.set(voterId, targetPlayerId)
      const voter = room.players.get(voterId)
      if (voter) {
        voter.hasSubmittedVote = true
      }
      room.lastActivity = Date.now()
      roomService.updateRoom(room)

      io.to(roomCode).emit('players_update', Array.from(room.players.values()))

      // Check if all players have voted (spectators can vote but don't block completion)
      const allVoted = Array.from(room.players.values())
        .filter(p => p.role === 'PLAYER')
        .every(p => p.hasSubmittedVote)

      if (allVoted) {
        calculateResults(room, io)
      }
    }))

    // Advance script line
    socket.on('advance_script_line', withErrorHandler(socket, 'advance_script_line', (roomCode) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room || !room.script) return
      if (!requireHost(room, socket)) return

      room.currentLineIndex++
      room.lastActivity = Date.now()
      roomService.updateRoom(room, true) // debounced - high frequency
      io.to(roomCode).emit('sync_teleprompter', room.currentLineIndex)
    }))

    // Pause script
    socket.on('pause_script', withErrorHandler(socket, 'pause_script', (roomCode) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room || !room.script) return
      if (!requireHost(room, socket)) return

      room.isPaused = true
      room.lastActivity = Date.now()

      // Clear the current timeout
      const timeout = roomService.getRoomTimeout(roomCode)
      if (timeout) {
        clearTimeout(timeout)
        roomService.clearRoomTimeout(roomCode)
      }

      logger.debug(`Script paused for room ${roomCode}`)
    }))

    // Resume script
    socket.on('resume_script', withErrorHandler(socket, 'resume_script', (roomCode) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room || !room.script) return
      if (!requireHost(room, socket)) return

      room.isPaused = false
      room.lastActivity = Date.now()

      logger.debug(`Script resumed for room ${roomCode}`)

      // Restart teleprompter from current line using smart timing
      const advanceLine = (lineIndex: number) => {
        if (room.isPaused) return

        if (!room.script || lineIndex >= room.script.lines.length - 1) {
          roomService.clearRoomTimeout(room.code)
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
        const readingTimeMs = calculateLineDisplayTime(currentLine)

        const timeout = setTimeout(() => {
          if (!room.script) return
          room.currentLineIndex++
          io.to(room.code).emit('sync_teleprompter', {
            lineIndex: room.currentLineIndex,
            serverTimestamp: Date.now(),
            expectedDuration: room.script.lines[room.currentLineIndex]
              ? calculateLineDisplayTime(room.script.lines[room.currentLineIndex])
              : undefined
          })
          advanceLine(room.currentLineIndex)
        }, readingTimeMs)

        roomService.setRoomTimeout(room.code, timeout)
      }

      advanceLine(room.currentLineIndex)
    }))

    // Jump to specific line (host control)
    socket.on('jump_to_line', withErrorHandler(socket, 'jump_to_line', (roomCode, lineIndex) => {
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

      // If not paused, restart timer for new line using smart timing
      if (!room.isPaused) {
        const advanceLine = (currentLineIndex: number) => {
          if (room.isPaused) return

          if (!room.script || currentLineIndex >= room.script.lines.length - 1) {
            roomService.clearRoomTimeout(room.code)
            if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
              room.gameState = 'VOTING'
              io.to(room.code).emit('game_state_change', 'VOTING')
            } else {
              room.gameState = 'RESULTS'
              io.to(room.code).emit('game_state_change', 'RESULTS')
            }
            return
          }

          const currentLine = room.script.lines[currentLineIndex]
          const readingTimeMs = calculateLineDisplayTime(currentLine)

          const newTimeout = setTimeout(() => {
            if (!room.script) return
            room.currentLineIndex++
            io.to(room.code).emit('sync_teleprompter', {
              lineIndex: room.currentLineIndex,
              serverTimestamp: Date.now(),
              expectedDuration: room.script.lines[room.currentLineIndex]
                ? calculateLineDisplayTime(room.script.lines[room.currentLineIndex])
                : undefined
            })
            advanceLine(room.currentLineIndex)
          }, readingTimeMs)

          roomService.setRoomTimeout(room.code, newTimeout)
        }

        advanceLine(lineIndex)
      }
    }))

    // Player jump to line (synced navigation - all clients move together)
    socket.on('player_jump_to_line', withErrorHandler(socket, 'player_jump_to_line', (roomCode, lineIndex) => {
      const room = validateRoom(roomCode, socket)
      if (!room || room.gameState !== 'PERFORMING' || !room.script) return

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
      setTimeout(() => {
        if (room.gameState === 'PERFORMING' && !room.isPaused && room.script) {
          startTeleprompterSync(room, io)
        }
      }, 500)
    }))

    // Request sequel
    socket.on('request_sequel', async (roomCode) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room || !room.script) {
        logger.info(`Cannot generate sequel: room or script not found for ${roomCode}`)
        return
      }
      if (!requireHost(room, socket)) return

      logger.info(`Sequel requested for room ${roomCode}`)

      // Credit gate: deduct 1 credit from host before generating sequel
      if (room.hostUid) {
        try {
          const creditResult = await checkAndDeductCredit(room.hostUid)
          if (!creditResult.success) {
            logger.info(`Insufficient credits for sequel: host ${room.hostUid} in room ${roomCode}`)
            io.to(roomCode).emit('insufficient_credits', { needed: 1, available: 0 })
            return
          }
          // Emit updated balance to host
          const balance = await getCredits(room.hostUid)
          const hostSocket = io.sockets.sockets.get(room.host.socketId)
          if (hostSocket) {
            hostSocket.emit('credit_balance', balance)
          }
        } catch (creditError) {
          logger.error(`Credit check failed for sequel host ${room.hostUid}:`, creditError)
          io.to(roomCode).emit('error', 'Failed to verify credits. Please try again.')
          return
        }
      } else if (!dev) {
        logger.warn(`Sequel blocked: no hostUid for room ${roomCode}`)
        io.to(roomCode).emit('error', 'Authentication required to generate scripts.')
        return
      }

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

        // Start ambience if enabled
        if (room.audioSettings?.ambienceEnabled) {
          const ambienceTrack = getAmbienceTrack(chosenSetting)
          io.to(roomCode).emit('ambience_start', ambienceTrack)
        }

        logger.info(`Sequel generated: "${finalScript.title}"`)

        // Start teleprompter sync
        startTeleprompterSync(room, io)
      } catch (error) {
        logger.error('Sequel generation failed:', error)
        io.to(roomCode).emit('error', 'Failed to generate sequel. Please try again.')

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
    })

    // Request new game (keeps players in room, no page reload)
    socket.on('request_new_game', withErrorHandler(socket, 'request_new_game', (roomCode, options?: NewGameOptions) => {
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
      room.lastActivity = Date.now()

      // Clear votes
      room.votes.clear()

      // Reset player state
      for (const player of room.players.values()) {
        player.hasSubmittedVote = false
        player.hasSubmittedSelection = false
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

    // Get room preview (for join page)
    socket.on('get_room_preview', (roomCode, callback) => {
      try {
        if (!isValidRoomCode(roomCode)) {
          callback({ success: false, error: 'Invalid room code format' })
          return
        }

        const room = roomService.getRoomFromCache(roomCode.toUpperCase())
        if (!room) {
          callback({ success: false, error: 'Room not found' })
          return
        }

        // Count active players (excluding host and spectators in non-solo modes)
        const activePlayers = Array.from(room.players.values()).filter(p =>
          room.gameMode === 'SOLO' ? p.isHost : (p.role === 'PLAYER' && !p.isHost)
        )
        const maxPlayers = room.gameMode === 'SOLO' ? 1 : room.gameMode === 'HEAD_TO_HEAD' ? 2 : 6

        callback({
          success: true,
          preview: {
            gameMode: room.gameMode,
            playerCount: activePlayers.length,
            maxPlayers,
            isMature: room.isMature,
            gameState: room.gameState
          }
        })
      } catch (error) {
        logger.error('Error getting room preview:', error)
        callback({ success: false, error: 'Failed to get room info' })
      }
    })

    // Update room settings
    socket.on('update_room_settings', withErrorHandler(socket, 'update_room_settings', (roomCode, settings) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room) return
      if (!requireHost(room, socket)) return

      if (settings.isMature !== undefined) {
        room.isMature = settings.isMature
      }
      if (settings.gameMode !== undefined) {
        room.gameMode = settings.gameMode
        // Update host role when switching to/from Solo mode
        if (settings.gameMode === 'SOLO') {
          room.host.role = 'PLAYER'
          room.host.nickname = 'You'
        } else if (room.host.role === 'PLAYER') {
          // Switching away from Solo mode, revert host role
          room.host.role = 'HOST'
          room.host.nickname = 'Host'
        }
        // Update the host in the players map
        room.players.set(room.host.id, room.host)
        io.to(roomCode).emit('players_update', Array.from(room.players.values()))
      }
      // Feature 2: Script Customization
      if (settings.scriptCustomization !== undefined) {
        room.scriptCustomization = validateCustomization(settings.scriptCustomization)
      }
      // Feature 3: Card Pack
      if (settings.cardPackId !== undefined) {
        room.cardPackId = settings.cardPackId
      }
      // Feature 4: Audio Settings
      if (settings.audioSettings !== undefined) {
        room.audioSettings = validateAudioSettings(settings.audioSettings)
      }
      // Feature 1: Audience Interaction
      if (settings.audienceInteractionEnabled !== undefined) {
        if (settings.audienceInteractionEnabled && !room.audienceInteraction) {
          room.audienceInteraction = initializeAudienceState()
        } else if (!settings.audienceInteractionEnabled) {
          room.audienceInteraction = undefined
        }
      }
      room.lastActivity = Date.now()
      roomService.updateRoom(room)

      const roomSettings: RoomSettings = {
        isMature: room.isMature,
        gameMode: room.gameMode,
        scriptCustomization: room.scriptCustomization,
        cardPackId: room.cardPackId,
        audioSettings: room.audioSettings,
        audienceInteractionEnabled: !!room.audienceInteraction
      }
      io.to(roomCode).emit('room_settings_update', roomSettings)
    }))

    // ============================================================
    // FEATURE 1: Audience Interaction Events
    // ============================================================

    // Send audience reaction
    socket.on('send_audience_reaction', withErrorHandler(socket, 'send_audience_reaction', (roomCode, reactionType) => {
      // Rate limiting
      if (!reactionLimiter.check(socket.id)) {
        return
      }

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
        sender.nickname
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

      const message = recordSpectatorMessage(
        room.audienceInteraction,
        text,
        sender.id,
        sender.nickname,
        isPreset
      )

      if (message) {
        room.lastActivity = Date.now()
        io.to(roomCode).emit('spectator_message_received', message)
      }
    }))

    // Start a plot twist vote
    socket.on('start_plot_twist', withErrorHandler(socket, 'start_plot_twist', (roomCode) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room || !room.audienceInteraction) return
      if (room.gameState !== 'PERFORMING') return

      // Only host can start plot twists
      if (room.host.socketId !== socket.id) return

      // Check if there's already an active twist
      if (room.audienceInteraction.activePlotTwist?.isActive) return

      // Use pre-generated AI twists if available (pass roomCode)
      const twist = startPlotTwist(room.audienceInteraction, 15000, roomCode) // 15 seconds to vote
      room.lastActivity = Date.now()

      // Emit dramatic sound effect when twist starts
      io.to(roomCode).emit('play_sound_effect', 'plot_twist_trigger' as SoundEffectType)

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
          io.to(roomCode).emit('error', 'Plot twist failed — the show goes on!')
        } finally {
          roomService.clearPlotTwistTimeout(roomCode)
        }
      }, 15000)

      roomService.setPlotTwistTimeout(roomCode, timeout)
    }))

    // Vote on a plot twist option
    socket.on('vote_plot_twist', withErrorHandler(socket, 'vote_plot_twist', (roomCode, optionId) => {
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

    // ============================================================
    // FEATURE 3: Card Pack Events
    // ============================================================

    // List available card packs
    socket.on('list_card_packs', async (callback) => {
      try {
        const packs = await listCardPacks()
        callback({ success: true, packs })
      } catch (error) {
        logger.error('Error listing card packs:', error)
        callback({ success: false, error: 'Failed to list card packs' })
      }
    })

    // Select a card pack for the room
    socket.on('select_card_pack', async (roomCode, packId, callback) => {
      try {
        const room = roomService.getRoomFromCache(roomCode)
        if (!room) {
          callback({ success: false, error: 'Room not found' })
          return
        }

        // Only host can select packs
        if (room.host.socketId !== socket.id) {
          callback({ success: false, error: 'Only the host can select card packs' })
          return
        }

        // Verify pack exists
        if (packId !== STANDARD_PACK_ID && !(await getCardPack(packId))) {
          callback({ success: false, error: 'Card pack not found' })
          return
        }

        room.cardPackId = packId
        room.lastActivity = Date.now()
        roomService.updateRoom(room)

        // Increment download count for custom packs
        if (packId !== STANDARD_PACK_ID) {
          await incrementDownloads(packId)
        }

        const pack = packId !== STANDARD_PACK_ID ? await getCardPack(packId) : null
        io.to(roomCode).emit('card_pack_selected', packId, pack?.name || 'Standard Pack')
        callback({ success: true })
      } catch (error) {
        logger.error('Error selecting card pack:', error)
        callback({ success: false, error: 'Failed to select card pack' })
      }
    })

    // Create a new card pack
    socket.on('create_card_pack', async (packData, callback) => {
      // Rate limiting
      if (!cardPackLimiter.check(socket.id)) {
        callback({ success: false, error: 'Too many requests. Please wait a moment.' })
        return
      }

      try {
        const result = await createCardPack(packData)
        callback(result)
      } catch (error) {
        logger.error('Error creating card pack:', error)
        callback({ success: false, error: 'Failed to create card pack' })
      }
    })

    // Rate a card pack
    socket.on('rate_card_pack', async (packId, rating, callback) => {
      // Rate limiting
      if (!cardPackLimiter.check(socket.id)) {
        callback({ success: false, error: 'Too many requests. Please wait a moment.' })
        return
      }

      try {
        const result = await rateCardPack(packId, rating)
        callback(result)
      } catch (error) {
        logger.error('Error rating card pack:', error)
        callback({ success: false, error: 'Failed to rate card pack' })
      }
    })

    // Update a card pack
    socket.on('update_card_pack', async (packId, updates, callback) => {
      // Rate limiting
      if (!cardPackLimiter.check(socket.id)) {
        callback({ success: false, error: 'Too many requests. Please wait a moment.' })
        return
      }

      try {
        const result = await updateCardPack(packId, updates)
        callback(result)
      } catch (error) {
        logger.error('Error updating card pack:', error)
        callback({ success: false, error: 'Failed to update card pack' })
      }
    })

    // Delete a card pack
    socket.on('delete_card_pack', async (packId, callback) => {
      // Rate limiting
      if (!cardPackLimiter.check(socket.id)) {
        callback({ success: false, error: 'Too many requests. Please wait a moment.' })
        return
      }

      try {
        const result = await deleteCardPack(packId)
        callback(result)
      } catch (error) {
        logger.error('Error deleting card pack:', error)
        callback({ success: false, error: 'Failed to delete card pack' })
      }
    })

    // Search card packs
    socket.on('search_card_packs', async (query, callback) => {
      try {
        const packs = await searchCardPacks(query)
        callback({ success: true, packs })
      } catch (error) {
        logger.error('Error searching card packs:', error)
        callback({ success: false, error: 'Failed to search card packs' })
      }
    })

    // Get featured packs
    socket.on('get_featured_packs', async (limit, callback) => {
      try {
        const packs = await getFeaturedPacks(limit)
        callback({ success: true, packs })
      } catch (error) {
        logger.error('Error getting featured packs:', error)
        callback({ success: false, error: 'Failed to get featured packs' })
      }
    })

    // Get a specific card pack
    socket.on('get_card_pack', async (packId, callback) => {
      try {
        const pack = await getCardPack(packId)
        if (pack) {
          callback({ success: true, pack })
        } else {
          callback({ success: false, error: 'Pack not found' })
        }
      } catch (error) {
        logger.error('Error getting card pack:', error)
        callback({ success: false, error: 'Failed to get card pack' })
      }
    })

    // ============================================================
    // FEATURE 4: Audio Events
    // ============================================================

    // Update audio settings
    socket.on('update_audio_settings', withErrorHandler(socket, 'update_audio_settings', (roomCode, settings) => {
      const room = validateRoom(roomCode, socket)
      if (!room) return

      // Only host can change audio settings
      if (room.host.socketId !== socket.id) return

      room.audioSettings = validateAudioSettings({
        ...room.audioSettings,
        ...settings
      })
      room.lastActivity = Date.now()

      io.to(roomCode).emit('audio_settings_update', room.audioSettings)
    }))

    // Trigger sound effect (host only)
    socket.on('trigger_sound_effect', withErrorHandler(socket, 'trigger_sound_effect', (roomCode, effect) => {
      const room = validateRoom(roomCode, socket)
      if (!room) return

      // Only host can trigger sound effects
      if (room.host.socketId !== socket.id) return

      if (!room.audioSettings?.soundEffectsEnabled) return

      room.lastActivity = Date.now()
      io.to(roomCode).emit('play_sound_effect', effect)
    }))

    // Request line audio (for TTS)
    socket.on('request_line_audio', withErrorHandler(socket, 'request_line_audio', (roomCode, lineIndex, callback) => {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room || !room.script) {
        callback({ success: false, error: 'Room or script not found' })
        return
      }

      if (!room.audioSettings?.voiceEnabled) {
        callback({ success: false, error: 'Voice is not enabled' })
        return
      }

      // For now, return a placeholder - actual TTS would require external API
      // Browser TTS will be handled client-side
      const line = room.script.lines[lineIndex]
      if (!line) {
        callback({ success: false, error: 'Line not found' })
        return
      }

      // Return success - client will use browser TTS
      callback({ success: true, audioUrl: undefined })
    }))

    // ============================================================
    // FEATURE 5: Game History Events
    // ============================================================

    // Get game history for a player
    socket.on('get_game_history', async (playerId, limit, callback) => {
      try {
        const games = await getPlayerGames(playerId, limit)
        callback({ success: true, games })
      } catch (error) {
        logger.error('Error fetching game history:', error)
        callback({ success: false, error: 'Failed to load game history' })
      }
    })

    // Get specific game details (supports both share codes and UUIDs)
    socket.on('get_game_details', async (gameId, callback) => {
      try {
        // Try share code lookup first (8-char alphanumeric), then fall back to UUID
        let game = await getGameByShareCode(gameId)
        if (!game) {
          game = await getGame(gameId)
        }
        if (!game) {
          callback({ success: false, error: 'Game not found' })
          return
        }
        callback({ success: true, game })
      } catch (error) {
        logger.error('Error fetching game details:', error)
        callback({ success: false, error: 'Failed to load game' })
      }
    })

    // Share a game
    socket.on('share_game', async (gameId, callback) => {
      try {
        const result = await shareGame(gameId)
        if (result.success && result.shareCode) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://plottwists.app'
          callback({
            success: true,
            shareUrl: `${baseUrl}/replay/${result.shareCode}`
          })
        } else {
          callback({ success: false, error: result.error })
        }
      } catch (error) {
        logger.error('Error sharing game:', error)
        callback({ success: false, error: 'Failed to share game' })
      }
    })

    // ============================================================
    // FEATURE 6: Player Stats Events
    // ============================================================

    // Get player stats
    socket.on('get_player_stats', async (playerId, callback) => {
      try {
        const stats = await getPlayerStats(playerId)
        callback({ success: true, stats })
      } catch (error) {
        logger.error('Error fetching player stats:', error)
        callback({ success: false, error: 'Failed to load stats' })
      }
    })

    // Get leaderboard
    socket.on('get_leaderboard', async (category, limit, callback) => {
      try {
        const entries = await getLeaderboard(category, limit)
        callback({ success: true, entries })
      } catch (error) {
        logger.error('Error fetching leaderboard:', error)
        callback({ success: false, error: 'Failed to load leaderboard' })
      }
    })

    // ============================================================
    // Credit System
    // ============================================================

    socket.on('get_credit_balance', async (callback) => {
      try {
        const uid = socket.data.uid
        if (!uid) {
          callback({ success: false, error: 'Not authenticated' })
          return
        }
        const balance = await getCredits(uid)
        callback({ success: true, balance })
      } catch (error) {
        logger.error('Error fetching credit balance:', error)
        callback({ success: false, error: 'Failed to load credits' })
      }
    })

    // ============================================================
    // Referral System
    // ============================================================

    socket.on('get_referral_info', async (callback) => {
      try {
        const uid = socket.data.uid
        if (!uid) {
          callback({ success: false, error: 'Not authenticated' })
          return
        }
        const info = await getReferralInfo(uid)
        callback({ success: true, ...info })
      } catch (error) {
        logger.error('Error fetching referral info:', error)
        callback({ success: false, error: 'Failed to load referral info' })
      }
    })

    socket.on('redeem_referral', async (code, callback) => {
      try {
        const uid = socket.data.uid
        if (!uid) {
          callback({ success: false, error: 'Not authenticated' })
          return
        }
        const result = await redeemReferralCode(uid, code)
        callback(result)
      } catch (error) {
        logger.error('Error redeeming referral:', error)
        callback({ success: false, error: 'Failed to redeem referral code' })
      }
    })

    // ============================================================
    // Admin Dashboard Events
    // ============================================================

    socket.on('check_admin', (callback) => {
      callback({ isAdmin: isAdminSocket(socket) })
    })

    socket.on('admin_get_rooms', (callback) => {
      if (!isAdminSocket(socket)) {
        callback({ success: false, rooms: [] })
        return
      }
      const rooms: AdminRoomInfo[] = []
      for (const [code, room] of roomService.getRoomEntries()) {
        const players = Array.from(room.players.values())
        rooms.push({
          code,
          hostNickname: room.host.nickname,
          playerCount: players.filter(p => p.role === 'PLAYER').length,
          spectatorCount: players.filter(p => p.role === 'SPECTATOR').length,
          gameState: room.gameState,
          createdAt: room.createdAt,
          gameMode: room.gameMode,
          scriptTitle: room.script?.title,
          players: players.map(p => ({
            id: p.id,
            nickname: p.nickname,
            role: p.role,
            isHost: p.isHost,
          })),
        })
      }
      callback({ success: true, rooms })
    })

    socket.on('admin_get_users', async (query, callback) => {
      if (!isAdminSocket(socket)) {
        callback({ success: false, users: [], total: 0 })
        return
      }
      try {
        const db = getDatabase()
        const limit = query.limit || 20
        const offset = query.offset || 0
        const allUsers = await db.query<UserProfile>(Collections.USERS, [], {
          orderBy: 'lastSeenAt',
          orderDirection: 'desc',
          limit: 200,
        })
        let filtered = allUsers
        if (query.search) {
          const s = query.search.toLowerCase()
          filtered = allUsers.filter(u =>
            u.displayName?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s) ||
            u.phoneNumber?.includes(s) ||
            u.uid?.toLowerCase().includes(s)
          )
        }
        const total = filtered.length
        const page = filtered.slice(offset, offset + limit)
        const users = page.map(u => ({
          uid: u.uid,
          displayName: u.displayName || 'Unknown',
          email: u.email,
          phoneNumber: u.phoneNumber,
          linkedAccounts: u.linkedAccounts || [],
          credits: {
            free: Math.max(0, (u.credits?.free?.limit ?? 5) - (u.credits?.free?.used ?? 0)),
            banked: u.credits?.banked ?? 0,
          },
          lastSeenAt: u.lastSeenAt || 0,
        }))
        callback({ success: true, users, total })
      } catch (error) {
        logger.error('[Admin] Error fetching users:', error)
        callback({ success: false, users: [], total: 0 })
      }
    })

    socket.on('admin_get_stats', async (callback) => {
      if (!isAdminSocket(socket)) {
        callback({ success: false, stats: { activeRooms: 0, connectedSockets: 0, totalUsersInRooms: 0, gamesPlayedToday: 0, recentGameModes: {}, totalRegisteredUsers: 0 } })
        return
      }
      try {
        const rooms = Array.from(roomService.getRoomEntries())
        const activeRooms = rooms.length
        const connectedSockets = io.sockets.sockets.size
        let totalUsersInRooms = 0
        const recentGameModes: Record<string, number> = {}
        for (const [, room] of rooms) {
          totalUsersInRooms += room.players.size
          recentGameModes[room.gameMode] = (recentGameModes[room.gameMode] || 0) + 1
        }

        // Count games played today
        let gamesPlayedToday = 0
        let totalRegisteredUsers = 0
        const db = getDatabase()
        try {
          const todayStart = new Date()
          todayStart.setHours(0, 0, 0, 0)
          const todayGames = await db.query(Collections.GAME_HISTORY, [
            { field: 'playedAt', operator: '>=', value: todayStart.getTime() }
          ], { limit: 1000 })
          gamesPlayedToday = todayGames.length
        } catch {
          // Game history query may fail in dev — that's fine
        }
        try {
          const allUsers = await db.query(Collections.USERS, [], { limit: 10000 })
          totalRegisteredUsers = allUsers.length
        } catch {
          // Users query may fail in dev
        }

        callback({
          success: true,
          stats: { activeRooms, connectedSockets, totalUsersInRooms, gamesPlayedToday, recentGameModes, totalRegisteredUsers }
        })
      } catch (error) {
        logger.error('[Admin] Error fetching stats:', error)
        callback({ success: false, stats: { activeRooms: 0, connectedSockets: 0, totalUsersInRooms: 0, gamesPlayedToday: 0, recentGameModes: {}, totalRegisteredUsers: 0 } })
      }
    })

    socket.on('admin_kick_player', (roomCode, playerId, callback) => {
      if (!isAdminSocket(socket)) {
        callback({ success: false, error: 'Unauthorized' })
        return
      }
      const room = roomService.getRoomFromCache(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }
      const player = room.players.get(playerId)
      if (!player) {
        callback({ success: false, error: 'Player not found' })
        return
      }
      // Emit kicked event to the player's socket
      const playerSocket = io.sockets.sockets.get(player.socketId)
      if (playerSocket) {
        playerSocket.emit('kicked', { reason: 'Removed by admin' })
        playerSocket.disconnect(true)
      }
      roomService.removePlayer(room, playerId)
      io.to(roomCode).emit('player_left', playerId)
      io.to(roomCode).emit('players_update', Array.from(room.players.values()))
      logger.info(`[Admin] Kicked player ${player.nickname} (${playerId}) from room ${roomCode}`)
      callback({ success: true })
    })

    socket.on('admin_close_room', async (roomCode, callback) => {
      if (!isAdminSocket(socket)) {
        callback({ success: false, error: 'Unauthorized' })
        return
      }
      const room = roomService.getRoomFromCache(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }
      // Notify all players and disconnect them
      io.to(roomCode).emit('kicked', { reason: 'Room closed by admin' })
      // Disconnect all player sockets from the room
      for (const [, player] of room.players) {
        const playerSocket = io.sockets.sockets.get(player.socketId)
        if (playerSocket) {
          playerSocket.leave(roomCode)
          playerSocket.disconnect(true)
        }
      }
      await roomService.deleteRoom(roomCode)
      logger.info(`[Admin] Closed room ${roomCode} (${room.players.size} players disconnected)`)
      callback({ success: true })
    })

    socket.on('admin_add_credits', async (uid, amount, callback) => {
      if (!isAdminSocket(socket)) {
        callback({ success: false, error: 'Unauthorized' })
        return
      }
      if (!uid || !amount || amount <= 0 || amount > 1000) {
        callback({ success: false, error: 'Invalid uid or amount' })
        return
      }
      try {
        await addBankedCredits(uid, amount, 0)
        const balance = await getCredits(uid)
        // Notify the target user if they're connected
        for (const [, s] of io.sockets.sockets) {
          if (s.data.uid === uid) {
            s.emit('credit_balance', balance)
            break
          }
        }
        logger.info(`[Admin] Added ${amount} credits to user ${uid}`)
        callback({ success: true, newBalance: balance.total })
      } catch (error) {
        logger.error('[Admin] Error adding credits:', error)
        callback({ success: false, error: 'Failed to add credits' })
      }
    })

    // ============================================================
    // Latency Measurement
    // ============================================================

    // Respond to latency pong from client
    socket.on('latency_pong', withErrorHandler(socket, 'latency_pong', (serverTimestamp: number, clientTimestamp: number) => {
      const now = Date.now()
      const roundTripTime = now - serverTimestamp
      const latency = Math.round(roundTripTime / 2)

      // Send latency result back to client
      socket.emit('latency_pong_response', { latency })
    }))

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

              // If host left and room is still in lobby, allow others to continue
              // Only delete room if it's empty or has been too long
              if (player.isHost && room.gameState === 'LOBBY' && room.players.size === 0) {
                logger.info(`Deleting empty room ${code}`)
                roomService.clearAllRoomTimeouts(code)
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
      }, 3000) // 3 second grace period
    }))
  })

  // Helper function to start script generation
  async function startScriptGeneration(room: Room, io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
    // Rate limiting for script generation (use host socket ID)
    const hostSocketId = room.host.socketId
    if (!scriptGenerationLimiter.check(hostSocketId)) {
      logger.warn(`Script generation rate limit exceeded for room ${room.code}`)
      io.to(room.code).emit('error', 'Too many script generation requests. Please wait a moment.')
      room.gameState = 'SELECTION'
      io.to(room.code).emit('game_state_change', 'SELECTION')
      return
    }

    // Credit gate: deduct 1 credit from host before generating
    if (room.hostUid) {
      try {
        const creditResult = await checkAndDeductCredit(room.hostUid)
        if (!creditResult.success) {
          logger.info(`Insufficient credits for host ${room.hostUid} in room ${room.code}`)
          io.to(room.code).emit('insufficient_credits', { needed: 1, available: 0 })
          room.gameState = 'SELECTION'
          io.to(room.code).emit('game_state_change', 'SELECTION')
          return
        }
        // Emit updated balance to host
        const balance = await getCredits(room.hostUid)
        const hostSocket = io.sockets.sockets.get(room.host.socketId)
        if (hostSocket) {
          hostSocket.emit('credit_balance', balance)
        }
      } catch (creditError) {
        logger.error(`Credit check failed for host ${room.hostUid}:`, creditError)
        io.to(room.code).emit('error', 'Failed to verify credits. Please try again.')
        room.gameState = 'SELECTION'
        io.to(room.code).emit('game_state_change', 'SELECTION')
        return
      }
    } else if (!dev) {
      // In production, require authenticated host
      logger.warn(`Script generation blocked: no hostUid for room ${room.code}`)
      io.to(room.code).emit('error', 'Authentication required to generate scripts.')
      room.gameState = 'SELECTION'
      io.to(room.code).emit('game_state_change', 'SELECTION')
      return
    }

    room.gameState = 'LOADING'
    io.to(room.code).emit('game_state_change', 'LOADING')

    // Get all player selections
    const allSelections = Array.from(room.selections.values())
    if (allSelections.length === 0) {
      logger.error(`No selections found for room ${room.code}, cannot generate script`)
      io.to(room.code).emit('error', 'No card selections found. Please try again.')
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
      generateTitleCard(finalScript.title, finalScript.synopsis, chosenSetting)
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
      io.to(room.code).emit('error', 'Failed to generate script. Please try again.')

      // Reset game state to SELECTION so players can try again
      room.gameState = 'SELECTION'
      room.selections.clear()
      roomService.updateRoom(room)

      // Reset all player submission flags
      for (const player of room.players.values()) {
        player.hasSubmittedSelection = false
      }

      io.to(room.code).emit('game_state_change', 'SELECTION')
      io.to(room.code).emit('players_update', Array.from(room.players.values()))

      // Send cards again
      const content = getFilteredContent(room.isMature)
      io.to(room.code).emit('available_cards', content)
    }
  }


  // ============================================================
  // Stripe Routes (must be before Next.js catch-all)
  // ============================================================

  // Lazy-initialized Stripe client (shared across webhook + checkout routes)
  const Stripe = (await import('stripe')).default
  let stripeClient: InstanceType<typeof Stripe> | null = null
  function getStripe(): InstanceType<typeof Stripe> | null {
    if (stripeClient) return stripeClient
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) return null
    stripeClient = new Stripe(key)
    return stripeClient
  }

  // Log Stripe configuration status on startup
  if (process.env.STRIPE_SECRET_KEY) {
    logger.info('[Stripe] Secret key configured')
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      logger.info('[Stripe] Webhook secret configured')
    } else {
      logger.warn('[Stripe] STRIPE_WEBHOOK_SECRET not set — webhooks will fail')
    }
  } else {
    logger.warn('[Stripe] STRIPE_SECRET_KEY not set — payments disabled')
  }

  // Persistent idempotency: check DB instead of in-memory Set
  const db = getDatabase()
  async function isStripeEventProcessed(eventId: string): Promise<boolean> {
    const existing = await db.get(Collections.STRIPE_EVENTS, eventId)
    return existing !== null
  }
  async function markStripeEventProcessed(eventId: string, eventType: string, userId?: string): Promise<void> {
    await db.set(Collections.STRIPE_EVENTS, eventId, {
      eventId,
      eventType,
      userId: userId || null,
      processedAt: new Date().toISOString()
    })
  }

  // Stripe webhook needs raw body — must be registered before express.json()
  expressApp.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      logger.error('[Stripe] STRIPE_WEBHOOK_SECRET not configured')
      res.status(500).json({ error: 'Webhook not configured' })
      return
    }

    try {
      const stripe = getStripe()
      if (!stripe) {
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)

      // Idempotency: skip already-processed events (Stripe retries on timeout)
      if (await isStripeEventProcessed(event.id)) {
        logger.info(`[Stripe] Skipping duplicate event ${event.id}`)
        res.json({ received: true })
        return
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: Record<string, string>; amount_total?: number | null; payment_intent?: string }
        const userId = session.metadata?.userId
        const scripts = parseInt(session.metadata?.scripts || '0', 10)
        const packageId = session.metadata?.packageId || ''
        const amountTotal = session.amount_total || 0

        if (userId && scripts > 0) {
          await markStripeEventProcessed(event.id, event.type, userId)
          await addBankedCredits(userId, scripts, amountTotal)

          // Record purchase transaction
          const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
          await recordTransaction({
            userId,
            type: 'purchase',
            stripeEventId: event.id,
            packageId,
            packageLabel: pkg?.label || packageId,
            creditsAdded: scripts,
            amountCents: amountTotal,
            status: 'completed'
          })

          // Emit updated balance to user's connected socket (if online)
          const balance = await getCredits(userId)
          for (const [, s] of io.sockets.sockets) {
            if (s.data.uid === userId) {
              s.emit('credit_balance', balance)
              break
            }
          }

          logger.info(`[Stripe] Fulfilled ${scripts} credits for user ${userId}`)
        }
      } else if (event.type === 'charge.refunded') {
        const charge = event.data.object as { metadata?: Record<string, string>; amount_refunded?: number; amount?: number; payment_intent?: string }
        const userId = charge.metadata?.userId
        const originalScripts = parseInt(charge.metadata?.scripts || '0', 10)
        const amountRefunded = charge.amount_refunded || 0
        const originalAmount = charge.amount || 1

        if (userId && originalScripts > 0 && amountRefunded > 0) {
          await markStripeEventProcessed(event.id, event.type, userId)

          // Proportional credit deduction (round down to avoid over-deducting)
          const creditsToDeduct = Math.min(
            Math.round((amountRefunded / originalAmount) * originalScripts),
            originalScripts
          )
          await deductBankedCredits(userId, creditsToDeduct)

          await recordTransaction({
            userId,
            type: 'refund',
            stripeEventId: event.id,
            packageId: charge.metadata?.packageId || '',
            packageLabel: 'Refund',
            creditsAdded: -creditsToDeduct,
            amountCents: -amountRefunded,
            status: 'completed'
          })

          // Emit updated balance
          const balance = await getCredits(userId)
          for (const [, s] of io.sockets.sockets) {
            if (s.data.uid === userId) {
              s.emit('credit_balance', balance)
              break
            }
          }

          logger.info(`[Stripe] Refund: deducted ${creditsToDeduct} credits from user ${userId}`)
        }
      } else if (event.type === 'checkout.session.expired') {
        const session = event.data.object as { metadata?: Record<string, string> }
        const userId = session.metadata?.userId
        await markStripeEventProcessed(event.id, event.type, userId)

        if (userId) {
          await recordTransaction({
            userId,
            type: 'expired',
            stripeEventId: event.id,
            packageId: session.metadata?.packageId || '',
            packageLabel: session.metadata?.packageId || 'Unknown',
            creditsAdded: 0,
            amountCents: 0,
            status: 'expired'
          })

          // Notify connected user
          for (const [, s] of io.sockets.sockets) {
            if (s.data.uid === userId) {
              s.emit('error', 'Your checkout session expired. No charges were made.')
              break
            }
          }
        }
      } else if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object as { metadata?: Record<string, string>; last_payment_error?: { message?: string } }
        const userId = intent.metadata?.userId
        await markStripeEventProcessed(event.id, event.type, userId)

        if (userId) {
          await recordTransaction({
            userId,
            type: 'failed',
            stripeEventId: event.id,
            packageId: intent.metadata?.packageId || '',
            packageLabel: intent.metadata?.packageId || 'Unknown',
            creditsAdded: 0,
            amountCents: 0,
            status: 'failed'
          })

          // Notify connected user
          for (const [, s] of io.sockets.sockets) {
            if (s.data.uid === userId) {
              s.emit('error', 'Payment failed. Please try again or use a different payment method.')
              break
            }
          }
        }
      }

      res.json({ received: true })
    } catch (error) {
      logger.error('[Stripe] Webhook error:', error)
      res.status(400).json({ error: 'Webhook signature verification failed' })
    }
  })

  // JSON body parser for other Stripe routes
  expressApp.use('/api/stripe', express.json())

  // Helper: get or create Stripe customer for a user
  async function getOrCreateStripeCustomer(stripe: InstanceType<typeof Stripe>, userId: string): Promise<string> {
    const user = await db.get<import('./lib/types').UserProfile>(Collections.USERS, userId)
    if (user?.stripeCustomerId) return user.stripeCustomerId

    const customer = await stripe.customers.create({
      metadata: { userId },
      email: user?.email || undefined,
      name: user?.displayName || undefined
    })

    await db.update(Collections.USERS, userId, { stripeCustomerId: customer.id })
    return customer.id
  }

  expressApp.post('/api/stripe/create-checkout-session', authenticateRequest, async (req, res) => {
    logger.info('[Stripe] Checkout session request received')
    const { packageId } = req.body
    const userId = req.user!.uid

    if (!packageId) {
      logger.error('[Stripe] Missing packageId in checkout request', { bodyKeys: Object.keys(req.body || {}) })
      res.status(400).json({ error: 'Missing packageId' })
      return
    }

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      logger.error(`[Stripe] Invalid packageId: ${packageId}`)
      res.status(400).json({ error: 'Invalid package' })
      return
    }

    try {
      const stripe = getStripe()
      if (!stripe) {
        logger.error('[Stripe] STRIPE_SECRET_KEY not set — cannot create checkout session')
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }

      // Determine base URL for redirects
      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || `http://localhost:${port}`

      // Get or create Stripe customer
      const customerId = await getOrCreateStripeCustomer(stripe, userId)

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        ui_mode: 'embedded',
        customer: customerId,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.label}`,
              description: `${pkg.scripts} script credits — use anytime, never expire`,
              images: ['https://plot-twists.com/icon.svg']
            },
            unit_amount: pkg.price
          },
          quantity: 1
        }],
        metadata: {
          userId,
          packageId: pkg.id,
          scripts: String(pkg.scripts)
        },
        payment_intent_data: {
          metadata: {
            userId,
            packageId: pkg.id,
            scripts: String(pkg.scripts)
          }
        },
        return_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`
      })

      res.json({ clientSecret: session.client_secret })
    } catch (error) {
      logger.error('[Stripe] Create checkout session error:', error)
      res.status(500).json({ error: 'Failed to create checkout session' })
    }
  })

  // Payment transaction history
  expressApp.get('/api/stripe/transactions', authenticateRequest, async (req, res) => {
    const userId = req.user!.uid

    try {
      const transactions = await getUserTransactions(userId)
      res.json({ transactions })
    } catch (error) {
      logger.error('[Stripe] Get transactions error:', error)
      res.status(500).json({ error: 'Failed to get transactions' })
    }
  })

  // Stripe Customer Portal session
  expressApp.post('/api/stripe/portal-session', authenticateRequest, async (req, res) => {
    const userId = req.user!.uid

    try {
      const stripe = getStripe()
      if (!stripe) {
        logger.error('[Stripe] STRIPE_SECRET_KEY not set — cannot create portal session')
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }

      const user = await db.get<import('./lib/types').UserProfile>(Collections.USERS, userId)
      if (!user?.stripeCustomerId) {
        res.status(400).json({ error: 'No Stripe customer found. Make a purchase first.' })
        return
      }

      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || `http://localhost:${port}`

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${origin}/profile`
      })

      res.json({ url: portalSession.url })
    } catch (error) {
      logger.error('[Stripe] Portal session error:', error)
      res.status(500).json({ error: 'Failed to create portal session' })
    }
  })

  // Checkout session status (for success page)
  expressApp.get('/api/stripe/session-status', async (req, res) => {
    const sessionId = req.query.session_id as string
    if (!sessionId) {
      res.status(400).json({ error: 'Missing session_id' })
      return
    }

    try {
      const stripe = getStripe()
      if (!stripe) {
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId)
      res.json({
        status: session.status,
        paymentStatus: session.payment_status,
        packageId: session.metadata?.packageId,
        scripts: session.metadata?.scripts,
        amountTotal: session.amount_total
      })
    } catch (error) {
      logger.error('[Stripe] Session status error:', error)
      res.status(500).json({ error: 'Failed to get session status' })
    }
  })

  // Game metadata API (used by Next.js generateMetadata for dynamic OG images)
  expressApp.get('/api/game/:shareCode', async (req, res) => {
    try {
      const { shareCode } = req.params
      let game = await getGameByShareCode(shareCode)
      if (!game) {
        game = await getGame(shareCode)
      }
      if (!game) {
        res.status(404).json({ error: 'Game not found' })
        return
      }
      res.json({
        title: game.title,
        synopsis: game.synopsis,
        gameMode: game.gameMode,
        players: game.players.map(p => ({
          nickname: p.nickname,
          character: p.character,
          isWinner: p.isWinner
        })),
        winner: game.winner,
        setting: game.setting,
        circumstance: game.circumstance,
        playedAt: game.playedAt,
        comedyStyle: game.comedyStyle
      })
    } catch (error) {
      logger.error('Error fetching game metadata:', error)
      res.status(500).json({ error: 'Failed to load game' })
    }
  })

  // ============================================================
  // Server-side Phone Auth via Twilio Verify
  // ============================================================
  expressApp.use('/api/auth', express.json())

  expressApp.post('/api/auth/send-code', async (req, res) => {
    const { phoneNumber } = req.body
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      res.status(400).json({ error: 'Missing phone number' })
      return
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !serviceSid) {
      logger.error('[Auth] Twilio env vars not configured')
      res.status(500).json({ error: 'SMS service not configured' })
      return
    }

    try {
      const twilio = await import('twilio')
      const client = twilio.default(accountSid, authToken)
      await client.verify.v2.services(serviceSid).verifications.create({
        to: phoneNumber,
        channel: 'sms',
      })
      res.json({ success: true })
    } catch (error) {
      logger.error('[Auth] Twilio send code error:', error)
      res.status(500).json({ error: 'Failed to send verification code' })
    }
  })

  expressApp.post('/api/auth/verify-code', async (req, res) => {
    const { phoneNumber, code, mode, idToken } = req.body
    if (!phoneNumber || !code) {
      res.status(400).json({ error: 'Missing phone number or code' })
      return
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !serviceSid) {
      res.status(500).json({ error: 'SMS service not configured' })
      return
    }

    try {
      const twilio = await import('twilio')
      const client = twilio.default(accountSid, authToken)
      const check = await client.verify.v2.services(serviceSid).verificationChecks.create({
        to: phoneNumber,
        code,
      })

      if (check.status !== 'approved') {
        res.status(400).json({ error: 'Invalid code' })
        return
      }

      const admin = await import('firebase-admin')
      if (admin.apps.length === 0) {
        res.status(500).json({ error: 'Firebase Admin not initialized' })
        return
      }

      // Link mode: attach phone to existing user
      if (mode === 'link' && idToken) {
        try {
          const decoded = await admin.auth().verifyIdToken(idToken)
          await admin.auth().updateUser(decoded.uid, { phoneNumber })
          const customToken = await admin.auth().createCustomToken(decoded.uid)
          res.json({ success: true, customToken })
          return
        } catch (linkError) {
          logger.error('[Auth] Link phone error:', linkError)
          res.status(400).json({ error: 'Failed to link phone number' })
          return
        }
      }

      // Sign-in mode: find or create Firebase user by phone
      let uid: string
      try {
        const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber)
        uid = userRecord.uid
      } catch {
        const newUser = await admin.auth().createUser({ phoneNumber })
        uid = newUser.uid
      }

      const customToken = await admin.auth().createCustomToken(uid)
      res.json({ success: true, customToken })
    } catch (error) {
      logger.error('[Auth] Verify code error:', error)
      res.status(500).json({ error: 'Verification failed' })
    }
  })

  // ============================================================
  // Apple In-App Purchase
  // ============================================================

  expressApp.post('/api/apple/verify-transaction', authenticateRequest, async (req, res) => {
    const { signedTransaction } = req.body
    const userId = req.user!.uid
    if (!signedTransaction) {
      res.status(400).json({ error: 'Missing signedTransaction' })
      return
    }

    try {
      const { verifyTransaction } = await import('./server/services/apple.service')
      const result = await verifyTransaction(signedTransaction)

      if (!result.success || !result.credits || !result.transactionId) {
        res.status(400).json({ error: result.error || 'Verification failed' })
        return
      }

      // Check for duplicate transaction
      const existingTxn = await db.get(Collections.PAYMENT_TRANSACTIONS, `apple_${result.transactionId}`)
      if (existingTxn) {
        res.json({ success: true, credits: result.credits, alreadyProcessed: true })
        return
      }

      // Grant credits (spendCents=0 because Apple handles pricing)
      await addBankedCredits(userId, result.credits, 0)

      // Record transaction
      const appleModule = await import('./server/services/apple.service')
      await recordTransaction({
        userId,
        type: 'purchase',
        stripeEventId: `apple_${result.transactionId}`,
        amountCents: 0, // Apple handles pricing
        creditsAdded: result.credits,
        packageId: result.productId || '',
        packageLabel: result.productId ? appleModule.APPLE_PRODUCTS[result.productId]?.label || '' : '',
        status: 'completed',
      })

      // Store transaction ID to prevent duplicates
      await db.set(Collections.PAYMENT_TRANSACTIONS, `apple_${result.transactionId}`, {
        userId,
        transactionId: result.transactionId,
        productId: result.productId,
        credits: result.credits,
        processedAt: Date.now(),
      })

      logger.info(`[Apple] Granted ${result.credits} credits to user ${userId}`)
      res.json({ success: true, credits: result.credits })
    } catch (error) {
      logger.error('[Apple] Verify transaction error:', error)
      res.status(500).json({ error: 'Failed to verify transaction' })
    }
  })

  expressApp.post('/api/apple/webhook', async (req, res) => {
    const { signedPayload } = req.body
    if (!signedPayload) {
      res.status(400).json({ error: 'Missing signedPayload' })
      return
    }

    try {
      const { handleServerNotification } = await import('./server/services/apple.service')
      const result = await handleServerNotification(signedPayload)

      if (result.type === 'REFUND' || result.type === 'REVOKE') {
        // Handle refund/revocation — could deduct credits if needed
        logger.warn(`[Apple] ${result.type} notification for transaction ${result.transactionId}`)
      }

      res.json({ success: true })
    } catch (error) {
      logger.error('[Apple] Webhook error:', error)
      res.status(500).json({ error: 'Webhook processing failed' })
    }
  })

  // ============================================================
  // Account Deletion
  // ============================================================

  expressApp.post('/api/account/delete', authenticateRequest, async (req, res) => {
    try {
      const result = await deleteUser(req.user!.uid)
      if (!result.success) {
        res.status(404).json({ error: result.error })
        return
      }
      res.json({ success: true })
    } catch (error) {
      logger.error('[Account] Delete error:', error)
      res.status(500).json({ error: 'Failed to delete account' })
    }
  })

  // Handle Next.js requests
  expressApp.use((req, res) => {
    const parsedUrl = parse(req.url!, true)
    return handle(req, res, parsedUrl)
  })

  server.listen(port, () => {
    logger.info(`> Ready on http://${hostname}:${port}`)
  })
})
