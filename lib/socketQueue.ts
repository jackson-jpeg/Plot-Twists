import { logger } from '@/lib/logger'

interface QueuedAction {
  event: string
  args: unknown[]
  timestamp: number
}

const MAX_AGE_MS = 30_000 // Discard actions older than 30 seconds

export class SocketActionQueue {
  private queue: QueuedAction[] = []

  enqueue(event: string, ...args: unknown[]) {
    this.queue.push({ event, args, timestamp: Date.now() })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flush(socket: { connected: boolean; emit: (...args: any[]) => any }) {
    if (!socket.connected) return

    const now = Date.now()
    const valid = this.queue.filter(a => now - a.timestamp < MAX_AGE_MS)
    const discarded = this.queue.length - valid.length

    if (discarded > 0) {
      logger.debug(`[SocketQueue] Discarded ${discarded} stale actions`)
    }

    for (const action of valid) {
      logger.debug(`[SocketQueue] Flushing: ${action.event}`)
      socket.emit(action.event, ...action.args)
    }

    this.queue = []
  }

  clear() {
    this.queue = []
  }
}
