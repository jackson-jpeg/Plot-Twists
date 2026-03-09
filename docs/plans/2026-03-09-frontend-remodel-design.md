# Frontend Remodel — Zustand + Domain Stores

**Date:** 2026-03-09
**Status:** Approved
**Scope:** Frontend state management, socket layer, page orchestration

## Problem

The current frontend has 5 critical issues:

1. **Prop drilling explosion** — HostPerforming takes 20+ props, all threaded through orchestrators
2. **Scattered state** — 22 states in useGameSocket, 6-7 in role hooks, 9-16 in page orchestrators
3. **Host/join duplication** — 90% shared structure maintained in 2 separate 400-500 line files
4. **Stale closure workarounds** — every useState mirrored with useRef for socket listeners
5. **Callback bridge pattern** — 9 optional callbacks connecting base hook to role-specific layers

## Architecture

### Layer 1: Typed Socket Manager (`lib/socketManager.ts`)

Singleton class wrapping Socket.IO. No React dependency.

- Typed `emit<E>(event, payload)` and `on<E>(event, handler)` derived from `lib/types.ts`
- Handles connect, disconnect, reconnect lifecycle
- Store handlers call `set()` directly on Zustand stores — no stale closures possible
- Replaces `contexts/SocketContext.tsx`

### Layer 2: Zustand Domain Stores (`stores/`)

State split by domain, not by role. Each store subscribes to its own socket events.

| Store | State | Socket Events |
|-------|-------|---------------|
| `gameStore` | gameState, players, roomCode, role, settings, countdown | game_state_change, players_update, room_created, player_joined |
| `scriptStore` | script, currentLine, isPlaying, imageUrl, generationProgress | script_ready, sync_teleprompter, script_generation_progress |
| `selectionStore` | availableCards, selection, hasSubmitted, selectedPack | available_cards, card_pack_selected |
| `audienceStore` | spectatorMessages, reactions, plotTwists, chaosCooldown | audience_reaction, plot_twist_*, spectator_message |
| `votingStore` | votes, results, winner, standings, xpEvents | game_over, new_game_started |
| `connectionStore` | isConnected, latency, hostDisconnected, reconnecting | connect, disconnect, latency_pong, host_disconnected |

Components select slices — only re-render when their slice changes.

### Layer 3: Unified Game Shell (`app/game/GameShell.tsx`)

One orchestrator replaces the duplicated phase routing from both pages.

- Reads `role` + `gameState` from `useGameStore`
- Routes to phase components (Lobby, Selection, Loading, Performing, Voting, Results)
- Manages confetti, wake lock, audio, countdown — previously duplicated
- ~200 lines

### Page Files

**host/page.tsx (~120 lines)** — Auth gate, room creation, host-only modals (purchase, onboarding, age gate, poster lightbox), renders `<GameShell role="host" />`

**join/page.tsx (~100 lines)** — URL param parsing, join form, nickname validation, onboarding, renders `<GameShell role="player" />` after join

## Data Flow

### Inbound (Server → UI)
```
Socket.IO Server → SocketManager → Domain Store (set()) → Component (selector re-render)
```

### Outbound (UI → Server)
```
Component → Store Action (optimistic update + emit) → SocketManager.emit() → Server
```

## Why Zustand

- **Stores are plain JS** — socket handlers call `set()` outside React. No useRef mirrors needed.
- **Selector subscriptions** — surgical re-renders. Only components reading changed state update.
- **~2KB gzipped** — no boilerplate, no dispatch/reducer layer.
- **`getState()` anywhere** — stores can read each other, socket handlers can read game state.

## Migration Map

### Create (8 files)
- `lib/socketManager.ts`
- `stores/gameStore.ts`
- `stores/scriptStore.ts`
- `stores/selectionStore.ts`
- `stores/audienceStore.ts`
- `stores/votingStore.ts`
- `stores/connectionStore.ts`
- `app/game/GameShell.tsx`

### Delete (4 files, ~690 lines)
- `hooks/useGameSocket.ts` (271 lines)
- `hooks/useHostSocket.ts` (152 lines)
- `hooks/useJoinSocket.ts` (197 lines)
- `contexts/SocketContext.tsx`

### Simplify
- `app/host/page.tsx` — 515 → ~120 lines
- `app/join/page.tsx` — 384 → ~100 lines
- `app/host/components/*` — prop interfaces shrink from 15-20 to 3-5
- `app/join/components/*` — read from stores instead of receiving props
- `lib/types.ts` — add `ServerToClientEvents` and `ClientToServerEvents` interfaces

## Impact

| Metric | Before | After |
|--------|--------|-------|
| Page orchestrators | 899 lines | ~420 lines (pages + GameShell) |
| Socket hook files | 620 lines (3 files) | 0 (deleted) |
| useRef workarounds | 22 ref mirrors | 0 |
| Max props per component | 20+ | ~3-5 |
| Files to change for new event | 3-5 | 1 store |
| Total lines | ~1,519 | ~820 |
