// Operational configuration for server behavior.
// Game rules live in constants.ts — this file covers timeouts, retries, limits.
//
// CHUNK 3 ITEM 3, 2026-07-29. This file used to describe a server that did not exist.
// Five of its six groups had ZERO readers anywhere in the codebase, and several of them stated
// numbers that contradicted the hardcoded values actually in force. That is worse than dead
// code: `ANTHROPIC_MODEL` and `GENERATION_TIMEOUT_MS` looked like supported knobs, so setting
// one in /etc/plotslop/env would have changed nothing and given no sign of it.
//
// What survives is what something reads. What was removed, and why:
//
//   rateLimits   — DELETED. Described roomCreate as 3-per-60s while the live limiter in
//                  room.handler.ts is 10-per-5min, and named events (plotTwist, vote,
//                  lineAdvance) that have no limiter at all. Keeping it "for later" means the
//                  next person reads it and believes it. The live numbers stay where they are
//                  enforced, next to the limiter that enforces them.
//   image        — DELETED. Declared timeoutMs / maxRetries / retryBackoffMs for an
//                  image.service that has no timeout and no retry logic whatsoever.
//   ui           — DELETED. featuredPacksLimit said 20; getFeaturedPacks defaults to 5.
//   generation.maxRetries — DELETED. There is no retry path in scriptGeneration.service.
//
// And the one real bug this audit turned up: `generation.timeoutMs` defaulted to 45_000 while
// the timeout actually running was a hardcoded 120_000. Had anything ever read this config, it
// would have cut the generation deadline to a third and started failing long scripts. The
// default below is now the value that has genuinely been in force.

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
    /** Read by scriptGeneration.service. Was 45_000 here and 120_000 in the code; 120_000 won. */
    timeoutMs: envNum('GENERATION_TIMEOUT_MS', 120_000),
    model: envStr('ANTHROPIC_MODEL', 'claude-sonnet-4-5-20250929'),
  },
  persistence: {
    debounceMs: envNum('PERSISTENCE_DEBOUNCE_MS', 5_000),
    retryIntervalMs: envNum('PERSISTENCE_RETRY_MS', 10_000),
    maxRetryQueueSize: envNum('PERSISTENCE_MAX_QUEUE', 100),
  },
  reconnection: {
    gracePeriodMs: envNum('RECONNECT_GRACE_MS', 60_000),
  },
  /**
   * Abuse limits for room creation. Chunk 3 items 1 and 2.
   *
   * ENV-TUNABLE ON PURPOSE, AND THIS IS THE ONE TO WATCH. Both limits are keyed per client IP
   * for guests (utils/clientIdentity.ts), and on a carrier-grade NAT thousands of unrelated
   * mobile subscribers share one public IPv4. At playtest and early-launch volume that is
   * irrelevant — it needs eleven strangers behind one carrier IP creating rooms inside the same
   * five minutes. At scale it stops being irrelevant, and the failure looks like "the game is
   * broken on mobile data" rather than like a rate limit.
   *
   * These are therefore knobs, not constants: the first report of unexplained "can't create a
   * room" from mobile users is answered by raising ROOM_CREATE_MAX in /etc/plotslop/env, not by
   * a deploy. The durable fix is requiring an account for room creation, which gives every host
   * their own bucket regardless of network — see NEEDS-JACKSON.md.
   *
   * Signed-in hosts are already immune: their key is the Clerk subject, not the IP.
   */
  abuse: {
    roomCreateMax: envNum('ROOM_CREATE_MAX', 10),
    roomCreateWindowMs: envNum('ROOM_CREATE_WINDOW_MS', 5 * 60 * 1000),
    maxLiveRoomsPerCreator: envNum('MAX_LIVE_ROOMS_PER_CREATOR', 5),
  },
} as const
