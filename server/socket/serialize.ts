/**
 * Outbound serialisation boundary.
 *
 * Every player object that leaves the server passes through here. This exists because
 * defect D2b was not one bad emit — it was thirteen `players_update` sites across eight
 * files, each independently doing `Array.from(room.players.values())` and shipping the full
 * server-side `Player` (including `sessionId`, `uid` and `socketId`) to every client in the
 * room. Fixing that at the emit sites would have worked right up until the fourteenth site
 * was written.
 *
 * So the rule is: `toPublicPlayer` is the only way a player reaches a client, and
 * `ServerToClientEvents` is typed in terms of `PublicPlayer` so the compiler enforces it.
 *
 * If you are adding a field to `Player`, the default is that it does NOT belong here.
 */

import type { Player, PublicPlayer, Room, GameResults, PublicGameResults } from '../../lib/types'

/**
 * Strip a server-side Player down to what a client may see.
 *
 * Written as an explicit allow-list rather than a `delete`/rest-destructure denylist on
 * purpose: a new sensitive field added to `Player` is then invisible by default instead of
 * leaking until someone remembers to exclude it. Fail closed.
 */
export function toPublicPlayer(player: Player): PublicPlayer {
  return {
    publicId: player.publicId,
    nickname: player.nickname,
    role: player.role,
    isHost: player.isHost,
    connected: player.connected,
    hasSubmittedSelection: player.hasSubmittedSelection,
    hasSubmittedVote: player.hasSubmittedVote,
    assignedCharacter: player.assignedCharacter,
    score: player.score,
    level: player.level,
    title: player.title,
  }
}

/** The room's players, serialised. Replaces every `Array.from(room.players.values())` emit. */
export function toPublicPlayers(room: Room): PublicPlayer[] {
  return Array.from(room.players.values()).map(toPublicPlayer)
}

/** Same, for the handful of sites that hold a bare collection rather than a Room. */
export function toPublicPlayerList(players: Iterable<Player>): PublicPlayer[] {
  return Array.from(players, toPublicPlayer)
}

/**
 * Strip results down to what a client may see — drops `playerId` entirely.
 *
 * `room.results` is both persisted (gameHistory / playerStats key off `playerId`) and
 * emitted via `game_over`, so it crosses the boundary. No client consumer ever read the id:
 * results views match the winner by nickname. Emitting it was pure attack surface.
 */
export function toPublicResults(results: GameResults): PublicGameResults
export function toPublicResults(results: GameResults | null | undefined): PublicGameResults | null
export function toPublicResults(results: GameResults | null | undefined): PublicGameResults | null {
  if (!results) return null
  return {
    winner: results.winner
      ? { playerName: results.winner.playerName, votes: results.winner.votes }
      : undefined,
    allResults: results.allResults.map(r => ({ playerName: r.playerName, votes: r.votes })),
    highlights: results.highlights,
  }
}

/**
 * Resolve a client-supplied publicId back to the server-side player.
 *
 * A publicId carries NO authority — it is broadcast to everyone in the room. It answers
 * "which seat do you mean" (e.g. the target of a vote). It must never answer "who are you".
 * Callers that need identity must authenticate separately.
 */
export function findByPublicId(room: Room, publicId: string): { playerId: string; player: Player } | null {
  if (typeof publicId !== 'string' || !publicId) return null
  for (const [playerId, player] of room.players.entries()) {
    if (player.publicId === publicId) return { playerId, player }
  }
  return null
}
