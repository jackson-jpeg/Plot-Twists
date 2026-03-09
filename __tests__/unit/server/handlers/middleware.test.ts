jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}))

import { z } from 'zod'
import { logger } from '@/lib/logger'
import {
  withErrorBoundary,
  withAuth,
  withRateLimit,
  withValidation,
  compose,
} from '../../../../server/handlers/middleware'
import type { AppSocket } from '../../../../server/handlers/types'

describe('withErrorBoundary', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls the handler normally when no error is thrown', async () => {
    const handler = jest.fn()
    const wrapped = withErrorBoundary('test-event', handler)

    await wrapped('arg1', 'arg2')

    expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('catches async errors and sends error via callback', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('async boom'))
    const callback = jest.fn()
    const wrapped = withErrorBoundary('test-event', handler)

    await wrapped('arg1', callback)

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'async boom',
    })
    expect(logger.error).toHaveBeenCalledWith(
      'handler.test-event.failed',
      expect.objectContaining({ error: 'async boom' })
    )
  })

  it('catches sync errors thrown in handler', async () => {
    const handler = jest.fn(() => {
      throw new Error('sync boom')
    })
    const callback = jest.fn()
    const wrapped = withErrorBoundary('test-event', handler)

    await wrapped(callback)

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'sync boom',
    })
  })

  it('handles non-Error thrown values gracefully', async () => {
    const handler = jest.fn(() => {
      throw 'string error'
    })
    const callback = jest.fn()
    const wrapped = withErrorBoundary('test-event', handler)

    await wrapped(callback)

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'An unexpected error occurred',
    })
  })

  it('does not throw when no callback is provided', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('no callback'))
    const wrapped = withErrorBoundary('test-event', handler)

    await expect(wrapped('arg1')).resolves.toBeUndefined()
    expect(logger.error).toHaveBeenCalled()
  })

  it('emits game_error on socket when socket is provided', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Room not found'))
    const mockSocket = { emit: jest.fn() } as unknown as AppSocket
    const wrapped = withErrorBoundary('join_room', handler, mockSocket)

    await wrapped('arg1')

    expect(mockSocket.emit).toHaveBeenCalledWith('game_error', expect.objectContaining({
      code: 'ROOM_NOT_FOUND',
      message: 'Room no longer exists.',
      recoverable: true,
    }))
  })

  it('classifies credit errors correctly when socket is provided', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Insufficient credits'))
    const mockSocket = { emit: jest.fn() } as unknown as AppSocket
    const wrapped = withErrorBoundary('start_game', handler, mockSocket)

    await wrapped('arg1')

    expect(mockSocket.emit).toHaveBeenCalledWith('game_error', expect.objectContaining({
      code: 'CREDIT_INSUFFICIENT',
      message: 'Not enough credits.',
      action: { type: 'REDIRECT', path: '/profile' },
    }))
  })

  it('classifies timeout errors correctly when socket is provided', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Request timed out'))
    const mockSocket = { emit: jest.fn() } as unknown as AppSocket
    const wrapped = withErrorBoundary('generate_script', handler, mockSocket)

    await wrapped('arg1')

    expect(mockSocket.emit).toHaveBeenCalledWith('game_error', expect.objectContaining({
      code: 'NETWORK_TIMEOUT',
      action: { type: 'RETRY', event: 'generate_script' },
    }))
  })

  it('classifies unknown errors as UNKNOWN when socket is provided', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('something weird'))
    const mockSocket = { emit: jest.fn() } as unknown as AppSocket
    const wrapped = withErrorBoundary('test-event', handler, mockSocket)

    await wrapped('arg1')

    expect(mockSocket.emit).toHaveBeenCalledWith('game_error', expect.objectContaining({
      code: 'UNKNOWN',
      action: { type: 'DISMISS' },
    }))
  })

  it('does not emit game_error when no socket is provided', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('some error'))
    const callback = jest.fn()
    const wrapped = withErrorBoundary('test-event', handler)

    await wrapped('arg1', callback)

    expect(callback).toHaveBeenCalledWith({ success: false, error: 'some error' })
    // No socket means no emit — just verifying no crash
  })
})

describe('withAuth', () => {
  function makeSocket(data: Record<string, unknown>): AppSocket {
    return { data } as unknown as AppSocket
  }

  it('allows handler execution when userId is present', async () => {
    const socket = makeSocket({ userId: 'user-123' })
    const handler = jest.fn()
    const wrapped = withAuth(socket, handler)

    await wrapped('arg1')

    expect(handler).toHaveBeenCalledWith('arg1')
  })

  it('allows handler execution when uid is present', async () => {
    const socket = makeSocket({ uid: 'uid-456' })
    const handler = jest.fn()
    const wrapped = withAuth(socket, handler)

    await wrapped('arg1')

    expect(handler).toHaveBeenCalledWith('arg1')
  })

  it('rejects when neither userId nor uid is present', async () => {
    const socket = makeSocket({})
    const handler = jest.fn()
    const callback = jest.fn()
    const wrapped = withAuth(socket, handler)

    await wrapped('arg1', callback)

    expect(handler).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'Authentication required',
    })
  })

  it('rejects silently when no callback and no auth', async () => {
    const socket = makeSocket({})
    const handler = jest.fn()
    const wrapped = withAuth(socket, handler)

    await wrapped('arg1')

    expect(handler).not.toHaveBeenCalled()
  })
})

