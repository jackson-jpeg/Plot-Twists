# Backend-Frontend Rewire Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the 2,488-line monolithic server.ts into handler modules, deduplicate host/join hooks, add middleware pipeline, typed error propagation, reconnection resilience, and centralized constants.

**Architecture:** Socket-first. 57 inline handlers move into 9 domain modules. Composable middleware (auth, rate limit, validation, error boundary) wraps every handler. Shared `useGameSocket` base hook eliminates ~80% duplication between host/join. Typed `GameError` events flow from server to client toasts.

**Tech Stack:** TypeScript, Socket.IO, Zod, Framer Motion (ReconnectionBanner), Jest + ts-jest

---

## Phase 1: Infrastructure — Middleware, Config, RetryQueue, Schemas

### Task 1.1: Create Handler Types

**Files:**
- Create: `server/handlers/types.ts`

**Step 1: Create the types file**

```typescript
// server/handlers/types.ts
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
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit server/handlers/types.ts`
Expected: No errors (or run full `npm run build` after all Phase 1 tasks)

**Step 3: Commit**

```bash
git add server/handlers/types.ts
git commit -m "feat: add handler types for socket middleware system"
```

---

### Task 1.2: Create Composable Middleware

**Files:**
- Create: `server/handlers/middleware.ts`
- Reference: `server/middleware/socketErrorHandler.ts` (existing `withErrorHandler` at lines 11-38)
- Reference: `server/middleware/rateLimiter.ts` (existing `SocketRateLimiter` at lines 56-108)

**Important context:** There's already a `withErrorHandler` in `server/middleware/socketErrorHandler.ts` that wraps handlers with try-catch and generates `requestId`. The new middleware builds on this pattern but adds composability.

There's already a `SocketRateLimiter` class in `server/middleware/rateLimiter.ts`. The new `withRateLimit` wraps it for per-handler use.

**Step 1: Write the test**

Create: `__tests__/unit/server/handlers/middleware.test.ts`

```typescript
import { withErrorBoundary, withAuth, withRateLimit, withValidation, compose } from '@/server/handlers/middleware'
import { z } from 'zod'

describe('withErrorBoundary', () => {
  it('calls handler normally when no error', async () => {
    const handler = jest.fn()
    const wrapped = withErrorBoundary('test_event', handler)
    await wrapped('arg1', jest.fn())
    expect(handler).toHaveBeenCalledWith('arg1', expect.any(Function))
  })

  it('sends error callback when handler throws', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('boom'))
    const callback = jest.fn()
    const wrapped = withErrorBoundary('test_event', handler)
    await wrapped('arg1', callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'boom',
    }))
  })

  it('handles sync throws', async () => {
    const handler = jest.fn(() => { throw new Error('sync boom') })
    const callback = jest.fn()
    const wrapped = withErrorBoundary('test_event', handler)
    await wrapped(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'sync boom',
    }))
  })
})

describe('withAuth', () => {
  it('allows handler when userId present', async () => {
    const handler = jest.fn()
    const socket = { data: { userId: 'user123', uid: 'user123' } } as any
    const wrapped = withAuth(socket, handler)
    await wrapped('arg1', jest.fn())
    expect(handler).toHaveBeenCalled()
  })

  it('rejects when no userId', async () => {
    const handler = jest.fn()
    const socket = { data: {} } as any
    const callback = jest.fn()
    const wrapped = withAuth(socket, handler)
    await wrapped('arg1', callback)
    expect(handler).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringContaining('Authentication'),
    }))
  })
})

describe('withRateLimit', () => {
  it('allows requests under limit', async () => {
    const handler = jest.fn()
    const wrapped = withRateLimit('test-key-1', 3, 60_000, handler)
    await wrapped(jest.fn())
    await wrapped(jest.fn())
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('blocks requests over limit', async () => {
    const handler = jest.fn()
    const callback = jest.fn()
    const wrapped = withRateLimit('test-key-2', 2, 60_000, handler)
    await wrapped(jest.fn())
    await wrapped(jest.fn())
    await wrapped(callback) // 3rd call, limit is 2
    expect(handler).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringContaining('Rate limit'),
    }))
  })
})

describe('withValidation', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  })

  it('passes validated data to handler', async () => {
    const handler = jest.fn()
    const wrapped = withValidation(schema, handler)
    await wrapped({ name: 'Alice', age: 25 }, jest.fn())
    expect(handler).toHaveBeenCalledWith({ name: 'Alice', age: 25 }, expect.any(Function))
  })

  it('rejects invalid data', async () => {
    const handler = jest.fn()
    const callback = jest.fn()
    const wrapped = withValidation(schema, handler)
    await wrapped({ name: '', age: -1 }, callback)
    expect(handler).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringContaining('Invalid'),
    }))
  })
})

describe('compose', () => {
  it('chains middleware and wraps with error boundary', async () => {
    const handler = jest.fn()
    const socket = { data: { userId: 'user1', uid: 'user1' } } as any
    const wrapped = compose('test',
      (h) => withAuth(socket, h),
    )(handler)
    await wrapped('arg', jest.fn())
    expect(handler).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --testPathPattern="handlers/middleware" --verbose`
Expected: FAIL — cannot find module

**Step 3: Write the middleware implementation**

```typescript
// server/handlers/middleware.ts
import { z } from 'zod'
import { logger } from '@/lib/logger'
import type { AppSocket, HandlerFn, SocketCallback } from './types'

// ─── Error Boundary ─────────────────────────────────────────
// Wraps every handler. No handler can crash silently.
export function withErrorBoundary(eventName: string, handler: HandlerFn): HandlerFn {
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
    }
  }
}

// ─── Auth Check ─────────────────────────────────────────────
// Rejects unauthenticated sockets for protected handlers.
// Note: socketAuth.ts (Clerk) allows unauthenticated connections for guest play.
// This middleware is for handlers that REQUIRE auth (room creation, voting, etc.)
export function withAuth(socket: AppSocket, handler: HandlerFn): HandlerFn {
  return async (...args: unknown[]) => {
    if (!socket.data.userId && !socket.data.uid) {
      const callback = args.find(a => typeof a === 'function') as SocketCallback | undefined
      callback?.({ success: false, error: 'Authentication required' })
      return
    }
    return handler(...args)
  }
}

// ─── Rate Limiting ──────────────────────────────────────────
// Per-key rate limiting. Key should include socket.id for per-socket limits.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Cleanup expired entries every 60s
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now >= entry.resetAt) rateLimitStore.delete(key)
  }
}, 60_000)
cleanupInterval.unref()

export function withRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  handler: HandlerFn,
): HandlerFn {
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

// ─── Input Validation ───────────────────────────────────────
// Zod schema validation for the first handler argument.
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

    // Replace first arg with validated data, keep rest
    return handler(result.data, ...args.slice(1))
  }
}

// ─── Compose ────────────────────────────────────────────────
// Combine multiple middleware. Error boundary is always outermost.
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
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --testPathPattern="handlers/middleware" --verbose`
Expected: All 9 tests PASS

