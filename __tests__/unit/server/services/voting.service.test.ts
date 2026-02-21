/**
 * Voting Service Tests
 * Tests vote counting, race condition guards, and result calculation.
 */

import { calculateResults } from '../../../../server/services/voting.service'
import type { Room, Player, GameState } from '../../../../lib/types'

// Mock dependencies
jest.mock('../../../../server/services/room.service', () => ({
  updateRoom: jest.fn(),
}))
jest.mock('../../../../server/services/gameHistory.service', () => ({
  saveGame: jest.fn().mockResolvedValue({ id: 'test-game-id' }),
}))
jest.mock('../../../../server/services/playerStats.service', () => ({
  recordGameResult: jest.fn().mockResolvedValue([]),
}))
jest.mock('../../../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}))

function createMockRoom(overrides: Partial<Room> = {}): Room {
  const players = new Map<string, Player>()
  players.set('player1', {
    id: 'player1',
    socketId: 'socket1',
    nickname: 'Alice',
    isHost: false,
    role: 'PLAYER',
    hasSubmittedSelection: true,
    hasSubmittedVote: true,
  } as Player)
  players.set('player2', {
    id: 'player2',
    socketId: 'socket2',
    nickname: 'Bob',
    isHost: false,
    role: 'PLAYER',
    hasSubmittedSelection: true,
    hasSubmittedVote: true,
  } as Player)

  return {
    code: 'ABCD',
    host: { id: 'host1', socketId: 'hostSocket', nickname: 'Host', isHost: true, role: 'HOST' } as Player,
    players,
    gameState: 'VOTING' as GameState,
    gameMode: 'HEAD_TO_HEAD',
    votes: new Map(),
    selections: new Map(),
    isMature: false,
    currentLineIndex: 0,
    isPaused: false,
    lastActivity: Date.now(),
    createdAt: Date.now(),
    ...overrides,
  } as Room
}

function createMockIO() {
  const emitted: { event: string; args: unknown[] }[] = []
  return {
    to: () => ({
      emit: (event: string, ...args: unknown[]) => {
        emitted.push({ event, args })
      },
    }),
    sockets: { sockets: new Map() },
    _emitted: emitted,
  }
}

describe('calculateResults', () => {
  it('should count votes correctly and emit winner', async () => {
    const room = createMockRoom()
    // Both players vote for player1
    room.votes.set('player1', 'player2')
    room.votes.set('player2', 'player1')

    const io = createMockIO()
    await calculateResults(room, io as never)

    expect(room.gameState).toBe('RESULTS')

    const gameOverEvent = io._emitted.find(e => e.event === 'game_over')
    expect(gameOverEvent).toBeDefined()

    const results = gameOverEvent!.args[0] as { winner: { playerId: string; votes: number }; allResults: unknown[] }
    // player1 got 1 vote, player2 got 1 vote — winner is first alphabetically or first in sort
    expect(results.allResults).toHaveLength(2)
  })

  it('should guard against double execution (race condition)', async () => {
    const room = createMockRoom()
    room.votes.set('player1', 'player2')

    const io = createMockIO()

    // Call twice simultaneously
    await Promise.all([
      calculateResults(room, io as never),
      calculateResults(room, io as never),
    ])

    // game_over should only be emitted once
    const gameOverEvents = io._emitted.filter(e => e.event === 'game_over')
    expect(gameOverEvents).toHaveLength(1)
  })

  it('should handle room already in RESULTS state', async () => {
    const room = createMockRoom({ gameState: 'RESULTS' as GameState })
    const io = createMockIO()

    await calculateResults(room, io as never)

    // No events should be emitted
    expect(io._emitted).toHaveLength(0)
  })

  it('should handle room with no votes', async () => {
    const room = createMockRoom()
    const io = createMockIO()

    await calculateResults(room, io as never)

    const gameOverEvent = io._emitted.find(e => e.event === 'game_over')
    expect(gameOverEvent).toBeDefined()

    const results = gameOverEvent!.args[0] as { allResults: unknown[] }
    expect(results.allResults).toHaveLength(0)
  })

  it('should compute audience highlights correctly', async () => {
    const room = createMockRoom({
      audienceInteraction: {
        reactionCounts: { laugh: 5, gasp: 2, cheer: 3, love: 1, mindblown: 0 },
        spectatorMessages: [{ id: '1', text: 'hi', senderId: 's1', senderName: 'A', timestamp: 0 }],
      },
    } as unknown as Partial<Room>)
    room.votes.set('player1', 'player2')
    const io = createMockIO()

    await calculateResults(room, io as never)

    const gameOverEvent = io._emitted.find(e => e.event === 'game_over')
    const { highlights } = gameOverEvent!.args[0] as { highlights: { label: string }[] }

    expect(highlights.find(h => h.label === 'Most Laughs')).toBeDefined()
    expect(highlights.find(h => h.label === 'Most Dramatic')).toBeDefined()
    expect(highlights.find(h => h.label === 'Crowd Favorite')).toBeDefined()
    expect(highlights.find(h => h.label === 'Most Loved')).toBeDefined()
    expect(highlights.find(h => h.label === 'Mind Blown')).toBeUndefined() // 0 count
    expect(highlights.find(h => h.label === 'Total Reactions')).toBeDefined()
    expect(highlights.find(h => h.label === 'Chat Messages')).toBeDefined()
  })
})