describe('withRateLimit', () => {
  it('allows requests under the limit', async () => {
    const handler = jest.fn()
    const wrapped = withRateLimit('test-under-limit', 3, 10_000, handler)

    await wrapped('a')
    await wrapped('b')
    await wrapped('c')

    expect(handler).toHaveBeenCalledTimes(3)
  })

  it('blocks requests over the limit', async () => {
    const handler = jest.fn()
    const callback = jest.fn()
    const wrapped = withRateLimit('test-over-limit', 2, 10_000, handler)

    await wrapped('a')
    await wrapped('b')
    // 3rd request should be blocked
    await wrapped('c', callback)

    expect(handler).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'Rate limit exceeded. Please slow down.',
    })
  })

  it('uses separate tracking per key', async () => {
    const handler = jest.fn()
    const wrappedA = withRateLimit('test-key-a', 1, 10_000, handler)
    const wrappedB = withRateLimit('test-key-b', 1, 10_000, handler)

    await wrappedA('a')
    await wrappedB('b')

    expect(handler).toHaveBeenCalledTimes(2)
  })
})

describe('withValidation', () => {
  const schema = z.object({
    roomCode: z.string().min(1, 'Room code is required'),
    nickname: z.string().min(1, 'Nickname is required'),
  })

  beforeEach(() => jest.clearAllMocks())

  it('passes validated data to the handler', async () => {
    const handler = jest.fn()
    const wrapped = withValidation(schema, handler)
    const input = { roomCode: 'ABCD', nickname: 'Player1' }

    await wrapped(input)

    expect(handler).toHaveBeenCalledWith(input)
  })

  it('strips extra fields via Zod parsing', async () => {
    const handler = jest.fn()
    const wrapped = withValidation(schema, handler)
    const input = { roomCode: 'ABCD', nickname: 'Player1', extra: 'ignored' }

    await wrapped(input)

    // Zod strip mode removes extra keys by default
    expect(handler).toHaveBeenCalledWith({ roomCode: 'ABCD', nickname: 'Player1' })
  })

  it('rejects invalid data and sends error via callback', async () => {
    const handler = jest.fn()
    const callback = jest.fn()
    const wrapped = withValidation(schema, handler)

    await wrapped({}, callback)

    expect(handler).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('Invalid input'),
    })
    expect(logger.warn).toHaveBeenCalledWith(
      'handler.validation.failed',
      expect.objectContaining({ issues: expect.any(String) })
    )
  })

  it('passes remaining args after validated data', async () => {
    const handler = jest.fn()
    const callback = jest.fn()
    const wrapped = withValidation(schema, handler)
    const input = { roomCode: 'ABCD', nickname: 'Player1' }

    await wrapped(input, callback)

    expect(handler).toHaveBeenCalledWith(
      { roomCode: 'ABCD', nickname: 'Player1' },
      callback
    )
  })
})

describe('compose', () => {
  beforeEach(() => jest.clearAllMocks())

  it('chains multiple middleware and wraps with error boundary', async () => {
    const order: string[] = []

    const mw1 = (handler: (...args: unknown[]) => Promise<void> | void) =>
      async (...args: unknown[]) => {
        order.push('mw1-before')
        await handler(...args)
        order.push('mw1-after')
      }

    const mw2 = (handler: (...args: unknown[]) => Promise<void> | void) =>
      async (...args: unknown[]) => {
        order.push('mw2-before')
        await handler(...args)
        order.push('mw2-after')
      }

    const innerHandler = jest.fn(() => {
      order.push('handler')
    })

    const composed = compose('test-compose', mw1, mw2)(innerHandler)
    await composed('arg1')

    expect(order).toEqual([
      'mw1-before',
      'mw2-before',
      'handler',
      'mw2-after',
      'mw1-after',
    ])
    expect(innerHandler).toHaveBeenCalledWith('arg1')
  })

  it('error boundary catches errors from inner middleware', async () => {
    const failingMw = () =>
      async () => {
        throw new Error('middleware failed')
      }

    const handler = jest.fn()
    const callback = jest.fn()
    const composed = compose('test-compose-error', failingMw)(handler)

    await composed(callback)

    expect(handler).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: 'middleware failed',
    })
    expect(logger.error).toHaveBeenCalled()
  })

  it('works with no middleware (just error boundary)', async () => {
    const handler = jest.fn()
    const composed = compose('test-no-mw')(handler)

    await composed('data')

    expect(handler).toHaveBeenCalledWith('data')
  })
})
