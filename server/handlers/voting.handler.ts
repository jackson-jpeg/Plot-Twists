// server/handlers/voting.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { calculateResults } from '../services/voting.service'
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
    for (const [id, player] of room.players.entries()) {
      if (player.socketId === socket.id) {
        voterId = id
        break
      }
    }

    if (!voterId) return

    // Validate target is an actual player in the room with PLAYER role
    const resolved = findByPublicId(room, targetPublicId)
    if (!resolved) return
    const { playerId: targetPlayerId, player: target } = resolved
    if (target.role !== 'PLAYER') return

    // Prevent self-voting — compared on internal ids, after resolution
    if (voterId === targetPlayerId) return

    room.votes.set(voterId, targetPlayerId)
    const voter = room.players.get(voterId)
    if (voter) {
      voter.hasSubmittedVote = true
    }
    room.lastActivity = Date.now()
    roomService.updateRoom(room)

    io.to(roomCode).emit('players_update', toPublicPlayers(room))

    // Check if all players have voted (spectators can vote but don't block completion)
    const allVoted = Array.from(room.players.values())
      .filter(p => p.role === 'PLAYER')
      .every(p => p.hasSubmittedVote)

    if (allVoted) {
      calculateResults(room, io)
    }
  }))
}
