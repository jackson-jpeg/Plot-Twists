// server/handlers/room.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { SocketRateLimiter } from '../middleware/rateLimiter'
import type { Player, Room, RoomSettings } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'
import { isValidRoomCode, isValidNickname, isValidGameMode, sanitizeInput as sanitizeUserInput } from '../utils/validation'
import { initializeAudienceState } from '../services/audience.service'
import { validateCustomization } from '../services/scriptCustomization.service'
import { validateAudioSettings, createDefaultAudioSettings } from '../services/audio.service'
import { STANDARD_PACK_ID } from '../services/cardpack.service'
import { startScriptGeneration } from './game.helpers'
import { calculateResults, allBallotsIn } from '../services/voting.service'
import { mintReconnectToken } from '../utils/reconnectToken'
import { MAX_PLAYERS } from '../utils/constants'
import { requireHost } from '../socket/helpers'
import { toPublicPlayer, toPublicPlayers } from '../socket/serialize'
import * as roomService from '../services/room.service'
import * as matchmakingService from '../services/matchmaking.service'
import { logger } from '@/lib/logger'
import { isBetaFeatureEnabled } from '@/lib/betaFeatures'

// Rate limiters (moved from server.ts)
const roomCreationLimiter = new SocketRateLimiter(10, 5 * 60 * 1000) // 10 rooms per 5 minutes
const joinRoomLimiter = new SocketRateLimiter(30, 60 * 1000) // 30 joins per minute

