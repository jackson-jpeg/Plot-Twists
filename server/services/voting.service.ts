/**
 * Voting & Results Service
 * Calculates voting results and saves game history + player stats.
 */

import type { Server as SocketIOServer } from 'socket.io'
import type { Room, Script, ClientToServerEvents, ServerToClientEvents } from '../../lib/types'
import * as roomService from './room.service'
import { saveGame } from './gameHistory.service'
import { recordGameResult } from './playerStats.service'
import { generateDirectorsReview } from './directorsReview.service'
import {
  awardXP,
  computeGameXPEvents,
  isFirstGameToday,
  markDailyBonus,
  updateChallengeProgress,
} from './progression.service'
import { logger } from '../../lib/logger'

/**
 * Calculate voting results, emit game_over, and save game history + player stats.
 */
export async function calculateResults(room: Room, io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>): Promise<void> {
  // Guard against double-execution from race conditions
  // Set state immediately to prevent concurrent calls from passing the guard
  if (room.gameState === 'RESULTS') return
  room.gameState = 'RESULTS'

  const voteCounts = new Map<string, number>()

  for (const targetId of room.votes.values()) {
    voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1)
  }

  const results = Array.from(voteCounts.entries())
    .map(([playerId, votes]) => ({
      playerId,
      playerName: room.players.get(playerId)?.nickname || 'Unknown',
      votes
    }))
    .sort((a, b) => b.votes - a.votes)

  const winner = results[0]

  // Compute post-game highlights from audience reactions
  const highlights: { label: string; value: string; icon: string }[] = []
  if (room.audienceInteraction) {
    const counts = room.audienceInteraction.reactionCounts
    if (counts.laugh > 0) highlights.push({ label: 'Most Laughs', value: `${counts.laugh} laughs`, icon: '😂' })
    if (counts.gasp > 0) highlights.push({ label: 'Most Dramatic', value: `${counts.gasp} gasps`, icon: '😱' })
    if (counts.cheer > 0) highlights.push({ label: 'Crowd Favorite', value: `${counts.cheer} cheers`, icon: '🎉' })
    if (counts.love > 0) highlights.push({ label: 'Most Loved', value: `${counts.love} hearts`, icon: '❤️' })
    if (counts.mindblown > 0) highlights.push({ label: 'Mind Blown', value: `${counts.mindblown}x`, icon: '🤯' })
    const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0)
    if (totalReactions > 0) highlights.push({ label: 'Total Reactions', value: `${totalReactions}`, icon: '🔥' })
    const chatCount = room.audienceInteraction.spectatorMessages?.length || 0
    if (chatCount > 0) highlights.push({ label: 'Chat Messages', value: `${chatCount}`, icon: '💬' })
  }

  roomService.updateRoom(room)
  io.to(room.code).emit('game_over', {
    winner,
    allResults: results,
    highlights
  })
  io.to(room.code).emit('game_state_change', 'RESULTS')

  // Fire-and-forget director's review
  generateDirectorsReview({
    title: room.script?.title || 'Untitled',
    synopsis: room.script?.synopsis || '',
    cast: [...room.players.values()]
      .filter(p => !p.isHost || p.role === 'PLAYER')
      .filter(p => p.role === 'PLAYER')
      .map(p => ({
        nickname: p.nickname,
        character: p.assignedCharacter || 'Unknown',
        isWinner: p.id === winner?.playerId,
      })),
    reactionCount: room.audienceInteraction?.reactionCounts
      ? Object.values(room.audienceInteraction.reactionCounts).reduce((a: number, b: number) => a + b, 0)
      : 0,
    plotTwists: room.audienceInteraction?.plotTwistHistory || [],
  }).then(review => {
    if (review) {
      room.directorsReview = review
      roomService.updateRoom(room)
      io.to(room.code).emit('directors_review', review)
    }
  }).catch(() => {})

  // Save game to history and update player stats
  try {
    if (room.script) {
      // Get setting and circumstance from selections
      const allSelections = Array.from(room.selections.values())
      const setting = allSelections[0]?.setting || 'Unknown'
      const circumstance = allSelections[0]?.circumstance || 'Unknown'

      // Calculate game duration (approximate)
      const duration = Math.floor((Date.now() - room.createdAt) / 1000)

      // Get reaction count
      const reactionCount = room.audienceInteraction
        ? Object.values(room.audienceInteraction.reactionCounts).reduce((a, b) => a + b, 0)
        : 0

      // Save the game
      const savedGame = await saveGame(
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
          plotTwistsUsed: room.audienceInteraction?.plotTwistHistory || []
        }
      )

      logger.info(`Saved game to history: ${savedGame.id}`)

      // Update player stats
      const players = Array.from(room.players.values()).filter(p => p.role === 'PLAYER')
      for (const player of players) {
        const voteResult = results.find(r => r.playerId === player.id)
        const newAchievements = await recordGameResult(
          player.id,
          player.nickname,
          savedGame,
          {
            character: player.assignedCharacter || '',
            votesReceived: voteResult?.votes || 0,
            isWinner: winner?.playerId === player.id,
            reactionsReceived: Math.floor(reactionCount / players.length) // Approximate per-player
          }
        )

        // Notify player of new achievements
        if (newAchievements.length > 0) {
          const playerSocket = io.sockets.sockets.get(player.socketId)
          if (playerSocket) {
            newAchievements.forEach(achievement => {
              playerSocket.emit('achievement_unlocked', achievement)
            })
          }
        }

        // Award XP via progression system
        try {
          const playerIsWinner = winner?.playerId === player.id
          const firstGame = await isFirstGameToday(player.id)
          const stats = await import('./playerStats.service').then(m => m.getPlayerStats(player.id))

          const xpEvents = computeGameXPEvents(
            playerIsWinner,
            voteResult?.votes || 0,
            Math.floor(reactionCount / players.length),
            stats.currentWinStreak,
            firstGame,
            !!room.isPublic,
            player.isHost,
            newAchievements
          )

          if (firstGame) await markDailyBonus(player.id)

          const xpResult = await awardXP(player.id, xpEvents)

          // Emit XP gained to player
          const playerSocket = io.sockets.sockets.get(player.socketId)
          if (playerSocket) {
            playerSocket.emit('xp_gained', {
              events: xpResult.xpEvents,
              totalXP: xpResult.totalXP,
              level: xpResult.newLevel,
              title: xpResult.title,
            })

            // Level up notification
            if (xpResult.newLevel > xpResult.oldLevel) {
              playerSocket.emit('level_up', {
                newLevel: xpResult.newLevel,
                title: xpResult.title,
              })
            }
          }

          // Update weekly challenges
          await updateChallengeProgress(player.id, {
            gameMode: room.gameMode,
            isWinner: playerIsWinner,
            reactionsReceived: Math.floor(reactionCount / players.length),
            currentWinStreak: stats.currentWinStreak,
            isPublicGame: !!room.isPublic,
          })
        } catch (xpError) {
          logger.error(`Error awarding XP to player ${player.id}:`, xpError)
        }
      }
    }
  } catch (error) {
    logger.error('Error saving game to history:', error)
  }
}
