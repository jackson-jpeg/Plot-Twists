/**
 * Player Stats & Achievements Service
 * Tracks player performance, stats, and unlockable achievements
 */

import * as fs from 'fs'
import * as path from 'path'
import type {
  PlayerStats,
  Achievement,
  AchievementId,
  LeaderboardCategory,
  LeaderboardEntry,
  GameMode,
  SavedGame
} from '../../lib/types'

// In-memory store with file persistence
const playerStats: Map<string, PlayerStats> = new Map()

const DATA_DIR = path.join(process.cwd(), 'data')
const STATS_FILE = path.join(DATA_DIR, 'player-stats.json')

// ============================================================
// Achievement Definitions
// ============================================================

const ACHIEVEMENT_DEFINITIONS: Record<AchievementId, Omit<Achievement, 'unlockedAt' | 'progress'>> = {
  first_game: {
    id: 'first_game',
    name: 'Debut Performance',
    description: 'Complete your first game',
    icon: '🎬',
    rarity: 'common'
  },
  comedy_king: {
    id: 'comedy_king',
    name: 'Comedy King',
    description: 'Win 10 games',
    icon: '👑',
    rarity: 'rare',
    target: 10
  },
  crowd_pleaser: {
    id: 'crowd_pleaser',
    name: 'Crowd Pleaser',
    description: 'Receive 100 audience reactions across all games',
    icon: '🎭',
    rarity: 'rare',
    target: 100
  },
  plot_twist_survivor: {
    id: 'plot_twist_survivor',
    name: 'Plot Twist Survivor',
    description: 'Win a game that had 3+ plot twists',
    icon: '🌀',
    rarity: 'epic'
  },
  versatile_actor: {
    id: 'versatile_actor',
    name: 'Versatile Actor',
    description: 'Play as 20 different characters',
    icon: '🎪',
    rarity: 'rare',
    target: 20
  },
  winning_streak_3: {
    id: 'winning_streak_3',
    name: 'Hat Trick',
    description: 'Win 3 games in a row',
    icon: '🔥',
    rarity: 'rare'
  },
  winning_streak_5: {
    id: 'winning_streak_5',
    name: 'On Fire',
    description: 'Win 5 games in a row',
    icon: '💥',
    rarity: 'epic'
  },
  games_10: {
    id: 'games_10',
    name: 'Regular',
    description: 'Play 10 games',
    icon: '🎮',
    rarity: 'common',
    target: 10
  },
  games_50: {
    id: 'games_50',
    name: 'Veteran',
    description: 'Play 50 games',
    icon: '⭐',
    rarity: 'rare',
    target: 50
  },
  games_100: {
    id: 'games_100',
    name: 'Legend',
    description: 'Play 100 games',
    icon: '🏆',
    rarity: 'legendary',
    target: 100
  },
  reactions_100: {
    id: 'reactions_100',
    name: 'Entertainer',
    description: 'Receive 100 total reactions',
    icon: '😂',
    rarity: 'common',
    target: 100
  },
  reactions_500: {
    id: 'reactions_500',
    name: 'Superstar',
    description: 'Receive 500 total reactions',
    icon: '🌟',
    rarity: 'epic',
    target: 500
  },
  perfect_game: {
    id: 'perfect_game',
    name: 'Flawless Victory',
    description: 'Win with all votes in your favor',
    icon: '💯',
    rarity: 'legendary'
  },
  ensemble_master: {
    id: 'ensemble_master',
    name: 'Ensemble Master',
    description: 'Win 5 ensemble mode games',
    icon: '👥',
    rarity: 'rare',
    target: 5
  },
  solo_star: {
    id: 'solo_star',
    name: 'Solo Star',
    description: 'Win 5 solo mode games',
    icon: '🎤',
    rarity: 'rare',
    target: 5
  },
  card_creator: {
    id: 'card_creator',
    name: 'Card Creator',
    description: 'Create a custom card pack',
    icon: '📦',
    rarity: 'common'
  },
  trendsetter: {
    id: 'trendsetter',
    name: 'Trendsetter',
    description: 'Have your card pack used in 10 games',
    icon: '📈',
    rarity: 'epic',
    target: 10
  }
}

// ============================================================
// Persistence
// ============================================================

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadStatsFromFile(): void {
  ensureDataDir()

  if (fs.existsSync(STATS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'))

      if (data.players && Array.isArray(data.players)) {
        data.players.forEach((stats: PlayerStats) => {
          playerStats.set(stats.playerId, stats)
        })
      }

      console.log(`Loaded stats for ${playerStats.size} players`)
    } catch (error) {
      console.error('Failed to load player stats:', error)
    }
  }
}

function saveStatsToFile(): void {
  ensureDataDir()

  try {
    const data = {
      players: Array.from(playerStats.values()),
      savedAt: Date.now()
    }
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Failed to save player stats:', error)
  }
}

// Load on startup
loadStatsFromFile()

// ============================================================
// Core Functions
// ============================================================

/**
 * Get or create player stats
 */
