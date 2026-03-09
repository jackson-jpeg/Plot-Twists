import { logger } from '@/lib/logger'

interface RetryOptions<T> {
  maxRetries: number
  backoffMs: number
  timeoutMs?: number
  onSuccess: (result: T) => void
  onRetry?: (attempt: number, error: Error) => void
  onFinalFailure: (error: Error) => void
}

export class RetryQueue {
  private active = new Map<string, { cancelled: boolean }>()

  add<T>(key: string, task: () => Promise<T>, options: RetryOptions<T>): void {
    const existing = this.active.get(key)
    if (existing) existing.cancelled = true

    const entry = { cancelled: false }
    this.active.set(key, entry)

    const execute = async (attempt: number) => {
      if (entry.cancelled) return

      try {
        const result = options.timeoutMs
          ? await withTimeout(task(), options.timeoutMs)
          : await task()

        if (!entry.cancelled) {
          options.onSuccess(result)
          this.active.delete(key)
        }
      } catch (error) {
        if (entry.cancelled) return

        const err = error instanceof Error ? error : new Error(String(error))
        logger.warn(`retry.${key}.attempt.${attempt}`, { error: err.message })
        options.onRetry?.(attempt, err)

        if (attempt < options.maxRetries) {
          const delay = options.backoffMs * Math.pow(2, attempt)
          setTimeout(() => execute(attempt + 1), delay)
        } else {
          options.onFinalFailure(err)
          this.active.delete(key)
        }
      }
    }

    execute(0)
  }

  cancel(key: string): void {
    const entry = this.active.get(key)
    if (entry) entry.cancelled = true
    this.active.delete(key)
  }

  cancelAll(): void {
    for (const entry of this.active.values()) {
      entry.cancelled = true
    }
    this.active.clear()
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    ),
  ])
}

export const retryQueue = new RetryQueue()
