import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>
export type AppServer = Server<ClientToServerEvents, ServerToClientEvents>

export interface HandlerContext {
  userId: string | null
  socketId: string
  isAdmin: boolean
  io: AppServer
}

export type SocketCallback<T = void> = (
  response: T extends void
    ? { success: true } | { success: false; error: string; requestId?: string }
    : { success: true; data: T } | { success: false; error: string; requestId?: string }
) => void

export type HandlerFn = (...args: any[]) => Promise<void> | void
