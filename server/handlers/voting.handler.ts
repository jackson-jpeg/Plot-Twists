// server/handlers/voting.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import type { Player } from '@/lib/types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { calculateResults, allBallotsIn } from '../services/voting.service'
import * as roomService from '../services/room.service'
import { toPublicPlayer, toPublicPlayers, findByPublicId } from '../socket/serialize'

export function registerVotingHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Submit vote
  // D2b: the target is now a publicId, not the internal Player.id — the internal id is no
  // longer broadcast, so a client has no way to name it. `findByPublicId` maps it back
  // server-side. The publicId identifies a SEAT, never the caller: the voter is still
  // resolved from the socket, so holding someone else's publicId does not let you vote as them.
  socket.on('submit_vote', withErrorHandler(socket, 'submit_vote', (roomCode, targetPublicId) => {
    if (typeof roomCode !== 'string' || typeof targetPublicId !== 'string') return

    const room = roomService.getRoomFromCache(roomCode)
    if (!room) return

    // Only allow voting during VOTING phase
    if (room.gameState !== 'VOTING') return

    // Find voter by socket ID
    let voterId: string | undefined
    let voter: Player | undefined
    for (const [id, player] of room.players.entries()) {
      if (player.socketId === socket.id) {
        voterId = id
        voter = player
        break
      }
    }

    if (!voterId || !voter) return

    // Chunk 2 item 6 — the VOTER is now role-checked, not just the target.
    //
    // Only the target was ever checked, so anyone holding a socket in the room could vote:
    // spectators included. That is not a hypothetical seat. ENSEMBLE caps PLAYER seats at 6
    // and `join_room` SILENTLY demotes the 7th joiner to SPECTATOR while still returning
    // success:true (room.handler.ts:172) — so an overflow joiner who believes they are
    // playing gets a ballot, and in a close round decides the winner.
    //
    // `PLAYER` is the right filter rather than "not SPECTATOR": in non-SOLO modes the host
    // holds role 'HOST' (room.handler.ts:48), does not perform, and has nothing to be judged
    // on. When the host opts into playing, update_room_settings flips that same field to
    // 'PLAYER' (room.handler.ts:341) and the ballot follows automatically.
    if (voter.role !== 'PLAYER') return

    // Validate target is an actual player in the room with PLAYER role
    const resolved = findByPublicId(room, targetPublicId)
    if (!resolved) return
    const { playerId: targetPlayerId, player: target } = resolved
    if (target.role !== 'PLAYER') return

    // Prevent self-voting — compared on internal ids, after resolution
    if (voterId === targetPlayerId) return

    room.votes.set(voterId, targetPlayerId)
    voter.hasSubmittedVote = true
    room.lastActivity = Date.now()
    roomService.updateRoom(room)

    io.to(roomCode).emit('players_update', toPublicPlayers(room))

    // Every ballot that can still arrive has arrived. Disconnected players are not waited on —
    // see allBallotsIn (Chunk 2 item 4).
    if (allBallotsIn(room)) {
      calculateResults(room, io)
    }
  }))
}
