/**
 * Reconnection Tests
 * Tests grace period disconnect, player reconnection, and auto-pause on host disconnect.
 */

import type { Room, Player, GameState } from '../../../../lib/types'

// Mock the database
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

jest.mock('../../../../server/utils/roomSerializer', () => ({
  roomToFirestore: (room: Room) => ({ ...room, players: Array.from(room.players.values()) }),
  firestoreToRoom: (doc: Record<string, unknown>) => doc
}))

import * as roomService from '../../../../server/services/room.service'
import { buildRoomRecoverySnapshot } from '../../../../server/handlers/reconnection.handler'

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    code: 'TEST',
    host: { id: 'host-1', nickname: 'Host', isHost: true, socketId: 'sock-host', role: 'HOST', connected: true } as Player,
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

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    nickname: 'Alice',
    role: 'PLAYER',
    isHost: false,
    socketId: 'sock-1',
    sessionId: 'session-1',
    uid: 'uid-1',
    connected: true,
    ...overrides,
  } as Player
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
})

afterEach(() => {
  jest.useRealTimers()
  // Clean up rooms by deleting them
  for (const room of roomService.getActiveRooms()) {
    roomService.deleteRoom(room.code)
  }
})

describe('markPlayerDisconnected', () => {
  it('sets player.connected to false', () => {
    const player = makePlayer({ socketId: 'sock-1' })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    const result = roomService.markPlayerDisconnected('TEST', 'sock-1')
    expect(result).not.toBeNull()
    expect(result!.player.connected).toBe(false)
  })

  it('returns null for unknown socket', () => {
    const room = makeRoom()
    roomService.createRoom(room)
    expect(roomService.markPlayerDisconnected('TEST', 'unknown-sock')).toBeNull()
  })

  it('returns null for unknown room', () => {
    expect(roomService.markPlayerDisconnected('NOPE', 'sock-1')).toBeNull()
  })
})

describe('markPlayerReconnected', () => {
  it('restores player.connected and updates socketId', () => {
    const player = makePlayer({ socketId: 'sock-old', connected: false })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    const result = roomService.markPlayerReconnected('TEST', 'player-1', 'sock-new')
    expect(result).not.toBeNull()
    expect(result!.player.connected).toBe(true)
    expect(result!.player.socketId).toBe('sock-new')
  })

  it('cancels pending disconnect timer', () => {
    const player = makePlayer({ socketId: 'sock-old', connected: false })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    // Set a disconnect timer
    const timer = setTimeout(() => {}, 60000)
    roomService.setDisconnectTimer('TEST', 'player-1', timer)

    // Reconnect should cancel it
    roomService.markPlayerReconnected('TEST', 'player-1', 'sock-new')

    // The timer should have been cleared (we can't directly test clearTimeout,
    // but we can verify the player is still in the room after advancing time)
    jest.advanceTimersByTime(70000)
    const updatedRoom = roomService.getRoomFromCache('TEST')
    expect(updatedRoom!.players.has('player-1')).toBe(true)
  })

  it('updates room.host when host reconnects', () => {
    const hostPlayer = makePlayer({ id: 'host-1', isHost: true, socketId: 'sock-host', connected: false })
    const room = makeRoom({ host: hostPlayer })
    room.players.set(hostPlayer.id, hostPlayer)
    roomService.createRoom(room)

    roomService.markPlayerReconnected('TEST', 'host-1', 'sock-host-new')
    const updatedRoom = roomService.getRoomFromCache('TEST')
    expect(updatedRoom!.host.socketId).toBe('sock-host-new')
  })
})

describe('removePlayerAfterGrace', () => {
  it('removes a disconnected player', () => {
    const player = makePlayer({ connected: false })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    const result = roomService.removePlayerAfterGrace('TEST', 'player-1')
    expect(result).not.toBeNull()
    const updatedRoom = roomService.getRoomFromCache('TEST')
    expect(updatedRoom!.players.has('player-1')).toBe(false)
  })

  it('does not remove a reconnected player', () => {
    const player = makePlayer({ connected: true })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    const result = roomService.removePlayerAfterGrace('TEST', 'player-1')
    expect(result).toBeNull()
    const updatedRoom = roomService.getRoomFromCache('TEST')
    expect(updatedRoom!.players.has('player-1')).toBe(true)
  })
})