**Step 5: Commit**

```bash
git add server/handlers/middleware.ts __tests__/unit/server/handlers/middleware.test.ts
git commit -m "feat: composable socket handler middleware (auth, rate limit, validation, error boundary)"
```

---

### Task 1.3: Expand Zod Schemas

**Files:**
- Modify: `lib/schema.ts` (currently 19 lines — only MoodSchema, ScriptLineSchema, ScriptSchema)
- Reference: `server/utils/constants.ts` lines 5-12 for limits
- Reference: `lib/types.ts` lines 457-541 for ClientToServerEvents signatures

**Step 1: Write the test**

Create: `__tests__/unit/lib/schema.test.ts`

```typescript
import {
  createRoomSchema, joinRoomSchema, submitCardsSchema,
  submitVoteSchema, createCardPackSchema, updateRoomSettingsSchema,
} from '@/lib/schema'

describe('createRoomSchema', () => {
  it('validates valid room settings', () => {
    const result = createRoomSchema.safeParse({
      isPublic: false,
      allowSpectators: true,
    })
    expect(result.success).toBe(true)
  })

  it('applies defaults', () => {
    const result = createRoomSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPublic).toBe(false)
      expect(result.data.allowSpectators).toBe(true)
    }
  })
})

describe('joinRoomSchema', () => {
  it('validates valid join input', () => {
    const result = joinRoomSchema.safeParse({
      roomCode: 'ABCD',
      nickname: 'Alice',
    })
    expect(result.success).toBe(true)
  })

  it('uppercases room code', () => {
    const result = joinRoomSchema.safeParse({
      roomCode: 'abcd',
      nickname: 'Alice',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.roomCode).toBe('ABCD')
    }
  })

  it('trims nickname', () => {
    const result = joinRoomSchema.safeParse({
      roomCode: 'ABCD',
      nickname: '  Bob  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nickname).toBe('Bob')
    }
  })

  it('rejects empty nickname', () => {
    const result = joinRoomSchema.safeParse({
      roomCode: 'ABCD',
      nickname: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects nickname over 50 chars', () => {
    const result = joinRoomSchema.safeParse({
      roomCode: 'ABCD',
      nickname: 'A'.repeat(51),
    })
    expect(result.success).toBe(false)
  })
})

describe('submitCardsSchema', () => {
  it('validates card selection', () => {
    const result = submitCardsSchema.safeParse({
      character: 'Detective',
      setting: 'Haunted House',
      circumstance: 'Time Loop',
    })
    expect(result.success).toBe(true)
  })

  it('allows missing setting and circumstance', () => {
    const result = submitCardsSchema.safeParse({
      character: 'Detective',
    })
    expect(result.success).toBe(true)
  })
})

describe('submitVoteSchema', () => {
  it('validates vote', () => {
    const result = submitVoteSchema.safeParse({
      targetPlayerId: 'player123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty targetPlayerId', () => {
    const result = submitVoteSchema.safeParse({
      targetPlayerId: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('createCardPackSchema', () => {
  it('validates valid card pack', () => {
    const result = createCardPackSchema.safeParse({
      name: 'Sci-Fi Pack',
      description: 'Space adventures',
      theme: 'sci-fi',
      characters: [
        { name: 'Captain' },
        { name: 'Alien' },
        { name: 'Robot' },
      ],
      settings: [{ name: 'Space Station' }],
      circumstances: [{ name: 'Meteor Shower' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects pack with fewer than 3 characters', () => {
    const result = createCardPackSchema.safeParse({
      name: 'Small Pack',
      description: 'Too small',
      theme: 'test',
      characters: [{ name: 'One' }, { name: 'Two' }],
      settings: [{ name: 'Place' }],
      circumstances: [{ name: 'Thing' }],
    })
    expect(result.success).toBe(false)
  })

  it('defaults isMature to false', () => {
    const result = createCardPackSchema.safeParse({
      name: 'Pack',
      description: 'Desc',
      theme: 'fun',
      characters: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      settings: [{ name: 'S' }],
      circumstances: [{ name: 'X' }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isMature).toBe(false)
    }
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --testPathPattern="lib/schema" --verbose`
Expected: FAIL — imports not found

**Step 3: Add schemas to lib/schema.ts**

Append after line 19 (after the existing `ValidatedScript` type export):

