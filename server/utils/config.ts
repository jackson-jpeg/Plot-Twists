// Operational configuration for server behavior.
// Game rules live in constants.ts — this file covers timeouts, retries, limits.

function envNum(key: string, defaultValue: number): number {
  const val = process.env[key]
  if (val === undefined) return defaultValue
  const parsed = parseInt(val, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

function envStr(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue
}

export const CONFIG = {
  generation: {
    timeoutMs: envNum('GENERATION_TIMEOUT_MS', 45_000),
    maxRetries: envNum('GENERATION_MAX_RETRIES', 1),
    model: envStr('ANTHROPIC_MODEL', 'claude-sonnet-4-5-20250929'),
  },
  image: {
    timeoutMs: envNum('IMAGE_TIMEOUT_MS', 30_000),
    maxRetries: envNum('IMAGE_MAX_RETRIES', 2),
    retryBackoffMs: envNum('IMAGE_RETRY_BACKOFF_MS', 5_000),
  },
  persistence: {
    debounceMs: envNum('PERSISTENCE_DEBOUNCE_MS', 5_000),
    retryIntervalMs: envNum('PERSISTENCE_RETRY_MS', 10_000),
    maxRetryQueueSize: envNum('PERSISTENCE_MAX_QUEUE', 100),
  },
  reconnection: {
    gracePeriodMs: envNum('RECONNECT_GRACE_MS', 60_000),
  },
  rateLimits: {
    roomCreate:       { max: 3,  windowMs: 60_000 },
    roomJoin:         { max: 10, windowMs: 60_000 },
    scriptGeneration: { max: 2,  windowMs: 60_000 },
    lineAdvance:      { max: 60, windowMs: 60_000 },
    reactions:        { max: 30, windowMs: 60_000 },
    cardPackWrite:    { max: 5,  windowMs: 60_000 },
    cardPackRead:     { max: 20, windowMs: 60_000 },
    vote:             { max: 5,  windowMs: 60_000 },
    plotTwist:        { max: 10, windowMs: 60_000 },
  },
  ui: {
    featuredPacksLimit: 20,
    spectatorMessageBuffer: 50,
    searchDebounceMs: 400,
    packLoadingTimeoutMs: 10_000,
  },
} as const
