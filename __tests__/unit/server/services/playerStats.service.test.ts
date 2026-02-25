/**
 * Player Stats Service Tests
 * Tests player stats retrieval, game result recording, achievements, and leaderboards.
 */

import type { PlayerStats, SavedGame } from '../../../../lib/types'

// Mock database
const mockGet = jest.fn()
const mockUpdate = jest.fn()
const mockDb = {
  get: mockGet,
  set: jest.fn(),
  update: mockUpdate,
  delete: jest.fn(),
  query: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(() => true),
  batchSet: jest.fn(),
  batchDelete: jest.fn(),
  getAll: jest.fn().mockResolvedValue([]),
  count: jest.fn(),
  runTransaction: jest.fn(async (fn: (txn: { get: jest.Mock; update: jest.Mock }) => Promise<unknown>) => {
    return fn({ get: mockGet, update: mockUpdate })
  }),
}

jest.mock('../../../../server/db', () => ({
  getDatabase: () => mockDb,
  Collections: {
    USERS: 'users',
    PLAYER_STATS: 'playerStats',
    GAME_HISTORY: 'gameHistory',
    CARD_PACKS: 'cardPacks',
    ROOMS: 'rooms',
    MIGRATIONS: 'migrations'
  }
}))

import {
  getPlayerStats,
  recordGameResult,
  getLeaderboard,
  unlockAchievement,
  getAchievementProgress,
  getTotalPlayerCount,
} from '../../../../server/services/playerStats.service'

function makeStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    playerId: 'player-1',
    nickname: 'Alice',
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
    lastPlayedAt: Date.now(),
    ...overrides,
  }
}