```typescript
// ── Room schemas ────────────────────────────────────────────

export const createRoomSchema = z.object({
  isPublic: z.boolean().default(false),
  allowSpectators: z.boolean().default(true),
  comedyStyle: z.string().optional(),
  scriptLength: z.enum(['short', 'medium', 'long']).default('medium'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  cardPackId: z.string().optional(),
  matureContent: z.boolean().default(false),
  customPrompt: z.string().max(500).optional(),
})

export const joinRoomSchema = z.object({
  roomCode: z.string().min(3).max(6).transform(s => s.toUpperCase()),
  nickname: z.string().trim().min(1, 'Nickname is required').max(50, 'Nickname too long'),
})

export const updateRoomSettingsSchema = createRoomSchema.partial()

// ── Selection schemas ───────────────────────────────────────

export const submitCardsSchema = z.object({
  character: z.string().min(1),
  setting: z.string().optional(),
  circumstance: z.string().optional(),
})

// ── Voting schemas ──────────────────────────────────────────

export const submitVoteSchema = z.object({
  targetPlayerId: z.string().min(1, 'Must select a player'),
})

// ── Card pack schemas ───────────────────────────────────────

export const createCardPackSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  theme: z.string().max(50).default(''),
  isMature: z.boolean().default(false),
  characters: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).min(3, 'Need at least 3 characters'),
  settings: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).min(1, 'Need at least 1 setting'),
  circumstances: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).min(1, 'Need at least 1 circumstance'),
})

export const rateCardPackSchema = z.object({
  packId: z.string().min(1),
  rating: z.number().min(1).max(5),
})

// ── Derived types ───────────────────────────────────────────

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type JoinRoomInput = z.infer<typeof joinRoomSchema>
export type SubmitCardsInput = z.infer<typeof submitCardsSchema>
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>
export type CreateCardPackInput = z.infer<typeof createCardPackSchema>
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --testPathPattern="lib/schema" --verbose`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/schema.ts __tests__/unit/lib/schema.test.ts
git commit -m "feat: add Zod validation schemas for room, selection, voting, card packs"
```

---

### Task 1.4: Centralize Server Config

**Files:**
- Create: `server/utils/config.ts`
- Reference: `server/utils/constants.ts` (lines 5-60) — existing constants to complement, NOT replace
- Reference: `server/middleware/rateLimiter.ts` (lines 7-50) — existing Express rate limit values

**Context:** `server/utils/constants.ts` already has game-rule constants (WORDS_PER_MINUTE, punctuation pauses, mood multipliers, etc.). The new config covers operational values that are currently hardcoded inline in server.ts and services: timeouts, retry counts, debounce windows, rate limit windows.

**Step 1: Create the config**

```typescript
// server/utils/config.ts

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
  // ── Script Generation ─────────────────────────
  generation: {
    timeoutMs: envNum('GENERATION_TIMEOUT_MS', 45_000),
    maxRetries: envNum('GENERATION_MAX_RETRIES', 1),
    model: envStr('ANTHROPIC_MODEL', 'claude-sonnet-4-5-20250929'),
  },

  // ── Image Generation ──────────────────────────
  image: {
    timeoutMs: envNum('IMAGE_TIMEOUT_MS', 30_000),
    maxRetries: envNum('IMAGE_MAX_RETRIES', 2),
    retryBackoffMs: envNum('IMAGE_RETRY_BACKOFF_MS', 5_000),
  },

  // ── Persistence (Firestore) ───────────────────
  persistence: {
    debounceMs: envNum('PERSISTENCE_DEBOUNCE_MS', 5_000),
    retryIntervalMs: envNum('PERSISTENCE_RETRY_MS', 10_000),
    maxRetryQueueSize: envNum('PERSISTENCE_MAX_QUEUE', 100),
  },

  // ── Reconnection ─────────────────────────────
  reconnection: {
    gracePeriodMs: envNum('RECONNECT_GRACE_MS', 60_000),
  },

  // ── Socket Rate Limits ────────────────────────
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

  // ── Client-Shared Defaults ────────────────────
  ui: {
    featuredPacksLimit: 20,
    spectatorMessageBuffer: 50,
    searchDebounceMs: 400,
    packLoadingTimeoutMs: 10_000,
  },
} as const
```

**Step 2: Create client-safe constants**

```typescript
// lib/constants.ts

// Client-safe constants shared across frontend components.
// Game rule constants (teleprompter timing, etc.) live in server/utils/constants.ts.

