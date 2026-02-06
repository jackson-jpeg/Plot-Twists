'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types'
import { getFirebaseAuth, initializeFirebase } from '@/lib/firebase'

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface SocketContextType {
  socket: SocketType | null
  isConnected: boolean
  connectionState: ConnectionState
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionState: 'disconnected'
})

export function useSocket() {
  return useContext(SocketContext)
}

// Singleton socket instance to prevent multiple connections
let globalSocket: SocketType | null = null

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
    console.warn('[SocketContext] Failed to get ID token:', error)
  }
  return null
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<SocketType | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const initRef = useRef(false)

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return
    initRef.current = true

    async function initSocket() {
      // Reuse existing socket or create new one
      if (!globalSocket) {
        // Get auth token before connecting
        const token = await getIdToken()

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
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
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
          console.log('Socket connected:', globalSocket?.id)
          setIsConnected(true)
          setConnectionState('connected')
        })

        globalSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason)
          setIsConnected(false)
          setConnectionState('disconnected')
        })

        globalSocket.on('connect_error', async (error) => {
          console.error('Socket connection error:', error)
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

        globalSocket.io.on('reconnect_attempt', async () => {
          console.log('Socket reconnecting...')
          setConnectionState('reconnecting')

          // Refresh token on reconnect
          const freshToken = await getIdToken()
          if (freshToken && globalSocket) {
            globalSocket.auth = { token: freshToken }
          }
        })

        globalSocket.io.on('reconnect', () => {
          console.log('Socket reconnected')
          setConnectionState('connected')
        })
      }

      setSocket(globalSocket)
    }

    initSocket()

    // Don't disconnect on unmount to prevent issues with strict mode
    return () => {
      // Only disconnect if window is actually closing
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          globalSocket?.disconnect()
        })
      }
    }
  }, [])

  // Reconnect socket with fresh token when auth state changes (sign in / sign out)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    const UNSET = '__unset__'
    let prevUid: string | null | typeof UNSET = UNSET

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
          // Skip the initial fire — socket was already connected with whatever token was available
          if (prevUid === UNSET) {
            prevUid = newUid
            return
          }
          if (newUid === prevUid) return
          prevUid = newUid

          if (globalSocket) {
            const freshToken = user ? await user.getIdToken() : null
            globalSocket.auth = freshToken ? { token: freshToken } : {}
            globalSocket.disconnect().connect()
            console.log(`[SocketContext] Auth changed (uid: ${newUid ?? 'null'}), reconnecting socket`)
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
    <SocketContext.Provider value={{ socket, isConnected, connectionState }}>
      {children}
    </SocketContext.Provider>
  )
}

// Connection Status Component
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
