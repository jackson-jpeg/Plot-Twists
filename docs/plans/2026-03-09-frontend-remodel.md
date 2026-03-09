# Frontend Remodel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 3-layer hook stack + dual page orchestrators with Zustand domain stores, a typed socket manager, and a unified GameShell — eliminating prop drilling, stale closures, and host/join duplication.

**Architecture:** Typed SocketManager singleton dispatches events directly to 6 Zustand domain stores. A shared GameShell component replaces duplicated phase routing. host/page.tsx and join/page.tsx become thin entry points owning only role-specific concerns (auth, modals, join form).

**Tech Stack:** Zustand (state), Socket.IO (typed via existing `ServerToClientEvents`/`ClientToServerEvents`), React 19, TypeScript, Jest + ts-jest

---

## Migration Strategy

**Incremental cutover, not big bang.** Each task produces a working app. The old hooks and new stores coexist during migration. We build stores first, then rewire components one phase at a time, then delete old hooks last.

---

### Task 1: Install Zustand

**Files:**
- Modify: `package.json`

**Step 1: Install dependency**

Run: `npm install zustand`

**Step 2: Verify installation**

Run: `npm ls zustand`
Expected: `zustand@5.x.x` (or latest)

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install zustand for state management"
```

---

### Task 2: Create SocketManager singleton

**Files:**
- Create: `lib/socketManager.ts`
- Test: `__tests__/unit/lib/socketManager.test.ts`

**Context:** The current `contexts/SocketContext.tsx` creates a socket via `io(socketUrl, { ...options })` with auth token from Firebase. The socket is typed as `Socket<ServerToClientEvents, ClientToServerEvents>`. The new SocketManager wraps this same creation logic but as a plain TypeScript singleton — no React context needed. Stores will call `socketManager.on()` to subscribe to events and `socketManager.emit()` to send them.

**Key references:**
- `contexts/SocketContext.tsx` — socket creation options (lines 115-129), auth token handling
- `lib/types.ts:441-621` — `ServerToClientEvents`, `ClientToServerEvents` interfaces
- `lib/types.ts:436-438` — `SocketResponse<T>` type

**Step 1: Write the failing test**

```typescript
// __tests__/unit/lib/socketManager.test.ts
import { SocketManager } from '../../../lib/socketManager'

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  id: 'test-socket-id',
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}))

describe('SocketManager', () => {
  let manager: SocketManager

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new SocketManager()
  })

  it('should create a typed socket connection', () => {
    manager.connect('http://localhost:3000')
    const { io } = require('socket.io-client')
    expect(io).toHaveBeenCalledWith('http://localhost:3000', expect.objectContaining({
      reconnection: true,
      transports: ['websocket', 'polling'],
    }))
  })

  it('should register and unregister event handlers', () => {
    manager.connect('http://localhost:3000')
    const handler = jest.fn()
    const unsub = manager.on('game_state_change', handler)
    expect(mockSocket.on).toHaveBeenCalledWith('game_state_change', handler)
    unsub()
    expect(mockSocket.off).toHaveBeenCalledWith('game_state_change', handler)
  })

  it('should emit typed events', () => {
    manager.connect('http://localhost:3000')
    manager.emit('start_game', 'ROOM1')
    expect(mockSocket.emit).toHaveBeenCalledWith('start_game', 'ROOM1')
  })

  it('should expose connection state', () => {
    expect(manager.isConnected).toBe(false)
    manager.connect('http://localhost:3000')
    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      ([event]: [string]) => event === 'connect'
    )?.[1]
    connectHandler?.()
    expect(manager.isConnected).toBe(true)
  })

  it('should disconnect and clean up', () => {
    manager.connect('http://localhost:3000')
    manager.disconnect()
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/unit/lib/socketManager.test.ts -v`
Expected: FAIL — `Cannot find module '../../../lib/socketManager'`

**Step 3: Implement SocketManager**

```typescript
// lib/socketManager.ts
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from './types'
import { logger } from './logger'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export class SocketManager {
  private socket: AppSocket | null = null
  private _isConnected = false
  private _connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected'
  private listeners: Set<() => void> = new Set()

  get isConnected(): boolean {
    return this._isConnected
  }

  get connectionState() {
    return this._connectionState
  }

  get socketId(): string | undefined {
    return this.socket?.id
  }

  connect(url: string, auth?: { token: string }) {
    if (this.socket) return

    this.socket = io(url, {
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 15000,
      reconnectionAttempts: 50,
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
      autoConnect: true,
      withCredentials: false,
      forceNew: false,
      multiplex: true,
      auth: auth?.token ? { token: auth.token } : undefined,
    })

    this.socket.on('connect', () => {
      this._isConnected = true
      this._connectionState = 'connected'
      logger.info('SocketManager: connected', this.socket?.id)
    })

    this.socket.on('disconnect', () => {
      this._isConnected = false
      this._connectionState = 'disconnected'
      logger.info('SocketManager: disconnected')
    })

    this.socket.io.on('reconnect_attempt', () => {
      this._connectionState = 'reconnecting'
    })
  }

  disconnect() {
    if (!this.socket) return
    // Unsubscribe all tracked listeners
    this.listeners.forEach((unsub) => unsub())
    this.listeners.clear()
    this.socket.disconnect()
    this.socket = null
    this._isConnected = false
    this._connectionState = 'disconnected'
  }

  on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ): () => void {
    if (!this.socket) throw new Error('SocketManager: not connected')
    this.socket.on(event, handler as any)
    const unsub = () => {
      this.socket?.off(event, handler as any)
      this.listeners.delete(unsub)
    }
    this.listeners.add(unsub)
    return unsub
  }

  emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) {
    if (!this.socket) throw new Error('SocketManager: not connected')
    this.socket.emit(event, ...args)
  }

  /** Raw socket access — escape hatch for edge cases during migration */
  get raw(): AppSocket | null {
    return this.socket
  }
}

