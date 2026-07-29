import { z } from 'zod'
import { logger } from '@/lib/logger'
import type { GameError, ErrorCode } from '@/lib/types'
import type { AppSocket, HandlerFn, SocketCallback } from './types'

function classifyError(eventName: string, error: unknown): GameError {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'

  if (message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('credit')) {
    return { code: 'CREDIT_INSUFFICIENT', message: 'Not enough credits.', recoverable: true, action: { type: 'REDIRECT', path: '/profile' } }
  }
  if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('no room')) {
    return { code: 'ROOM_NOT_FOUND', message: 'Room no longer exists.', recoverable: true, action: { type: 'REDIRECT', path: '/' } }
  }
  if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('timed out')) {
    return { code: 'NETWORK_TIMEOUT', message: 'Request timed out. Please try again.', recoverable: true, action: { type: 'RETRY', event: eventName } }
  }
  if (message.toLowerCase().includes('full')) {
    return { code: 'ROOM_FULL', message: 'This room is full.', recoverable: true, action: { type: 'REDIRECT', path: '/' } }
  }
  if (message.toLowerCase().includes('auth')) {
    return { code: 'AUTH_REQUIRED', message: 'Please sign in to continue.', recoverable: true, action: { type: 'REDIRECT', path: '/sign-in' } }
  }

  return { code: 'UNKNOWN', message: 'Something went wrong. Please try again.', recoverable: true, action: { type: 'DISMISS' } }
}

// withErrorBoundary(eventName, handler, socket?) — wraps handler in try/catch, sends error via callback
export function withErrorBoundary(eventName: string, handler: HandlerFn, socket?: AppSocket): HandlerFn {
  return async (...args: unknown[]) => {
    const callback = args.find(a => typeof a === 'function') as SocketCallback | undefined
    try {
      await handler(...args)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      logger.error(`handler.${eventName}.failed`, {
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      })
      callback?.({ success: false, error: message })
      if (socket) {
        socket.emit('game_error', classifyError(eventName, error))
      }
    }
  }
}

// withAuth(socket, handler) — rejects if no userId/uid on socket.data
export function withAuth(socket: AppSocket, handler: HandlerFn): HandlerFn {
  return async (...args: unknown[]) => {
    if (!socket.data.userId && !socket.data.uid) {
      const callback = args.find(a => typeof a === 'function') as SocketCallback | undefined
      if (callback) {
        callback({ success: false, error: 'Authentication required' })
      } else {
        // `callback?.()` swallowed the rejection entirely for any event emitted WITHOUT an ack:
        // the handler did not run, nothing was sent back, and the client waited forever. Same
        // shape as D6 one layer up — a rejection the user cannot observe is a hang.
        socket.emit('game_error_message', 'Please sign in to do that.')
      }
      return
    }
    return handler(...args)
  }
}

// withRateLimit(key, max, windowMs, handler) — per-key rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now >= entry.resetAt) rateLimitStore.delete(key)
  }
}, 60_000)
cleanupInterval.unref()

export function withRateLimit(key: string, maxRequests: number, windowMs: number, handler: HandlerFn): HandlerFn {
  return async (...args: unknown[]) => {
    const now = Date.now()
    const entry = rateLimitStore.get(key)
    if (entry && now < entry.resetAt) {
      if (entry.count >= maxRequests) {
        const callback = args.find(a => typeof a === 'function') as SocketCallback | undefined
        callback?.({ success: false, error: 'Rate limit exceeded. Please slow down.' })
        return
      }
      entry.count++
    } else {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    }
    return handler(...args)
  }
}

// withValidation(schema, handler) — validates first arg with Zod
export function withValidation<T extends z.ZodSchema>(
  schema: T,
  handler: (validated: z.infer<T>, ...rest: unknown[]) => Promise<void> | void,
): HandlerFn {
  return async (...args: unknown[]) => {
    const callback = args.find(a => typeof a === 'function') as SocketCallback | undefined
    const input = args[0]
    const result = schema.safeParse(input)
    if (!result.success) {
      const issues = result.error.issues.map(i => i.message).join(', ')
      logger.warn('handler.validation.failed', { issues })
      callback?.({ success: false, error: `Invalid input: ${issues}` })
      return
    }
    return handler(result.data, ...args.slice(1))
  }
}

// compose(eventName, ...middlewares)(handler) — chains middleware, always wraps with error boundary outermost
export function compose(
  eventName: string,
  ...middlewares: Array<(handler: HandlerFn) => HandlerFn>
): (handler: HandlerFn) => HandlerFn {
  return (handler: HandlerFn) => {
    let composed = handler
    for (const mw of [...middlewares].reverse()) {
      composed = mw(composed)
    }
    return withErrorBoundary(eventName, composed)
  }
}
