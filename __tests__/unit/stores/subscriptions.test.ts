import { initStoreSubscriptions } from '@/stores/subscriptions'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useAudienceStore } from '@/stores/audienceStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useVotingStore } from '@/stores/votingStore'
import type { SocketManager } from '@/lib/socketManager'
import type { DirectorsReview, Player, Script, GameResults, SpectatorMessage } from '@/lib/types'

// ── Mock SocketManager ─────────────────────────────────────────

type Handler = (...args: unknown[]) => void

function createMockManager() {
  const handlers = new Map<string, Handler[]>()
  let unsubCount = 0

  const manager = {
    on: jest.fn((event: string, handler: Handler) => {
      if (!handlers.has(event)) handlers.set(event, [])
      handlers.get(event)!.push(handler)
      return () => {
        const arr = handlers.get(event)
        if (arr) {
          const idx = arr.indexOf(handler)
          if (idx !== -1) arr.splice(idx, 1)
        }
        unsubCount++
      }
    }),
    emit: jest.fn(),

    // Test helpers
    _simulate(event: string, ...args: unknown[]) {
      const arr = handlers.get(event) ?? []
      for (const h of arr) h(...args)
    },
    _handlers: handlers,
    get _unsubCount() { return unsubCount },
  }

  return manager as unknown as SocketManager & {
    _simulate: (event: string, ...args: unknown[]) => void
    _handlers: Map<string, Handler[]>
    _unsubCount: number
  }
}

// ── Mock callbacks ────────────────────────────────────────────

const mockCallbacks = {
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
  achievementToasts: {
    addAchievement: jest.fn(),
  },
}

// ── Tests ──────────────────────────────────────────────────────

