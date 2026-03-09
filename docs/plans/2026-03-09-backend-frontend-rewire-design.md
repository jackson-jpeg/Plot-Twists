# Backend-Frontend Rewire — Architecture Design

**Date:** 2026-03-09
**Status:** Approved
**Scope:** DX + Reliability + Scalability (Full Architecture Overhaul)
**Approach:** Socket-first — keep Socket.IO as core, clean up the wiring

---

## Context

The Plot Twists backend is a 2,488-line monolithic `server.ts` with 60 inline socket handlers, no middleware pipeline, silent async failures, and ~80% duplicated code between host/join hooks. This design rewires the backend-frontend connection layer without changing services, game logic, or database layer.

## Section 1: Server.ts Splitting

### Problem
60 socket handlers in one file. Finding, editing, or adding handlers means working in a 2,488-line monolith. Merge conflicts are inevitable.

### Solution
Split into 9 handler modules. `server.ts` becomes ~150 lines (Express setup + Socket.IO init + `registerAllHandlers(io)`).

```
server.ts (~150 lines)
├── Express app + middleware chain
├── Next.js handler
├── Socket.IO server + auth
└── registerAllHandlers(io)

server/handlers/
  index.ts              — Orchestrator, registers all modules
  types.ts              — HandlerContext, middleware types
  middleware.ts          — withAuth, withRateLimit, withValidation, etc.
  room.handler.ts       — create/join/leave/kick/settings/close (~200 lines)
  selection.handler.ts  — submit_cards, confirm, start_game, toggle_ready (~180 lines)
  game.handler.ts       — advance/prev line, end/pause/resume performance (~150 lines)
  voting.handler.ts     — submit_vote, get_results, skip_voting (~100 lines)
  audience.handler.ts   — reactions, spectator chat, plot twists (~150 lines)
  generation.handler.ts — generate/regenerate script, generate image (~120 lines)
  cardpack.handler.ts   — CRUD, search, featured, rate (~200 lines)
  user.handler.ts       — profile, stats, history, referral (~120 lines)
  admin.handler.ts      — admin_* events (~120 lines)
```

Each module exports `registerXHandlers(io, socket, ctx)`. Handler bodies move as-is — no logic refactoring.

### HandlerContext
```typescript
interface HandlerContext {
  userId: string | null
  socketId: string
  ip: string
  isAdmin: boolean
  getRoom: (code: string) => Room | undefined
  io: Server
}
```

## Section 2: Socket Handler Middleware Pipeline

### Problem
Auth checks, input validation, error catching, rate limiting, and logging are duplicated ~60 times with inconsistencies. Some handlers check auth, some don't. Some catch errors, some crash silently.

### Solution
Composable middleware functions that wrap handlers:

- **withErrorBoundary** — Outermost. Catches all errors, logs them, sends structured error to client.
- **withAuth** — Rejects unauthenticated sockets for protected events.
- **withRateLimit** — Per-socket, per-event rate limiting with configurable windows.
- **withValidation** — Zod schema validation for handler arguments.
- **withLogging** — Automatic entry/exit logging with timing.
- **compose** — Combines multiple middleware into one wrapper.

### Middleware Application Per Category

| Category | Auth | Rate Limit | Validation |
|----------|------|------------|------------|
| Room create/join | Required | 3/min | Zod schema |
| Room settings | Required | 10/min | Zod schema |
| Card selection | Required | 20/min | Card ID exists |
| Script generation | Required | 2/min | — |
| Line advance | Required | 60/min | — |
| Reactions | Optional | 30/min | Emoji allowlist |
| Voting | Required | 5/min | Player ID exists |
| Admin | Required + isAdmin | — | — |
| Card packs (read) | None | 20/min | — |
| Card packs (write) | Required | 5/min | Zod schema |

## Section 3: Hook Deduplication — useGameSocket

### Problem
`useHostSocket` (290 lines, 18 useState, 20 listeners) and `useJoinSocket` (308 lines, 17 useState, 25 listeners) share ~80% of state and logic. Bugs get fixed in one but not the other.

### Solution
Shared base hook + role-specific extensions:

```
hooks/
  useGameSocket.ts          — ~250 lines, shared state + listeners
  useGameSocket.host.ts     — ~100 lines, host-only (generation, voting status, results)
  useGameSocket.join.ts     — ~120 lines, join-only (myCharacter, myRole, cards, vote)
  useGameSocket.types.ts    — ~80 lines, shared types
```

**Shared state** (in base): phase, players, script, currentLineIndex, spectatorMessages, plotTwists, error, isConnected.

**Host-only state**: generationProgress, votingStatus, results, scriptImageUrl.

**Join-only state**: myCharacter, myRole, availableCards, submittedCards, myVote.

**Shared actions**: advanceLine, previousLine, sendReaction, sendSpectatorMessage, submitPlotTwistVote.

Eliminates ~250 lines of duplicated state, ~15 duplicated listeners, ~100 lines of duplicated ref management.

## Section 4: Error Propagation & Resilience

### Problem
Silent failures: image generation fails silently, Firestore writes retry silently, script generation can hang forever, socket callback errors are swallowed.

### Solution

**Typed error events:**
```typescript
interface GameError {
  code: ErrorCode
  message: string
  phase: GamePhase
  recoverable: boolean
  action?: ErrorAction  // RETRY, REDIRECT, RELOAD, DISMISS, CONTACT_SUPPORT
}
```