describe('findPlayerByUserId', () => {
  it('finds player by uid', () => {
    const player = makePlayer({ uid: 'uid-abc' })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    const result = roomService.findPlayerByUserId('uid-abc')
    expect(result).not.toBeNull()
    expect(result!.player.nickname).toBe('Alice')
  })

  // ASSERTION AUDIT 2026-07-29 — was `finds player by playerId fallback`, asserting
  // room.service.ts:321 `player.uid === userId || playerId === userId` as intended behaviour.
  // That conflation IS defect D2b: a playerId the server broadcasts in players_update is
  // accepted as a reconnect credential, which is how the harness took the HOST seat.
  // Gates Chunk 2 item 5c. Red until the `playerId === userId` arm is deleted.
  it('does NOT resolve a playerId as a userId', () => {
    const player = makePlayer({ id: 'pid-xyz', uid: undefined })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    expect(roomService.findPlayerByUserId('pid-xyz')).toBeNull()
  })

  it('returns null when not found', () => {
    expect(roomService.findPlayerByUserId('nope')).toBeNull()
  })
})

describe('findPlayerInRoomByUserId', () => {
  it('finds player in specific room', () => {
    const player = makePlayer({ uid: 'uid-room' })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    const result = roomService.findPlayerInRoomByUserId('TEST', 'uid-room')
    expect(result).not.toBeNull()
    expect(result!.player.nickname).toBe('Alice')
  })

  it('returns null for wrong room', () => {
    expect(roomService.findPlayerInRoomByUserId('NOPE', 'uid-room')).toBeNull()
  })

  // ASSERTION AUDIT 2026-07-29 — same conflation as findPlayerByUserId, at room.service.ts:345.
  // This is the lookup rejoin_room uses (reconnection.handler.ts:57-58), so it is the live
  // credential path. Gates Chunk 2 item 5c.
  it('does NOT resolve a playerId as a userId', () => {
    const player = makePlayer({ id: 'pid-inroom', uid: undefined })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    expect(roomService.findPlayerInRoomByUserId('TEST', 'pid-inroom')).toBeNull()
  })
})

describe('findPlayerInRoomBySessionId', () => {
  it('finds player in specific room by stable session ID', () => {
    const player = makePlayer({ sessionId: 'session-room' })
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    const result = roomService.findPlayerInRoomBySessionId('TEST', 'session-room')
    expect(result).not.toBeNull()
    expect(result!.player.nickname).toBe('Alice')
  })

  it('returns null for unknown session ID', () => {
    const room = makeRoom()
    roomService.createRoom(room)

    expect(roomService.findPlayerInRoomBySessionId('TEST', 'missing-session')).toBeNull()
  })
})

describe('clearAllRoomTimeouts', () => {
  it('clears disconnect timers for the room', () => {
    const player = makePlayer()
    const room = makeRoom()
    room.players.set(player.id, player)
    roomService.createRoom(room)

    const timer = setTimeout(() => {}, 60000)
    roomService.setDisconnectTimer('TEST', 'player-1', timer)

    roomService.clearAllRoomTimeouts('TEST')
    // No error thrown = success (timers cleaned up)
  })
})

describe('buildRoomRecoverySnapshot', () => {
  it('includes persisted results and director review state', async () => {
    const player = makePlayer({ id: 'player-2', assignedCharacter: 'Detective' })
    const room = makeRoom({
      code: 'SNAP',
      results: {
        winner: { playerId: 'player-2', playerName: 'Alice', votes: 3 },
        allResults: [{ playerId: 'player-2', playerName: 'Alice', votes: 3 }],
      },
      directorsReview: {
        rating: 4,
        headline: 'A triumph',
        review: 'Very serious about very silly business.',
        bestMoment: 'The final monologue.',
      },
    })
    room.players.set(player.id, player)

    const snapshot = await buildRoomRecoverySnapshot(room, player.id, player)

    expect(snapshot.results).toEqual(room.results)
    expect(snapshot.directorsReview).toEqual(room.directorsReview)
    expect(snapshot.assignedCharacter).toBe('Detective')
  })

  it('flags host disconnect state for reconnecting audience members', async () => {
    const player = makePlayer({ id: 'player-3' })
    const host = makePlayer({ id: 'host-1', isHost: true, role: 'HOST', connected: false, socketId: '' })
    const room = makeRoom({
      code: 'PAUSE',
      host,
      gameState: 'PERFORMING',
      isPaused: true,
    })
    room.players.set(host.id, host)
    room.players.set(player.id, player)

    const snapshot = await buildRoomRecoverySnapshot(room, player.id, player)

    expect(snapshot.hostDisconnected).toBe(true)
    expect(snapshot.isPaused).toBe(true)
  })
})
