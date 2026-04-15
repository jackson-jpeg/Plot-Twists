// server/handlers/voting.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { calculateResults } from '../services/voting.service'
import * as roomService from '../services/room.service'

export function registerVotingHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Submit vote
  socket.on('submit_vote', withErrorHandler(socket, 'submit_vote', (roomCode, targetPlayerId) => {
    if (typeof roomCode !== 'string' || typeof targetPlayerId !== 'string') return

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

    // Prevent self-voting
    if (voterId === targetPlayerId) return

    // Validate target is an actual player in the room with PLAYER role
    const target = room.players.get(targetPlayerId)
    if (!target || target.role !== 'PLAYER') return

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
}