export function getPlayerStats(playerId: string, nickname?: string): PlayerStats {
  let stats = playerStats.get(playerId)

  if (!stats) {
    stats = createInitialStats(playerId, nickname || 'Anonymous')
    playerStats.set(playerId, stats)
    saveStatsToFile()
  } else if (nickname && stats.nickname !== nickname) {
    // Update nickname if changed
    stats.nickname = nickname
  }

  return stats
}

/**
 * Create initial stats for a new player
 */
function createInitialStats(playerId: string, nickname: string): PlayerStats {
  return {
    playerId,
    nickname,
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    totalVotesReceived: 0,
    totalReactionsReceived: 0,
    characterCounts: {},
    gameModeStats: {
      solo: { played: 0, won: 0 },
      headToHead: { played: 0, won: 0 },
      ensemble: { played: 0, won: 0 }
    },
    currentWinStreak: 0,
    bestWinStreak: 0,
    achievements: [],
    recentGames: [],
    joinedAt: Date.now(),
    lastPlayedAt: Date.now()
  }
}

/**
 * Update player stats after a game
 */
export function recordGameResult(
  playerId: string,
  nickname: string,
  game: SavedGame,
  playerData: {
    character: string
    votesReceived: number
    isWinner: boolean
    reactionsReceived: number
  }
): Achievement[] {
  const stats = getPlayerStats(playerId, nickname)
  const newAchievements: Achievement[] = []

  // Update basic stats
  stats.gamesPlayed++
  stats.totalVotesReceived += playerData.votesReceived
  stats.totalReactionsReceived += playerData.reactionsReceived
  stats.lastPlayedAt = Date.now()

  // Update character counts
  if (playerData.character) {
    stats.characterCounts[playerData.character] = (stats.characterCounts[playerData.character] || 0) + 1

    // Update favorite character
    const maxCount = Math.max(...Object.values(stats.characterCounts))
    const favorite = Object.entries(stats.characterCounts).find(([, count]) => count === maxCount)
    if (favorite) {
      stats.favoriteCharacter = favorite[0]
    }
  }

  // Update game mode stats
  const modeKey = game.gameMode === 'SOLO' ? 'solo' :
                  game.gameMode === 'HEAD_TO_HEAD' ? 'headToHead' : 'ensemble'
  stats.gameModeStats[modeKey].played++

  // Update win stats
  if (playerData.isWinner) {
    stats.gamesWon++
    stats.gameModeStats[modeKey].won++
    stats.currentWinStreak++
    if (stats.currentWinStreak > stats.bestWinStreak) {
      stats.bestWinStreak = stats.currentWinStreak
    }
  } else {
    stats.currentWinStreak = 0
  }

  stats.winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0

  // Add to recent games
  stats.recentGames.unshift(game.id)
  stats.recentGames = stats.recentGames.slice(0, 20)

  // Check for new achievements
  const earnedAchievements = checkAchievements(stats, game, playerData)
  earnedAchievements.forEach(achievement => {
    if (!stats.achievements.find(a => a.id === achievement.id)) {
      achievement.unlockedAt = Date.now()
      stats.achievements.push(achievement)
      newAchievements.push(achievement)
    }
  })

  // Save
  saveStatsToFile()

  return newAchievements
}

/**
 * Check which achievements the player has earned
 */
function checkAchievements(
  stats: PlayerStats,
  game: SavedGame,
  playerData: { isWinner: boolean, votesReceived: number }
): Achievement[] {
  const earned: Achievement[] = []
  const existingIds = new Set(stats.achievements.map(a => a.id))

  // First game
  if (stats.gamesPlayed === 1 && !existingIds.has('first_game')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.first_game })
  }

  // Games milestones
  if (stats.gamesPlayed >= 10 && !existingIds.has('games_10')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.games_10, progress: stats.gamesPlayed })
  }
  if (stats.gamesPlayed >= 50 && !existingIds.has('games_50')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.games_50, progress: stats.gamesPlayed })
  }
  if (stats.gamesPlayed >= 100 && !existingIds.has('games_100')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.games_100, progress: stats.gamesPlayed })
  }

  // Wins milestone
  if (stats.gamesWon >= 10 && !existingIds.has('comedy_king')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.comedy_king, progress: stats.gamesWon })
  }

  // Win streaks
  if (stats.currentWinStreak >= 3 && !existingIds.has('winning_streak_3')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.winning_streak_3 })
  }
  if (stats.currentWinStreak >= 5 && !existingIds.has('winning_streak_5')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.winning_streak_5 })
  }

  // Reactions milestones
  if (stats.totalReactionsReceived >= 100 && !existingIds.has('reactions_100')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.reactions_100, progress: stats.totalReactionsReceived })
  }
  if (stats.totalReactionsReceived >= 500 && !existingIds.has('reactions_500')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.reactions_500, progress: stats.totalReactionsReceived })
  }

  // Crowd pleaser (same as reactions_100 but based on audience reactions specifically)
  if (stats.totalReactionsReceived >= 100 && !existingIds.has('crowd_pleaser')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.crowd_pleaser, progress: stats.totalReactionsReceived })
  }

  // Versatile actor
  const uniqueCharacters = Object.keys(stats.characterCounts).length
  if (uniqueCharacters >= 20 && !existingIds.has('versatile_actor')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.versatile_actor, progress: uniqueCharacters })
  }

  // Game mode specific
  if (stats.gameModeStats.solo.won >= 5 && !existingIds.has('solo_star')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.solo_star, progress: stats.gameModeStats.solo.won })
  }
  if (stats.gameModeStats.ensemble.won >= 5 && !existingIds.has('ensemble_master')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.ensemble_master, progress: stats.gameModeStats.ensemble.won })
  }

  // Perfect game (won with all votes)
  if (playerData.isWinner && !existingIds.has('perfect_game')) {
    const totalPlayers = game.players.length
    const totalVotes = totalPlayers - 1 // Can't vote for self
    if (playerData.votesReceived === totalVotes && totalVotes > 0) {
      earned.push({ ...ACHIEVEMENT_DEFINITIONS.perfect_game })
    }
  }

  // Plot twist survivor
  if (playerData.isWinner && game.plotTwistsUsed.length >= 3 && !existingIds.has('plot_twist_survivor')) {
    earned.push({ ...ACHIEVEMENT_DEFINITIONS.plot_twist_survivor })
  }

  return earned
}