function makeSavedGame(overrides: Partial<SavedGame> = {}): SavedGame {
  return {
    id: 'game-1',
    title: 'Test Script',
    synopsis: 'A test game',
    playedAt: Date.now(),
    duration: 300,
    roomCode: 'TEST',
    gameMode: 'ENSEMBLE',
    players: [
      { id: 'player-1', nickname: 'Alice', character: 'Detective', isHost: false, votesReceived: 2, isWinner: true },
      { id: 'player-2', nickname: 'Bob', character: 'Chef', isHost: false, votesReceived: 1, isWinner: false },
      { id: 'player-3', nickname: 'Carol', character: 'Pirate', isHost: false, votesReceived: 0, isWinner: false },
    ],
    script: { title: 'Test', lines: [], synopsis: '' } as unknown as SavedGame['script'],
    setting: 'A restaurant',
    circumstance: 'The food is alive',
    plotTwistsUsed: [],
    cardPackUsed: 'default',
    ...overrides,
  } as SavedGame
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getPlayerStats', () => {
  it('should create initial stats for a new player', async () => {
    mockGet.mockResolvedValue(null)
    mockDb.set.mockResolvedValue(undefined)

    const stats = await getPlayerStats('new-player', 'Newbie')

    expect(stats.playerId).toBe('new-player')
    expect(stats.nickname).toBe('Newbie')
    expect(stats.gamesPlayed).toBe(0)
    expect(stats.gamesWon).toBe(0)
    expect(stats.winRate).toBe(0)
    expect(stats.achievements).toEqual([])
    expect(stats.recentGames).toEqual([])
    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'new-player', expect.objectContaining({
      playerId: 'new-player',
      nickname: 'Newbie'
    }))
  })

  it('should return existing stats for a known player', async () => {
    const existing = makeStats({ playerId: 'known-player', nickname: 'Alice', gamesPlayed: 5 })
    mockGet.mockResolvedValue(existing)

    const stats = await getPlayerStats('known-player')

    expect(stats.playerId).toBe('known-player')
    expect(stats.gamesPlayed).toBe(5)
    expect(mockDb.set).not.toHaveBeenCalled()
  })

  it('should use "Anonymous" as default nickname for new player', async () => {
    mockGet.mockResolvedValue(null)
    mockDb.set.mockResolvedValue(undefined)

    const stats = await getPlayerStats('anon-player')

    expect(stats.nickname).toBe('Anonymous')
  })

  it('should update nickname if changed', async () => {
    const existing = makeStats({ playerId: 'player-1', nickname: 'OldName' })
    mockGet.mockResolvedValue(existing)
    mockUpdate.mockResolvedValue(undefined)

    const stats = await getPlayerStats('player-1', 'NewName')

    expect(stats.nickname).toBe('NewName')
    expect(mockUpdate).toHaveBeenCalledWith('playerStats', 'player-1', { nickname: 'NewName' })
  })

  it('should not update nickname if unchanged', async () => {
    const existing = makeStats({ playerId: 'player-1', nickname: 'Alice' })
    mockGet.mockResolvedValue(existing)

    await getPlayerStats('player-1', 'Alice')

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe('recordGameResult', () => {
  it('should increment basic stats', async () => {
    const existing = makeStats()
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame(), {
      character: 'Detective',
      votesReceived: 2,
      isWinner: false,
      reactionsReceived: 10,
    })

    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'player-1', expect.objectContaining({
      gamesPlayed: 1,
      totalVotesReceived: 2,
      totalReactionsReceived: 10,
    }))
  })

  it('should update win stats when player wins', async () => {
    const existing = makeStats()
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame(), {
      character: 'Detective',
      votesReceived: 3,
      isWinner: true,
      reactionsReceived: 0,
    })

    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'player-1', expect.objectContaining({
      gamesWon: 1,
      currentWinStreak: 1,
    }))
  })

  it('should reset win streak on loss', async () => {
    const existing = makeStats({ currentWinStreak: 3 })
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame(), {
      character: 'Detective',
      votesReceived: 0,
      isWinner: false,
      reactionsReceived: 0,
    })

    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'player-1', expect.objectContaining({
      currentWinStreak: 0,
    }))
  })

  it('should update best win streak', async () => {
    const existing = makeStats({ currentWinStreak: 4, bestWinStreak: 4 })
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame(), {
      character: 'Detective',
      votesReceived: 2,
      isWinner: true,
      reactionsReceived: 0,
    })

    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'player-1', expect.objectContaining({
      currentWinStreak: 5,
      bestWinStreak: 5,
    }))
  })

  it('should track character counts and set favorite', async () => {
    const existing = makeStats({ characterCounts: { 'Chef': 3 } })
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame(), {
      character: 'Chef',
      votesReceived: 0,
      isWinner: false,
      reactionsReceived: 0,
    })

    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'player-1', expect.objectContaining({
      characterCounts: { Chef: 4 },
      favoriteCharacter: 'Chef',
    }))
  })

  it('should update game mode stats for ensemble', async () => {
    const existing = makeStats()
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame({ gameMode: 'ENSEMBLE' }), {
      character: 'Detective',
      votesReceived: 0,
      isWinner: true,
      reactionsReceived: 0,
    })

    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'player-1', expect.objectContaining({
      gameModeStats: expect.objectContaining({
        ensemble: { played: 1, won: 1 }
      })
    }))
  })

  it('should update game mode stats for solo', async () => {
    const existing = makeStats()
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame({ gameMode: 'SOLO' }), {
      character: 'Detective',
      votesReceived: 0,
      isWinner: false,
      reactionsReceived: 0,
    })

    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'player-1', expect.objectContaining({
      gameModeStats: expect.objectContaining({
        solo: { played: 1, won: 0 }
      })
    }))
  })

  it('should add game to recentGames (max 20)', async () => {
    const recentGames = Array.from({ length: 20 }, (_, i) => `old-game-${i}`)
    const existing = makeStats({ recentGames })
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame({ id: 'new-game' }), {
      character: 'Detective',
      votesReceived: 0,
      isWinner: false,
      reactionsReceived: 0,
    })

    expect(mockDb.set).toHaveBeenCalledWith('playerStats', 'player-1', expect.objectContaining({
      recentGames: expect.arrayContaining(['new-game'])
    }))

    // Verify it's capped at 20
    const savedStats = mockDb.set.mock.calls[0][2] as PlayerStats
    expect(savedStats.recentGames).toHaveLength(20)
    expect(savedStats.recentGames[0]).toBe('new-game')
  })

  it('should award first_game achievement on first game', async () => {
    const existing = makeStats()
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    const achievements = await recordGameResult('player-1', 'Alice', makeSavedGame(), {
      character: 'Detective',
      votesReceived: 0,
      isWinner: false,
      reactionsReceived: 0,
    })

    expect(achievements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'first_game' })
      ])
    )
  })

  it('should calculate win rate correctly', async () => {
    const existing = makeStats({ gamesPlayed: 9, gamesWon: 4 })
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    await recordGameResult('player-1', 'Alice', makeSavedGame(), {
      character: 'Detective',
      votesReceived: 0,
      isWinner: true,
      reactionsReceived: 0,
    })

    const savedStats = mockDb.set.mock.calls[0][2] as PlayerStats
    expect(savedStats.winRate).toBe(50) // 5/10 * 100
  })

  it('should not duplicate achievements', async () => {
    const existing = makeStats({
      gamesPlayed: 0,
      achievements: [{ id: 'first_game', name: 'Debut', description: '', icon: '', rarity: 'common', unlockedAt: 1000 }]
    })
    mockGet.mockResolvedValue(existing)
    mockDb.set.mockResolvedValue(undefined)

    const achievements = await recordGameResult('player-1', 'Alice', makeSavedGame(), {
      character: 'Detective',
      votesReceived: 0,
      isWinner: false,
      reactionsReceived: 0,
    })

    // first_game should not be duplicated
    const firstGameCount = achievements.filter(a => a.id === 'first_game').length
    expect(firstGameCount).toBe(0)
  })
})