**Error classification** — `classifyError()` maps exceptions to user-friendly GameError objects.

**Client-side error hook** — `useGameErrors()` listens for `game_error`/`game_warning` events and shows toast notifications with recovery actions.

**Specific fixes:**
- Image generation: Retry queue with exponential backoff, warning toast, graceful degradation
- Script generation: 45s server-side timeout, error event on failure
- Firestore persistence: Health tracking, admin alerts on degradation

## Section 5: Connection Resilience & Reconnection

### Problem
Socket.IO reconnects the transport, but game state is lost. Player rejoins but loses position, character, vote state. Host disconnect freezes everyone.

### Solution

**Server: `rejoin_room` event** — On reconnect, client sends `rejoin_room` with room code. Server updates socket ID, sends full state snapshot (phase, players, script, line index, character, role, etc.), notifies other players.

**Server: Graceful disconnect** — Mark player as disconnected, don't remove. 60s grace period. If they reconnect within window, seamless rejoin. After timeout, remove and notify.

**Client: `useReconnection` hook** — Detects reconnection, auto-sends `rejoin_room`, restores state from snapshot.

**Client: `ReconnectionBanner` component** — Fixed banner showing "Reconnecting (attempt N)..." during reconnection attempts.

## Section 6: Type Safety — End-to-End Socket Contract

### Problem
Socket event types in `lib/types.ts` can drift from server implementation. Callback response shapes are inconsistent. No shared validation.

### Solution

**Unified response type:**
```typescript
type SocketResponse<T = void> =
  | { success: true } & (T extends void ? {} : { data: T })
  | { success: false; error: string; code?: ErrorCode }
```

**Shared Zod schemas** in `lib/schema.ts` — used by both server middleware (`withValidation`) and optional client pre-flight validation.

**Type-safe emit wrapper** — `createSocketEmitter(socket)` provides `.emit()` and `.request()` (promise-based) with full type inference.

## Section 7: Constants Extraction

### Problem
~40 magic numbers scattered across server.ts and services. Not documented, not testable, not environment-configurable.

### Solution

**Server: `server/utils/config.ts`** — `CONFIG` object with categories: room, generation, image, persistence, rateLimits, ui. All values have defaults, overridable via env vars.

**Client: `lib/constants.ts`** — `GAME_CONSTANTS` with the client-safe subset (maxPlayers, nickname length, debounce values, etc.).

## Section 8: Retry Queue Utility

### Problem
Background tasks (image gen, Firestore writes) are fire-and-forget. Failures are silent, no retry, no notification.

### Solution

`RetryQueue` class with:
- Keyed tasks (cancel/replace by key)
- Configurable maxRetries, exponential backoff, per-attempt timeout
- `onSuccess`, `onRetry`, `onFinalFailure` callbacks
- Used by image generation, Firestore persistence, and any future background task

## What Changes vs What Doesn't

### Changes
- server.ts: 2,488 lines → ~150 lines + 9 handler modules
- Socket middleware: Ad-hoc → composable pipeline
- Hooks: 598 lines with 80% duplication → ~470 lines with 0% duplication
- Error handling: Silent → typed errors with toast notifications and retry
- Reconnection: Loses state → full state recovery via `rejoin_room`
- Type safety: Drift-prone → shared Zod schemas + standardized responses
- Magic numbers: Scattered → centralized CONFIG + GAME_CONSTANTS
- Background tasks: Fire-and-forget → RetryQueue with backoff

### Doesn't Change
- All 18 service modules (room, script generation, voting, etc.)
- Game state machine (LOBBY → SELECTION → LOADING → PERFORMING → VOTING → RESULTS)
- Socket.IO as primary transport
- Database layer (adapter pattern, Firestore/JSON, write-through cache)
- Auth (Firebase Auth, token verification)
- Payments (Stripe + Apple IAP)
- UI components (all stay as-is, only hooks change)
- Deployment (Railway config unchanged)

## Execution Order

```
Phase 1: Infrastructure (no dependencies)
  - server/handlers/types.ts, middleware.ts
  - server/utils/config.ts, retryQueue.ts
  - lib/constants.ts, lib/schema.ts (expand)

Phase 2: Server split (depends on Phase 1)
  - Create handler modules, move handlers one-by-one
  - server.ts shrinks to ~150 lines

Phase 3: Hook dedup (independent of Phase 2)
  - useGameSocket.ts base hook
  - useGameSocket.host.ts + useGameSocket.join.ts
  - Update host/page.tsx and join/page.tsx to use new hooks

Phase 4: Error system (depends on Phase 1)
  - GameError types in lib/types.ts
  - Error classification in middleware
  - useGameErrors hook + toast integration

Phase 5: Reconnection (depends on Phase 2 + 3)
  - rejoin_room server handler
  - Graceful disconnect with grace period
  - useReconnection hook + ReconnectionBanner

Phase 6: Type safety (depends on Phase 1 + 2)
  - SocketResponse<T> standardization
  - Zod schemas in withValidation middleware
  - createSocketEmitter wrapper
```

Phases 1+2+3 can be parallelized. Phase 4 needs Phase 1. Phase 5 needs 2+3. Phase 6 needs 1+2.
