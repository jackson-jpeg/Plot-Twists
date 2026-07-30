'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types'
import { useAuth as useClerkAuth } from '@clerk/nextjs'
import { logger } from '@/lib/logger'
import { SocketActionQueue } from '@/lib/socketQueue'
import { useConnectionStore } from '@/stores/connectionStore'
import { getPlayerSessionId } from '@/lib/playerSession'
import { API_ORIGIN } from '@/lib/siteUrl'

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface SocketContextType {
  socket: SocketType | null
  isConnected: boolean
  connectionState: ConnectionState
  reconnectAttempt: number
  playerSessionId: string
  socketEmit: <E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>) => void
  setActiveRoom: (roomCode: string | null) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionState: 'disconnected',
  reconnectAttempt: 0,
  playerSessionId: '',
  socketEmit: () => {},
  setActiveRoom: () => {},
})

export function useSocket() {
  return useContext(SocketContext)
}

// Singleton socket instance to prevent multiple connections
let globalSocket: SocketType | null = null
const actionQueue = new SocketActionQueue()

// Session storage key for active room
const ACTIVE_ROOM_KEY = 'plottwists_active_room'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<SocketType | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const initRef = useRef(false)
  const { getToken, userId, isLoaded } = useClerkAuth()
  const activeRoomRef = useRef<string | null>(null)
  const playerSessionIdRef = useRef<string>('')

  const connectionStore = useConnectionStore()

  const setActiveRoom = useCallback((roomCode: string | null) => {
    activeRoomRef.current = roomCode
    try {
      if (roomCode) {
        sessionStorage.setItem(ACTIVE_ROOM_KEY, roomCode)
      } else {
        sessionStorage.removeItem(ACTIVE_ROOM_KEY)
      }
    } catch { /* sessionStorage unavailable */ }
  }, [])

  const socketEmit = useCallback(<E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>) => {
    if (globalSocket?.connected) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalSocket as any).emit(event, ...args)
    } else {
      actionQueue.enqueue(event as string, ...args)
    }
  }, [])

  useEffect(() => {
    // Wait for Clerk to load before initializing socket
    if (!isLoaded) return
    // Prevent double initialization in strict mode
    if (initRef.current) return
    initRef.current = true

    async function initSocket() {
      if (!playerSessionIdRef.current) {
        playerSessionIdRef.current = getPlayerSessionId()
      }

      // Reuse existing socket or create new one
      if (!globalSocket) {
        // Get Clerk session token if signed in
        let token: string | null = null
        if (userId) {
          try {
            token = await getToken()
          } catch (error) {
            logger.warn('[SocketContext] Failed to get Clerk token:', error)
          }
        }
        logger.debug(`[SocketContext] initSocket: token ${token ? 'present' : 'absent'}`)

        // Determine socket URL based on environment
        let socketUrl: string

        if (typeof window !== 'undefined') {
          const isLocalhost = window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1'

          if (isLocalhost) {
            socketUrl = 'http://localhost:3000'
          } else if (process.env.NEXT_PUBLIC_WS_URL) {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL
            const cleanUrl = wsUrl.replace(/^(wss?|https?):\/\//, '')
            socketUrl = `https://${cleanUrl}`
          } else {
            socketUrl = window.location.origin
          }
        } else {
          // No window: this is the SSR pass. There is no origin to read, so the canonical site URL
          // is the only correct answer. It used to fall back to the literal 'localhost:3000' and
          // then prefix it with https://, producing `https://localhost:3000` in a production
          // bundle — a value that could never connect to anything.
          socketUrl = API_ORIGIN
        }

        globalSocket = io(socketUrl, {
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
          auth: {
            ...(token ? { token } : {}),
            playerSessionId: playerSessionIdRef.current,
          }
        })

        setConnectionState('connecting')
        connectionStore.setConnectionState('connecting')
        connectionStore.setIsConnected(false)

        globalSocket.on('connect', () => {
          logger.info('Socket connected:', globalSocket?.id)
          setIsConnected(true)
          setConnectionState('connected')
          setReconnectAttempt(0)
          connectionStore.setIsConnected(true)
          connectionStore.setConnectionState('connected')
          connectionStore.setReconnectAttempt(0)
        })

        globalSocket.on('disconnect', (reason) => {
          logger.info('Socket disconnected:', reason)
          setIsConnected(false)
          setConnectionState('disconnected')
          connectionStore.setIsConnected(false)
          connectionStore.setConnectionState('disconnected')
        })

        globalSocket.on('connect_error', async (error) => {
          logger.error('Socket connection error:', error)
          setConnectionState('disconnected')
          connectionStore.setIsConnected(false)
          connectionStore.setConnectionState('disconnected')

          // If auth error, try refreshing token and reconnecting
          if (error.message === 'Invalid authentication token' || error.message === 'Authentication required') {
            try {
              const freshToken = await getToken()
              if (freshToken && globalSocket) {
                globalSocket.auth = { token: freshToken, playerSessionId: playerSessionIdRef.current }
                globalSocket.connect()
              }
            } catch {
              // Token refresh failed
            }
          }
        })

        globalSocket.io.on('reconnect_attempt', async (attempt) => {
          logger.info('Socket reconnecting... attempt', attempt)
          setConnectionState('reconnecting')
          setReconnectAttempt(attempt)
          connectionStore.setConnectionState('reconnecting')
          connectionStore.setReconnectAttempt(attempt)

          // Refresh token on reconnect
          try {
            const freshToken = await getToken()
            if (freshToken && globalSocket) {
              globalSocket.auth = { token: freshToken, playerSessionId: playerSessionIdRef.current }
            }
          } catch {
            // Token refresh failed
          }
        })

        globalSocket.io.on('reconnect', () => {
          logger.info('Socket reconnected')
          setConnectionState('connected')
          setReconnectAttempt(0)
          connectionStore.setIsConnected(true)
          connectionStore.setConnectionState('connected')
          connectionStore.setReconnectAttempt(0)
          if (globalSocket) actionQueue.flush(globalSocket)
        })

        globalSocket.io.on('reconnect_failed', () => {
          logger.error('Socket reconnection failed after all attempts')
          setConnectionState('disconnected')
          connectionStore.setIsConnected(false)
          connectionStore.setConnectionState('disconnected')
        })
      }

      setSocket(globalSocket)
    }

    initSocket()
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Disconnect socket when the page actually unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      globalSocket?.disconnect()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Reconnect socket with fresh token when auth state changes (sign in / sign out)
  const prevUserIdRef = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (!isLoaded) return
    // Skip initial render
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = userId
      return
    }
    // Only reconnect if userId actually changed
    if (userId === prevUserIdRef.current) return
    prevUserIdRef.current = userId

    async function reconnectWithNewAuth() {
      if (!globalSocket) return
      let freshToken: string | null = null
      if (userId) {
        try {
          freshToken = await getToken()
        } catch {
          // No token available
        }
      }
      globalSocket.auth = freshToken
        ? { token: freshToken, playerSessionId: playerSessionIdRef.current }
        : { playerSessionId: playerSessionIdRef.current }
      globalSocket.disconnect().connect()
      logger.info(`[SocketContext] Auth changed (userId: ${userId ?? 'null'}), reconnecting socket`)
    }

    reconnectWithNewAuth()
  }, [userId, isLoaded, getToken])

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionState, reconnectAttempt, playerSessionId: playerSessionIdRef.current, socketEmit, setActiveRoom }}>
      {children}
    </SocketContext.Provider>
  )
}

// Connection Status Component (legacy - used in HostLobby etc.)
export function ConnectionStatus({ showLabel = true }: { showLabel?: boolean }) {
  const { connectionState } = useSocket()

  const stateConfig: Record<ConnectionState, { color: string; label: string; animate: boolean }> = {
    connecting: { color: 'var(--color-warning)', label: 'Connecting...', animate: true },
    connected: { color: 'var(--color-success)', label: 'Connected', animate: true },
    disconnected: { color: 'var(--color-danger)', label: 'Disconnected', animate: false },
    reconnecting: { color: 'var(--color-warning)', label: 'Reconnecting...', animate: true }
  }

  const config = stateConfig[connectionState]

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: `${config.color}20`,
      color: config.color
    }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.color,
          animation: config.animate ? 'pulse-live 2s ease-in-out infinite' : 'none'
        }}
      />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}
