/**
 * Game History Service
 * Handles saving, retrieving, and sharing completed games
 */

import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import type {
  SavedGame,
  SavedGamePlayer,
  GameHistoryFilters,
  Script,
  GameMode,
  ComedyStyle,
  Player,
  GameResults
} from '../../lib/types'

// In-memory store with file persistence
const gameHistory: Map<string, SavedGame> = new Map()
const playerGameIndex: Map<string, string[]> = new Map() // playerId -> gameIds
const shareCodeIndex: Map<string, string> = new Map() // shareCode -> gameId

const DATA_DIR = path.join(process.cwd(), 'data')
const HISTORY_FILE = path.join(DATA_DIR, 'game-history.json')

// ============================================================
// Persistence
// ============================================================

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadHistoryFromFile(): void {
  ensureDataDir()

  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))

      // Load games
      if (data.games && Array.isArray(data.games)) {
        data.games.forEach((game: SavedGame) => {
          gameHistory.set(game.id, game)

          // Build share code index
          if (game.shareCode) {
            shareCodeIndex.set(game.shareCode, game.id)
          }
        })
      }

      // Rebuild player index
      gameHistory.forEach((game, gameId) => {
        game.players.forEach(player => {
          const existing = playerGameIndex.get(player.id) || []
          if (!existing.includes(gameId)) {
            existing.push(gameId)
            playerGameIndex.set(player.id, existing)
          }
        })
      })

      console.log(`Loaded ${gameHistory.size} games from history`)
    } catch (error) {
      console.error('Failed to load game history:', error)
    }
  }
}

function saveHistoryToFile(): void {
  ensureDataDir()

  try {
    const data = {
      games: Array.from(gameHistory.values()),
      savedAt: Date.now()
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Failed to save game history:', error)
  }
}

// Load on startup
loadHistoryFromFile()

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

function getUniqueShareCode(): string {
  let code = generateShareCode()
  let attempts = 0
  while (shareCodeIndex.has(code) && attempts < 10) {
    code = generateShareCode()
    attempts++
  }
  return code
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Save a completed game to history
 */
export function saveGame(
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
  }
): SavedGame {
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
    cardPackUsed: metadata.cardPackId || 'standard',
    comedyStyle: metadata.comedyStyle || 'witty',
    isPublic: false,
    views: 0,
    likes: 0
  }

  // Save to store
  gameHistory.set(gameId, savedGame)

  // Update player index
  savedPlayers.forEach(player => {
    const existing = playerGameIndex.get(player.id) || []
    existing.unshift(gameId) // Add to front (most recent)
    playerGameIndex.set(player.id, existing.slice(0, 100)) // Keep last 100 games
  })

  // Persist
  saveHistoryToFile()

  console.log(`Saved game: ${script.title} (${gameId})`)

  return savedGame
}

/**
 * Get a game by ID
 */
export function getGame(gameId: string): SavedGame | null {
  return gameHistory.get(gameId) || null
}

/**
 * Get a game by share code
 */
export function getGameByShareCode(shareCode: string): SavedGame | null {
  const gameId = shareCodeIndex.get(shareCode.toUpperCase())
  if (!gameId) return null
  return gameHistory.get(gameId) || null
}

/**
 * Get games for a player
 */
export function getPlayerGames(
  playerId: string,
  limit: number = 20,
  offset: number = 0
): SavedGame[] {
  const gameIds = playerGameIndex.get(playerId) || []
  const paginatedIds = gameIds.slice(offset, offset + limit)

  return paginatedIds
    .map(id => gameHistory.get(id))
    .filter((game): game is SavedGame => game !== null)
}

/**
 * Search games with filters
 */