describe('initStoreSubscriptions', () => {
  let manager: ReturnType<typeof createMockManager>
  let cleanup: () => void

  beforeEach(() => {
    // Reset all stores
    useGameStore.getState().reset()
    useScriptStore.getState().reset()
    useConnectionStore.getState().reset()
    useAudienceStore.getState().reset()
    useSelectionStore.getState().reset()
    useVotingStore.getState().reset()
    jest.clearAllMocks()

    manager = createMockManager()
    cleanup = initStoreSubscriptions(manager, mockCallbacks)
  })

  afterEach(() => {
    cleanup()
  })

  // ── Registration ──────────────────────────────────────────

  it('registers handlers for all core events', () => {
    const registeredEvents = [...manager._handlers.keys()]

    const expectedEvents = [
      'game_state_change',
      'players_update',
      'player_joined',
      'player_left',
      'room_created',
      'credit_balance',
      'room_settings_update',
      'insufficient_credits',
      'auto_start_countdown',
      'script_ready',
      'sync_teleprompter',
      'script_generation_progress',
      'script_image_update',
      'plot_twist_injected',
      'available_cards',
      'card_pack_selected',
      'host_disconnected',
      'latency_pong_response',
      'performance_paused',
      'performance_resumed',
      'player_reconnected',
      'player_disconnected',
      'game_error_message',
      'kicked',
      'spectator_message_received',
      'green_room_prompt',
      'plot_twist_started',
      'game_over',
      'directors_review',
      'xp_gained',
      'level_up',
      'achievement_unlocked',
      'new_game_started',
      'latency_ping',
    ]

    for (const event of expectedEvents) {
      expect(registeredEvents).toContain(event)
    }
  })

  // ── Game Store events ─────────────────────────────────────

  it('game_state_change → gameStore.setGameState', () => {
    manager._simulate('game_state_change', 'SELECTION')
    expect(useGameStore.getState().gameState).toBe('SELECTION')
  })

  it('players_update → gameStore.setPlayers', () => {
    const players: Player[] = [
      { id: '1', nickname: 'Alice', role: 'HOST', isHost: true, socketId: 's1' },
    ]
    manager._simulate('players_update', players)
    expect(useGameStore.getState().players).toEqual(players)
  })

  it('player_joined → appends to players', () => {
    const existing: Player = { id: '1', nickname: 'Alice', role: 'HOST', isHost: true, socketId: 's1' }
    useGameStore.getState().setPlayers([existing])

    const newPlayer: Player = { id: '2', nickname: 'Bob', role: 'PLAYER', isHost: false, socketId: 's2' }
    manager._simulate('player_joined', newPlayer)

    const players = useGameStore.getState().players
    expect(players).toHaveLength(2)
    expect(players[1]).toEqual(newPlayer)
  })

  it('player_joined → does not duplicate existing player', () => {
    const existing: Player = { id: '1', nickname: 'Alice', role: 'HOST', isHost: true, socketId: 's1' }
    useGameStore.getState().setPlayers([existing])

    manager._simulate('player_joined', existing)
    expect(useGameStore.getState().players).toHaveLength(1)
  })

  it('player_left → removes player from list', () => {
    const players: Player[] = [
      { id: '1', nickname: 'Alice', role: 'HOST', isHost: true, socketId: 's1' },
      { id: '2', nickname: 'Bob', role: 'PLAYER', isHost: false, socketId: 's2' },
    ]
    useGameStore.getState().setPlayers(players)

    manager._simulate('player_left', '2')
    expect(useGameStore.getState().players).toHaveLength(1)
    expect(useGameStore.getState().players[0].id).toBe('1')
  })

  it('room_created → gameStore.setRoomCode', () => {
    manager._simulate('room_created', 'ABCD')
    expect(useGameStore.getState().roomCode).toBe('ABCD')
  })

  it('credit_balance → gameStore.setCreditBalance', () => {
    const balance = { free: 3, banked: 10, total: 13 }
    manager._simulate('credit_balance', balance)
    expect(useGameStore.getState().creditBalance).toEqual(balance)
  })

  it('room_settings_update → gameStore.setSettings', () => {
    const settings = { isMature: false, gameMode: 'SOLO' as const }
    manager._simulate('room_settings_update', settings)
    expect(useGameStore.getState().settings).toEqual(settings)
  })

  // ── Script Store events ───────────────────────────────────

  it('script_ready → scriptStore.setScript + setImageUrl + setIsGeneratingImage', () => {
    const script: Script = {
      title: 'Test Script',
      synopsis: 'A test',
      lines: [{ speaker: 'Alice', text: 'Hello', mood: 'happy' }],
      imageUrl: 'https://example.com/poster.jpg',
    }
    manager._simulate('script_ready', script)

    const state = useScriptStore.getState()
    expect(state.script).toEqual(script)
    expect(state.imageUrl).toBe('https://example.com/poster.jpg')
    expect(state.isGeneratingImage).toBe(true)
  })

  it('script_ready → sets imageUrl to null when no imageUrl', () => {
    const script: Script = {
      title: 'Test',
      synopsis: 'A test',
      lines: [],
    }
    manager._simulate('script_ready', script)
    expect(useScriptStore.getState().imageUrl).toBeNull()
  })

  it('sync_teleprompter → scriptStore with number payload', () => {
    manager._simulate('sync_teleprompter', 5)

    const state = useScriptStore.getState()
    expect(state.currentLineIndex).toBe(5)
    expect(state.isPlaying).toBe(true)
  })

  it('sync_teleprompter → scriptStore with TeleprompterSyncData payload', () => {
    manager._simulate('sync_teleprompter', { lineIndex: 7, serverTimestamp: Date.now() })

    const state = useScriptStore.getState()
    expect(state.currentLineIndex).toBe(7)
    expect(state.isPlaying).toBe(true)
  })

  it('script_generation_progress → scriptStore progress fields', () => {
    manager._simulate('script_generation_progress', { phase: 'Writing dialogue', percent: 42, title: 'The Big Show' })

    const state = useScriptStore.getState()
    expect(state.generationProgress).toBe(42)
    expect(state.generationPhase).toBe('Writing dialogue')
    expect(state.titlePreview).toBe('The Big Show')
  })

  it('script_generation_progress → does not set titlePreview when title is absent', () => {
    useScriptStore.getState().setTitlePreview('Existing')
    manager._simulate('script_generation_progress', { phase: 'Thinking', percent: 10 })

    expect(useScriptStore.getState().titlePreview).toBe('Existing')
  })

  it('script_image_update → scriptStore.setImageUrl + setIsGeneratingImage(false)', () => {
    useScriptStore.getState().setIsGeneratingImage(true)

    manager._simulate('script_image_update', 'https://example.com/final.jpg')

    const state = useScriptStore.getState()
    expect(state.imageUrl).toBe('https://example.com/final.jpg')
    expect(state.isGeneratingImage).toBe(false)
  })

  it('script_image_update → ignores default-poster URLs', () => {
    useScriptStore.getState().setImageUrl('https://example.com/real.jpg')
    useScriptStore.getState().setIsGeneratingImage(true)

    manager._simulate('script_image_update', 'https://example.com/default-poster.png')

    const state = useScriptStore.getState()
    expect(state.imageUrl).toBe('https://example.com/real.jpg')
    expect(state.isGeneratingImage).toBe(false)
  })

  it('plot_twist_injected → splices new lines into script', () => {
    const script: Script = {
      title: 'Test',
      synopsis: 'Test',
      lines: [
        { speaker: 'A', text: 'Line 0', mood: 'neutral' },
        { speaker: 'B', text: 'Line 1', mood: 'neutral' },
      ],
    }
    useScriptStore.getState().setScript(script)

    const newLines = [{ speaker: 'Narrator', text: 'TWIST!', mood: 'angry' as const }]
    manager._simulate('plot_twist_injected', 1, newLines)

    const lines = useScriptStore.getState().script!.lines
    expect(lines).toHaveLength(3)
    expect(lines[1].text).toBe('TWIST!')
  })

  // ── Selection Store events ────────────────────────────────

  it('available_cards → selectionStore.setAvailableCards', () => {
    const cards = { characters: ['Hero'], settings: ['Castle'], circumstances: ['Rain'] }
    manager._simulate('available_cards', cards)
    expect(useSelectionStore.getState().availableCards).toEqual(cards)
  })

  it('card_pack_selected → selectionStore.setSelectedPackName', () => {
    manager._simulate('card_pack_selected', 'pack-123', 'Comedy Classics')
    expect(useSelectionStore.getState().selectedPackName).toBe('Comedy Classics')
  })

  // ── Connection Store events ───────────────────────────────

  it('host_disconnected → connectionStore.setHostDisconnected(true) + setError + toast', () => {
    manager._simulate('host_disconnected', { message: 'Host left' })
    expect(useConnectionStore.getState().hostDisconnected).toBe(true)
    expect(useConnectionStore.getState().error).toBe('Host left')
    expect(mockCallbacks.toast.error).toHaveBeenCalledWith('Host Disconnected')
  })

  it('latency_pong_response → connectionStore.setLatency', () => {
    manager._simulate('latency_pong_response', { latency: 42 })
    expect(useConnectionStore.getState().latency).toBe(42)
  })

  it('performance_paused → connectionStore.setHostDisconnected(true)', () => {
    manager._simulate('performance_paused', { reason: 'host reconnecting' })
    expect(useConnectionStore.getState().hostDisconnected).toBe(true)
  })

  it('performance_resumed → connectionStore.setHostDisconnected(false)', () => {
    useConnectionStore.getState().setHostDisconnected(true)
    manager._simulate('performance_resumed')
    expect(useConnectionStore.getState().hostDisconnected).toBe(false)
  })

  it('player_reconnected → connectionStore.setHostDisconnected(false) + toast', () => {
    useConnectionStore.getState().setHostDisconnected(true)
    manager._simulate('player_reconnected', { name: 'Alice', socketId: 's1' })
    expect(useConnectionStore.getState().hostDisconnected).toBe(false)
    expect(mockCallbacks.toast.success).toHaveBeenCalledWith('Alice reconnected')
  })

  it('game_error_message → connectionStore.setError + toast', () => {
    manager._simulate('game_error_message', 'Something went wrong')
    expect(useConnectionStore.getState().error).toBe('Something went wrong')
    expect(mockCallbacks.toast.error).toHaveBeenCalledWith('Something went wrong')
  })

  // ── Audience Store events ─────────────────────────────────

  it('spectator_message_received → audienceStore.addMessage', () => {
    const msg: SpectatorMessage = {
      id: 'm1', senderId: 'u1', senderName: 'Fan', text: 'LOL', timestamp: Date.now(), isPreset: false,
    }
    manager._simulate('spectator_message_received', msg)
    expect(useAudienceStore.getState().spectatorMessages).toEqual([msg])
  })

  it('green_room_prompt → audienceStore.setGreenRoomQuestion', () => {
    manager._simulate('green_room_prompt', 'What is your character afraid of?')
    expect(useAudienceStore.getState().greenRoomQuestion).toBe('What is your character afraid of?')
  })

  it('plot_twist_started → audienceStore.setChaosCooldown(true)', () => {
    manager._simulate('plot_twist_started', { id: 't1', options: [], expiresAt: Date.now() + 30000 })
    expect(useAudienceStore.getState().chaosCooldown).toBe(true)
  })

  // ── Voting Store events ───────────────────────────────────

  it('game_over → votingStore.setResults', () => {
    const results: GameResults = {
      winner: { playerId: '1', playerName: 'Alice', votes: 3 },
      allResults: [{ playerId: '1', playerName: 'Alice', votes: 3 }],
    }
    manager._simulate('game_over', results)
    expect(useVotingStore.getState().gameResults).toEqual(results)
  })

  it('directors_review → votingStore.setDirectorsReview', () => {
    const review: DirectorsReview = {
      rating: 4,
      headline: 'A triumph',
      review: 'Very serious about very silly business.',
      bestMoment: 'The final monologue.',
    }

    manager._simulate('directors_review', review)

    expect(useVotingStore.getState().directorsReview).toEqual(review)
  })

  it('xp_gained → votingStore.setXpEvents', () => {
    const events = [{ source: 'game_completed' as const, amount: 100, description: 'Completed a game', timestamp: Date.now() }]
    manager._simulate('xp_gained', { events, totalXP: 100, level: 1, title: 'Rookie' })
    expect(useVotingStore.getState().xpEvents).toEqual(events)
  })

  it('level_up → votingStore.setLevelUpData', () => {
    manager._simulate('level_up', { newLevel: 5, title: 'Comedy Pro' })
    expect(useVotingStore.getState().levelUpData).toEqual({ level: 5, title: 'Comedy Pro' })
  })

  // ── Cross-store: new_game_started ─────────────────────────

  it('new_game_started → resets stores and sets gameState to LOBBY', () => {
    // Set up dirty state across stores
    useGameStore.getState().setGameState('RESULTS')
    useScriptStore.getState().setScript({ title: 'Old', synopsis: '', lines: [] })
    useSelectionStore.getState().setAvailableCards({ characters: ['X'], settings: ['Y'], circumstances: ['Z'] })
    useAudienceStore.getState().addMessage({ id: 'm1', senderId: 'u1', senderName: 'Fan', text: 'Hi', timestamp: 1, isPreset: false })
    useVotingStore.getState().setResults({ allResults: [{ playerId: '1', playerName: 'A', votes: 1 }] })
    useVotingStore.getState().setDirectorsReview({
      rating: 5,
      headline: 'Encore',
      review: 'A grand finale.',
      bestMoment: 'Curtain call.',
    })

    manager._simulate('new_game_started', {})

    expect(useGameStore.getState().gameState).toBe('LOBBY')
    expect(useScriptStore.getState().script).toBeNull()
    expect(useSelectionStore.getState().availableCards).toBeNull()
    expect(useAudienceStore.getState().spectatorMessages).toEqual([])
    expect(useVotingStore.getState().gameResults).toBeNull()
    expect(useVotingStore.getState().directorsReview).toBeNull()
  })

  // ── Latency ping/pong ────────────────────────────────────

  it('latency_ping → emits latency_pong with timestamps', () => {
    const serverTs = 1234567890
    manager._simulate('latency_ping', serverTs)

    expect((manager as unknown as { emit: jest.Mock }).emit).toHaveBeenCalledWith(
      'latency_pong',
      serverTs,
      expect.any(Number),
    )
  })

  // ── Cleanup ───────────────────────────────────────────────

  it('cleanup unsubscribes all handlers', () => {
    const totalRegistered = (manager as unknown as { on: jest.Mock }).on.mock.calls.length

    cleanup()

    // All handlers should be removed
    expect(manager._unsubCount).toBe(totalRegistered)

    // Simulating events after cleanup should not affect stores
    useGameStore.getState().reset()
    manager._simulate('game_state_change', 'RESULTS')
    expect(useGameStore.getState().gameState).toBe('LOBBY')
  })
})
