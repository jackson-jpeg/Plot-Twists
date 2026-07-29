/**
 * Voting & Results Service
 * Calculates voting results and saves game history + player stats.
 */

import type { Server as SocketIOServer } from 'socket.io'
import type { Room, Player, SavedGame, ClientToServerEvents, ServerToClientEvents } from '../../lib/types'
import * as roomService from './room.service'
import { saveGame } from './gameHistory.service'
import { getPlayerStats, recordGameResult } from './playerStats.service'
import { generateDirectorsReview, shouldGenerateDirectorsReview } from './directorsReview.service'
import { toPublicResults } from '../socket/serialize'
import {
  awardXP,
  computeGameXPEvents,
  isFirstGameToday,
  markDailyBonus,
  updateChallengeProgress,
} from './progression.service'
import { logger } from '../../lib/logger'

interface VoteResult {
  playerId: string
  playerName: string
  votes: number
}

function getAudienceReactionCount(room: Room): number {
  if (!room.audienceInteraction) return 0
  return Object.values(room.audienceInteraction.reactionCounts).reduce((total, count) => total + count, 0)
}

function scheduleDirectorsReview(
  room: Room,
  winnerPlayerId: string | undefined,
  reactionCount: number,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  if (!shouldGenerateDirectorsReview()) {
    return
  }

  const cast = [...room.players.values()]
    .filter(player => player.role === 'PLAYER')
    .map(player => ({
      nickname: player.nickname,
      character: player.assignedCharacter || 'Unknown',
      isWinner: player.id === winnerPlayerId,
    }))

  void generateDirectorsReview({
    title: room.script?.title || 'Untitled',
    synopsis: room.script?.synopsis || '',
    cast,
    reactionCount,
    plotTwists: room.audienceInteraction?.plotTwistHistory || [],
  }).then(review => {
    if (!review) {
      return
    }

    room.directorsReview = review
    roomService.updateRoom(room)
    io.to(room.code).emit('directors_review', review)
  }).catch(error => {
    logger.error(`[VotingService] Unexpected director's review failure for room ${room.code}:`, error)
  })
}

async function processPlayerResults(
  room: Room,
  player: Player,
  savedGame: SavedGame,
  voteResult: VoteResult | undefined,
  winnerPlayerId: string | undefined,
  reactionCountPerPlayer: number,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): Promise<void> {
  const newAchievements = await recordGameResult(
    player.id,
    player.nickname,
    savedGame,
    {
      character: player.assignedCharacter || '',
      votesReceived: voteResult?.votes || 0,
      isWinner: winnerPlayerId === player.id,
      reactionsReceived: reactionCountPerPlayer,
    }
  )

  const playerSocket = io.sockets.sockets.get(player.socketId)
  if (playerSocket && newAchievements.length > 0) {
    newAchievements.forEach(achievement => {
      playerSocket.emit('achievement_unlocked', achievement)
    })
  }

  const playerIsWinner = winnerPlayerId === player.id
  const firstGameToday = await isFirstGameToday(player.id)
  const stats = await getPlayerStats(player.id)

  const { completedChallenges } = await updateChallengeProgress(player.id, {
    gameMode: room.gameMode,
    isWinner: playerIsWinner,
    reactionsReceived: reactionCountPerPlayer,
    currentWinStreak: stats.currentWinStreak,
    isPublicGame: !!room.isPublic,
  })

  const xpEvents = computeGameXPEvents(
    playerIsWinner,
    voteResult?.votes || 0,
    reactionCountPerPlayer,
    stats.currentWinStreak,
    firstGameToday,
    !!room.isPublic,
    player.isHost,
    newAchievements
  )

  completedChallenges.forEach(challenge => {
    xpEvents.push({
      source: 'weekly_challenge',
      amount: challenge.xpReward,
      description: `Weekly challenge: ${challenge.title}`,
    })
  })

  if (firstGameToday) {
    await markDailyBonus(player.id)
  }

  const xpResult = await awardXP(player.id, xpEvents)

  if (!playerSocket) {
    return
  }

  playerSocket.emit('xp_gained', {
    events: xpResult.xpEvents,
    totalXP: xpResult.totalXP,
    level: xpResult.newLevel,
    title: xpResult.title,
  })

  if (xpResult.newLevel > xpResult.oldLevel) {
    playerSocket.emit('level_up', {
      newLevel: xpResult.newLevel,
      title: xpResult.title,
    })
  }
}

