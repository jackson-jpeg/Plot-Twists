// server/handlers/admin.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import type { AdminRoomInfo, UserProfile } from '@/lib/types'
import { isAdminSocket } from '../socket/helpers'
import { getDatabase, Collections } from '../db'
import { addBankedCredits, getCredits } from '../services/credit.service'
import * as roomService from '../services/room.service'
import * as matchmakingService from '../services/matchmaking.service'
import { logger } from '@/lib/logger'

export function registerAdminHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Check admin status
  socket.on('check_admin', withErrorHandler(socket, 'check_admin', (callback) => {
    callback({ isAdmin: isAdminSocket(socket) })
  }))

  // Get all rooms
  socket.on('admin_get_rooms', withErrorHandler(socket, 'admin_get_rooms', (callback) => {
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
  }))

  // Get users
  socket.on('admin_get_users', withErrorHandler(socket, 'admin_get_users', async (query, callback) => {
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
  }))

  // Get stats
  socket.on('admin_get_stats', withErrorHandler(socket, 'admin_get_stats', async (callback) => {
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
        totalRegisteredUsers = await db.count(Collections.USERS)
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
  }))

  // Kick player (admin)
  socket.on('admin_kick_player', withErrorHandler(socket, 'admin_kick_player', (roomCode, playerId, callback) => {
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
  }))

  // Close room (admin)
  socket.on('admin_close_room', withErrorHandler(socket, 'admin_close_room', async (roomCode, callback) => {
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
    roomService.clearRoomTimeout(roomCode)
    roomService.clearPlotTwistTimeout(roomCode)
    matchmakingService.cleanupRoom(roomCode)
    await roomService.deleteRoom(roomCode)
    logger.info(`[Admin] Closed room ${roomCode} (${room.players.size} players disconnected)`)
    callback({ success: true })
  }))

  // Add credits (admin)
  socket.on('admin_add_credits', withErrorHandler(socket, 'admin_add_credits', async (uid, amount, callback) => {
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
  }))

  // Latency pong
  socket.on('latency_pong', withErrorHandler(socket, 'latency_pong', (serverTimestamp: number, clientTimestamp: number) => {
    const now = Date.now()
    const roundTripTime = now - serverTimestamp
    const latency = Math.round(roundTripTime / 2)

    // Send latency result back to client
    socket.emit('latency_pong_response', { latency })
  }))
}