describe('getLeaderboard', () => {
  it('should return leaderboard entries sorted by category', async () => {
    const players: PlayerStats[] = [
      makeStats({ playerId: 'p1', nickname: 'Alice', gamesWon: 10 }),
      makeStats({ playerId: 'p2', nickname: 'Bob', gamesWon: 5 }),
    ]
    mockDb.query.mockResolvedValue(players)

    const leaderboard = await getLeaderboard('wins', 10)

    expect(leaderboard).toHaveLength(2)
    expect(leaderboard[0].rank).toBe(1)
    expect(leaderboard[0].playerId).toBe('p1')
    expect(leaderboard[0].value).toBe(10)
    expect(leaderboard[1].rank).toBe(2)
    expect(leaderboard[1].value).toBe(5)
  })

  it('should return games played for "games" category', async () => {
    const players: PlayerStats[] = [
      makeStats({ playerId: 'p1', nickname: 'Alice', gamesPlayed: 50 }),
    ]
    mockDb.query.mockResolvedValue(players)

    const leaderboard = await getLeaderboard('games', 10)

    expect(leaderboard[0].value).toBe(50)
  })

  it('should return reactions for "reactions" category', async () => {
    const players: PlayerStats[] = [
      makeStats({ playerId: 'p1', nickname: 'Alice', totalReactionsReceived: 200 }),
    ]
    mockDb.query.mockResolvedValue(players)

    const leaderboard = await getLeaderboard('reactions', 10)

    expect(leaderboard[0].value).toBe(200)
  })

  it('should return best win streak for "streak" category', async () => {
    const players: PlayerStats[] = [
      makeStats({ playerId: 'p1', nickname: 'Alice', bestWinStreak: 7 }),
    ]
    mockDb.query.mockResolvedValue(players)

    const leaderboard = await getLeaderboard('streak', 10)

    expect(leaderboard[0].value).toBe(7)
  })

  it('should apply minimum games filter for winRate', async () => {
    mockDb.query.mockResolvedValue([])

    await getLeaderboard('winRate', 10)

    expect(mockDb.query).toHaveBeenCalledWith(
      'playerStats',
      expect.arrayContaining([
        expect.objectContaining({ field: 'gamesPlayed', operator: '>=', value: 5 })
      ]),
      expect.objectContaining({
        orderBy: 'winRate',
        orderDirection: 'desc',
        limit: 10
      })
    )
  })

  it('should return empty array when no players', async () => {
    mockDb.query.mockResolvedValue([])

    const leaderboard = await getLeaderboard('wins', 10)

    expect(leaderboard).toEqual([])
  })

  it('should include featured achievement if player has one', async () => {
    const players: PlayerStats[] = [
      makeStats({
        playerId: 'p1',
        nickname: 'Alice',
        gamesWon: 10,
        achievements: [
          { id: 'first_game', name: 'Debut', description: '', icon: '', rarity: 'common', unlockedAt: 1000 },
          { id: 'comedy_king', name: 'Comedy King', description: '', icon: '', rarity: 'rare', unlockedAt: 2000 },
        ]
      }),
    ]
    mockDb.query.mockResolvedValue(players)

    const leaderboard = await getLeaderboard('wins', 10)

    // Should feature the rarest achievement (rare > common)
    expect(leaderboard[0].achievement).toBe('comedy_king')
  })
})

describe('unlockAchievement', () => {
  it('should unlock a valid achievement', async () => {
    const stats = makeStats()
    mockGet.mockResolvedValue(stats)
    mockDb.set.mockResolvedValue(undefined)

    const result = await unlockAchievement('player-1', 'first_game')

    expect(result).toBe(true)
    expect(mockDb.set).toHaveBeenCalled()
  })

  it('should return false for non-existent player', async () => {
    mockGet.mockResolvedValue(null)

    const result = await unlockAchievement('ghost', 'first_game')

    expect(result).toBe(false)
  })

  it('should return false if already unlocked', async () => {
    const stats = makeStats({
      achievements: [{ id: 'first_game', name: 'Debut', description: '', icon: '', rarity: 'common', unlockedAt: 1000 }]
    })
    mockGet.mockResolvedValue(stats)

    const result = await unlockAchievement('player-1', 'first_game')

    expect(result).toBe(false)
    expect(mockDb.set).not.toHaveBeenCalled()
  })
})

describe('getTotalPlayerCount', () => {
  it('should return count from database', async () => {
    mockDb.count.mockResolvedValue(42)

    const count = await getTotalPlayerCount()

    expect(count).toBe(42)
    expect(mockDb.count).toHaveBeenCalledWith('playerStats')
  })
})
