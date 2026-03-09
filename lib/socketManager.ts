import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

/** Tracked listener entry so disconnect() can clean up everything. */
interface TrackedListener {
  event: string
  handler: (...args: unknown[]) => void
}

/**
 * SocketManager — pure TypeScript singleton wrapping Socket.IO.
 *
 * No React dependency. Zustand stores (and any other code) call this directly
 * to subscribe to server events and emit client events.
 *
 * During migration this coexists with SocketContext.tsx.
 */
export class SocketManager {
  private socket: AppSocket | null = null
  private listeners: TrackedListener[] = []
  private _connectionState: ConnectionState = 'disconnected'
  private stateListeners = new Set<(state: ConnectionState) => void>()

  // ── Connection ──────────────────────────────────────────────

  /**
   * Create a typed Socket.IO connection.
   * Options match contexts/SocketContext.tsx lines 115-129.
   */
  connect(url: string, auth?: { token: string }): void {
    if (this.socket) return // already connected / connecting

    this.socket = io(url, {
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
      auth: auth ?? undefined,
    })

    this.setConnectionState('connecting')

    this.socket.on('connect', () => {
      this.setConnectionState('connected')
    })

    this.socket.on('disconnect', () => {
      this.setConnectionState('disconnected')
    })

    this.socket.on('connect_error', () => {
      this.setConnectionState('disconnected')
    })

    this.socket.io.on('reconnect_attempt', () => {
      this.setConnectionState('reconnecting')
    })

    this.socket.io.on('reconnect', () => {
      this.setConnectionState('connected')
    })

    this.socket.io.on('reconnect_failed', () => {
      this.setConnectionState('disconnected')
    })
  }

  /** Disconnect and remove all tracked listeners. */
  disconnect(): void {
    if (!this.socket) return

    // Remove all tracked listeners
    for (const { event, handler } of this.listeners) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.off(event as any, handler as any)
    }
    this.listeners = []

    this.socket.disconnect()
    this.socket = null
    this.setConnectionState('disconnected')
  }

  // ── Event subscription ──────────────────────────────────────

  /**
   * Subscribe to a server→client event. Returns an unsubscribe function.
   * All subscriptions are tracked so `disconnect()` can clean up.
   */
  on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E],
  ): () => void {
    if (!this.socket) {
      throw new Error(`SocketManager.on("${String(event)}"): not connected. Call connect() first.`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket.on(event as any, handler as any)

    const entry: TrackedListener = {
      event: event as string,
      handler: handler as (...args: unknown[]) => void,
    }
    this.listeners.push(entry)

    // Return unsubscribe function
    return () => {
      if (!this.socket) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.off(event as any, handler as any)
      const idx = this.listeners.indexOf(entry)
      if (idx !== -1) this.listeners.splice(idx, 1)
    }
  }

  // ── Event emission ──────────────────────────────────────────

  /** Emit a client→server event with full type safety. */
  emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ): void {
    if (!this.socket) {
      throw new Error(`SocketManager.emit("${String(event)}"): not connected. Call connect() first.`)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.socket as any).emit(event, ...args)
  }

  // ── Getters ─────────────────────────────────────────────────

  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  get connectionState(): ConnectionState {
    return this._connectionState
  }

  get socketId(): string | undefined {
    return this.socket?.id
  }

  /** Escape hatch: raw socket access during migration period. */
  get raw(): AppSocket | null {
    return this.socket
  }

  // ── Connection state subscriptions ──────────────────────────

  /** Subscribe to connection state changes. Returns unsubscribe. */
  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener)
    return () => { this.stateListeners.delete(listener) }
  }

  // ── Auth ────────────────────────────────────────────────────

  /** Update the auth token (e.g. after refresh). Takes effect on next reconnect. */
  updateAuth(auth: { token: string } | undefined): void {
    if (this.socket) {
      this.socket.auth = auth ?? {}
    }
  }

  // ── Internal ────────────────────────────────────────────────

  private setConnectionState(state: ConnectionState) {
    this._connectionState = state
    for (const listener of this.stateListeners) {
      listener(state)
    }
  }
}

/** Singleton instance — import this everywhere. */
export const socketManager = new SocketManager()