/**
 * Manually unlock an achievement
 */
export function unlockAchievement(playerId: string, achievementId: AchievementId): boolean {
  const stats = playerStats.get(playerId)
  if (!stats) return false

  const definition = ACHIEVEMENT_DEFINITIONS[achievementId]
  if (!definition) return false

  if (stats.achievements.find(a => a.id === achievementId)) {
    return false // Already unlocked
  }

  stats.achievements.push({
    ...definition,
    unlockedAt: Date.now()
  })

  saveStatsToFile()
  return true
}

/**
 * Get leaderboard
 */
export function getLeaderboard(category: LeaderboardCategory, limit: number = 10): LeaderboardEntry[] {
  const allStats = Array.from(playerStats.values())

  // Sort by category
  let sorted: PlayerStats[]
  switch (category) {
    case 'wins':
      sorted = allStats.sort((a, b) => b.gamesWon - a.gamesWon)
      break
    case 'games':
      sorted = allStats.sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      break
    case 'winRate':
      sorted = allStats
        .filter(s => s.gamesPlayed >= 5) // Minimum games for winRate
        .sort((a, b) => b.winRate - a.winRate)
      break
    case 'reactions':
      sorted = allStats.sort((a, b) => b.totalReactionsReceived - a.totalReactionsReceived)
      break
    case 'streak':
      sorted = allStats.sort((a, b) => b.bestWinStreak - a.bestWinStreak)
      break
    default:
      sorted = allStats.sort((a, b) => b.gamesWon - a.gamesWon)
  }

  // Map to entries
  return sorted.slice(0, limit).map((stats, index) => {
    let value: number
    switch (category) {
      case 'wins': value = stats.gamesWon; break
      case 'games': value = stats.gamesPlayed; break
      case 'winRate': value = Math.round(stats.winRate * 10) / 10; break
      case 'reactions': value = stats.totalReactionsReceived; break
      case 'streak': value = stats.bestWinStreak; break
      default: value = stats.gamesWon
    }

    // Get featured achievement (rarest one)
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
    const featuredAchievement = stats.achievements
      .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])[0]

    return {
      rank: index + 1,
      playerId: stats.playerId,
      nickname: stats.nickname,
      value,
      achievement: featuredAchievement?.id
    }
  })
}

/**
 * Get achievement progress for a player
 */
export function getAchievementProgress(playerId: string): Achievement[] {
  const stats = playerStats.get(playerId)
  if (!stats) return []

  const unlockedIds = new Set(stats.achievements.map(a => a.id))

  // Return all achievements with progress
  return Object.values(ACHIEVEMENT_DEFINITIONS).map(def => {
    const unlocked = stats.achievements.find(a => a.id === def.id)
    if (unlocked) {
      return unlocked
    }

    // Calculate progress for locked achievements
    let progress = 0
    switch (def.id) {
      case 'games_10':
      case 'games_50':
      case 'games_100':
        progress = stats.gamesPlayed
        break
      case 'comedy_king':
        progress = stats.gamesWon
        break
      case 'reactions_100':
      case 'reactions_500':
      case 'crowd_pleaser':
        progress = stats.totalReactionsReceived
        break
      case 'versatile_actor':
        progress = Object.keys(stats.characterCounts).length
        break
      case 'solo_star':
        progress = stats.gameModeStats.solo.won
        break
      case 'ensemble_master':
        progress = stats.gameModeStats.ensemble.won
        break
    }

    return {
      ...def,
      progress,
      target: def.target
    }
  })
}

/**
 * Get total player count
 */
export function getTotalPlayerCount(): number {
  return playerStats.size
}