export function searchGames(
  filters: GameHistoryFilters,
  limit: number = 20,
  offset: number = 0
): SavedGame[] {
  let games = Array.from(gameHistory.values())

  // Apply filters
  if (filters.playerId) {
    const playerGameIds = new Set(playerGameIndex.get(filters.playerId) || [])
    games = games.filter(g => playerGameIds.has(g.id))
  }

  if (filters.gameMode) {
    games = games.filter(g => g.gameMode === filters.gameMode)
  }

  if (filters.startDate) {
    games = games.filter(g => g.playedAt >= filters.startDate!)
  }

  if (filters.endDate) {
    games = games.filter(g => g.playedAt <= filters.endDate!)
  }

  if (filters.won !== undefined && filters.playerId) {
    games = games.filter(g => {
      const player = g.players.find(p => p.id === filters.playerId)
      return player?.isWinner === filters.won
    })
  }

  // Sort by date (newest first)
  games.sort((a, b) => b.playedAt - a.playedAt)

  return games.slice(offset, offset + limit)
}

/**
 * Get public/featured games
 */
export function getPublicGames(limit: number = 20): SavedGame[] {
  return Array.from(gameHistory.values())
    .filter(g => g.isPublic)
    .sort((a, b) => b.likes - a.likes || b.playedAt - a.playedAt)
    .slice(0, limit)
}

/**
 * Share a game (make it publicly accessible)
 */
export function shareGame(gameId: string): { success: boolean, shareCode?: string, error?: string } {
  const game = gameHistory.get(gameId)
  if (!game) {
    return { success: false, error: 'Game not found' }
  }

  // Generate share code if not exists
  if (!game.shareCode) {
    game.shareCode = getUniqueShareCode()
    shareCodeIndex.set(game.shareCode, gameId)
  }

  game.isPublic = true
  saveHistoryToFile()

  return { success: true, shareCode: game.shareCode }
}

/**
 * Unshare a game
 */
export function unshareGame(gameId: string): { success: boolean, error?: string } {
  const game = gameHistory.get(gameId)
  if (!game) {
    return { success: false, error: 'Game not found' }
  }

  game.isPublic = false
  saveHistoryToFile()

  return { success: true }
}

/**
 * Record a view on a shared game
 */
export function recordView(gameId: string): void {
  const game = gameHistory.get(gameId)
  if (game && game.isPublic) {
    game.views++
    // Don't save immediately to reduce writes - batch later
  }
}

/**
 * Like a shared game
 */
export function likeGame(gameId: string): { success: boolean, likes?: number, error?: string } {
  const game = gameHistory.get(gameId)
  if (!game) {
    return { success: false, error: 'Game not found' }
  }

  if (!game.isPublic) {
    return { success: false, error: 'Game is not public' }
  }

  game.likes++
  saveHistoryToFile()

  return { success: true, likes: game.likes }
}

/**
 * Delete a game from history
 */
export function deleteGame(gameId: string, requesterId: string): { success: boolean, error?: string } {
  const game = gameHistory.get(gameId)
  if (!game) {
    return { success: false, error: 'Game not found' }
  }

  // Only host can delete
  const hostPlayer = game.players.find(p => p.isHost)
  if (hostPlayer?.id !== requesterId) {
    return { success: false, error: 'Only the host can delete this game' }
  }

  // Remove from indices
  if (game.shareCode) {
    shareCodeIndex.delete(game.shareCode)
  }

  game.players.forEach(player => {
    const games = playerGameIndex.get(player.id) || []
    playerGameIndex.set(player.id, games.filter(id => id !== gameId))
  })

  gameHistory.delete(gameId)
  saveHistoryToFile()

  return { success: true }
}

/**
 * Get game count for a player
 */
export function getPlayerGameCount(playerId: string): number {
  return (playerGameIndex.get(playerId) || []).length
}

/**
 * Export game as formatted text
 */
export function exportGameAsText(gameId: string): string | null {
  const game = gameHistory.get(gameId)
  if (!game) return null

  const lines: string[] = []

  lines.push('=' .repeat(50))
  lines.push(game.title.toUpperCase())
  lines.push('=' .repeat(50))
  lines.push('')
  lines.push(`A Plot Twists Production`)
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
