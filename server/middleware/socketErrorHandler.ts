import type { Socket } from 'socket.io'
import crypto from 'crypto'
import { logger } from '../../lib/logger'

/**
 * Wraps a socket event handler with centralized error handling.
 * Catches any thrown errors, logs them with the event name and socket ID,
 * and sends a generic error to the client via callback or socket emit.
 * Includes a requestId for correlation between client and server logs.
 */
export function withErrorHandler<TArgs extends unknown[]>(
  socket: Socket,
  eventName: string,
  handler: (...args: TArgs) => void | Promise<void>
): (...args: TArgs) => Promise<void> {
  return async (...args: TArgs) => {
    try {
      await handler(...args)
    } catch (error) {
      const requestId = crypto.randomUUID()
      logger.error(`[Socket:${eventName}] [${requestId}] Error for ${socket.id}:`, error)

      // If the last argument is a callback function, call it with an error
      const lastArg = args[args.length - 1]
      if (typeof lastArg === 'function') {
        (lastArg as (response: { success: false; error: string; requestId: string }) => void)({
          success: false,
          error: 'An unexpected error occurred. Please try again.',
          requestId
        })
      } else {
        // Otherwise emit a generic error event
        // Must emit a string to match ServerToClientEvents['error'] type
        socket.emit('error', 'An unexpected error occurred. Please try again.')
      }
    }
  }
}
