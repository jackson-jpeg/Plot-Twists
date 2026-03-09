/* eslint-disable @typescript-eslint/no-explicit-any */
import { SocketManager } from '@/lib/socketManager'

// ── Mock socket.io-client ────────────────────────────────────

const mockSocketOn = jest.fn()
const mockSocketOff = jest.fn()
const mockSocketEmit = jest.fn()
const mockSocketDisconnect = jest.fn()
const mockManagerOn = jest.fn()

const mockSocket = {
  on: mockSocketOn,
  off: mockSocketOff,
  emit: mockSocketEmit,
  disconnect: mockSocketDisconnect,
  connected: false,
  id: 'test-socket-id',
  io: { on: mockManagerOn },
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}))

// Get a reference to the mocked `io` for assertions
import { io as mockIo } from 'socket.io-client'

beforeEach(() => {
  jest.clearAllMocks()
  mockSocket.connected = false
  mockSocket.id = 'test-socket-id'
})

// Helper: create a fresh SocketManager per test (avoids singleton bleed)
function createManager(): SocketManager {
  return new SocketManager()
}

// ─────────────────────────────────────────────────────────────

describe('SocketManager', () => {
  describe('connect()', () => {
    it('creates a typed socket connection with correct options', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000', { token: 'abc123' })

      expect(mockIo).toHaveBeenCalledWith('http://localhost:3000', {
        path: '/socket.io',
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 15000,
        reconnectionAttempts: 50,
        transports: ['websocket', 'polling'],
        upgrade: true,
        timeout: 20000,
        autoConnect: true,
        withCredentials: false,
        forceNew: false,
        multiplex: true,
        auth: { token: 'abc123' },
      })
    })

    it('passes undefined auth when no token provided', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      expect(mockIo).toHaveBeenCalledWith(
        'http://localhost:3000',
        expect.objectContaining({ auth: undefined }),
      )
    })

    it('does not create a second socket if already connected', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')
      mgr.connect('http://localhost:3000') // second call

      expect(mockIo).toHaveBeenCalledTimes(1)
    })

    it('sets connectionState to "connecting" immediately', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      expect(mgr.connectionState).toBe('connecting')
    })

    it('registers internal socket lifecycle listeners', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      // socket.on should have connect, disconnect, connect_error
      const socketEvents = mockSocketOn.mock.calls.map((c: any[]) => c[0])
      expect(socketEvents).toContain('connect')
      expect(socketEvents).toContain('disconnect')
      expect(socketEvents).toContain('connect_error')

      // socket.io.on should have reconnect_attempt, reconnect, reconnect_failed
      const managerEvents = mockManagerOn.mock.calls.map((c: any[]) => c[0])
      expect(managerEvents).toContain('reconnect_attempt')
      expect(managerEvents).toContain('reconnect')
      expect(managerEvents).toContain('reconnect_failed')
    })
  })

  describe('connectionState transitions', () => {
    it('transitions to "connected" on connect event', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      // Simulate the "connect" event
      const connectHandler = mockSocketOn.mock.calls.find((c: any[]) => c[0] === 'connect')![1]
      connectHandler()

      expect(mgr.connectionState).toBe('connected')
    })

    it('transitions to "disconnected" on disconnect event', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      // First connect, then disconnect
      const connectHandler = mockSocketOn.mock.calls.find((c: any[]) => c[0] === 'connect')![1]
      connectHandler()
      const disconnectHandler = mockSocketOn.mock.calls.find((c: any[]) => c[0] === 'disconnect')![1]
      disconnectHandler()

      expect(mgr.connectionState).toBe('disconnected')
    })

    it('transitions to "reconnecting" on reconnect_attempt', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      const handler = mockManagerOn.mock.calls.find((c: any[]) => c[0] === 'reconnect_attempt')![1]
      handler(1)

      expect(mgr.connectionState).toBe('reconnecting')
    })

    it('notifies state change listeners', () => {
      const mgr = createManager()
      const listener = jest.fn()
      mgr.onConnectionStateChange(listener)
      mgr.connect('http://localhost:3000')

      // 'connecting' on connect()
      expect(listener).toHaveBeenCalledWith('connecting')

      // 'connected' on connect event
      const connectHandler = mockSocketOn.mock.calls.find((c: any[]) => c[0] === 'connect')![1]
      connectHandler()
      expect(listener).toHaveBeenCalledWith('connected')
    })
  })

  describe('on() — event subscription', () => {
    it('registers an event handler on the socket', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      const handler = jest.fn()
      mgr.on('players_update', handler)

      expect(mockSocketOn).toHaveBeenCalledWith('players_update', handler)
    })

    it('returns an unsubscribe function that removes the handler', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      const handler = jest.fn()
      const unsub = mgr.on('game_state_change', handler)

      unsub()

      expect(mockSocketOff).toHaveBeenCalledWith('game_state_change', handler)
    })

    it('throws if called before connect()', () => {
      const mgr = createManager()

      expect(() => mgr.on('error', jest.fn())).toThrow('not connected')
    })
  })

  describe('emit() — typed event emission', () => {
    it('emits events through the socket', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      mgr.emit('start_game', 'ROOM1')

      expect(mockSocketEmit).toHaveBeenCalledWith('start_game', 'ROOM1')
    })

    it('emits events with multiple arguments', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      mgr.emit('advance_script_line', 'ROOM1')

      expect(mockSocketEmit).toHaveBeenCalledWith('advance_script_line', 'ROOM1')
    })

    it('throws if called before connect()', () => {
      const mgr = createManager()

      expect(() => mgr.emit('start_game', 'ROOM1')).toThrow('not connected')
    })
  })

  describe('getters', () => {
    it('isConnected reflects socket.connected', () => {
      const mgr = createManager()
      expect(mgr.isConnected).toBe(false)

      mgr.connect('http://localhost:3000')
      expect(mgr.isConnected).toBe(false) // mockSocket.connected is false

      mockSocket.connected = true
      expect(mgr.isConnected).toBe(true)
    })

    it('socketId returns the socket id', () => {
      const mgr = createManager()
      expect(mgr.socketId).toBeUndefined()

      mgr.connect('http://localhost:3000')
      expect(mgr.socketId).toBe('test-socket-id')
    })

    it('raw returns the underlying socket', () => {
      const mgr = createManager()
      expect(mgr.raw).toBeNull()

      mgr.connect('http://localhost:3000')
      expect(mgr.raw).toBe(mockSocket)
    })
  })

  describe('disconnect()', () => {
    it('disconnects the socket and resets state', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      mgr.disconnect()

      expect(mockSocketDisconnect).toHaveBeenCalled()
      expect(mgr.connectionState).toBe('disconnected')
      expect(mgr.raw).toBeNull()
    })

    it('removes all tracked event listeners', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      const handler1 = jest.fn()
      const handler2 = jest.fn()
      mgr.on('players_update', handler1)
      mgr.on('error', handler2)

      mgr.disconnect()

      // Both handlers should have been removed
      expect(mockSocketOff).toHaveBeenCalledWith('players_update', handler1)
      expect(mockSocketOff).toHaveBeenCalledWith('error', handler2)
    })

    it('is a no-op if not connected', () => {
      const mgr = createManager()
      // Should not throw
      mgr.disconnect()
      expect(mockSocketDisconnect).not.toHaveBeenCalled()
    })
  })

  describe('updateAuth()', () => {
    it('updates socket auth for next reconnect', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      mgr.updateAuth({ token: 'new-token' })
      expect(mockSocket.auth).toEqual({ token: 'new-token' })
    })

    it('clears auth when called with undefined', () => {
      const mgr = createManager()
      mgr.connect('http://localhost:3000')

      mgr.updateAuth(undefined)
      expect(mockSocket.auth).toEqual({})
    })
  })

  describe('singleton export', () => {
    it('exports a singleton socketManager instance', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { socketManager: instance1 } = require('@/lib/socketManager')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { socketManager: instance2 } = require('@/lib/socketManager')

      expect(instance1).toBe(instance2)
      expect(instance1).toBeInstanceOf(SocketManager)
    })
  })
})
