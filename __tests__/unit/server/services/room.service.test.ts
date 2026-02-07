/**
 * Room Service Tests
 * Tests cache CRUD, debounced persist, and cleanup of inactive rooms.
 */

import type { Room, Player, GameState } from '../../../../lib/types'

// Mock the database before importing room service
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
  getAll: jest.fn().mockResolvedValue([]),
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

// Mock roomSerializer
jest.mock('../../../../server/utils/roomSerializer', () => ({
  roomToFirestore: (room: Room) => ({ ...room, players: Array.from(room.players.values()) }),
  firestoreToRoom: (doc: Record<string, unknown>) => doc
}))

import * as roomService from '../../../../server/services/room.service'

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    code: 'ABCD',
    host: { id: 'host-1', nickname: 'Host', isHost: true, socketId: 'sock-1', role: 'HOST', hasSubmittedSelection: false, hasSubmittedVote: false } as Player,
    players: new Map(),
    gameState: 'LOBBY' as GameState,
    isMature: false,
    gameMode: 'ENSEMBLE',
    votes: new Map(),
    selections: new Map(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    currentLineIndex: 0,
    isPaused: false,
    ...overrides
  } as Room
}

beforeEach(() => {
  jest.clearAllMocks()
  // Clean up rooms between tests
  for (const [code] of roomService.getRoomEntries()) {
    roomService.deleteRoom(code)
  }
})

describe('createRoom / getRoomFromCache', () => {
  it('should create and retrieve a room from cache', () => {
    const room = makeRoom({ code: 'TEST' })
    roomService.createRoom(room)

    const retrieved = roomService.getRoomFromCache('TEST')
    expect(retrieved).toBeDefined()
    expect(retrieved?.code).toBe('TEST')
  })

  it('should persist to Firestore on create', () => {
    const room = makeRoom({ code: 'FIRE' })
    roomService.createRoom(room)

    expect(mockDb.set).toHaveBeenCalled()
  })

  it('should handle case-insensitive room codes', () => {
    const room = makeRoom({ code: 'ABCD' })
    roomService.createRoom(room)

    expect(roomService.getRoomFromCache('abcd')).toBeDefined()
    expect(roomService.getRoomFromCache('ABCD')).toBeDefined()
  })
})

describe('updateRoom', () => {
  it('should update room in cache', () => {
    const room = makeRoom({ code: 'UPD1' })
    roomService.createRoom(room)

    room.gameState = 'SELECTION'
    roomService.updateRoom(room)

    const updated = roomService.getRoomFromCache('UPD1')
    expect(updated?.gameState).toBe('SELECTION')
  })
})

describe('deleteRoom', () => {
  it('should remove room from cache', async () => {
    const room = makeRoom({ code: 'DEL1' })
    roomService.createRoom(room)

    expect(roomService.getRoomFromCache('DEL1')).toBeDefined()

    await roomService.deleteRoom('DEL1')

    expect(roomService.getRoomFromCache('DEL1')).toBeUndefined()
  })

  it('should delete from Firestore', async () => {
    const room = makeRoom({ code: 'DEL2' })
    roomService.createRoom(room)
    jest.clearAllMocks()

    await roomService.deleteRoom('DEL2')

    expect(mockDb.delete).toHaveBeenCalledWith('rooms', 'DEL2')
  })
})

describe('addPlayer / removePlayer', () => {
  it('should add a player to the room', () => {
    const room = makeRoom({ code: 'PLAY' })
    roomService.createRoom(room)

    const player: Player = {
      id: 'p-1',
      nickname: 'Player 1',
      isHost: false,
      socketId: 'sock-2',
      role: 'PLAYER',
      hasSubmittedSelection: false,
      hasSubmittedVote: false
    } as Player

    roomService.addPlayer(room, player)

    const updated = roomService.getRoomFromCache('PLAY')
    expect(updated?.players.get('p-1')).toBeDefined()
    expect(updated?.players.get('p-1')?.nickname).toBe('Player 1')
  })

  it('should remove a player from the room', () => {
    const room = makeRoom({ code: 'REM1' })
    const player: Player = {
      id: 'p-2',
      nickname: 'Player 2',
      isHost: false,
      socketId: 'sock-3',
      role: 'PLAYER',
      hasSubmittedSelection: false,
      hasSubmittedVote: false
    } as Player
    room.players.set(player.id, player)
    roomService.createRoom(room)

    roomService.removePlayer(room, 'p-2')

    const updated = roomService.getRoomFromCache('REM1')
    expect(updated?.players.get('p-2')).toBeUndefined()
  })
})

describe('setGameState', () => {
  it('should update game state and last activity', () => {
    const room = makeRoom({ code: 'GS01' })
    roomService.createRoom(room)

    const before = room.lastActivity
    roomService.setGameState(room, 'PERFORMING')

    const updated = roomService.getRoomFromCache('GS01')
    expect(updated?.gameState).toBe('PERFORMING')
    expect(updated?.lastActivity).toBeGreaterThanOrEqual(before)
  })
})

describe('hasRoom / getActiveRoomCount', () => {
  it('should report room existence', () => {
    const room = makeRoom({ code: 'HAS1' })
    roomService.createRoom(room)

    expect(roomService.hasRoom('HAS1')).toBe(true)
    expect(roomService.hasRoom('NOPE')).toBe(false)
  })

  it('should report correct active room count', () => {
    const initialCount = roomService.getActiveRoomCount()

    roomService.createRoom(makeRoom({ code: 'CNT1' }))
    roomService.createRoom(makeRoom({ code: 'CNT2' }))

    expect(roomService.getActiveRoomCount()).toBe(initialCount + 2)
  })
})

describe('generateRoomCode', () => {
  it('should generate a unique code', () => {
    const code = roomService.generateRoomCode()
    expect(code).toHaveLength(4)
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/)
  })

  it('should not collide with existing rooms', () => {
    // Fill some codes
    for (let i = 0; i < 10; i++) {
      const code = roomService.generateRoomCode()
      roomService.createRoom(makeRoom({ code }))
    }

    // New code should still be unique
    const newCode = roomService.generateRoomCode()
    expect(roomService.hasRoom(newCode)).toBe(false)
  })
})

describe('timeout management', () => {
  it('should set and clear room timeouts', () => {
    const timeout = setTimeout(() => {}, 100000)
    roomService.setRoomTimeout('TEST', timeout)

    expect(roomService.getRoomTimeout('TEST')).toBeDefined()

    roomService.clearRoomTimeout('TEST')
    expect(roomService.getRoomTimeout('TEST')).toBeUndefined()

    clearTimeout(timeout)
  })

  it('should clear all room timeouts', () => {
    const t1 = setTimeout(() => {}, 100000)
    const t2 = setTimeout(() => {}, 100000)
    roomService.setRoomTimeout('CLR1', t1)
    roomService.setPlotTwistTimeout('CLR1', t2)

    roomService.clearAllRoomTimeouts('CLR1')

    expect(roomService.getRoomTimeout('CLR1')).toBeUndefined()
    expect(roomService.getPlotTwistTimeout('CLR1')).toBeUndefined()

    clearTimeout(t1)
    clearTimeout(t2)
  })
})