/**
 * Every player who can still cast a ballot has cast one.
 *
 * Chunk 2 item 4. This predicate used to be written out by hand in four places
 * (`submit_vote`, the leave_room path, and twice in the disconnect handler) and every copy
 * counted DISCONNECTED players as still owing a vote. A player whose phone died therefore
 * blocked the tally until the voting timeout swept it — up to a full minute of a room staring
 * at a "waiting for votes" screen for someone who has physically left the party.
 *
 * `connected !== false` rather than `connected === true`: `connected` is undefined on a freshly
 * built Player and only ever set to false by markPlayerDisconnected, so undefined means present.
 *
 * Returns false when nobody is eligible. That is deliberate — an empty room must fall through
 * to the timeout and be handled as a zero-vote round (item 7), not tallied as unanimous.
 */
export function allBallotsIn(room: Room): boolean {
  const eligible = Array.from(room.players.values())
    .filter(player => player.role === 'PLAYER' && player.connected !== false)
  return eligible.length > 0 && eligible.every(player => player.hasSubmittedVote)
}

/**
 * A round nobody voted in has no result, so do not stage one.
 *
 * Chunk 2 item 7 / defect D3b. `calculateResults` treated an empty tally as an ordinary
 * outcome: `winner` undefined, `allResults` [], emitted as `game_over` and followed by a
 * RESULTS transition. Players got the full results ceremony — winner card, scoreboard,
 * director's review — with nothing in it. Worse than the blank screen, it also wrote that
 * round to gameHistory and ran every player through recordGameResult and awardXP, so a round
 * that never happened polluted lifetime stats.
 *
 * Returning to LOBBY discards the script, which is a real cost. It is the lesser one: the
 * alternative being removed here is presenting an empty scoreboard as the outcome of the
 * evening. The client resets its stores on `new_game_started` regardless, so the server
 * clearing the script keeps both sides consistent rather than leaving a ghost script server-side.
 */
function endRoundWithNoVotes(room: Room, io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>): void {
  // Claim the state first: this is the same re-entrancy guard the RESULTS path relies on, and
  // it also makes the `gameState !== 'VOTING'` checks in the pending timeout callbacks bail.
  room.gameState = 'LOBBY'
  room.script = undefined
  room.currentLineIndex = 0
  room.isPaused = false
  room.results = undefined
  room.directorsReview = undefined
  room.votes.clear()
  room.selections.clear()
  room.lastActivity = Date.now()

  for (const player of room.players.values()) {
    player.hasSubmittedVote = false
    player.hasSubmittedSelection = false
    player.assignedCharacter = undefined
  }

  roomService.clearAllRoomTimeouts(room.code)
  roomService.updateRoom(room)

  logger.info(`[VotingService] Room ${room.code} ended a round with zero votes — returned to lobby, nothing recorded`)

  io.to(room.code).emit('game_error_message', 'Nobody voted, so there is no winner this round. Back to the lobby.')
  io.to(room.code).emit('new_game_started', { keepSelections: false })
  io.to(room.code).emit('game_state_change', 'LOBBY')
}

/**
 * Calculate voting results, emit game_over, and save game history + player stats.
 */
