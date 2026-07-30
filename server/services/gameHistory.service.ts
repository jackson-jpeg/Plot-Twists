/**
 * Game History Service
 * Handles saving, retrieving, and sharing completed games
 */

import { v4 as uuidv4 } from 'uuid'
import { logger } from '../../lib/logger'
import type {
  SavedGame,
  SavedGamePlayer,
  GameHistoryFilters,
  Script,
  GameMode,
  ComedyStyle,
  Player,
  GameResults,
  ReactionTimelineEntry,
} from '../../lib/types'
import { findClipMoments } from './audience.service'
import { getDatabase, Collections } from '../db'

// ============================================================
// Share Code Generation
// ============================================================

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid ambiguous chars
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function getUniqueShareCode(): Promise<string> {
  const db = getDatabase()
  let code = generateShareCode()
  let attempts = 0

  // Check if share code already exists
  while (attempts < 10) {
    const existing = await db.query<SavedGame>(Collections.GAME_HISTORY, [
      { field: 'shareCode', operator: '==', value: code }
    ], { limit: 1 })

    if (existing.length === 0) {
      return code
    }

    code = generateShareCode()
    attempts++
  }

  throw new Error('Failed to generate unique share code after 10 attempts')
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Save a completed game to history
 */
export async function saveGame(
  roomCode: string,
  script: Script,
  players: Player[],
  gameMode: GameMode,
  results: GameResults,
  metadata: {
    setting: string
    circumstance: string
    cardPackId: string
    comedyStyle: ComedyStyle
    duration: number
    audienceReactionCount: number
    plotTwistsUsed: string[]
    reactionTimeline?: ReactionTimelineEntry[]
  }
): Promise<SavedGame> {
  const db = getDatabase()
  const gameId = uuidv4()
  const now = Date.now()

  // Map players to saved format
  const savedPlayers: SavedGamePlayer[] = players.map(player => {
    const voteResult = results.allResults.find(r => r.playerId === player.id)
    return {
      id: player.id,
      nickname: player.nickname,
      character: player.assignedCharacter || '',
      isHost: player.isHost,
      votesReceived: voteResult?.votes || 0,
      isWinner: results.winner?.playerId === player.id
    }
  })

  const savedGame: SavedGame = {
    id: gameId,
    title: script.title,
    synopsis: script.synopsis,
    playedAt: now,
    duration: metadata.duration,
    roomCode,
    gameMode,
    playerIds: savedPlayers.map(p => p.id),
    players: savedPlayers,
    script,
    setting: metadata.setting,
    circumstance: metadata.circumstance,
    winner: results.winner ? {
      playerId: results.winner.playerId,
      playerName: results.winner.playerName,
      character: savedPlayers.find(p => p.id === results.winner?.playerId)?.character || ''
    } : undefined,
    audienceReactionCount: metadata.audienceReactionCount,
    plotTwistsUsed: metadata.plotTwistsUsed,
    reactionTimeline: metadata.reactionTimeline,
    clipMoments: findClipMoments(metadata.reactionTimeline || []),
    cardPackUsed: metadata.cardPackId || 'standard',
    comedyStyle: metadata.comedyStyle || 'witty',
    isPublic: false,
    views: 0,
    likes: 0
  }

  // Save to database
  await db.set(Collections.GAME_HISTORY, gameId, savedGame)

  logger.info(`Saved game: ${script.title} (${gameId})`)

  return savedGame
}

/**
 * Get a game by ID
 */
export async function getGame(gameId: string): Promise<SavedGame | null> {
  const db = getDatabase()
  return await db.get<SavedGame>(Collections.GAME_HISTORY, gameId)
}

/**
 * Get a game by share code
 */
export async function getGameByShareCode(shareCode: string): Promise<SavedGame | null> {
  const db = getDatabase()
  const results = await db.query<SavedGame>(Collections.GAME_HISTORY, [
    { field: 'shareCode', operator: '==', value: shareCode.toUpperCase() }
  ], { limit: 1 })

  return results[0] || null
}

/**
 * Get games for a player
 */
export async function getPlayerGames(
  playerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<SavedGame[]> {
  const db = getDatabase()

  // Use playerIds top-level field for Firestore querying when available,
  // fall back to full scan + JS filter for legacy records
  const games = await db.query<SavedGame>(Collections.GAME_HISTORY, [
    { field: 'playerIds', operator: 'array-contains', value: playerId }
  ], {
    orderBy: 'playedAt',
    orderDirection: 'desc',
    limit: limit + offset // Fetch enough to cover offset
  })

  return games.slice(offset, offset + limit)
}

/**
 * Search games with filters
 */
export async function searchGames(
  filters: GameHistoryFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SavedGame[]> {
  const db = getDatabase()
  const whereClauses: import('../db').WhereClause[] = []

  if (filters.playerId) {
    whereClauses.push({ field: 'playerIds', operator: 'array-contains', value: filters.playerId })
  }

  if (filters.gameMode) {
    whereClauses.push({ field: 'gameMode', operator: '==', value: filters.gameMode })
  }

  if (filters.startDate) {
    whereClauses.push({ field: 'playedAt', operator: '>=', value: filters.startDate })
  }

  if (filters.endDate) {
    whereClauses.push({ field: 'playedAt', operator: '<=', value: filters.endDate })
  }

  let games = await db.query<SavedGame>(Collections.GAME_HISTORY, whereClauses, {
    orderBy: 'playedAt',
    orderDirection: 'desc',
    limit: limit + offset
  })

  // Client-side filter for won status (requires nested player lookup)
  if (filters.won !== undefined && filters.playerId) {
    games = games.filter(g => {
      const player = g.players.find(p => p.id === filters.playerId)
      return player?.isWinner === filters.won
    })
  }

  return games.slice(offset, offset + limit)
}

/**
 * Get public/featured games
 */
export async function getPublicGames(limit: number = 20): Promise<SavedGame[]> {
  const db = getDatabase()

  const games = await db.query<SavedGame>(Collections.GAME_HISTORY, [
    { field: 'isPublic', operator: '==', value: true }
  ], {
    orderBy: 'likes',
    orderDirection: 'desc',
    limit
  })

  return games
}

/**
 * Get recent public games (sorted by playedAt descending)
 */
export async function getRecentPublicGames(limit: number = 20, offset: number = 0): Promise<SavedGame[]> {
  const db = getDatabase()
  // Fetch more than needed to handle offset (Firestore doesn't have native offset)
  const games = await db.query<SavedGame>(Collections.GAME_HISTORY, [
    { field: 'isPublic', operator: '==', value: true }
  ], {
    orderBy: 'playedAt',
    orderDirection: 'desc',
    limit: limit + offset
  })
  return games.slice(offset, offset + limit)
}

/**
 * Share a game (make it publicly accessible)
 */
export async function shareGame(gameId: string): Promise<{ success: boolean, shareCode?: string, error?: string }> {
  const db = getDatabase()
  const game = await db.get<SavedGame>(Collections.GAME_HISTORY, gameId)

  if (!game) {
    return { success: false, error: 'Game not found' }
  }

  // Generate share code if not exists
  let shareCode = game.shareCode
  if (!shareCode) {
    shareCode = await getUniqueShareCode()
  }

  await db.update(Collections.GAME_HISTORY, gameId, {
    shareCode,
    isPublic: true
  })

  return { success: true, shareCode }
}

/**
 * Unshare a game
 */
export async function unshareGame(gameId: string): Promise<{ success: boolean, error?: string }> {
  const db = getDatabase()
  const game = await db.get<SavedGame>(Collections.GAME_HISTORY, gameId)

  if (!game) {
    return { success: false, error: 'Game not found' }
  }

  await db.update(Collections.GAME_HISTORY, gameId, { isPublic: false })

  return { success: true }
}

/**
 * Record a view on a shared game
 */
export async function recordView(gameId: string): Promise<void> {
  const db = getDatabase()
  const game = await db.get<SavedGame>(Collections.GAME_HISTORY, gameId)

  if (game && game.isPublic) {
    await db.update(Collections.GAME_HISTORY, gameId, { views: game.views + 1 })
  }
}

/**
 * Like a shared game
 */
export async function likeGame(gameId: string): Promise<{ success: boolean, likes?: number, error?: string }> {
  const db = getDatabase()
  const game = await db.get<SavedGame>(Collections.GAME_HISTORY, gameId)

  if (!game) {
    return { success: false, error: 'Game not found' }
  }

  if (!game.isPublic) {
    return { success: false, error: 'Game is not public' }
  }

  const newLikes = game.likes + 1
  await db.update(Collections.GAME_HISTORY, gameId, { likes: newLikes })

  return { success: true, likes: newLikes }
}

/**
 * Delete a game from history
 */
export async function deleteGame(gameId: string, requesterId: string): Promise<{ success: boolean, error?: string }> {
  const db = getDatabase()
  const game = await db.get<SavedGame>(Collections.GAME_HISTORY, gameId)

  if (!game) {
    return { success: false, error: 'Game not found' }
  }

  // Only host can delete
  const hostPlayer = game.players.find(p => p.isHost)
  if (hostPlayer?.id !== requesterId) {
    return { success: false, error: 'Only the host can delete this game' }
  }

  await db.delete(Collections.GAME_HISTORY, gameId)

  return { success: true }
}

/**
 * Get game count for a player
 */
export async function getPlayerGameCount(playerId: string): Promise<number> {
  const db = getDatabase()

  return await db.count(Collections.GAME_HISTORY, [
    { field: 'playerIds', operator: 'array-contains', value: playerId }
  ])
}

/**
 * Export game as formatted text
 */
export async function exportGameAsText(gameId: string): Promise<string | null> {
  const db = getDatabase()
  const game = await db.get<SavedGame>(Collections.GAME_HISTORY, gameId)
  if (!game) return null

  const lines: string[] = []

  lines.push('=' .repeat(50))
  lines.push(game.title.toUpperCase())
  lines.push('=' .repeat(50))
  lines.push('')
  lines.push(`A PlotSlop Production`)
  lines.push(`Played on ${new Date(game.playedAt).toLocaleDateString()}`)
  lines.push('')
  lines.push('CAST')
  lines.push('-'.repeat(30))
  game.players.forEach(p => {
    const winnerBadge = p.isWinner ? ' [MVP]' : ''
    lines.push(`${p.character} ............ ${p.nickname}${winnerBadge}`)
  })
  lines.push('')
  lines.push('SETTING')
  lines.push('-'.repeat(30))
  lines.push(game.setting)
  lines.push('')
  lines.push('CIRCUMSTANCE')
  lines.push('-'.repeat(30))
  lines.push(game.circumstance)
  lines.push('')
  lines.push('SYNOPSIS')
  lines.push('-'.repeat(30))
  lines.push(game.synopsis)
  lines.push('')
  lines.push('=' .repeat(50))
  lines.push('SCRIPT')
  lines.push('=' .repeat(50))
  lines.push('')

  game.script.lines.forEach(line => {
    lines.push(`${line.speaker.toUpperCase()} (${line.mood}):`)
    lines.push(`  "${line.text}"`)
    lines.push('')
  })

  lines.push('=' .repeat(50))
  lines.push('THE END')
  lines.push('=' .repeat(50))

  if (game.winner) {
    lines.push('')
    lines.push(`MVP: ${game.winner.playerName} as ${game.winner.character}`)
  }

  return lines.join('\n')
}
