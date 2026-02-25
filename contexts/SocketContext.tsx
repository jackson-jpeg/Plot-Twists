'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types'
import { getFirebaseAuth, initializeFirebase } from '@/lib/firebase'
import { logger } from '@/lib/logger'
import { SocketActionQueue } from '@/lib/socketQueue'

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface SocketContextType {
  socket: SocketType | null
  isConnected: boolean
  connectionState: ConnectionState
  reconnectAttempt: number
  socketEmit: <E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionState: 'disconnected',
  reconnectAttempt: 0,
  socketEmit: () => {},
})

export function useSocket() {
  return useContext(SocketContext)
}

// Singleton socket instance to prevent multiple connections
let globalSocket: SocketType | null = null
const actionQueue = new SocketActionQueue()

/**
 * Get the current user's Firebase ID token for socket auth.
 * Returns null if no user is signed in.
 */
async function getIdToken(): Promise<string | null> {
  try {
    const auth = getFirebaseAuth()
    const currentUser = auth?.currentUser
    if (currentUser) {
      return await currentUser.getIdToken()
    }
  } catch (error) {
    logger.warn('[SocketContext] Failed to get ID token:', error)
  }
  return null
}

/**
 * Wait for Firebase auth to fully restore its session from IndexedDB.
 * This prevents the race condition where socket connects before auth is ready.
 */
async function waitForAuthReady(): Promise<void> {
  try {
    const ready = await initializeFirebase()
    if (!ready) return
    const auth = getFirebaseAuth()
    if (auth?.authStateReady) {
      await auth.authStateReady()
    }
  } catch (error) {
    logger.warn('[SocketContext] Failed to wait for auth ready:', error)
  }
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<SocketType | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const initRef = useRef(false)

  const socketEmit = useCallback(<E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>) => {
    if (globalSocket?.connected) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalSocket as any).emit(event, ...args)
    } else {
      actionQueue.enqueue(event as string, ...args)
    }
  }, [])

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return
    initRef.current = true

    async function initSocket() {
      // Reuse existing socket or create new one
      if (!globalSocket) {
        // Wait for Firebase auth to restore session before getting token
        await waitForAuthReady()
        const token = await getIdToken()
        logger.debug(`[SocketContext] initSocket: token ${token ? 'present' : 'absent'}`)

        // Determine socket URL based on environment
        let socketUrl: string

        if (typeof window !== 'undefined') {
          // Client-side: check if we're on localhost
          const isLocalhost = window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1'

          if (isLocalhost) {
            // Local development
            socketUrl = 'http://localhost:3000'
          } else if (process.env.NEXT_PUBLIC_WS_URL) {
            // Production: Use Railway backend
            // Strip any existing protocol, then add https://
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL
            const cleanUrl = wsUrl.replace(/^(wss?|https?):\/\//, '')
            socketUrl = `https://${cleanUrl}`
          } else {
            // Fallback to same origin
            socketUrl = window.location.origin
          }
        } else {
          // Server-side fallback
          const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'localhost:3000'
          const cleanUrl = wsUrl.replace(/^(wss?|https?):\/\//, '')
          socketUrl = `https://${cleanUrl}`
        }

        globalSocket = io(socketUrl, {
          path: '/socket.io',
          reconnection: true,
          reconnectionDelay: 500,
          reconnectionDelayMax: 15000,
          reconnectionAttempts: 50,
          transports: ['polling', 'websocket'],
          upgrade: true,
          timeout: 20000,
          autoConnect: true,
          withCredentials: false,
          forceNew: false,
          multiplex: true,
          auth: token ? { token } : undefined
        })

        // Set initial connecting state
        setConnectionState('connecting')

        globalSocket.on('connect', () => {
          logger.info('Socket connected:', globalSocket?.id)
          setIsConnected(true)
          setConnectionState('connected')
          setReconnectAttempt(0)
        })

        globalSocket.on('disconnect', (reason) => {
          logger.info('Socket disconnected:', reason)
          setIsConnected(false)
          setConnectionState('disconnected')
        })

        globalSocket.on('connect_error', async (error) => {
          logger.error('Socket connection error:', error)
          setConnectionState('disconnected')

          // If auth error, try refreshing token and reconnecting
          if (error.message === 'Invalid authentication token' || error.message === 'Authentication required') {
            const freshToken = await getIdToken()
            if (freshToken && globalSocket) {
              globalSocket.auth = { token: freshToken }
              globalSocket.connect()
            }
          }
        })

        globalSocket.io.on('reconnect_attempt', async (attempt) => {
          logger.info('Socket reconnecting... attempt', attempt)
          setConnectionState('reconnecting')
          setReconnectAttempt(attempt)

          // Refresh token on reconnect
          const freshToken = await getIdToken()
          if (freshToken && globalSocket) {
            globalSocket.auth = { token: freshToken }
          }
        })

        globalSocket.io.on('reconnect', () => {
          logger.info('Socket reconnected')
          setConnectionState('connected')
          setReconnectAttempt(0)
          // Flush any queued actions
          if (globalSocket) actionQueue.flush(globalSocket)
        })

        globalSocket.io.on('reconnect_failed', () => {
          logger.error('Socket reconnection failed after all attempts')
          setConnectionState('disconnected')
        })
      }

      setSocket(globalSocket)
    }

    initSocket()

    // Don't disconnect on unmount to prevent issues with strict mode
  }, [])

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
  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let prevUid: string | null = null

    async function watchAuth() {
      const ready = await initializeFirebase()
      if (!ready) return

      try {
        const firebaseAuth = await import('firebase/auth')
        const auth = getFirebaseAuth()
        if (!auth) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unsubscribe = firebaseAuth.onAuthStateChanged(auth as any, async (user: any) => {
          const newUid: string | null = user?.uid ?? null
          if (newUid === prevUid) return
          prevUid = newUid

          if (globalSocket) {
            const freshToken = user ? await user.getIdToken() : null
            // Check if the socket already has the correct token (e.g. from initSocket)
            const currentToken = (globalSocket.auth as { token?: string })?.token ?? null
            if (freshToken && currentToken === freshToken) return

            globalSocket.auth = freshToken ? { token: freshToken } : {}
            globalSocket.disconnect().connect()
            logger.info(`[SocketContext] Auth changed (uid: ${newUid ?? 'null'}), reconnecting socket`)
          }
        })
      } catch {
        // Firebase not available
      }
    }

    watchAuth()
    return () => { unsubscribe?.() }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionState, reconnectAttempt, socketEmit }}>
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
    <div className="connection-indicator" style={{
      background: `${config.color}20`,
      color: config.color
    }}>
      <span
        className="connection-indicator-dot"
        style={{
          background: config.color,
          animation: config.animate ? 'pulse-live 2s ease-in-out infinite' : 'none'
        }}
      />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}
