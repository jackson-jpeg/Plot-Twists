'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types'

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

interface SocketContextType {
  socket: SocketType | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export function useSocket() {
  return useContext(SocketContext)
}

// Singleton socket instance to prevent multiple connections
let globalSocket: SocketType | null = null

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<SocketType | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const initRef = useRef(false)

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return
    initRef.current = true

    // Reuse existing socket or create new one
    if (!globalSocket) {
      console.log('Creating new socket connection')
      globalSocket = io({
        path: '/socket.io',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      })

      globalSocket.on('connect', () => {
        console.log('Socket connected:', globalSocket?.id)
        setIsConnected(true)
      })

      globalSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        setIsConnected(false)
      })

      globalSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
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
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
