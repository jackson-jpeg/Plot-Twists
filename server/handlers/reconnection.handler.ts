// server/handlers/reconnection.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import * as roomService from '../services/room.service'
import type { Player, Room, RoomRecoverySnapshot } from '@/lib/types'
import { logger } from '@/lib/logger'
import { toPublicPlayer, toPublicPlayers, findByPublicId } from '../socket/serialize'
import { toSelectedCards } from '../services/cardCatalog.service'
import { cancelHostMigration } from '../services/hostMigration.service'

export async function buildRoomRecoverySnapshot(room: Room, playerId: string, player: Player): Promise<RoomRecoverySnapshot> {
  const hostDisconnected = room.gameState === 'PERFORMING' && room.host.connected === false

  // Names -> pickable options, so the "Your Scene" recap survives a reconnect.
  // Reverse lookup on trusted server-side names, never on wire input.
  const stored = room.selections.get(playerId)
  const selection = stored ? await toSelectedCards(room, stored) : undefined

  return {
    gameState: room.gameState,
    players: toPublicPlayers(room),
    script: room.script ?? null,
    currentLineIndex: room.currentLineIndex,
    scriptImageUrl: room.script?.imageUrl ?? null,
    isPaused: room.isPaused,
    hostDisconnected,
    myPlayerId: playerId,
    roomCode: room.code,
    assignedCharacter: player.assignedCharacter,
    myRole: player.role,
    hasSubmittedSelection: player.hasSubmittedSelection,
    selection,
    spectatorMessages: room.audienceInteraction?.spectatorMessages ?? [],
    votingStatus: {
      hasVoted: !!room.votes.get(playerId),
      deadline: room.gameState === 'VOTING' ? room.votingDeadline : undefined,
    },
    results: room.results ?? null,
    directorsReview: room.directorsReview ?? null,
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
}

export function registerReconnectionHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  socket.on('rejoin_room', withErrorHandler(socket, 'rejoin_room', async (roomCode: string, reconnectToken: string, callback) => {
    if (!roomCode) {
      callback({ success: false, error: 'Missing roomCode' })
      return
    }

    const upperCode = roomCode.toUpperCase()
    const room = roomService.getRoomFromCache(upperCode)
    if (!room) {
      callback({ success: false, error: 'Room not found' })
      return
    }

    // Chunk 2 item 5. Exactly two things can reclaim a seat now, in this order.
    //
    // What this replaced accepted a client-chosen string — `playerSessionId` — as identity, so
    // `rejoin_room(code, 'session-alice')` took Alice's seat from any socket at all, and the
    // second lookup in the chain would also accept the internal playerId that `players_update`
    // used to broadcast to the whole room. Two accepted credentials, neither issued by us.
    //
    // 1. A VERIFIED Clerk subject on this socket, matched against the seat's `uid`. This is
    //    5a's precedence fix: something the auth middleware proved outranks anything the client
    //    merely asserts, so an authenticated player needs no token at all.
    const verifiedUid = (socket.data.userId ?? socket.data.uid) as string | undefined
    let found = verifiedUid ? roomService.findPlayerInRoomByUid(upperCode, verifiedUid) : null

    // 2. Otherwise the server-issued reconnect token, which is how a GUEST proves a seat — and
    //    most players are guests, since tokenless connections are allowed by design
    //    (socketAuth.ts:48). Compared against a per-seat hash; see utils/reconnectToken.ts.
    if (!found && typeof reconnectToken === 'string' && reconnectToken) {
      found = roomService.findPlayerInRoomByReconnectToken(upperCode, reconnectToken)
    }

    if (!found) {
      // Deliberately does not distinguish "no such seat" from "wrong token". The old message
      // ("Player not found in room") told an attacker which room codes had live seats worth
      // attacking.
      logger.warn(`[Reconnect] Rejected rejoin for room ${upperCode} from socket ${socket.id}`)
      callback({ success: false, error: 'Could not verify your seat in this room' })
      return
    }

    const { playerId, player } = found

    // Reconnect: cancel grace timer, update socketId, mark connected
    const result = roomService.markPlayerReconnected(upperCode, playerId, socket.id)
    if (!result) {
      callback({ success: false, error: 'Reconnection failed' })
      return
    }
    // NOT re-pinning `sessionId` from the handshake any more. That line let a reconnecting
    // client rewrite the seat's stored identity to whatever string it sent, which is the same
    // trust-the-client mistake one level down. `sessionId` is a hint; the seat is already
    // proven by the time we get here.

    // Join socket to the room channel
    socket.join(upperCode)

    // Update handler context
    ctx.socketId = socket.id
    ctx.userId = player.uid ?? ctx.userId

    logger.info(`Player ${player.nickname} reconnected to room ${upperCode} (new socket: ${socket.id})`)

    // Notify room of reconnection
    io.to(upperCode).emit('player_reconnected', { name: player.nickname })
    io.to(upperCode).emit('players_update', toPublicPlayers(room))

    // The host got back inside the migration window — stand the promotion down.
    // migrateHost also re-checks `room.host.connected` before firing, so this is belt and
    // braces rather than the only guard, but clearing the timer keeps a stale callback from
    // sitting on the room for the rest of the window.
    if (player.isHost) {
      cancelHostMigration(upperCode)
    }

    // If host reconnected during PERFORMING and room was paused due to disconnect, auto-resume
    if (player.isHost && room.gameState === 'PERFORMING' && room.isPaused) {
      room.isPaused = false
      roomService.updateRoom(room)
      io.to(upperCode).emit('performance_resumed')
      logger.info(`Auto-resumed performance in room ${upperCode} after host reconnect`)
    }

    const snapshot = await buildRoomRecoverySnapshot(room, playerId, player)

    callback({ success: true, snapshot })
  }))
}
