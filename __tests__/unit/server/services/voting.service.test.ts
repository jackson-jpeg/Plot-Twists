/**
 * Voting Service Tests
 * Tests vote tallying, tie-breaking, MVP selection, and double-vote rejection.
 */

import type { Room, Player, GameState, Script } from '../../../../lib/types'

const mockGenerateDirectorsReview = jest.fn().mockResolvedValue(null)
const mockShouldGenerateDirectorsReview = jest.fn(() => false)
const mockRecordGameResult = jest.fn().mockResolvedValue([])
const mockGetPlayerStats = jest.fn().mockResolvedValue({ currentWinStreak: 0 })
const mockAwardXP = jest.fn().mockResolvedValue({
  xpEvents: [{ source: 'game_completed', amount: 50, description: 'Game completed', timestamp: Date.now() }],
  newLevel: 1,
  oldLevel: 1,
  title: 'Rookie',
  totalXP: 50,
})
const mockComputeGameXPEvents = jest.fn().mockReturnValue([
  { source: 'game_completed', description: 'Game completed' },
])
const mockIsFirstGameToday = jest.fn().mockResolvedValue(false)
const mockMarkDailyBonus = jest.fn().mockResolvedValue(undefined)
const mockUpdateChallengeProgress = jest.fn().mockResolvedValue({ completedChallenges: [], xpAwarded: 0 })

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

// Mock room service
jest.mock('../../../../server/services/room.service', () => ({
  updateRoom: jest.fn(),
}))

// Mock game history service
jest.mock('../../../../server/services/gameHistory.service', () => ({
  saveGame: jest.fn().mockResolvedValue({ id: 'game-1' }),
}))

// Mock player stats service
jest.mock('../../../../server/services/playerStats.service', () => ({
  recordGameResult: (...args: unknown[]) => mockRecordGameResult(...args),
  getPlayerStats: (...args: unknown[]) => mockGetPlayerStats(...args),
}))

jest.mock('../../../../server/services/directorsReview.service', () => ({
  generateDirectorsReview: (...args: unknown[]) => mockGenerateDirectorsReview(...args),
  shouldGenerateDirectorsReview: () => mockShouldGenerateDirectorsReview(),
}))

jest.mock('../../../../server/services/progression.service', () => ({
  awardXP: (...args: unknown[]) => mockAwardXP(...args),
  computeGameXPEvents: (...args: unknown[]) => mockComputeGameXPEvents(...args),
  isFirstGameToday: (...args: unknown[]) => mockIsFirstGameToday(...args),
  markDailyBonus: (...args: unknown[]) => mockMarkDailyBonus(...args),
  updateChallengeProgress: (...args: unknown[]) => mockUpdateChallengeProgress(...args),
}))

// Mock roomSerializer
jest.mock('../../../../server/utils/roomSerializer', () => ({
  roomToFirestore: (room: Room) => ({ ...room, players: Array.from(room.players.values()) }),
  firestoreToRoom: (doc: Record<string, unknown>) => doc
}))

import { calculateResults } from '../../../../server/services/voting.service'
import * as roomService from '../../../../server/services/room.service'