export async function calculateResults(room: Room, io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>): Promise<void> {
  // Guard against double-execution from race conditions
  // Set state immediately to prevent concurrent calls from passing the guard
  if (room.gameState === 'RESULTS') return

  // Item 7 — checked BEFORE claiming RESULTS, so a zero-vote round never enters that state.
  if (room.votes.size === 0) {
    endRoundWithNoVotes(room, io)
    return
  }

  room.gameState = 'RESULTS'

  const voteCounts = new Map<string, number>()

  for (const targetId of room.votes.values()) {
    voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1)
  }

  const results: VoteResult[] = Array.from(voteCounts.entries())
    .map(([playerId, votes]) => ({
      playerId,
      playerName: room.players.get(playerId)?.nickname || 'Unknown',
      votes,
    }))
    .sort((a, b) => b.votes - a.votes)

  const winner = results[0]
  const reactionCount = getAudienceReactionCount(room)

  // Compute post-game highlights from audience reactions
  const highlights: { label: string; value: string; icon: string }[] = []
  if (room.audienceInteraction) {
    const counts = room.audienceInteraction.reactionCounts
    if (counts.laugh > 0) highlights.push({ label: 'Most Laughs', value: `${counts.laugh} laughs`, icon: '😂' })
    if (counts.gasp > 0) highlights.push({ label: 'Most Dramatic', value: `${counts.gasp} gasps`, icon: '😱' })
    if (counts.cheer > 0) highlights.push({ label: 'Crowd Favorite', value: `${counts.cheer} cheers`, icon: '🎉' })
    if (counts.love > 0) highlights.push({ label: 'Most Loved', value: `${counts.love} hearts`, icon: '❤️' })
    if (counts.mindblown > 0) highlights.push({ label: 'Mind Blown', value: `${counts.mindblown}x`, icon: '🤯' })
    if (reactionCount > 0) highlights.push({ label: 'Total Reactions', value: `${reactionCount}`, icon: '🔥' })
    const chatCount = room.audienceInteraction.spectatorMessages?.length || 0
    if (chatCount > 0) highlights.push({ label: 'Chat Messages', value: `${chatCount}`, icon: '💬' })
  }

  room.results = {
    winner,
    allResults: results,
    highlights,
  }

  roomService.updateRoom(room)
  io.to(room.code).emit('game_over', toPublicResults(room.results))
  io.to(room.code).emit('game_state_change', 'RESULTS')

  scheduleDirectorsReview(room, winner?.playerId, reactionCount, io)

  if (!room.script) {
    return
  }

  const allSelections = Array.from(room.selections.values())
  const setting = allSelections[0]?.setting || 'Unknown'
  const circumstance = allSelections[0]?.circumstance || 'Unknown'
  const duration = Math.floor((Date.now() - room.createdAt) / 1000)

  let savedGame: SavedGame
  try {
    savedGame = await saveGame(
      room.code,
      room.script,
      Array.from(room.players.values()),
      room.gameMode,
      { winner, allResults: results },
      {
        setting,
        circumstance,
        cardPackId: room.cardPackId || 'standard',
        comedyStyle: room.scriptCustomization?.comedyStyle || 'witty',
        duration,
        audienceReactionCount: reactionCount,
        plotTwistsUsed: room.audienceInteraction?.plotTwistHistory || [],
        reactionTimeline: room.audienceInteraction?.reactionTimeline || []
      }
    )
  } catch (error) {
    logger.error('Error saving game to history:', error)
    return
  }

  logger.info(`Saved game to history: ${savedGame.id}`)

  const players = Array.from(room.players.values()).filter(player => player.role === 'PLAYER')
  const reactionCountPerPlayer = players.length > 0 ? Math.floor(reactionCount / players.length) : 0

  for (const player of players) {
    const voteResult = results.find(result => result.playerId === player.id)
    try {
      await processPlayerResults(
        room,
        player,
        savedGame,
        voteResult,
        winner?.playerId,
        reactionCountPerPlayer,
        io
      )
    } catch (error) {
      logger.error(`Error processing post-game results for player ${player.id}:`, error)
    }
  }
}
