/**
 * Socket Helpers Tests
 * Tests for shared socket handler utilities.
 */

import {
  validateRoom,
  requireRoomMember,
  requireHost,
  findPlayerBySocketId,
  findPlayerEntryBySocketId,
} from '../../../../server/socket/helpers'
import type { Room, Player } from '../../../../lib/types'

// Mock dependencies
jest.mock('../../../../server/services/room.service', () => ({
  getRoomFromCache: jest.fn(),
}))
jest.mock('../../../../server/utils/validation', () => ({
  isValidRoomCode: (code: string) => /^[A-Z0-9]{4}$/.test(code),
}))
jest.mock('../../../../lib/admin', () => ({
  isAdminUser: jest.fn(() => false),
}))
jest.mock('../../../../server/services/credit.service', () => ({
  checkAndDeductCredit: jest.fn(),
  getCredits: jest.fn(),
}))
jest.mock('../../../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}))

const { getRoomFromCache } = require('../../../../server/services/room.service')

function createMockRoom(): Room {
  const players = new Map<string, Player>()
  players.set('p1', { id: 'p1', socketId: 'sock1', nickname: 'Alice', isHost: false, role: 'PLAYER' } as Player)
  players.set('p2', { id: 'p2', socketId: 'sock2', nickname: 'Bob', isHost: false, role: 'PLAYER' } as Player)
  return {
    code: 'ABCD',
    host: { id: 'host', socketId: 'hostSock', nickname: 'Host', isHost: true, role: 'HOST' } as Player,
    players,
    gameState: 'LOBBY',
  } as Room
}

describe('validateRoom', () => {
  it('should return null and emit error for invalid room code', () => {
    const emit = jest.fn()
    const result = validateRoom('!!', { emit })
    expect(result).toBeNull()
    expect(emit).toHaveBeenCalledWith('game_error_message', 'Invalid room code')
  })

  it('should return null and emit error for non-existent room', () => {
    getRoomFromCache.mockReturnValue(null)
    const emit = jest.fn()
    const result = validateRoom('ABCD', { emit })
    expect(result).toBeNull()
    expect(emit).toHaveBeenCalledWith('game_error_message', 'Room not found')
  })

  it('should return room for valid code', () => {
    const room = createMockRoom()
    getRoomFromCache.mockReturnValue(room)
    const emit = jest.fn()
    const result = validateRoom('ABCD', { emit })
    expect(result).toBe(room)
    expect(emit).not.toHaveBeenCalled()
  })
})

describe('requireRoomMember', () => {
  it('should return true for host socket', () => {
    const room = createMockRoom()
    expect(requireRoomMember(room, { id: 'hostSock' })).toBe(true)
  })

  it('should return true for player socket', () => {
    const room = createMockRoom()
    expect(requireRoomMember(room, { id: 'sock1' })).toBe(true)
  })

  it('should return false for unknown socket', () => {
    const room = createMockRoom()
    expect(requireRoomMember(room, { id: 'unknown' })).toBe(false)
  })
})

describe('requireHost', () => {
  it('should return true for host', () => {
    const room = createMockRoom()
    expect(requireHost(room, { id: 'hostSock' })).toBe(true)
  })

  it('should return false for non-host', () => {
    const room = createMockRoom()
    expect(requireHost(room, { id: 'sock1' })).toBe(false)
  })
})

describe('findPlayerBySocketId', () => {
  it('should find player by socket ID', () => {
    const room = createMockRoom()
    const player = findPlayerBySocketId(room, 'sock1')
    expect(player?.nickname).toBe('Alice')
  })

  it('should return undefined for unknown socket', () => {
    const room = createMockRoom()
    expect(findPlayerBySocketId(room, 'unknown')).toBeUndefined()
  })
})

describe('findPlayerEntryBySocketId', () => {
  it('should return id and player for matching socket', () => {
    const room = createMockRoom()
    const entry = findPlayerEntryBySocketId(room, 'sock2')
    expect(entry?.id).toBe('p2')
    expect(entry?.player.nickname).toBe('Bob')
  })

  it('should return undefined for no match', () => {
    const room = createMockRoom()
    expect(findPlayerEntryBySocketId(room, 'nope')).toBeUndefined()
  })
})