// Singleton instance
export const socketManager = new SocketManager()
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/unit/lib/socketManager.test.ts -v`
Expected: PASS — all 5 tests green

**Step 5: Commit**

```bash
git add lib/socketManager.ts __tests__/unit/lib/socketManager.test.ts
git commit -m "feat: typed SocketManager singleton — foundation for Zustand migration"
```

---

### Task 3: Create gameStore (core game state)

**Files:**
- Create: `stores/gameStore.ts`
- Test: `__tests__/unit/stores/gameStore.test.ts`

**Context:** This is the most critical store — it owns the game state machine, player list, room identity, and role. Currently these live in `useGameSocket.ts` (lines 40-65 for state declarations) and the page orchestrators. The store subscribes to `game_state_change`, `players_update`, `room_created`, `player_joined`, `player_left` via the SocketManager.

**Key references:**
- `hooks/useGameSocket.ts:40-65` — current state declarations
- `lib/types.ts` — `GameState`, `Player`, `PlayerRole`, `RoomSettings` types
- `hooks/useGameSocket.ts:80-150` — socket listener patterns for these events

**Step 1: Write the failing test**

```typescript
// __tests__/unit/stores/gameStore.test.ts
import { useGameStore } from '../../../stores/gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it('should initialize with default state', () => {
    const state = useGameStore.getState()
    expect(state.gameState).toBe('LOBBY')
    expect(state.players).toEqual([])
    expect(state.roomCode).toBe('')
    expect(state.role).toBeNull()
  })

  it('should set role and room code', () => {
    useGameStore.getState().setRole('host')
    useGameStore.getState().setRoomCode('ABCD')
    expect(useGameStore.getState().role).toBe('host')
    expect(useGameStore.getState().roomCode).toBe('ABCD')
  })

  it('should update game state', () => {
    useGameStore.getState().setGameState('SELECTION')
    expect(useGameStore.getState().gameState).toBe('SELECTION')
  })

  it('should update players list', () => {
    const players = [
      { id: 'p1', nickname: 'Alice', isHost: true, socketId: 's1', role: 'PLAYER' as const },
      { id: 'p2', nickname: 'Bob', isHost: false, socketId: 's2', role: 'PLAYER' as const },
    ]
    useGameStore.getState().setPlayers(players as any)
    expect(useGameStore.getState().players).toHaveLength(2)
    expect(useGameStore.getState().players[0].nickname).toBe('Alice')
  })

  it('should reset to defaults', () => {
    useGameStore.getState().setGameState('PERFORMING')
    useGameStore.getState().setRoomCode('ABCD')
    useGameStore.getState().reset()
    expect(useGameStore.getState().gameState).toBe('LOBBY')
    expect(useGameStore.getState().roomCode).toBe('')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/unit/stores/gameStore.test.ts -v`
Expected: FAIL — `Cannot find module '../../../stores/gameStore'`

**Step 3: Implement gameStore**

```typescript
// stores/gameStore.ts
import { create } from 'zustand'
import type { GameState, Player, RoomSettings } from '@/lib/types'

interface GameStoreState {
  // State
  gameState: GameState
  players: Player[]
  roomCode: string
  role: 'host' | 'player' | 'spectator' | null
  settings: RoomSettings | null
  countdown: number | null
  creditBalance: { free: number; banked: number; total: number } | null

  // Actions
  setGameState: (state: GameState) => void
  setPlayers: (players: Player[]) => void
  setRoomCode: (code: string) => void
  setRole: (role: 'host' | 'player' | 'spectator') => void
  setSettings: (settings: RoomSettings) => void
  setCountdown: (n: number | null) => void
  setCreditBalance: (balance: { free: number; banked: number; total: number } | null) => void
  reset: () => void
}

const initialState = {
  gameState: 'LOBBY' as GameState,
  players: [] as Player[],
  roomCode: '',
  role: null as 'host' | 'player' | 'spectator' | null,
  settings: null as RoomSettings | null,
  countdown: null as number | null,
  creditBalance: null as { free: number; banked: number; total: number } | null,
}

export const useGameStore = create<GameStoreState>((set) => ({
  ...initialState,

  setGameState: (gameState) => set({ gameState }),
  setPlayers: (players) => set({ players }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setRole: (role) => set({ role }),
  setSettings: (settings) => set({ settings }),
  setCountdown: (countdown) => set({ countdown }),
  setCreditBalance: (creditBalance) => set({ creditBalance }),
  reset: () => set(initialState),
}))
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/unit/stores/gameStore.test.ts -v`
Expected: PASS — all 5 tests green

**Step 5: Commit**

```bash
git add stores/gameStore.ts __tests__/unit/stores/gameStore.test.ts
git commit -m "feat: gameStore — core game state (gameState, players, role, room)"
```

---

### Task 4: Create scriptStore (teleprompter + generation)

**Files:**
- Create: `stores/scriptStore.ts`
- Test: `__tests__/unit/stores/scriptStore.test.ts`

**Context:** Owns the script object, teleprompter position, play/pause state, image URL, and generation progress. Actions include advanceLine, previousLine, pause, resume, jumpTo — each calls `socketManager.emit()` then optimistically updates local state. Subscribes to `script_ready`, `sync_teleprompter`, `script_generation_progress`, `script_image_update`.

**Key references:**
- `hooks/useGameSocket.ts:50-58` — script-related state (script, currentLineIndex, scriptImageUrl, loadingProgress, loadingPhase, scriptTitlePreview)
- `hooks/useHostSocket.ts:30-40` — isPlaying, scriptGenerationTimedOut, isGeneratingImage
- `hooks/useGameSocket.ts:110-135` — script_ready, sync_teleprompter listeners
- `app/host/components/HostPerforming.tsx:20-44` — the 9 teleprompter callbacks that become store actions

**Step 1: Write the failing test**

```typescript
// __tests__/unit/stores/scriptStore.test.ts
import { useScriptStore } from '../../../stores/scriptStore'

describe('scriptStore', () => {
  beforeEach(() => {
    useScriptStore.getState().reset()
  })

  it('should initialize with default state', () => {
    const state = useScriptStore.getState()
    expect(state.script).toBeNull()
    expect(state.currentLineIndex).toBe(0)
    expect(state.isPlaying).toBe(false)
    expect(state.generationProgress).toBe(0)
  })

  it('should set script and reset line index', () => {
    const script = { title: 'Test', lines: [{ text: 'Hello', speaker: 'A' }] }
    useScriptStore.getState().setScript(script as any)
    expect(useScriptStore.getState().script).toEqual(script)
    expect(useScriptStore.getState().currentLineIndex).toBe(0)
  })

  it('should advance and go back lines', () => {
    const script = { title: 'Test', lines: [{ text: 'L1' }, { text: 'L2' }, { text: 'L3' }] }
    useScriptStore.getState().setScript(script as any)
    useScriptStore.getState().setCurrentLineIndex(1)
    expect(useScriptStore.getState().currentLineIndex).toBe(1)
    useScriptStore.getState().setCurrentLineIndex(0)
    expect(useScriptStore.getState().currentLineIndex).toBe(0)
  })

  it('should toggle play/pause', () => {
    useScriptStore.getState().setIsPlaying(true)
    expect(useScriptStore.getState().isPlaying).toBe(true)
    useScriptStore.getState().setIsPlaying(false)
    expect(useScriptStore.getState().isPlaying).toBe(false)
  })

  it('should track generation progress', () => {
    useScriptStore.getState().setGenerationProgress(50)
    expect(useScriptStore.getState().generationProgress).toBe(50)
  })

  it('should reset to defaults', () => {
    useScriptStore.getState().setIsPlaying(true)
    useScriptStore.getState().setGenerationProgress(80)
    useScriptStore.getState().reset()
    expect(useScriptStore.getState().isPlaying).toBe(false)
    expect(useScriptStore.getState().generationProgress).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/unit/stores/scriptStore.test.ts -v`
Expected: FAIL — `Cannot find module`

**Step 3: Implement scriptStore**

```typescript
// stores/scriptStore.ts
import { create } from 'zustand'
import type { Script } from '@/lib/types'

interface ScriptStoreState {
  script: Script | null
  currentLineIndex: number
  isPlaying: boolean
  imageUrl: string | null
  isGeneratingImage: boolean
  generationProgress: number
  generationPhase: string
  titlePreview: string | null
  generationTimedOut: boolean

  setScript: (script: Script | null) => void
  setCurrentLineIndex: (index: number) => void
  setIsPlaying: (playing: boolean) => void
  setImageUrl: (url: string | null) => void
  setIsGeneratingImage: (generating: boolean) => void
  setGenerationProgress: (progress: number) => void
  setGenerationPhase: (phase: string) => void
  setTitlePreview: (title: string | null) => void
  setGenerationTimedOut: (timedOut: boolean) => void
  reset: () => void
}

const initialState = {
  script: null as Script | null,
  currentLineIndex: 0,
  isPlaying: false,
  imageUrl: null as string | null,
  isGeneratingImage: false,
  generationProgress: 0,
  generationPhase: '',
  titlePreview: null as string | null,
  generationTimedOut: false,
}

export const useScriptStore = create<ScriptStoreState>((set) => ({
  ...initialState,

  setScript: (script) => set({ script, currentLineIndex: 0 }),
  setCurrentLineIndex: (currentLineIndex) => set({ currentLineIndex }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setIsGeneratingImage: (isGeneratingImage) => set({ isGeneratingImage }),
  setGenerationProgress: (generationProgress) => set({ generationProgress }),
  setGenerationPhase: (generationPhase) => set({ generationPhase }),
  setTitlePreview: (titlePreview) => set({ titlePreview }),
  setGenerationTimedOut: (generationTimedOut) => set({ generationTimedOut }),
  reset: () => set(initialState),
}))
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/unit/stores/scriptStore.test.ts -v`
Expected: PASS — all 6 tests green

**Step 5: Commit**

```bash
git add stores/scriptStore.ts __tests__/unit/stores/scriptStore.test.ts
git commit -m "feat: scriptStore — teleprompter state, generation progress"
```

---

### Task 5: Create selectionStore (card selection)

**Files:**
- Create: `stores/selectionStore.ts`
- Test: `__tests__/unit/stores/selectionStore.test.ts`

**Context:** Owns card selection state: available cards, current selection, submission status, selected pack. Currently split across `useGameSocket.ts` (availableCards), `useJoinSocket.ts` (selection, hasSubmitted), and page orchestrators.

**Key references:**
- `hooks/useGameSocket.ts:56-57` — availableCards state
- `app/join/components/JoinSelection.tsx:18-31` — JoinSelectionProps showing selection state shape
- `lib/types.ts` — `CardSelection`, `AvailableCards` types

**Step 1: Write the failing test**

Follow same pattern as Tasks 3-4. Test: init defaults, set availableCards, update selection, toggle hasSubmitted, reset.

**Step 2-4: Implement and verify**

```typescript
// stores/selectionStore.ts
import { create } from 'zustand'
import type { CardSelection, AvailableCards } from '@/lib/types'

interface SelectionStoreState {
  availableCards: AvailableCards | null
  selection: CardSelection
  hasSubmitted: boolean
  isSubmitting: boolean
  selectedPackId: string
  selectedPackName: string | null
  gameSetupMode: 'quick' | 'custom'

  setAvailableCards: (cards: AvailableCards | null) => void
  setSelection: (selection: CardSelection) => void
  setHasSubmitted: (submitted: boolean) => void
  setIsSubmitting: (submitting: boolean) => void
  setSelectedPackId: (id: string) => void
  setSelectedPackName: (name: string | null) => void
  setGameSetupMode: (mode: 'quick' | 'custom') => void
  reset: () => void
}

const initialState = {
  availableCards: null as AvailableCards | null,
  selection: {} as CardSelection,
  hasSubmitted: false,
  isSubmitting: false,
  selectedPackId: '',
  selectedPackName: null as string | null,
  gameSetupMode: 'quick' as 'quick' | 'custom',
}

export const useSelectionStore = create<SelectionStoreState>((set) => ({
  ...initialState,

  setAvailableCards: (availableCards) => set({ availableCards }),
  setSelection: (selection) => set({ selection }),
  setHasSubmitted: (hasSubmitted) => set({ hasSubmitted }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSelectedPackId: (selectedPackId) => set({ selectedPackId }),
  setSelectedPackName: (selectedPackName) => set({ selectedPackName }),
  setGameSetupMode: (gameSetupMode) => set({ gameSetupMode }),
  reset: () => set(initialState),
}))
```

**Step 5: Commit**

```bash
git add stores/selectionStore.ts __tests__/unit/stores/selectionStore.test.ts
git commit -m "feat: selectionStore — card selection, pack choice, submission state"
```

---

### Task 6: Create connectionStore (network state)

**Files:**
- Create: `stores/connectionStore.ts`
- Test: `__tests__/unit/stores/connectionStore.test.ts`

**Context:** Owns connection lifecycle: isConnected, latency, reconnection state, host disconnect status. Currently in `useGameSocket.ts` (networkLatency) and `useJoinSocket.ts` (hostDisconnected).

**Key references:**
- `hooks/useGameSocket.ts:62` — networkLatency state
- `hooks/useJoinSocket.ts:20-25` — hostDisconnected, error states
- `contexts/SocketContext.tsx:14-21` — connectionState, reconnectAttempt

**Step 1-4: Write test, implement, verify**

```typescript
// stores/connectionStore.ts
import { create } from 'zustand'

interface ConnectionStoreState {
  isConnected: boolean
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  reconnectAttempt: number
  latency: number | null
  hostDisconnected: boolean
  error: string | null

  setIsConnected: (connected: boolean) => void
  setConnectionState: (state: ConnectionStoreState['connectionState']) => void
  setReconnectAttempt: (attempt: number) => void
  setLatency: (latency: number | null) => void
  setHostDisconnected: (disconnected: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  isConnected: false,
  connectionState: 'disconnected' as const,
  reconnectAttempt: 0,
  latency: null as number | null,
  hostDisconnected: false,
  error: null as string | null,
}

export const useConnectionStore = create<ConnectionStoreState>((set) => ({
  ...initialState,

  setIsConnected: (isConnected) => set({ isConnected }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  setLatency: (latency) => set({ latency }),
  setHostDisconnected: (hostDisconnected) => set({ hostDisconnected }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
```

**Step 5: Commit**

```bash
git add stores/connectionStore.ts __tests__/unit/stores/connectionStore.test.ts
git commit -m "feat: connectionStore — network state, latency, reconnection"
```

---

### Task 7: Create audienceStore (reactions + chaos)

**Files:**
- Create: `stores/audienceStore.ts`
- Test: `__tests__/unit/stores/audienceStore.test.ts`

**Context:** Owns spectator messages, audience reactions, plot twist state, chaos cooldown. Currently in `useGameSocket.ts` (spectatorMessages, greenRoomQuestion) and `useHostSocket.ts` (chaosCooldown).

**Key references:**
- `hooks/useGameSocket.ts:53-55` — spectatorMessages, greenRoomQuestion
- `hooks/useHostSocket.ts:35-38` — chaosCooldown
- `lib/types.ts` — `SpectatorMessage`, plot twist types

**Step 1-4: Write test, implement, verify** (same pattern as above)

**Step 5: Commit**

```bash
git add stores/audienceStore.ts __tests__/unit/stores/audienceStore.test.ts
git commit -m "feat: audienceStore — spectator messages, reactions, chaos"
```

---

### Task 8: Create votingStore (results + progression)

**Files:**
- Create: `stores/votingStore.ts`
- Test: `__tests__/unit/stores/votingStore.test.ts`

**Context:** Owns game results, vote state, winner, standings, XP events, level-up data. Currently in `useGameSocket.ts` (gameResults, xpEvents, levelUpData).

**Key references:**
- `hooks/useGameSocket.ts:58-62` — gameResults, xpEvents, levelUpData
- `lib/types.ts` — `GameResults`, `XPEvent` types
- `app/host/components/HostResults.tsx:24-36` — result-related props

**Step 1-4: Write test, implement, verify** (same pattern)

**Step 5: Commit**

```bash
git add stores/votingStore.ts __tests__/unit/stores/votingStore.test.ts
git commit -m "feat: votingStore — results, standings, XP, level-up"
```

---

### Task 9: Create store event subscriptions

**Files:**
- Create: `stores/subscriptions.ts`
- Test: `__tests__/unit/stores/subscriptions.test.ts`

**Context:** This is the wiring layer. A single function `initStoreSubscriptions(socketManager)` registers all socket event handlers that dispatch to stores. This replaces the 30+ `socket.on()` calls currently in `useGameSocket.ts:80-200`. Each handler simply calls the appropriate store's `set()` method.

**Key references:**
- `hooks/useGameSocket.ts:80-200` — all socket.on() calls to replicate
- `hooks/useHostSocket.ts:50-100` — host-specific listeners
- `hooks/useJoinSocket.ts:50-130` — join-specific listeners

**Step 1: Write the failing test**

```typescript
// __tests__/unit/stores/subscriptions.test.ts
import { initStoreSubscriptions } from '../../../stores/subscriptions'
import { useGameStore } from '../../../stores/gameStore'
import { useScriptStore } from '../../../stores/scriptStore'

describe('initStoreSubscriptions', () => {
  const handlers = new Map<string, Function>()
  const mockManager = {
    on: jest.fn((event: string, handler: Function) => {
      handlers.set(event, handler)
      return () => handlers.delete(event)
    }),
    isConnected: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    handlers.clear()
    useGameStore.getState().reset()
    useScriptStore.getState().reset()
  })

  it('should register handlers for core game events', () => {
    initStoreSubscriptions(mockManager as any)
    expect(mockManager.on).toHaveBeenCalledWith('game_state_change', expect.any(Function))
    expect(mockManager.on).toHaveBeenCalledWith('players_update', expect.any(Function))
    expect(mockManager.on).toHaveBeenCalledWith('script_ready', expect.any(Function))
  })

  it('should dispatch game_state_change to gameStore', () => {
    initStoreSubscriptions(mockManager as any)
    handlers.get('game_state_change')?.('PERFORMING')
    expect(useGameStore.getState().gameState).toBe('PERFORMING')
  })

  it('should dispatch script_ready to scriptStore', () => {
    initStoreSubscriptions(mockManager as any)
    const script = { title: 'Test Script', lines: [] }
    handlers.get('script_ready')?.({ script })
    expect(useScriptStore.getState().script).toEqual(script)
  })

  it('should return a cleanup function', () => {
    const cleanup = initStoreSubscriptions(mockManager as any)
    expect(typeof cleanup).toBe('function')
    cleanup()
    // All handlers should be removed
    expect(handlers.size).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/unit/stores/subscriptions.test.ts -v`
Expected: FAIL

**Step 3: Implement subscriptions**

```typescript
// stores/subscriptions.ts
import type { SocketManager } from '@/lib/socketManager'
import { useGameStore } from './gameStore'
import { useScriptStore } from './scriptStore'
import { useSelectionStore } from './selectionStore'
import { useConnectionStore } from './connectionStore'
import { useAudienceStore } from './audienceStore'
import { useVotingStore } from './votingStore'

export function initStoreSubscriptions(manager: SocketManager): () => void {
  const unsubs: (() => void)[] = []

  // --- Game Store ---
  unsubs.push(manager.on('game_state_change', (newState) => {
    useGameStore.getState().setGameState(newState)
  }))
  unsubs.push(manager.on('players_update', (players) => {
    useGameStore.getState().setPlayers(players)
  }))
  unsubs.push(manager.on('player_joined', (player) => {
    const current = useGameStore.getState().players
    useGameStore.getState().setPlayers([...current, player])
  }))
  unsubs.push(manager.on('player_left', (playerId) => {
    const current = useGameStore.getState().players
    useGameStore.getState().setPlayers(current.filter(p => p.id !== playerId))
  }))
  unsubs.push(manager.on('credit_balance', (balance) => {
    useGameStore.getState().setCreditBalance(balance)
  }))

  // --- Script Store ---
  unsubs.push(manager.on('script_ready', ({ script }) => {
    useScriptStore.getState().setScript(script)
  }))
  unsubs.push(manager.on('sync_teleprompter', ({ lineIndex, isPlaying }) => {
    useScriptStore.getState().setCurrentLineIndex(lineIndex)
    useScriptStore.getState().setIsPlaying(isPlaying)
  }))
  unsubs.push(manager.on('script_generation_progress', ({ progress, phase, titlePreview }) => {
    useScriptStore.getState().setGenerationProgress(progress)
    if (phase) useScriptStore.getState().setGenerationPhase(phase)
    if (titlePreview) useScriptStore.getState().setTitlePreview(titlePreview)
  }))
  unsubs.push(manager.on('script_image_update', ({ imageUrl, isGenerating }) => {
    useScriptStore.getState().setImageUrl(imageUrl)
    useScriptStore.getState().setIsGeneratingImage(isGenerating ?? false)
  }))

  // --- Selection Store ---
  unsubs.push(manager.on('available_cards', (cards) => {
    useSelectionStore.getState().setAvailableCards(cards)
  }))
  unsubs.push(manager.on('card_pack_selected', ({ packName }) => {
    useSelectionStore.getState().setSelectedPackName(packName)
  }))

  // --- Connection Store ---
  unsubs.push(manager.on('host_disconnected', () => {
    useConnectionStore.getState().setHostDisconnected(true)
  }))
  unsubs.push(manager.on('latency_pong', ({ serverTime }) => {
    const latency = Date.now() - serverTime
    useConnectionStore.getState().setLatency(latency)
  }))

  // --- Audience Store ---
  unsubs.push(manager.on('spectator_message', (message) => {
    useAudienceStore.getState().addMessage(message)
  }))
  unsubs.push(manager.on('green_room_prompt', ({ question }) => {
    useAudienceStore.getState().setGreenRoomQuestion(question)
  }))

  // --- Voting Store ---
  unsubs.push(manager.on('game_over', (results) => {
    useVotingStore.getState().setResults(results)
  }))
  unsubs.push(manager.on('new_game_started', () => {
    // Reset all stores for new game
    useScriptStore.getState().reset()
    useSelectionStore.getState().reset()
    useAudienceStore.getState().reset()
    useVotingStore.getState().reset()
    useGameStore.getState().setGameState('LOBBY')
  }))

  // Return cleanup
  return () => unsubs.forEach((unsub) => unsub())
}
```

**Note:** The exact event payload shapes will need to match what the server actually sends. Cross-reference with `hooks/useGameSocket.ts` socket.on handlers during implementation. Some events may have slightly different payload structures — verify each one.

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/unit/stores/subscriptions.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add stores/subscriptions.ts __tests__/unit/stores/subscriptions.test.ts
git commit -m "feat: store subscriptions — wire socket events to Zustand stores"
```

---

### Task 10: Create GameShell component

**Files:**
- Create: `app/game/GameShell.tsx`

**Context:** This replaces the duplicated phase routing from both `host/page.tsx` and `join/page.tsx`. It reads `gameState` and `role` from `useGameStore`, routes to the correct phase component, and manages shared concerns (confetti, wake lock, audio). Phase components are dynamically imported as they are today.

**Key references:**
- `app/host/page.tsx:350-515` — host phase routing (switch on gameState)
- `app/join/page.tsx:250-384` — join phase routing (switch on gameState)
- `hooks/useConfetti.ts` — confetti hook interface
- `hooks/useWakeLock.ts` — wake lock hook interface
- `hooks/useAudioPlayer.ts` — audio player hook interface

**Step 1: Create the GameShell component**

Build incrementally — start with just the phase routing:

```typescript
// app/game/GameShell.tsx
'use client'

import dynamic from 'next/dynamic'
import { useGameStore } from '@/stores/gameStore'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

// Dynamic imports for code splitting — same as current pages
const HostLobby = dynamic(() => import('@/app/host/components/HostLobby').then(m => ({ default: m.HostLobby })))
const HostSelection = dynamic(() => import('@/app/host/components/HostSelection').then(m => ({ default: m.HostSelection })))
const HostLoading = dynamic(() => import('@/app/host/components/HostLoading').then(m => ({ default: m.HostLoading })))
const HostPerforming = dynamic(() => import('@/app/host/components/HostPerforming').then(m => ({ default: m.HostPerforming })))
const HostVoting = dynamic(() => import('@/app/host/components/HostVoting').then(m => ({ default: m.HostVoting })))
const HostResults = dynamic(() => import('@/app/host/components/HostResults').then(m => ({ default: m.HostResults })))
const JoinLobby = dynamic(() => import('@/app/join/components/JoinLobby').then(m => ({ default: m.JoinLobby })))
const JoinSelection = dynamic(() => import('@/app/join/components/JoinSelection').then(m => ({ default: m.JoinSelection })))
const JoinLoading = dynamic(() => import('@/app/join/components/JoinLoading').then(m => ({ default: m.JoinLoading })))
const JoinPerforming = dynamic(() => import('@/app/join/components/JoinPerforming').then(m => ({ default: m.JoinPerforming })))
const JoinVoting = dynamic(() => import('@/app/join/components/JoinVoting').then(m => ({ default: m.JoinVoting })))
const JoinResults = dynamic(() => import('@/app/join/components/JoinResults').then(m => ({ default: m.JoinResults })))

interface GameShellProps {
  role: 'host' | 'player' | 'spectator'
}

export function GameShell({ role }: GameShellProps) {
  const gameState = useGameStore((s) => s.gameState)

  // Shared lifecycle hooks
  useWakeLock()
  const { triggerConfetti } = useConfetti()

  // Phase routing — host and join render different components per phase
  // During migration, components still receive props.
  // After store migration (Tasks 11-14), props will be removed.

  const isHost = role === 'host'

  switch (gameState) {
    case 'LOBBY':
      return isHost ? <HostLobby /> : <JoinLobby />
    case 'SELECTION':
      return isHost ? <HostSelection /> : <JoinSelection />
    case 'LOADING':
      return isHost ? <HostLoading /> : <JoinLoading />
    case 'PERFORMING':
      return isHost ? <HostPerforming /> : <JoinPerforming />
    case 'VOTING':
      return isHost ? <HostVoting /> : <JoinVoting />
    case 'RESULTS':
      return isHost ? <HostResults /> : <JoinResults />
    default:
      return null
  }
}
```

**Important:** This initial version will NOT compile because components still expect their full prop interfaces. That's expected — Tasks 11-14 will migrate components to read from stores. During migration, the old pages continue working.

**Step 2: Commit the shell (WIP — not yet wired)**

```bash
git add app/game/GameShell.tsx
git commit -m "feat: GameShell component — unified phase routing (WIP, props TBD)"
```

---

### Task 11: Migrate HostPerforming to use stores

**Files:**
- Modify: `app/host/components/HostPerforming.tsx`

**Context:** This is the worst offender — 24 props. After migration it should have ~3 props (roomCode, onShowPosterLightbox, and toast). All game state reads from stores. All teleprompter actions become store method calls.

**Key references:**
- `app/host/components/HostPerforming.tsx:20-44` — current 24-prop interface
- `stores/scriptStore.ts` — script, currentLineIndex, isPlaying
- `stores/audienceStore.ts` — spectatorMessages, chaosCooldown
- Component analysis from research: 12 state props move to store, 8 callbacks become store actions, 3 stay as props

**Step 1: Update props interface**

Replace the 24-prop interface with a minimal one. The component reads from stores internally:

```typescript
// New minimal props — only things that can't come from stores
export interface HostPerformingProps {
  roomCode: string
  onShowPosterLightbox: () => void
}
```

**Step 2: Replace prop reads with store selectors inside the component**

```typescript
// Inside the component, replace prop destructuring with:
const script = useScriptStore((s) => s.script)
const currentLineIndex = useScriptStore((s) => s.currentLineIndex)
const isPlaying = useScriptStore((s) => s.isPlaying)
const scriptImageUrl = useScriptStore((s) => s.imageUrl)
const isGeneratingImage = useScriptStore((s) => s.isGeneratingImage)
const spectatorMessages = useAudienceStore((s) => s.spectatorMessages)
const chaosCooldown = useAudienceStore((s) => s.chaosCooldown)
const networkLatency = useConnectionStore((s) => s.latency)
```

**Step 3: Replace callback props with store actions**

```typescript
// Replace onNextLine, onPreviousLine, etc. with direct store calls:
const { setCurrentLineIndex, setIsPlaying } = useScriptStore.getState()

// In event handlers:
const handleNextLine = () => {
  socketManager.emit('advance_script_line', roomCode)
  setCurrentLineIndex(currentLineIndex + 1)
}
```

**Step 4: Verify component renders** (manual test — run dev server)

Run: `npm run dev`
Verify: Navigate to host page, component renders without errors

**Step 5: Commit**

```bash
git add app/host/components/HostPerforming.tsx
git commit -m "refactor: HostPerforming reads from stores — 24 props → 2"
```

---

### Task 12: Migrate remaining host components to stores

**Files:**
- Modify: `app/host/components/HostLobby.tsx`
- Modify: `app/host/components/HostSelection.tsx`
- Modify: `app/host/components/HostLoading.tsx`
- Modify: `app/host/components/HostVoting.tsx`
- Modify: `app/host/components/HostResults.tsx`

**Context:** Same pattern as Task 11. Each component gets its props interface reduced. Game state comes from stores. Socket operations use socketManager.emit(). Do one component at a time and verify dev server renders correctly after each.

**Key references:**
- Component prop analysis from research agent
- Each store's state shape from Tasks 3-8
- Existing prop interfaces in each component file

**Step 1-5: Migrate HostLobby**

Replace props interface. Game state (players, settings, creditBalance, selectedPackId, scriptCustomization, audioSettings) from stores. Keep: roomCode, joinUrl, toast, socket (for direct emit during migration), onShowOnboarding, onNavigateHome.

**Step 6-10: Migrate HostSelection, HostLoading, HostVoting, HostResults**

Same pattern — one at a time, verify after each.

**Step 11: Commit**

```bash
git add app/host/components/
git commit -m "refactor: all host components read from stores — props minimized"
```

---

### Task 13: Migrate join components to stores

**Files:**
- Modify: `app/join/components/JoinSelection.tsx`
- Modify: `app/join/components/JoinLobby.tsx`
- Modify: `app/join/components/JoinLoading.tsx`
- Modify: `app/join/components/JoinPerforming.tsx`
- Modify: `app/join/components/JoinVoting.tsx`
- Modify: `app/join/components/JoinResults.tsx`

**Context:** Same pattern as Tasks 11-12, but for join components. Note: JoinSelection has the `setSelection` anti-pattern — replace with `useSelectionStore.getState().setSelection()`.

**Key references:**
- Component prop analysis from research agent
- `app/join/components/JoinSelection.tsx:18-31` — the setSelection anti-pattern to fix

**Steps:** One component at a time, verify after each, commit when all pass.

```bash
git add app/join/components/
git commit -m "refactor: all join components read from stores — props minimized"
```

---

### Task 14: Wire GameShell and simplify page orchestrators

**Files:**
- Modify: `app/game/GameShell.tsx` — finalize with real component rendering (no props or minimal props)
- Modify: `app/host/page.tsx` — simplify to ~120 lines
- Modify: `app/join/page.tsx` — simplify to ~100 lines

**Context:** Now that all phase components read from stores, GameShell can render them without prop threading. The page orchestrators drop to entry points: auth, room creation/joining, modals, and `<GameShell role="..." />`.

**Key references:**
- The "After" pseudocode from the Paper canvas (Artboard 4)
- `app/host/page.tsx` — identify what stays (auth, room creation, modals) vs what moves
- `app/join/page.tsx` — identify what stays (join form, URL params) vs what moves

**Step 1: Finalize GameShell**

Update to pass only minimal remaining props to phase components. Add confetti triggers on game state transitions. Add audio player. Move countdown logic from pages.

**Step 2: Simplify host/page.tsx**

Remove: all 22 game states from useHostSocket, phase routing switch, prop threading to components.
Keep: auth gate, room creation, 4 modal states, renders `<GameShell role="host" />`.

**Step 3: Simplify join/page.tsx**

Remove: game states from useJoinSocket, phase routing, prop threading.
Keep: URL param parsing, JoinForm pre-game UI, onboarding, renders `<GameShell role="player" />`.

**Step 4: Initialize stores in pages**

Both pages need to init the socket manager and store subscriptions on mount:

```typescript
useEffect(() => {
  socketManager.connect(wsUrl, { token })
  const cleanup = initStoreSubscriptions(socketManager)
  return () => { cleanup(); socketManager.disconnect() }
}, [token])
```

**Step 5: Verify full game flow**

Run: `npm run dev`
Test: Create room as host → join as player → select cards → generate script → perform → vote → results → new game. Every phase transition should work.

**Step 6: Commit**

```bash
git add app/game/GameShell.tsx app/host/page.tsx app/join/page.tsx
git commit -m "feat: GameShell wired, page orchestrators simplified"
```

---

### Task 15: Delete old hook files

**Files:**
- Delete: `hooks/useGameSocket.ts`
- Delete: `hooks/useHostSocket.ts`
- Delete: `hooks/useJoinSocket.ts`
- Delete: `contexts/SocketContext.tsx`

**Context:** All socket state management is now in stores + socketManager. These files are no longer imported anywhere. Verify with grep before deleting.

**Step 1: Verify nothing imports old hooks**

Run: `grep -r "useGameSocket\|useHostSocket\|useJoinSocket\|SocketContext" --include="*.ts" --include="*.tsx" app/ hooks/ contexts/ components/ lib/ -l`

Expected: No files should import these (or only the files we're about to delete).

**Step 2: Delete**

```bash
rm hooks/useGameSocket.ts hooks/useHostSocket.ts hooks/useJoinSocket.ts contexts/SocketContext.tsx
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build, no missing module errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: delete old socket hooks + context — fully replaced by stores"
```

---

### Task 16: Run full test suite + manual verification

**Files:** None (verification only)

**Step 1: Run unit tests**

Run: `npm run test`
Expected: All existing tests pass. New store tests pass.

**Step 2: Run build**

Run: `npm run build`
Expected: Clean build, no TypeScript errors.

**Step 3: Manual smoke test**

Run: `npm run dev`
Test the full game loop:
1. Open host page → room created, QR code visible
2. Open join page → enter room code, join
3. Host starts game → card selection
4. Both submit cards → loading/script generation
5. Script ready → performing (teleprompter works, advance lines)
6. End performance → voting
7. Submit votes → results
8. New game → back to lobby

**Step 4: Final commit**

```bash
git commit --allow-empty -m "chore: frontend remodel complete — verified full game loop"
```

---

## Summary

| Task | What | New Files | Est. Lines |
|------|------|-----------|------------|
| 1 | Install Zustand | — | 0 |
| 2 | SocketManager | socketManager.ts + test | ~120 |
| 3 | gameStore | gameStore.ts + test | ~80 |
| 4 | scriptStore | scriptStore.ts + test | ~80 |
| 5 | selectionStore | selectionStore.ts + test | ~70 |
| 6 | connectionStore | connectionStore.ts + test | ~60 |
| 7 | audienceStore | audienceStore.ts + test | ~70 |
| 8 | votingStore | votingStore.ts + test | ~70 |
| 9 | Store subscriptions | subscriptions.ts + test | ~120 |
| 10 | GameShell (WIP) | GameShell.tsx | ~80 |
| 11 | Migrate HostPerforming | — (modify) | net -100 |
| 12 | Migrate host components | — (modify) | net -200 |
| 13 | Migrate join components | — (modify) | net -150 |
| 14 | Wire GameShell + simplify pages | — (modify) | net -500 |
| 15 | Delete old hooks | — (delete) | -690 |
| 16 | Verify | — | 0 |
