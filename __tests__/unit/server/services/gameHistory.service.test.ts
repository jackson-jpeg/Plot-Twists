/**
 * Game History Service Tests
 * Tests saving, retrieving, and filtering games.
 */

import type { SavedGame, Script, Player, GameResults } from '../../../../lib/types'

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}))

// Mock the database module
const mockDb = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(() => true),
  batchSet: jest.fn(),
  batchDelete: jest.fn(),
  getAll: jest.fn(),
  count: jest.fn(),
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
  saveGame,
  getGame,
  getPlayerGames,
  getPublicGames,
  shareGame,
  deleteGame
} from '../../../../server/services/gameHistory.service'

const mockScript: Script = {
  title: 'Test Script',
  synopsis: 'A test synopsis',
  lines: [
    { speaker: 'Alice', text: 'Hello', mood: 'happy' },
    { speaker: 'Bob', text: 'Hi there', mood: 'neutral' }
  ]
}

const mockPlayers: Player[] = [
  { id: 'p1', nickname: 'Alice', isHost: true, socketId: 's1', role: 'PLAYER', assignedCharacter: 'Alice', hasSubmittedSelection: true, hasSubmittedVote: true } as Player,
  { id: 'p2', nickname: 'Bob', isHost: false, socketId: 's2', role: 'PLAYER', assignedCharacter: 'Bob', hasSubmittedSelection: true, hasSubmittedVote: true } as Player
]

const mockResults: GameResults = {
  winner: { playerId: 'p1', playerName: 'Alice', votes: 1 },
  allResults: [{ playerId: 'p1', playerName: 'Alice', votes: 1 }, { playerId: 'p2', playerName: 'Bob', votes: 0 }]
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('saveGame', () => {
  it('should save a game to the database', async () => {
    mockDb.set.mockResolvedValue(undefined)

    const result = await saveGame(
      'ABCD',
      mockScript,
      mockPlayers,
      'ENSEMBLE',
      mockResults,
      {
        setting: 'Test Setting',
        circumstance: 'Test Circumstance',
        cardPackId: 'standard',
        comedyStyle: 'witty',
        duration: 120,
        audienceReactionCount: 5,
        plotTwistsUsed: ['twist1']
      }
    )

    expect(result.id).toBe('test-uuid-1234')
    expect(result.title).toBe('Test Script')
    expect(result.players).toHaveLength(2)
    expect(result.playerIds).toEqual(['p1', 'p2'])
    expect(result.winner?.playerId).toBe('p1')
    expect(mockDb.set).toHaveBeenCalledWith('gameHistory', 'test-uuid-1234', expect.objectContaining({
      id: 'test-uuid-1234',
      title: 'Test Script',
      playerIds: ['p1', 'p2']
    }))
  })

  it('should set isPublic to false by default', async () => {
    mockDb.set.mockResolvedValue(undefined)

    const result = await saveGame('ABCD', mockScript, mockPlayers, 'ENSEMBLE', mockResults, {
      setting: 'S', circumstance: 'C', cardPackId: 'standard', comedyStyle: 'witty',
      duration: 60, audienceReactionCount: 0, plotTwistsUsed: []
    })

    expect(result.isPublic).toBe(false)
  })
})

describe('getGame', () => {
  it('should return game by ID', async () => {
    const game = { id: 'g1', title: 'Test' } as SavedGame
    mockDb.get.mockResolvedValue(game)

    const result = await getGame('g1')
    expect(result?.id).toBe('g1')
    expect(mockDb.get).toHaveBeenCalledWith('gameHistory', 'g1')
  })

  it('should return null for non-existent game', async () => {
    mockDb.get.mockResolvedValue(null)

    const result = await getGame('nonexistent')
    expect(result).toBeNull()
  })
})

describe('getPlayerGames', () => {
  it('should query with array-contains for playerIds', async () => {
    mockDb.query.mockResolvedValue([])

    await getPlayerGames('p1', 20, 0)

    expect(mockDb.query).toHaveBeenCalledWith(
      'gameHistory',
      [{ field: 'playerIds', operator: 'array-contains', value: 'p1' }],
      expect.objectContaining({
        orderBy: 'playedAt',
        orderDirection: 'desc',
        limit: 20
      })
    )
  })

  it('should handle offset by requesting extra records', async () => {
    const games = Array.from({ length: 15 }, (_, i) => ({
      id: `g${i}`,
      playedAt: 1000 + i,
      playerIds: ['p1']
    })) as unknown as SavedGame[]
    mockDb.query.mockResolvedValue(games)

    const result = await getPlayerGames('p1', 5, 5)

    expect(result).toHaveLength(5)
    expect(mockDb.query).toHaveBeenCalledWith(
      'gameHistory',
      expect.any(Array),
      expect.objectContaining({ limit: 10 }) // limit + offset
    )
  })
})

describe('getPublicGames', () => {
  it('should query for public games only', async () => {
    mockDb.query.mockResolvedValue([])

    await getPublicGames(10)

    expect(mockDb.query).toHaveBeenCalledWith(
      'gameHistory',
      [{ field: 'isPublic', operator: '==', value: true }],
      expect.objectContaining({ orderBy: 'likes', orderDirection: 'desc', limit: 10 })
    )
  })
})

describe('shareGame', () => {
  it('should generate share code and make game public', async () => {
    const game = { id: 'g1', isPublic: false } as SavedGame
    mockDb.get.mockResolvedValue(game)
    mockDb.query.mockResolvedValue([]) // No existing share code
    mockDb.update.mockResolvedValue(undefined)

    const result = await shareGame('g1')

    expect(result.success).toBe(true)
    expect(result.shareCode).toBeDefined()
    expect(result.shareCode).toHaveLength(8)
    expect(mockDb.update).toHaveBeenCalledWith('gameHistory', 'g1', expect.objectContaining({
      isPublic: true,
      shareCode: expect.any(String)
    }))
  })

  it('should fail for non-existent game', async () => {
    mockDb.get.mockResolvedValue(null)

    const result = await shareGame('nonexistent')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Game not found')
  })
})

describe('deleteGame', () => {
  it('should delete game when requester is host', async () => {
    const game = {
      id: 'g1',
      players: [{ id: 'host-1', isHost: true }]
    } as unknown as SavedGame
    mockDb.get.mockResolvedValue(game)
    mockDb.delete.mockResolvedValue(undefined)

    const result = await deleteGame('g1', 'host-1')

    expect(result.success).toBe(true)
    expect(mockDb.delete).toHaveBeenCalledWith('gameHistory', 'g1')
  })

  it('should reject deletion by non-host', async () => {
    const game = {
      id: 'g1',
      players: [{ id: 'host-1', isHost: true }, { id: 'p2', isHost: false }]
    } as unknown as SavedGame
    mockDb.get.mockResolvedValue(game)

    const result = await deleteGame('g1', 'p2')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Only the host can delete this game')
  })
})