// Sanitize user input
function sanitizeInput(input: string): string {
  return sanitizeUserInput(input, 50)
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Create room
  socket.on('create_room', withErrorHandler(socket, 'create_room', (settings, callback) => {
    // Rate limiting
    if (!roomCreationLimiter.check(socket.id)) {
      logger.warn(`Rate limit exceeded for room creation: ${socket.id}`)
      callback({ success: false, error: 'Too many room creation attempts. Please try again later.' })
      return
    }

    try {
      const code = roomService.generateRoomCode()
      const isSoloMode = settings.gameMode === 'SOLO'
      const { token: reconnectToken, hash: reconnectHash } = mintReconnectToken()
      const hostPlayer: Player = {
        id: uuidv4(),
        publicId: uuidv4(),
        nickname: isSoloMode ? 'You' : 'Host',
        role: isSoloMode ? 'PLAYER' : 'HOST', // In Solo mode, host is the player
        isHost: true,
        socketId: socket.id,
        // Chunk 2 item 5a — VERIFIED identity first. This read
        // `playerSessionId ?? userId ?? legacy_uuid`, i.e. the client-asserted string outranked
        // the Clerk subject the auth middleware had just verified. Any client could therefore
        // pin its own seat identity and, with 5b's old lookup, hand that identity to anyone.
        // `sessionId` is now only a hint for recognising a returning client; the reconnect
        // token below is what actually reclaims the seat.
        sessionId: socket.data.userId ?? socket.data.playerSessionId ?? `legacy_${uuidv4()}`,
        uid: socket.data.userId ?? undefined,
        reconnectHash,
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

      // Public games
      if (settings.isPublic) {
        room.isPublic = true
        room.publicTitle = settings.publicTitle || undefined
        room.autoStart = true
      }

      roomService.createRoom(room)
      socket.join(code)

      // Broadcast to public room watchers
      if (room.isPublic) {
        matchmakingService.broadcastPublicRooms(io)
      }

      logger.info(`Room created: ${code} (host: ${room.hostUid || 'unknown'})${room.isPublic ? ' [PUBLIC]' : ''}`)
      callback({ success: true, code, reconnectToken })
      socket.emit('room_created', code)
    } catch (error) {
      logger.error('Error creating room:', error)
      callback({ success: false, error: 'Failed to create room' })
    }
  }))

  // Join room
  socket.on('join_room', withErrorHandler(socket, 'join_room', (roomCode, nickname, callback) => {
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
      const maxPlayers = MAX_PLAYERS[room.gameMode]
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
      const { token: reconnectToken, hash: reconnectHash } = mintReconnectToken()
      const player: Player = {
        id: uuidv4(),
        publicId: uuidv4(),
        nickname: sanitizedNickname,
        role: isRoomFull ? 'SPECTATOR' : 'PLAYER',
        isHost: false,
        socketId: socket.id,
        // Chunk 2 item 5a — VERIFIED identity first. This read
        // `playerSessionId ?? userId ?? legacy_uuid`, i.e. the client-asserted string outranked
        // the Clerk subject the auth middleware had just verified. Any client could therefore
        // pin its own seat identity and, with 5b's old lookup, hand that identity to anyone.
        // `sessionId` is now only a hint for recognising a returning client; the reconnect
        // token below is what actually reclaims the seat.
        sessionId: socket.data.userId ?? socket.data.playerSessionId ?? `legacy_${uuidv4()}`,
        uid: socket.data.userId ?? undefined,
        reconnectHash,
        score: 0
      }

      roomService.addPlayer(room, player)
      socket.join(upperRoomCode)

      const playersList = Array.from(room.players.values())
      // D2b: `player_joined` shipped the full Player too — the same leak as players_update,
      // one line below it, and part of why this had to be fixed at the boundary.
      io.to(upperRoomCode).emit('player_joined', toPublicPlayer(player))
      io.to(upperRoomCode).emit('players_update', toPublicPlayers(room))

      const roomSettings: RoomSettings = {
        isMature: room.isMature,
        gameMode: room.gameMode
      }

      logger.info(`${player.role === 'SPECTATOR' ? 'Spectator' : 'Player'} "${sanitizedNickname}" (ID: ${player.id}) successfully joined room ${upperRoomCode}`)
      logger.debug(`Total players in room: ${playersList.length}`, playersList.map(p => p.nickname))

      callback({
        success: true,
        publicId: player.publicId,
        players: toPublicPlayers(room),
        settings: roomSettings,
        role: player.role,
        // Handed over exactly once, in an ack (one socket), never in an event (whole room).
        reconnectToken,
      })

      // Check auto-start for public rooms
      if (room.isPublic) {
        matchmakingService.syncAutoStart(room, io)
        matchmakingService.broadcastPublicRooms(io)
      }
    } catch (error) {
      logger.error('Error joining room:', error)
      callback({ success: false, error: 'Failed to join room' })
    }
  }))

  socket.on('leave_room', withErrorHandler(socket, 'leave_room', async (roomCode, callback) => {
    const upperRoomCode = roomCode?.toUpperCase()
    if (!upperRoomCode) {
      callback({ success: false, error: 'Room code is required' })
      return
    }

    const room = roomService.getRoomFromCache(upperRoomCode)
    if (!room) {
      callback({ success: true })
      return
    }

    const playerEntry = Array.from(room.players.entries()).find(([, player]) => player.socketId === socket.id)
    if (!playerEntry) {
      callback({ success: true })
      return
    }

    const [playerId, player] = playerEntry
    socket.leave(upperRoomCode)

    if (player.isHost) {
      logger.info(`Host "${player.nickname}" ended room ${upperRoomCode}`)

      for (const remainingPlayer of room.players.values()) {
        if (remainingPlayer.id === playerId) continue
        const remainingSocket = io.sockets.sockets.get(remainingPlayer.socketId)
        if (!remainingSocket) continue
        remainingSocket.emit('kicked', { reason: 'The host ended the game' })
        remainingSocket.leave(upperRoomCode)
      }

      roomService.clearAllRoomTimeouts(upperRoomCode)
      matchmakingService.cleanupRoom(upperRoomCode)
      await roomService.deleteRoom(upperRoomCode)
      if (room.isPublic) {
        matchmakingService.broadcastPublicRooms(io)
      }

      callback({ success: true })
      return
    }

    roomService.removePlayer(room, playerId)
    io.to(upperRoomCode).emit('player_left', player.publicId)
    io.to(upperRoomCode).emit('players_update', toPublicPlayers(room))

    if (room.isPublic) {
      matchmakingService.syncAutoStart(room, io)
      matchmakingService.broadcastPublicRooms(io)
    }

    if (room.gameState === 'SELECTION') {
      const remainingPlayers = Array.from(room.players.values()).filter(p => p.role === 'PLAYER' && !p.isHost)
      const allSubmitted = remainingPlayers.length > 0 && remainingPlayers.every(p => p.hasSubmittedSelection)
      if (allSubmitted && room.players.size > 1) {
        logger.info(`All remaining players submitted after ${player.nickname} left room ${upperRoomCode}, starting script generation`)
        void startScriptGeneration(room, io).catch(err => logger.error(`Script generation error in room ${upperRoomCode}:`, err))
      }
    }

    if (room.gameState === 'VOTING' && allBallotsIn(room)) {
      logger.info(`All remaining players voted after ${player.nickname} left room ${upperRoomCode}, calculating results`)
      void calculateResults(room, io)
    }

    callback({ success: true })
  }))

  // Get room preview (for join page)
  socket.on('get_room_preview', withErrorHandler(socket, 'get_room_preview', (roomCode, callback) => {
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
      const maxPlayers = MAX_PLAYERS[room.gameMode]

      callback({
        success: true,
        preview: {
          gameMode: room.gameMode,
          playerCount: activePlayers.length,
          maxPlayers,
          isMature: room.isMature,
          gameState: room.gameState,
          hostName: room.host.nickname,
          players: activePlayers.slice(0, 6).map(p => ({ nickname: p.nickname }))
        }
      })
    } catch (error) {
      logger.error('Error getting room preview:', error)
      callback({ success: false, error: 'Failed to get room info' })
    }
  }))

  // Update room settings
  socket.on('update_room_settings', withErrorHandler(socket, 'update_room_settings', (roomCode, settings) => {
    const room = roomService.getRoomFromCache(roomCode)
    if (!room) return
    if (!requireHost(room, socket)) return

    if (settings.isMature !== undefined) {
      room.isMature = Boolean(settings.isMature)
    }
    if (settings.gameMode !== undefined && isValidGameMode(settings.gameMode)) {
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
      io.to(roomCode).emit('players_update', toPublicPlayers(room))
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
    // Feature 8: Public Games
    if (settings.isPublic !== undefined) {
      if (settings.isPublic && !isBetaFeatureEnabled('publicMatchmaking')) {
        socket.emit('game_error_message', 'Public matchmaking is disabled for this beta build.')
        return
      }
      room.isPublic = settings.isPublic
      room.autoStart = settings.isPublic
      if (!settings.isPublic) {
        matchmakingService.cancelAutoCountdown(roomCode)
      } else {
        matchmakingService.syncAutoStart(room, io)
      }
    }
    if (settings.publicTitle !== undefined) {
      room.publicTitle = settings.publicTitle ? sanitizeUserInput(settings.publicTitle, 100) : undefined
    }
    room.lastActivity = Date.now()
    roomService.updateRoom(room)

    const roomSettings: RoomSettings = {
      isMature: room.isMature,
      gameMode: room.gameMode,
      scriptCustomization: room.scriptCustomization,
      cardPackId: room.cardPackId,
      audioSettings: room.audioSettings,
      audienceInteractionEnabled: !!room.audienceInteraction,
      isPublic: room.isPublic,
      publicTitle: room.publicTitle,
    }
    io.to(roomCode).emit('room_settings_update', roomSettings)

    // Broadcast to public room watchers
    if (room.isPublic !== undefined) {
      matchmakingService.broadcastPublicRooms(io)
    }
  }))

  // List public rooms
  socket.on('list_public_rooms', withErrorHandler(socket, 'list_public_rooms', (filters, callback) => {
    try {
      if (!isBetaFeatureEnabled('publicMatchmaking')) {
        callback({ success: true, rooms: [] })
        return
      }
      const rooms = matchmakingService.getPublicRooms(filters || undefined)
      callback({ success: true, rooms })
    } catch (error) {
      logger.error('Error listing public rooms:', error)
      callback({ success: false, error: 'Failed to list rooms' })
    }
  }))

  // Subscribe to public rooms
  socket.on('subscribe_public_rooms', withErrorHandler(socket, 'subscribe_public_rooms', () => {
    if (!isBetaFeatureEnabled('publicMatchmaking')) return
    matchmakingService.subscribeToPublicRooms(socket)
  }))

  // Unsubscribe from public rooms
  socket.on('unsubscribe_public_rooms', withErrorHandler(socket, 'unsubscribe_public_rooms', () => {
    matchmakingService.unsubscribeFromPublicRooms(socket)
  }))

  // Quick play
  socket.on('quick_play', withErrorHandler(socket, 'quick_play', (request, callback) => {
    try {
      if (!isBetaFeatureEnabled('publicMatchmaking')) {
        callback({ success: false, error: 'Public matchmaking is disabled for this beta build' })
        return
      }

      // Auth required for public games
      if (!socket.data.uid) {
        callback({ success: false, error: 'Sign in to join public games' })
        return
      }

      const gameMode = (request.gameMode && isValidGameMode(request.gameMode)) ? request.gameMode : 'ENSEMBLE'
      const isMature = request.isMature === true

      // Try to find an existing matching room
      const existingRoom = matchmakingService.findMatchingRoom(gameMode, isMature)
      if (existingRoom) {
        callback({ success: true, code: existingRoom.code })
        return
      }

      // Create a new public room
      const code = roomService.generateRoomCode()
      const { token: reconnectToken, hash: reconnectHash } = mintReconnectToken()
      const hostPlayer: Player = {
        id: uuidv4(),
        publicId: uuidv4(),
        nickname: 'Host',
        role: 'HOST',
        isHost: true,
        socketId: socket.id,
        // Chunk 2 item 5a — VERIFIED identity first. This read
        // `playerSessionId ?? userId ?? legacy_uuid`, i.e. the client-asserted string outranked
        // the Clerk subject the auth middleware had just verified. Any client could therefore
        // pin its own seat identity and, with 5b's old lookup, hand that identity to anyone.
        // `sessionId` is now only a hint for recognising a returning client; the reconnect
        // token below is what actually reclaims the seat.
        sessionId: socket.data.userId ?? socket.data.playerSessionId ?? `legacy_${uuidv4()}`,
        uid: socket.data.userId ?? undefined,
        reconnectHash,
      }

      const newRoom: Room = {
        code,
        host: hostPlayer,
        players: new Map([[hostPlayer.id, hostPlayer]]),
        gameState: 'LOBBY',
        gameMode,
        isMature,
        selections: new Map(),
        currentLineIndex: 0,
        isPaused: false,
        votes: new Map(),
        createdAt: Date.now(),
        lastActivity: Date.now(),
        hostUid: socket.data.uid ?? undefined,
        isPublic: true,
        autoStart: true,
        publicTitle: `Quick Play ${gameMode}`,
      }

      roomService.createRoom(newRoom)
      socket.join(code)

      // Broadcast update to public room watchers
      matchmakingService.broadcastPublicRooms(io)

      callback({ success: true, code, reconnectToken })
    } catch (error) {
      logger.error('Error in quick_play:', error)
      callback({ success: false, error: 'Failed to start quick play' })
    }
  }))

  // Cancel quick play
  socket.on('cancel_quick_play', withErrorHandler(socket, 'cancel_quick_play', () => {
    // No-op for now; room cleanup handles abandoned rooms
  }))

  // Host kick player
  socket.on('host_kick_player', withErrorHandler(socket, 'host_kick_player', (roomCode, playerId, callback) => {
    try {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }
      if (!requireHost(room, socket)) {
        callback({ success: false, error: 'Only the host can kick players' })
        return
      }
      const player = room.players.get(playerId)
      if (!player) {
        callback({ success: false, error: 'Player not found' })
        return
      }
      if (player.isHost) {
        callback({ success: false, error: 'Cannot kick the host' })
        return
      }

      // Notify the kicked player
      const kickedSocket = io.sockets.sockets.get(player.socketId)
      if (kickedSocket) {
        kickedSocket.emit('kicked', { reason: 'You were removed by the host' })
        kickedSocket.leave(roomCode)
      }

      roomService.removePlayer(room, playerId)
      io.to(roomCode).emit('players_update', toPublicPlayers(room))

      // Update public room listings
      if (room.isPublic) {
        matchmakingService.broadcastPublicRooms(io)
      }

      callback({ success: true })
    } catch (error) {
      logger.error('Error kicking player:', error)
      callback({ success: false, error: 'Failed to kick player' })
    }
  }))
}
