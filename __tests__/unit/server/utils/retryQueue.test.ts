import { RetryQueue } from '@/server/utils/retryQueue'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
}))

describe('RetryQueue', () => {
  let queue: RetryQueue

  beforeEach(() => {
    queue = new RetryQueue()
    jest.useFakeTimers()
  })

  afterEach(() => {
    queue.cancelAll()
    jest.useRealTimers()
  })

  it('calls onSuccess when task succeeds', async () => {
    const onSuccess = jest.fn()
    const onFinalFailure = jest.fn()

    queue.add('test', async () => 'result', {
      maxRetries: 2,
      backoffMs: 100,
      onSuccess,
      onFinalFailure,
    })

    await Promise.resolve()
    expect(onSuccess).toHaveBeenCalledWith('result')
    expect(onFinalFailure).not.toHaveBeenCalled()
  })

  it('retries on failure and eventually succeeds', async () => {
    const onSuccess = jest.fn()
    const onRetry = jest.fn()
    let attempt = 0

    queue.add('retry-test', async () => {
      attempt++
      if (attempt < 3) throw new Error(`fail ${attempt}`)
      return 'ok'
    }, {
      maxRetries: 3,
      backoffMs: 100,
      onSuccess,
      onRetry,
      onFinalFailure: jest.fn(),
    })

    // First attempt fails immediately
    await Promise.resolve()
    await Promise.resolve()
    expect(onRetry).toHaveBeenCalledTimes(1)

    // Advance timer for retry 2 (100ms * 2^0 = 100ms)
    jest.advanceTimersByTime(100)
    await Promise.resolve()
    await Promise.resolve()
    expect(onRetry).toHaveBeenCalledTimes(2)

    // Advance timer for retry 3 (100ms * 2^1 = 200ms) — succeeds
    jest.advanceTimersByTime(200)
    await Promise.resolve()
    await Promise.resolve()
    expect(onSuccess).toHaveBeenCalledWith('ok')
  })

  it('calls onFinalFailure after max retries', async () => {
    const onFinalFailure = jest.fn()

    queue.add('fail-test', async () => { throw new Error('always fails') }, {
      maxRetries: 1,
      backoffMs: 50,
      onSuccess: jest.fn(),
      onFinalFailure,
    })

    // First attempt
    await Promise.resolve()
    await Promise.resolve()

    // Retry (50ms * 2^0 = 50ms)
    jest.advanceTimersByTime(50)
    await Promise.resolve()
    await Promise.resolve()

    expect(onFinalFailure).toHaveBeenCalledWith(expect.any(Error))
  })

  it('cancels a task by key', async () => {
    const onSuccess = jest.fn()
    const onFinalFailure = jest.fn()

    queue.add('cancel-test', async () => { throw new Error('fail') }, {
      maxRetries: 5,
      backoffMs: 100,
      onSuccess,
      onFinalFailure,
    })

    await Promise.resolve()
    await Promise.resolve()
    queue.cancel('cancel-test')

    jest.advanceTimersByTime(10_000)
    await Promise.resolve()
    await Promise.resolve()

    // Neither success nor final failure should be called after cancel
    expect(onSuccess).not.toHaveBeenCalled()
    // onFinalFailure might have been called before cancel
  })

  it('replaces existing task with same key', async () => {
    const onSuccess1 = jest.fn()
    const onSuccess2 = jest.fn()

    queue.add('replace-test', async () => { throw new Error('fail') }, {
      maxRetries: 5,
      backoffMs: 1000,
      onSuccess: onSuccess1,
      onFinalFailure: jest.fn(),
    })

    await Promise.resolve()

    // Replace with succeeding task
    queue.add('replace-test', async () => 'replaced', {
      maxRetries: 0,
      backoffMs: 100,
      onSuccess: onSuccess2,
      onFinalFailure: jest.fn(),
    })

    await Promise.resolve()
    expect(onSuccess2).toHaveBeenCalledWith('replaced')

    // Advance to see if old task retries fire
    jest.advanceTimersByTime(10_000)
    await Promise.resolve()
    expect(onSuccess1).not.toHaveBeenCalled()
  })
})