function makePlayer(id: string, nickname: string): Player {
  return {
    id,
    nickname,
    isHost: false,
    socketId: `sock-${id}`,
    role: 'PLAYER',
    hasSubmittedSelection: false,
    hasSubmittedVote: false,
  } as Player
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  const players = new Map<string, Player>()
  players.set('p1', makePlayer('p1', 'Alice'))
  players.set('p2', makePlayer('p2', 'Bob'))
  players.set('p3', makePlayer('p3', 'Charlie'))

  return {
    code: 'TEST',
    host: { id: 'host-1', nickname: 'Host', isHost: true, socketId: 'sock-host', role: 'HOST', hasSubmittedSelection: false, hasSubmittedVote: false } as Player,
    players,
    gameState: 'VOTING' as GameState,
    isMature: false,
    gameMode: 'ENSEMBLE',
    votes: new Map(),
    selections: new Map(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    currentLineIndex: 0,
    isPaused: false,
    script: { title: 'Test Script', lines: [], synopsis: '' } as Script,
    ...overrides,
  } as Room
}

// Create a mock Socket.IO server
function makeMockIO() {
  const emitFn = jest.fn()
  const socketsMap = new Map()
  return {
    to: jest.fn().mockReturnValue({ emit: emitFn }),
    sockets: { sockets: socketsMap },
    _emit: emitFn,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGenerateDirectorsReview.mockResolvedValue(null)
  mockShouldGenerateDirectorsReview.mockReturnValue(false)
  mockRecordGameResult.mockResolvedValue([])
  mockGetPlayerStats.mockResolvedValue({ currentWinStreak: 0 })
  mockAwardXP.mockResolvedValue({
    xpEvents: [{ source: 'game_completed', amount: 50, description: 'Game completed', timestamp: Date.now() }],
    newLevel: 1,
    oldLevel: 1,
    title: 'Rookie',
    totalXP: 50,
  })
  mockComputeGameXPEvents.mockReturnValue([
    { source: 'game_completed', description: 'Game completed' },
  ])
  mockIsFirstGameToday.mockResolvedValue(false)
  mockMarkDailyBonus.mockResolvedValue(undefined)
  mockUpdateChallengeProgress.mockResolvedValue({ completedChallenges: [], xpAwarded: 0 })
})

describe('calculateResults', () => {
  it('should tally votes and determine a winner', async () => {
    const room = makeRoom()
    // p1 and p3 vote for p2, p2 votes for p1
    room.votes.set('p1', 'p2')
    room.votes.set('p3', 'p2')
    room.votes.set('p2', 'p1')

    const io = makeMockIO()
    await calculateResults(room, io as never)

    // Should emit game_over with p2 as winner (2 votes)
    expect(io._emit).toHaveBeenCalledWith('game_over', expect.objectContaining({
      winner: expect.objectContaining({ playerId: 'p2', votes: 2 }),
      allResults: expect.arrayContaining([
        expect.objectContaining({ playerId: 'p2', votes: 2 }),
        expect.objectContaining({ playerId: 'p1', votes: 1 }),
      ])
    }))

    // Should emit game_state_change to RESULTS
    expect(io._emit).toHaveBeenCalledWith('game_state_change', 'RESULTS')
  })

  it('should handle ties (first in sort order wins)', async () => {
    const room = makeRoom()
    // p1 votes for p2, p2 votes for p3 — tie (1 vote each)
    room.votes.set('p1', 'p2')
    room.votes.set('p2', 'p3')

    const io = makeMockIO()
    await calculateResults(room, io as never)

    expect(io._emit).toHaveBeenCalledWith('game_over', expect.objectContaining({
      allResults: expect.arrayContaining([
        expect.objectContaining({ votes: 1 }),
        expect.objectContaining({ votes: 1 }),
      ])
    }))
  })

  it('should not execute twice if already in RESULTS state', async () => {
    const room = makeRoom({ gameState: 'RESULTS' as GameState })
    room.votes.set('p1', 'p2')

    const io = makeMockIO()
    await calculateResults(room, io as never)

    // Should not emit anything since gameState is already RESULTS
    expect(io._emit).not.toHaveBeenCalled()
  })

  // ASSERTION AUDIT 2026-07-29 — was `should handle no votes gracefully`, asserting that a
  // zero-vote round emits a normal game_over with winner=undefined and allResults=[]. That is
  // defect D3b (voting.service.ts:162-176) restated as a virtue: players get a results screen
  // with no winner and no scores, presented as the outcome. This test was GREEN while the
  // harness case `emptyResults` was RED on the same behaviour — the suite and the harness
  // directly contradicted each other. Gates Chunk 2 item 7.
  it('does NOT emit a normal game_over for a zero-vote round', async () => {
    const room = makeRoom()
    // No votes cast

    const io = makeMockIO()
    await calculateResults(room, io as never)

    expect(io._emit).not.toHaveBeenCalledWith('game_over', expect.objectContaining({
      winner: undefined,
      allResults: []
    }))
  })

  it('should update room state to RESULTS', async () => {
    const room = makeRoom()
    room.votes.set('p1', 'p2')

    const io = makeMockIO()
    await calculateResults(room, io as never)

    expect(room.gameState).toBe('RESULTS')
    expect(roomService.updateRoom).toHaveBeenCalledWith(room)
  })

  it('should include audience highlights when reactions exist', async () => {
    const room = makeRoom()
    room.votes.set('p1', 'p2')
    room.audienceInteraction = {
      reactionCounts: { laugh: 10, gasp: 5, cheer: 3, love: 2, mindblown: 1, boo: 0 },
      reactions: new Map(),
      plotTwistHistory: [],
      spectatorMessages: [{ id: '1', nickname: 'spec', message: 'lol', timestamp: Date.now() }],
    } as unknown as Room['audienceInteraction']

    const io = makeMockIO()
    await calculateResults(room, io as never)

    expect(io._emit).toHaveBeenCalledWith('game_over', expect.objectContaining({
      highlights: expect.arrayContaining([
        expect.objectContaining({ label: 'Most Laughs' }),
        expect.objectContaining({ label: 'Chat Messages' }),
      ])
    }))
  })

  it('should add weekly challenge XP to awarded events', async () => {
    const room = makeRoom()
    room.votes.set('p1', 'p2')

    mockUpdateChallengeProgress.mockResolvedValue({
      completedChallenges: [
        {
          id: 'play_3',
          title: 'Triple Feature',
          description: 'Play 3 games this week',
          target: 3,
          progress: 3,
          xpReward: 150,
          expiresAt: Date.now() + 1000,
          completed: true,
        },
      ],
      xpAwarded: 150,
    })

    const io = makeMockIO()
    await calculateResults(room, io as never)

    const awardCall = mockAwardXP.mock.calls.find(([playerId]) => playerId === 'p1')
    expect(awardCall).toBeDefined()
    expect(awardCall?.[1]).toEqual(expect.arrayContaining([
      expect.objectContaining({
        source: 'weekly_challenge',
        amount: 150,
        description: 'Weekly challenge: Triple Feature',
      }),
    ]))
  })

  it('should continue processing other players if one player update fails', async () => {
    const room = makeRoom()
    room.votes.set('p1', 'p2')
    room.votes.set('p2', 'p1')
    room.votes.set('p3', 'p2')

    mockRecordGameResult.mockImplementation(async (playerId: string) => {
      if (playerId === 'p1') {
        throw new Error('stats write failed')
      }
      return []
    })

    const io = makeMockIO()
    await calculateResults(room, io as never)

    expect(mockRecordGameResult).toHaveBeenCalledTimes(3)
    expect(mockAwardXP).toHaveBeenCalledTimes(2)
    expect(mockAwardXP.mock.calls.map(([playerId]) => playerId)).toEqual(['p2', 'p3'])
    expect(io._emit).toHaveBeenCalledWith('game_over', expect.any(Object))
  })

  it('should emit director review when generation is enabled and succeeds', async () => {
    const room = makeRoom()
    room.votes.set('p1', 'p2')
    const review = {
      rating: 4,
      headline: 'A triumph',
      review: 'Absurdly serious and very funny.',
      bestMoment: 'The final line reading.',
    }

    mockShouldGenerateDirectorsReview.mockReturnValue(true)
    mockGenerateDirectorsReview.mockResolvedValue(review)

    const io = makeMockIO()
    await calculateResults(room, io as never)
    await new Promise<void>(resolve => setImmediate(resolve))

    expect(mockGenerateDirectorsReview).toHaveBeenCalled()
    expect(io._emit).toHaveBeenCalledWith('directors_review', review)
  })
})
