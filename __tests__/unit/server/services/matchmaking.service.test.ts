import type { Player, Room } from '../../../../lib/types'

// Mock database adapter used by room.service persistence
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
    MIGRATIONS: 'migrations',
  },
}))

jest.mock('../../../../server/utils/roomSerializer', () => ({
  roomToFirestore: (room: Room) => ({ ...room, players: Array.from(room.players.values()) }),
  firestoreToRoom: (doc: Record<string, unknown>) => doc,
}))

import * as roomService from '../../../../server/services/room.service'
import { checkAutoStart, syncAutoStart } from '../../../../server/services/matchmaking.service'

function makePlayer(id: string, role: Player['role'], isHost = false): Player {
  return {
    id,
    nickname: isHost ? 'Host' : `Player ${id}`,
    role,
    isHost,
    socketId: `sock-${id}`,
    connected: true,
    sessionId: `session-${id}`,
  } as Player
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  const host = makePlayer('host', 'HOST', true)
  const players = new Map<string, Player>([[host.id, host]])

  return {
    code: 'ROOM',
    host,
    players,
    gameState: 'LOBBY',
    gameMode: 'ENSEMBLE',
    isMature: false,
    selections: new Map(),
    currentLineIndex: 0,
    isPaused: false,
    votes: new Map(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    isPublic: true,
    autoStart: true,
    ...overrides,
  } as Room
}

function makeIo() {
  return {
    to: jest.fn(() => ({ emit: jest.fn() })),
  }
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
})

afterEach(() => {
  jest.useRealTimers()
  for (const room of roomService.getActiveRooms()) {
    roomService.deleteRoom(room.code)
  }
})

describe('matchmaking thresholds', () => {
  it('does not start ensemble countdown until three non-host players join', () => {
    const room = makeRoom()
    room.players.set('p1', makePlayer('p1', 'PLAYER'))
    room.players.set('p2', makePlayer('p2', 'PLAYER'))
    roomService.createRoom(room)

    const io = makeIo()
    checkAutoStart(room, io as never)

    expect(io.to).not.toHaveBeenCalled()
  })

  it('starts ensemble countdown when three non-host players join', () => {
    const room = makeRoom()
    room.players.set('p1', makePlayer('p1', 'PLAYER'))
    room.players.set('p2', makePlayer('p2', 'PLAYER'))
    room.players.set('p3', makePlayer('p3', 'PLAYER'))
    roomService.createRoom(room)

    const io = makeIo()
    checkAutoStart(room, io as never)
    jest.advanceTimersByTime(1000)

    expect(io.to).toHaveBeenCalledWith('ROOM')
  })

  it('cancels an active countdown when the room drops below the threshold', () => {
    const room = makeRoom()
    room.players.set('p1', makePlayer('p1', 'PLAYER'))
    room.players.set('p2', makePlayer('p2', 'PLAYER'))
    room.players.set('p3', makePlayer('p3', 'PLAYER'))
    roomService.createRoom(room)

    const io = makeIo()
    checkAutoStart(room, io as never)

    room.players.delete('p3')
    syncAutoStart(room, io as never)

    const emit = (io.to as jest.Mock).mock.results.at(-1)?.value.emit as jest.Mock | undefined
    expect(emit).toHaveBeenCalledWith('auto_start_countdown', 0)
  })
})
