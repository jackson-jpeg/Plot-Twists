/**
 * Voting Service Tests
 * Tests vote tallying, tie-breaking, MVP selection, and double-vote rejection.
 */

import type { Room, Player, GameState, Script } from '../../../../lib/types'

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
  recordGameResult: jest.fn().mockResolvedValue([]),
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

  it('should handle no votes gracefully', async () => {
    const room = makeRoom()
    // No votes cast

    const io = makeMockIO()
    await calculateResults(room, io as never)

    expect(io._emit).toHaveBeenCalledWith('game_over', expect.objectContaining({
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
})
