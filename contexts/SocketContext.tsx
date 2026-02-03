'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types'

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

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<SocketType | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const initRef = useRef(false)

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return
    initRef.current = true

    // Reuse existing socket or create new one
    if (!globalSocket) {
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
          // Add https:// if not present
          const wsUrl = process.env.NEXT_PUBLIC_WS_URL
          socketUrl = wsUrl.startsWith('http') ? wsUrl : `https://${wsUrl}`
        } else {
          // Fallback to same origin
          socketUrl = window.location.origin
        }
      } else {
        // Server-side fallback
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
        socketUrl = wsUrl.startsWith('http') ? wsUrl : `https://${wsUrl}`
      }

      console.log('🔌 Socket connection config:')
      console.log('  - Target URL:', socketUrl)
      console.log('  - Environment:', process.env.NODE_ENV)
      console.log('  - WS_URL env var:', process.env.NEXT_PUBLIC_WS_URL)

      // Configure transports based on environment
      // Railway can be flaky with WebSocket upgrades, so we force polling in production
      const isProduction = !socketUrl.includes('localhost')

      globalSocket = io(socketUrl, {
        path: '/socket.io',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        // Force polling-only in production (Railway), allow upgrade in dev
        transports: isProduction ? ['polling'] : ['polling', 'websocket'],
        upgrade: !isProduction, // Disable WebSocket upgrade in production
        timeout: 20000,
        autoConnect: true,
        withCredentials: true,
        forceNew: false,
        multiplex: true
      })

      console.log('  - Transport mode:', isProduction ? 'polling-only (production)' : 'polling + websocket (dev)')

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

      globalSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setConnectionState('disconnected')
      })

      globalSocket.io.on('reconnect_attempt', () => {
        console.log('Socket reconnecting...')
        setConnectionState('reconnecting')
      })

      globalSocket.io.on('reconnect', () => {
        console.log('Socket reconnected')
        setConnectionState('connected')
      })
    }

    setSocket(globalSocket)

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