export const GAME_CONSTANTS = {
  maxNicknameLength: 50,
  roomCodeLength: 4,
  searchDebounceMs: 400,
  packLoadingTimeoutMs: 10_000,
  spectatorMessageBuffer: 50,
  featuredPacksLimit: 20,
  countdownDurationMs: 800,
  performingCountdownStart: 3,
  loadingTimeoutMs: 45_000,
} as const
```

**Step 3: Commit**

```bash
git add server/utils/config.ts lib/constants.ts
git commit -m "feat: centralize server config and client constants (timeouts, rate limits, defaults)"
```

---

### Task 1.5: Create RetryQueue Utility

**Files:**
- Create: `server/utils/retryQueue.ts`
- Create: `__tests__/unit/server/utils/retryQueue.test.ts`

**Step 1: Write the test**

```typescript
// __tests__/unit/server/utils/retryQueue.test.ts
import { RetryQueue } from '@/server/utils/retryQueue'

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

    // Let microtask resolve
    await Promise.resolve()

    expect(onSuccess).toHaveBeenCalledWith('result')
    expect(onFinalFailure).not.toHaveBeenCalled()
  })

  it('retries on failure and eventually succeeds', async () => {
    const onSuccess = jest.fn()
    const onRetry = jest.fn()
    let attempt = 0

    queue.add('test', async () => {
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

    // First attempt fails
    await Promise.resolve()
    expect(onRetry).toHaveBeenCalledTimes(1)

    // Advance to retry 2
    jest.advanceTimersByTime(200) // 100 * 2^1
    await Promise.resolve()
    expect(onRetry).toHaveBeenCalledTimes(2)

    // Advance to retry 3 — succeeds
    jest.advanceTimersByTime(400) // 100 * 2^2
    await Promise.resolve()
    expect(onSuccess).toHaveBeenCalledWith('ok')
  })

  it('calls onFinalFailure after max retries', async () => {
    const onFinalFailure = jest.fn()

    queue.add('test', async () => { throw new Error('always fails') }, {
      maxRetries: 1,
      backoffMs: 50,
      onSuccess: jest.fn(),
      onFinalFailure,
    })

    // First attempt
    await Promise.resolve()

    // Retry
    jest.advanceTimersByTime(100)
    await Promise.resolve()

    expect(onFinalFailure).toHaveBeenCalledWith(expect.any(Error))
  })

  it('cancels a task by key', async () => {
    const onSuccess = jest.fn()

    queue.add('cancel-me', async () => { throw new Error('fail') }, {
      maxRetries: 5,
      backoffMs: 100,
      onSuccess,
      onFinalFailure: jest.fn(),
    })

    await Promise.resolve()
    queue.cancel('cancel-me')

    jest.advanceTimersByTime(10_000)
    await Promise.resolve()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --testPathPattern="retryQueue" --verbose`
Expected: FAIL

**Step 3: Write the implementation**

```typescript
// server/utils/retryQueue.ts
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
    // Cancel existing task with this key
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
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --testPathPattern="retryQueue" --verbose`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add server/utils/retryQueue.ts __tests__/unit/server/utils/retryQueue.test.ts
git commit -m "feat: add RetryQueue utility for async background tasks with exponential backoff"
```

---

### Task 1.6: Add GameError Types

**Files:**
- Modify: `lib/types.ts` (add to ServerToClientEvents around line 455, add error types)

**Step 1: Add types to lib/types.ts**

After the existing `ServerToClientEvents` interface (around line 455), add the error types. Then add `game_error` and `game_warning` to the `ServerToClientEvents` interface.

Add before `ServerToClientEvents`:

```typescript
// ── Error Types ─────────────────────────────────────────────

export type ErrorCode =
  | 'SCRIPT_GENERATION_FAILED'
  | 'SCRIPT_GENERATION_TIMEOUT'
  | 'IMAGE_GENERATION_FAILED'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'INVALID_GAME_STATE'
  | 'AUTH_REQUIRED'
  | 'AUTH_EXPIRED'
  | 'RATE_LIMITED'
  | 'CREDIT_INSUFFICIENT'
  | 'DATABASE_ERROR'
  | 'NETWORK_TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'

export type WarningCode =
  | 'IMAGE_GENERATION_SLOW'
  | 'PLAYER_RECONNECTING'
  | 'PLAYER_RECONNECTED'
  | 'DATABASE_WRITE_DELAYED'
  | 'FALLBACK_ACTIVATED'

export type ErrorAction =
  | { type: 'RETRY'; event: string }
  | { type: 'REDIRECT'; path: string }
  | { type: 'RELOAD' }
  | { type: 'DISMISS' }

export interface GameError {
  code: ErrorCode
  message: string
  phase?: GameState
  recoverable: boolean
  action?: ErrorAction
}

export interface GameWarning {
  code: WarningCode
  message: string
  details?: string
}
```

Add to `ServerToClientEvents` (inside the interface):

```typescript
  game_error: (error: GameError) => void
  game_warning: (warning: GameWarning) => void
  player_reconnected: (data: { name: string; socketId: string }) => void
  player_disconnected: (data: { name: string }) => void
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No new errors

**Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add GameError, GameWarning, ErrorCode types + game_error/game_warning socket events"
```

---

## Phase 2: Server Split — Move Handlers to Modules

### Task 2.1: Create Handler Registration Orchestrator

**Files:**
- Create: `server/handlers/index.ts`

**Context:** This is the entry point. It creates `HandlerContext` and calls each module's register function. Start with an empty shell that just handles `disconnect` — we'll add modules one by one.

**Step 1: Create the orchestrator**

```typescript
// server/handlers/index.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { logger } from '@/lib/logger'

// Handler module imports will be added as each module is created:
// import { registerRoomHandlers } from './room.handler'
// import { registerSelectionHandlers } from './selection.handler'
// etc.

export function registerAllHandlers(io: AppServer) {
  io.on('connection', (socket: AppSocket) => {
    const ctx: HandlerContext = {
      userId: socket.data.userId ?? socket.data.uid ?? null,
      socketId: socket.id,
      isAdmin: socket.data.isAdmin ?? false,
      io,
    }

    logger.info('socket.connected', {
      socketId: socket.id,
      userId: ctx.userId,
      ip: socket.handshake.address,
    })

    // Handler modules will be registered here as they are created:
    // registerRoomHandlers(io, socket, ctx)
    // registerSelectionHandlers(io, socket, ctx)
    // registerGameHandlers(io, socket, ctx)
    // registerVotingHandlers(io, socket, ctx)
    // registerAudienceHandlers(io, socket, ctx)
    // registerGenerationHandlers(io, socket, ctx)
    // registerCardpackHandlers(io, socket, ctx)
    // registerUserHandlers(io, socket, ctx)
    // registerAdminHandlers(io, socket, ctx)

    socket.on('disconnect', (reason) => {
      logger.info('socket.disconnected', { socketId: socket.id, reason })
      // Disconnect handling will be moved here from server.ts
    })
  })
}
```

**Step 2: Commit**

```bash
git add server/handlers/index.ts
git commit -m "feat: add handler registration orchestrator (empty shell)"
```

---

### Task 2.2: Move Room Handlers

**Files:**
- Create: `server/handlers/room.handler.ts`
- Modify: `server.ts` — remove lines 227-402 (create_room, join_room), 964-1075 (get_room_preview, update_room_settings), 1746-1827 (public rooms, quick_play), 1829-1870 (host_kick_player)
- Modify: `server/handlers/index.ts` — uncomment room handler registration

**Important:** This is the largest handler group. Move the handler bodies verbatim — do NOT refactor logic. Keep the same service calls, same callbacks, same error messages. The only change is wrapping with middleware.

**Step 1: Create room.handler.ts**

Copy handler bodies from server.ts at the following locations:
- `create_room`: lines 227-295
- `join_room`: lines 298-402
- `get_room_preview`: lines 964-999
- `update_room_settings`: lines 1002-1075
- `list_public_rooms`: lines 1746-1754
- `subscribe_public_rooms`: lines 1756-1758
- `unsubscribe_public_rooms`: lines 1760-1762
- `quick_play`: lines 1764-1823
- `cancel_quick_play`: lines 1825-1827
- `host_kick_player`: lines 1829-1870

The file structure:

```typescript
// server/handlers/room.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorBoundary, withAuth, withRateLimit } from './middleware'
import { CONFIG } from '../utils/config'
// Import all services used by room handlers (copy from server.ts imports)
// These will be the same imports currently at the top of server.ts

export function registerRoomHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  const rl = CONFIG.rateLimits

  socket.on('create_room', withErrorBoundary('create_room',
    withAuth(socket,
      withRateLimit(`${socket.id}:room:create`, rl.roomCreate.max, rl.roomCreate.windowMs,
        async (settings, callback) => {
          // PASTE handler body from server.ts lines 228-294 verbatim
          // Replace `socket.data.uid` with `ctx.userId` where appropriate
        }
      )
    )
  ))

  socket.on('join_room', withErrorBoundary('join_room',
    withRateLimit(`${socket.id}:room:join`, rl.roomJoin.max, rl.roomJoin.windowMs,
      async (roomCode, nickname, callback) => {
        // PASTE handler body from server.ts lines 299-401 verbatim
      }
    )
  ))

  // ... remaining handlers follow same pattern
}
```

**Step 2: Update server/handlers/index.ts** — uncomment room handler import and registration

**Step 3: Remove moved handlers from server.ts** — delete the handler bodies but keep the `io.on('connection')` block structure for remaining handlers

**Step 4: Run existing tests**

Run: `npm run test --verbose`
Expected: All existing tests still pass (no service logic changed)

**Step 5: Run build**

Run: `npm run build`
Expected: No TypeScript errors

**Step 6: Commit**

```bash
git add server/handlers/room.handler.ts server/handlers/index.ts server.ts
git commit -m "refactor: move room handlers to server/handlers/room.handler.ts"
```

---

### Task 2.3: Move Selection Handlers

**Files:**
- Create: `server/handlers/selection.handler.ts`
- Modify: `server.ts` — remove lines 405-501 (submit_cards, start_game)
- Modify: `server/handlers/index.ts` — add selection handler registration

**Handlers to move:**
- `submit_cards`: lines 405-482
- `start_game`: lines 485-501

```typescript
// server/handlers/selection.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorBoundary, withAuth, withRateLimit } from './middleware'
// ... service imports

export function registerSelectionHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  socket.on('submit_cards', withErrorBoundary('submit_cards',
    withAuth(socket, async (roomCode, selections, callback) => {
      // PASTE from server.ts lines 406-481
    })
  ))

  socket.on('start_game', withErrorBoundary('start_game',
    withAuth(socket, async (roomCode) => {
      // PASTE from server.ts lines 486-500
    })
  ))
}
```

**Steps:** Same as 2.2 — create file, update index.ts, remove from server.ts, run tests + build, commit.

```bash
git commit -m "refactor: move selection handlers to server/handlers/selection.handler.ts"
```

---

### Task 2.4: Move Game Flow Handlers

**Files:**
- Create: `server/handlers/game.handler.ts`
- Modify: `server.ts`
- Modify: `server/handlers/index.ts`

**Handlers to move:**
- `retry_script_generation`: lines 504-526
- `end_performance`: lines 529-557
- `advance_script_line`: lines 606-621
- `pause_script`: lines 624-643
- `resume_script`: lines 645-661
- `jump_to_line`: lines 662-694
- `player_jump_to_line`: lines 697-743
- `request_sequel`: lines 746-897
- `request_new_game`: lines 900-961
- `request_resync`: lines 2100-2154

**Steps:** Create file, update index.ts, remove from server.ts, test + build, commit.

```bash
git commit -m "refactor: move game flow handlers to server/handlers/game.handler.ts"
```

---

### Task 2.5: Move Voting Handlers

**Files:**
- Create: `server/handlers/voting.handler.ts`

**Handlers to move:**
- `submit_vote`: lines 560-603

```bash
git commit -m "refactor: move voting handlers to server/handlers/voting.handler.ts"
```

---

### Task 2.6: Move Audience Handlers

**Files:**
- Create: `server/handlers/audience.handler.ts`

**Handlers to move:**
- `send_audience_reaction`: lines 1082-1122
- `send_spectator_message`: lines 1125-1156
- `start_plot_twist`: lines 1159-1297
- `vote_plot_twist`: lines 1300-1321

```bash
git commit -m "refactor: move audience handlers to server/handlers/audience.handler.ts"
```

---

### Task 2.7: Move Card Pack Handlers

**Files:**
- Create: `server/handlers/cardpack.handler.ts`

**Handlers to move:**
- `list_card_packs`: lines 1328-1336
- `select_card_pack`: lines 1339-1375
- `create_card_pack`: lines 1378-1394
- `rate_card_pack`: lines 1397-1411
- `update_card_pack`: lines 1414-1428
- `delete_card_pack`: lines 1431-1445
- `search_card_packs`: lines 1448-1459
- `get_featured_packs`: lines 1462-1471
- `get_card_pack`: lines 1474-1487

```bash
git commit -m "refactor: move card pack handlers to server/handlers/cardpack.handler.ts"
```

---

### Task 2.8: Move Audio, User, and Admin Handlers

**Files:**
- Create: `server/handlers/audio.handler.ts`
- Create: `server/handlers/user.handler.ts`
- Create: `server/handlers/admin.handler.ts`

**Audio handlers:**
- `update_audio_settings`: lines 1494-1508
- `trigger_sound_effect`: lines 1511-1522
- `request_line_audio`: lines 1525-1547

**User handlers:**
- `get_game_history`: lines 1554-1563
- `get_game_details`: lines 1566-1583
- `share_game`: lines 1586-1602
- `get_player_stats`: lines 1609-1618
- `get_leaderboard`: lines 1621-1630
- `get_credit_balance`: lines 1636-1650
- `get_referral_info`: lines 1656-1670
- `redeem_referral`: lines 1672-1685
- `get_progression`: lines 1691-1701
- `get_weekly_challenges`: lines 1703-1717
- `claim_level_reward`: lines 1719-1740

**Admin handlers:**
- `check_admin`: lines 1876-1878
- `admin_get_rooms`: lines 1880-1906
- `admin_get_users`: lines 1908-1951
- `admin_get_stats`: lines 1953-1997
- `admin_kick_player`: lines 1999-2025
- `admin_close_room`: lines 2027-2053
- `admin_add_credits`: lines 2055-2080

**Latency/diagnostics:**
- `latency_pong`: lines 2087-2094

```bash
git commit -m "refactor: move audio, user, and admin handlers to handler modules"
```

---

### Task 2.9: Slim Down server.ts

**Files:**
- Modify: `server.ts` — remove the now-empty `io.on('connection')` block and replace with `registerAllHandlers(io)`
- Modify: `server/handlers/index.ts` — move `disconnect` handler logic from server.ts lines 2158-2207

**Step 1: In server.ts, replace the entire `io.on('connection', ...)` block (lines 223-2208) with:**

```typescript
import { registerAllHandlers } from './server/handlers'

// After io is created (around line 220):
registerAllHandlers(io)
```

**Step 2: Move disconnect handler and helper functions**

Move `disconnect` handler (lines 2158-2207) into `server/handlers/index.ts`.
Move `startScriptGeneration` helper (line 2227+) to `server/handlers/generation.handler.ts` or keep in a shared helpers file.

**Step 3: Run full test suite + build**

Run: `npm run test && npm run build`
Expected: All pass. server.ts should now be ~150-200 lines.

**Step 4: Commit**

```bash
git add server.ts server/handlers/
git commit -m "refactor: server.ts now ~150 lines — all handlers delegated to modules"
```

---

## Phase 3: Hook Deduplication

### Task 3.1: Create Shared Game Socket Types

**Files:**
- Create: `hooks/useGameSocket.types.ts`

```typescript
// hooks/useGameSocket.types.ts
import type { Script, Player, GameState, GameResults, SpectatorMessage, XPEvent, LevelReward, AvailableCards, CardSelection, RoomSettings, PlayerRole, AudienceReaction } from '@/lib/types'

export interface SharedGameState {
  gameState: GameState
  players: Player[]
  script: Script | null
  currentLineIndex: number
  greenRoomQuestion: string
  gameResults: GameResults | null
  availableCards: AvailableCards
  networkLatency: number | null
  spectatorMessages: SpectatorMessage[]
  countdown: number | null
  xpEvents: XPEvent[]
  levelUpData: { level: number; title: string; reward?: LevelReward } | null
  scriptImageUrl: string | null
  loadingProgress: number
  loadingPhase: string
  scriptTitlePreview: string | null
}

export interface SharedGameActions {
  setGameState: (state: GameState) => void
  setPlayers: (players: Player[]) => void
  setScript: (script: Script | null) => void
  setCurrentLineIndex: (index: number) => void
  setLevelUpData: (data: SharedGameState['levelUpData']) => void
}
```

**Step 1: Commit**

```bash
git add hooks/useGameSocket.types.ts
git commit -m "feat: add shared game socket types"
```

---

### Task 3.2: Create Base useGameSocket Hook

**Files:**
- Create: `hooks/useGameSocket.ts`
- Reference: `hooks/useHostSocket.ts` — shared listeners at lines 92-260
- Reference: `hooks/useJoinSocket.ts` — shared listeners at lines 138-280

**Context:** This hook contains ALL state and listeners that are identical between host and join:
- State: gameState, players, script, currentLineIndex, greenRoomQuestion, gameResults, availableCards, networkLatency, spectatorMessages, countdown, xpEvents, levelUpData, scriptImageUrl, loadingProgress, loadingPhase, scriptTitlePreview
- Listeners: players_update, player_joined, game_state_change, available_cards, green_room_prompt, script_ready, script_image_update, sync_teleprompter, game_over, achievement_unlocked, xp_gained, level_up, spectator_message_received, kicked, error, player_left, latency_ping, latency_pong_response, plot_twist_injected, new_game_started

**The countdown logic** (3-2-1 when entering PERFORMING) is identical in both hooks — it belongs in the base.

**Step 1: Write the base hook**

Extract the shared state declarations and listeners from both hooks. The hook accepts `params` matching the shared subset of both hooks' input params:

```typescript
// hooks/useGameSocket.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { SharedGameState } from './useGameSocket.types'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents, GameState, Player, Script, SpectatorMessage } from '@/lib/types'
import { GAME_CONSTANTS } from '@/lib/constants'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseGameSocketParams {
  roomCode: string
  playerId: string
  toast: { error: (msg: string) => void; success: (msg: string) => void; info: (msg: string) => void }
  achievementToasts: { addAchievement: (a: any) => void }
}

export function useGameSocket(params: UseGameSocketParams) {
  const { socket, isConnected } = useSocket()
  const router = useRouter()

  // ── Shared State ──────────────────────────────────
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [players, setPlayers] = useState<Player[]>([])
  const [script, setScript] = useState<Script | null>(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [greenRoomQuestion, setGreenRoomQuestion] = useState('')
  const [gameResults, setGameResults] = useState<any>(null)
  const [availableCards, setAvailableCards] = useState<any>({ characters: [], settings: [], circumstances: [] })
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [spectatorMessages, setSpectatorMessages] = useState<SpectatorMessage[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [xpEvents, setXpEvents] = useState<any[]>([])
  const [levelUpData, setLevelUpData] = useState<any>(null)
  const [scriptImageUrl, setScriptImageUrl] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [scriptTitlePreview, setScriptTitlePreview] = useState<string | null>(null)

  // ── Refs ──────────────────────────────────────────
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameStateRef = useRef(gameState)
  const playersRef = useRef(players)
  const roomCodeRef = useRef(params.roomCode)
  const playerIdRef = useRef(params.playerId)

  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { roomCodeRef.current = params.roomCode }, [params.roomCode])
  useEffect(() => { playerIdRef.current = params.playerId }, [params.playerId])

  // ── Shared Listeners ──────────────────────────────
  // These are registered by the hook and cleaned up on unmount.
  // Host-specific and join-specific listeners are added by the extension hooks.
  useEffect(() => {
    if (!socket || !isConnected) return

    // Copy shared listener registrations from useHostSocket lines 95-260
    // and useJoinSocket lines 141-280 — only the ones that appear in BOTH.
    //
    // Key shared listeners:
    // - players_update → setPlayers
    // - player_joined → toast
    // - game_state_change → countdown logic + setGameState
    // - available_cards → setAvailableCards
    // - green_room_prompt → setGreenRoomQuestion
    // - script_ready → setScript + setScriptImageUrl + setCurrentLineIndex(0)
    // - script_image_update → setScriptImageUrl
    // - sync_teleprompter → setCurrentLineIndex
    // - game_over → setGameResults
    // - achievement_unlocked → achievementToasts
    // - xp_gained → setXpEvents
    // - level_up → setLevelUpData
    // - spectator_message_received → append to buffer
    // - kicked → toast + redirect
    // - error → toast.error
    // - player_left → toast
    // - latency_ping → emit latency_pong
    // - latency_pong_response → setNetworkLatency
    // - plot_twist_injected → splice into script.lines
    // - new_game_started → reset all state
    // - script_generation_progress → setLoadingProgress + setLoadingPhase + setScriptTitlePreview

    // ... (paste the exact handler bodies from the existing hooks)

    return () => {
      // Clean up all listeners
      // socket.off('players_update', ...)
      // etc.
    }
  }, [socket, isConnected])

  return {
    // Connection
    socket, isConnected,
    // State
    gameState, setGameState,
    players, setPlayers,
    script, setScript,
    currentLineIndex, setCurrentLineIndex,
    greenRoomQuestion,
    gameResults,
    availableCards,
    networkLatency,
    spectatorMessages,
    countdown,
    xpEvents,
    levelUpData, setLevelUpData,
    scriptImageUrl,
    loadingProgress,
    loadingPhase,
    scriptTitlePreview,
    // Refs
    gameStateRef, playersRef, roomCodeRef, playerIdRef,
    countdownIntervalRef,
  }
}
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add hooks/useGameSocket.ts
git commit -m "feat: create shared useGameSocket base hook"
```

---

### Task 3.3: Rewrite useHostSocket to Extend Base

**Files:**
- Modify: `hooks/useHostSocket.ts` (full rewrite — currently 290 lines)
- Reference: `app/host/page.tsx` lines 81-114 — destructured values that must still be returned

**Step 1: Rewrite useHostSocket**

The hook now calls `useGameSocket()` for shared state and only manages host-specific state:
- `isPlaying`, `scriptGenerationTimedOut`, `isGeneratingImage`, `chaosCooldown`
- `creditBalance`, `showInsufficientCredits`
- `selection`, `hasSubmittedSelection`

Host-specific listeners (NOT in base hook):
- `credit_balance` → setCreditBalance
- `insufficient_credits` → setShowInsufficientCredits

The returned object must match what `app/host/page.tsx` destructures at lines 81-114.

**Step 2: Verify host page still works**

Run: `npm run build`
Expected: No TypeScript errors from `app/host/page.tsx`

**Step 3: Commit**

```bash
git add hooks/useHostSocket.ts
git commit -m "refactor: useHostSocket extends useGameSocket base hook"
```

---

### Task 3.4: Rewrite useJoinSocket to Extend Base

**Files:**
- Modify: `hooks/useJoinSocket.ts` (full rewrite — currently 308 lines)
- Reference: `app/join/page.tsx` lines 65-93 — destructured values that must still be returned

**Step 1: Rewrite useJoinSocket**

Join-specific state:
- `myCharacter`, `hostDisconnected`, `selectedPackName`, `loadingTimedOut`, `error`
- `autoStartCountdown`, `roomSettings`, `resyncData`

Join-specific listeners:
- `host_disconnected` → setHostDisconnected + toast
- `card_pack_selected` → setSelectedPackName
- `room_settings_update` → setRoomSettings
- `auto_start_countdown` → setAutoStartCountdown

The returned object must match what `app/join/page.tsx` destructures at lines 65-93.

**Step 2: Verify join page still works**

Run: `npm run build`

**Step 3: Commit**

```bash
git add hooks/useJoinSocket.ts
git commit -m "refactor: useJoinSocket extends useGameSocket base hook"
```

---

## Phase 4: Error System

### Task 4.1: Create useGameErrors Hook

**Files:**
- Create: `hooks/useGameErrors.ts`
- Reference: `hooks/useToast.tsx` — `showToast(message, type, options)` with types: success, error, warning, info

**Step 1: Write the hook**

```typescript
// hooks/useGameErrors.ts
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents, GameError, GameWarning } from '@/lib/types'
import { logger } from '@/lib/logger'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseGameErrorsParams {
  socket: AppSocket | null
  toast: {
    error: (msg: string, options?: { title?: string; duration?: number }) => void
    warning: (msg: string, options?: { title?: string; duration?: number }) => void
    info: (msg: string, options?: { title?: string; duration?: number }) => void
  }
}

export function useGameErrors({ socket, toast }: UseGameErrorsParams) {
  const router = useRouter()

  useEffect(() => {
    if (!socket) return

    const handleError = (error: GameError) => {
      logger.error('game.error', error)

      toast.error(error.message, {
        duration: error.recoverable ? 8000 : undefined,
      })

      // Auto-handle redirect actions
      if (error.action?.type === 'REDIRECT') {
        router.push(error.action.path)
      }
    }

    const handleWarning = (warning: GameWarning) => {
      logger.warn('game.warning', warning)
      toast.warning(warning.message, { duration: 5000 })
    }

    socket.on('game_error', handleError)
    socket.on('game_warning', handleWarning)
    return () => {
      socket.off('game_error', handleError)
      socket.off('game_warning', handleWarning)
    }
  }, [socket, toast, router])
}
```

**Step 2: Integrate into useGameSocket base hook**

Add `useGameErrors({ socket, toast })` call inside `useGameSocket`.

**Step 3: Commit**

```bash
git add hooks/useGameErrors.ts hooks/useGameSocket.ts
git commit -m "feat: add useGameErrors hook for typed error/warning toasts"
```

---

### Task 4.2: Add Error Classification to Server Middleware

**Files:**
- Modify: `server/handlers/middleware.ts` — enhance `withErrorBoundary` to emit `game_error`

**Step 1: Add error classification**

```typescript
// Add to server/handlers/middleware.ts

import type { GameError, ErrorCode } from '@/lib/types'

function classifyError(eventName: string, error: unknown): GameError {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'

  // Classify by error message patterns
  if (message.includes('insufficient') || message.includes('credits')) {
    return {
      code: 'CREDIT_INSUFFICIENT',
      message: 'Not enough credits to generate a script.',
      recoverable: true,
      action: { type: 'REDIRECT', path: '/profile' },
    }
  }
  if (message.includes('not found') || message.includes('no room')) {
    return {
      code: 'ROOM_NOT_FOUND',
      message: 'This room no longer exists.',
      recoverable: true,
      action: { type: 'REDIRECT', path: '/' },
    }
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      code: 'NETWORK_TIMEOUT',
      message: 'Request timed out. Please try again.',
      recoverable: true,
      action: { type: 'RETRY', event: eventName },
    }
  }

  return {
    code: 'UNKNOWN',
    message: 'Something went wrong. Please try again.',
    recoverable: true,
    action: { type: 'DISMISS' },
  }
}
```

Update `withErrorBoundary` to accept socket and emit:

```typescript
export function withErrorBoundary(eventName: string, handler: HandlerFn, socket?: AppSocket): HandlerFn {
  return async (...args: unknown[]) => {
    const callback = args.find(a => typeof a === 'function') as SocketCallback | undefined
    try {
      await handler(...args)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      logger.error(`handler.${eventName}.failed`, { error: message })
      callback?.({ success: false, error: message })

      // Emit structured error for client UI
      if (socket) {
        socket.emit('game_error', classifyError(eventName, error))
      }
    }
  }
}
```

**Step 2: Update tests for new signature**

**Step 3: Commit**

```bash
git add server/handlers/middleware.ts __tests__/unit/server/handlers/middleware.test.ts
git commit -m "feat: add error classification to middleware — emits game_error events"
```

---

## Phase 5: Reconnection System

### Task 5.1: Add rejoin_room Server Handler

**Files:**
- Modify: `server/handlers/room.handler.ts` — add `rejoin_room` event
- Modify: `lib/types.ts` — add `rejoin_room` to `ClientToServerEvents`

**Step 1: Add event type**

In `ClientToServerEvents` in `lib/types.ts`:

```typescript
rejoin_room: (roomCode: string, callback: (res: {
  success: boolean;
  error?: string;
  snapshot?: {
    phase: GameState;
    players: Player[];
    script: Script | null;
    currentLineIndex: number;
    scriptImageUrl: string | null;
  };
}) => void) => void
```

**Step 2: Add handler in room.handler.ts**

```typescript
socket.on('rejoin_room', withErrorBoundary('rejoin_room',
  withAuth(socket, async (roomCode: string, callback) => {
    // Find room, find player by userId, update socketId, rejoin socket room,
    // send full state snapshot, notify others via player_reconnected
  })
))
```

**Step 3: Modify disconnect handler** in `server/handlers/index.ts`

Instead of immediately removing the player, mark them as `connected: false` and set a 60-second grace period timeout. If they reconnect (via `rejoin_room`) within the window, cancel the timeout.

**Step 4: Commit**

```bash
git add server/handlers/room.handler.ts server/handlers/index.ts lib/types.ts
git commit -m "feat: add rejoin_room handler with grace period disconnect"
```

---

### Task 5.2: Create useReconnection Hook

**Files:**
- Create: `hooks/useReconnection.ts`

**Step 1: Write the hook**

```typescript
// hooks/useReconnection.ts
import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import type { GameState, Player, Script } from '@/lib/types'

interface ReconnectionSnapshot {
  phase: GameState
  players: Player[]
  script: Script | null
  currentLineIndex: number
  scriptImageUrl: string | null
}

interface UseReconnectionParams {
  roomCode: string | null
  onSnapshot: (snapshot: ReconnectionSnapshot) => void
}

export function useReconnection({ roomCode, onSnapshot }: UseReconnectionParams) {
  const { socket, isConnected, connectionState, reconnectAttempt } = useSocket()
  const [reconnecting, setReconnecting] = useState(false)
  const wasConnectedRef = useRef(false)

  useEffect(() => {
    if (!socket || !roomCode) return

    if (isConnected && wasConnectedRef.current === false && wasConnectedRef.current !== undefined) {
      // We just reconnected — try to rejoin
      setReconnecting(true)
      socket.emit('rejoin_room', roomCode.toUpperCase(), (response) => {
        setReconnecting(false)
        if (response.success && response.snapshot) {
          onSnapshot(response.snapshot)
        }
      })
    }

    wasConnectedRef.current = isConnected
  }, [isConnected, socket, roomCode, onSnapshot])

  return {
    reconnecting: reconnecting || connectionState === 'reconnecting',
    reconnectAttempt,
  }
}
```

**Step 2: Commit**

```bash
git add hooks/useReconnection.ts
git commit -m "feat: add useReconnection hook for automatic game state recovery"
```

---

### Task 5.3: Create ReconnectionBanner Component

**Files:**
- Create: `components/ReconnectionBanner.tsx`

**Step 1: Write the component**

```typescript
// components/ReconnectionBanner.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MOTION } from '@/lib/animations'

interface ReconnectionBannerProps {
  reconnecting: boolean
  attempt?: number
}

export function ReconnectionBanner({ reconnecting, attempt = 0 }: ReconnectionBannerProps) {
  return (
    <AnimatePresence>
      {reconnecting && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={MOTION.snappy}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium font-display"
          style={{
            background: 'var(--color-warning)',
            color: '#000',
            paddingTop: 'max(12px, env(safe-area-inset-top))',
          }}
        >
          Reconnecting{attempt > 1 ? ` (attempt ${attempt})` : ''}...
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Integrate into host and join pages**

In `app/host/page.tsx` and `app/join/page.tsx`, add:
```tsx
<ReconnectionBanner reconnecting={reconnecting} attempt={reconnectAttempt} />
```

**Step 3: Commit**

```bash
git add components/ReconnectionBanner.tsx app/host/page.tsx app/join/page.tsx
git commit -m "feat: add ReconnectionBanner component for connection loss feedback"
```

---

## Phase 6: Type Safety & Integration

### Task 6.1: Standardize SocketResponse Type

**Files:**
- Modify: `lib/types.ts` — add `SocketResponse<T>` type
- Gradually update `ClientToServerEvents` callbacks to use it

**Step 1: Add SocketResponse type**

```typescript
// Add to lib/types.ts
export type SocketResponse<T = void> =
  | ({ success: true } & (T extends void ? {} : { data: T }))
  | { success: false; error: string; code?: ErrorCode; requestId?: string }
```

**Step 2: Update a few key events** to use `SocketResponse<T>` (start with create_room, join_room, get_room_preview)

**Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add SocketResponse<T> type for standardized callback responses"
```

---

### Task 6.2: Final Integration Test

**Files:** None created — this is a verification step

**Step 1: Run full test suite**

Run: `npm run test --verbose`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Manual smoke test plan**

If dev server is available:
1. Host creates room → verify room code generated
2. Join enters room → verify player appears in host lobby
3. Start game → verify script generation progress
4. Performing → verify teleprompter syncs
5. Voting → verify votes counted
6. Results → verify winner displayed

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: backend-frontend rewire complete — integration verified"
```

---

## Execution Order & Dependencies

```
Phase 1 (Tasks 1.1-1.6): Infrastructure — no dependencies, all independent
  1.1 Handler types
  1.2 Middleware (depends on 1.1)
  1.3 Zod schemas (independent)
  1.4 Config (independent)
  1.5 RetryQueue (independent)
  1.6 Error types (independent)

Phase 2 (Tasks 2.1-2.9): Server split — depends on Phase 1
  2.1 Handler orchestrator (depends on 1.1)
  2.2-2.8 Move handlers (depends on 2.1, each independent of others)
  2.9 Slim server.ts (depends on 2.2-2.8 all complete)

Phase 3 (Tasks 3.1-3.4): Hook dedup — independent of Phase 2
  3.1 Types (independent)
  3.2 Base hook (depends on 3.1)
  3.3 Host extension (depends on 3.2)
  3.4 Join extension (depends on 3.2)

Phase 4 (Tasks 4.1-4.2): Error system — depends on Phase 1.6
  4.1 useGameErrors hook (depends on 1.6, 3.2)
  4.2 Error classification (depends on 1.2, 1.6)

Phase 5 (Tasks 5.1-5.3): Reconnection — depends on Phase 2, 3
  5.1 rejoin_room handler (depends on 2.1)
  5.2 useReconnection hook (depends on 3.2)
  5.3 ReconnectionBanner (depends on 5.2)

Phase 6 (Tasks 6.1-6.2): Type safety + verification — last
  6.1 SocketResponse type
  6.2 Integration test
```

**Parallelization opportunities:**
- Phase 1 tasks 1.1+1.3+1.4+1.5+1.6 can all run in parallel
- Phase 2 tasks 2.2-2.8 can run in parallel (each handler module is independent)
- Phase 3 can run in parallel with Phase 2

**Total estimated commits:** 22
**Total new files:** ~18
**Total modified files:** ~12
**Net line count change:** Approximately +1,500 new lines, -1,800 removed from server.ts = ~300 fewer lines total
