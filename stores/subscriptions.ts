import type { SocketManager } from '@/lib/socketManager'
import type { TeleprompterSyncData, GameState, Achievement } from '@/lib/types'
import { useGameStore } from './gameStore'
import { useScriptStore } from './scriptStore'
import { useConnectionStore } from './connectionStore'
import { useAudienceStore } from './audienceStore'
import { useSelectionStore } from './selectionStore'
import { useVotingStore } from './votingStore'

/**
 * Toast callbacks for events that need UI notifications.
 * Passed in from the page orchestrator so subscriptions stay pure.
 */
export interface SubscriptionCallbacks {
  toast: {
    success: (m: string) => void
    error: (m: string) => void
    info: (m: string) => void
  }
  achievementToasts: {
    addAchievement: (a: Achievement) => void
  }
}

/**
 * Register all socket event handlers that dispatch to Zustand stores.
 * Returns a cleanup function that unsubscribes everything.
 */
export function initStoreSubscriptions(
  manager: SocketManager,
  callbacks: SubscriptionCallbacks,
): () => void {
  const unsubs: (() => void)[] = []
  let countdownInterval: ReturnType<typeof setInterval> | null = null
  let loadingInterval: ReturnType<typeof setInterval> | null = null
  let loadingTimeout: ReturnType<typeof setTimeout> | null = null

  // ── Game Store ──────────────────────────────────────────────

  unsubs.push(manager.on('game_state_change', (newState: GameState) => {
    const store = useGameStore.getState()
    const prevState = store.gameState

    // Countdown logic: 3-2-1 before performing
    if (newState === 'PERFORMING' && prevState !== 'PERFORMING') {
      store.setCountdown(3)
      let count = 3
      if (countdownInterval) clearInterval(countdownInterval)
      countdownInterval = setInterval(() => {
        count--
        if (count > 0) {
          useGameStore.getState().setCountdown(count)
        } else {
          if (countdownInterval) clearInterval(countdownInterval)
          countdownInterval = null
          useGameStore.getState().setCountdown(null)
          useGameStore.getState().setGameState('PERFORMING')
        }
      }, 800)
    } else {
      store.setGameState(newState)
    }

    // Clear loading state when leaving LOADING
    if (newState !== 'LOADING') {
      if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null }
      if (loadingTimeout) { clearTimeout(loadingTimeout); loadingTimeout = null }
      useScriptStore.getState().setGenerationTimedOut(false)
      useScriptStore.getState().setGenerationProgress(0)
      useScriptStore.getState().setTitlePreview(null)
    }

    // Start loading progress animation when entering LOADING
    if (newState === 'LOADING') {
      const scriptStore = useScriptStore.getState()
      scriptStore.setGenerationTimedOut(false)
      scriptStore.setGenerationProgress(0)
      scriptStore.setTitlePreview(null)
      if (loadingInterval) clearInterval(loadingInterval)
      if (loadingTimeout) clearTimeout(loadingTimeout)
      loadingInterval = setInterval(() => {
        const progress = useScriptStore.getState().generationProgress
        if (progress < 95) {
          useScriptStore.getState().setGenerationProgress(progress + Math.random() * 2 + 0.5)
        }
      }, 500)
      loadingTimeout = setTimeout(() => {
        useScriptStore.getState().setGenerationTimedOut(true)
      }, 90_000)
    }

    // Reset selection state when entering SELECTION
    if (newState === 'SELECTION') {
      useSelectionStore.getState().setHasSubmitted(false)
    }
  }))

  unsubs.push(manager.on('players_update', (players) => {
    useGameStore.getState().setPlayers(players)
  }))

  unsubs.push(manager.on('player_joined', (player) => {
    const current = useGameStore.getState().players
    // Only add if not already present (avoid duplicates)
    if (!current.some(p => p.id === player.id)) {
      useGameStore.getState().setPlayers([...current, player])
    }
    // Toast notification
    const gameState = useGameStore.getState().gameState
    if (gameState === 'LOBBY' && !player.isHost) {
      callbacks.toast.success(`${player.nickname} joined!`)
    }
  }))

  unsubs.push(manager.on('player_left', (playerId) => {
    const current = useGameStore.getState().players
    const player = current.find(p => p.id === playerId)
    if (player && !player.isHost) {
      callbacks.toast.info(`${player.nickname} left the game`)
    }
    useGameStore.getState().setPlayers(current.filter(p => p.id !== playerId))
  }))

  unsubs.push(manager.on('room_created', (code) => {
    useGameStore.getState().setRoomCode(code)
  }))

  unsubs.push(manager.on('credit_balance', (balance) => {
    useGameStore.getState().setCreditBalance(balance)
  }))

  unsubs.push(manager.on('room_settings_update', (settings) => {
    useGameStore.getState().setSettings(settings)
  }))

  unsubs.push(manager.on('insufficient_credits', () => {
    useGameStore.getState().setShowInsufficientCredits(true)
  }))

  unsubs.push(manager.on('auto_start_countdown', (seconds) => {
    useGameStore.getState().setAutoStartCountdown(seconds)
  }))

  // ── Script Store ────────────────────────────────────────────

  unsubs.push(manager.on('script_ready', (script) => {
    const store = useScriptStore.getState()
    store.setScript(script)
    store.setImageUrl(script.imageUrl || null)
    store.setIsGeneratingImage(true)
    // Clear loading animation
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null }

    // Set myCharacter for join players based on their selection
    const gameStore = useGameStore.getState()
    if (gameStore.role !== 'host' && gameStore.myRole !== 'SPECTATOR') {
      const sel = useSelectionStore.getState().selection
      if (sel.character) {
        gameStore.setMyCharacter(sel.character)
      }
    }
  }))

  unsubs.push(manager.on('sync_teleprompter', (data: TeleprompterSyncData | number) => {
    const store = useScriptStore.getState()
    if (typeof data === 'number') {
      store.setCurrentLineIndex(data)
    } else {
      store.setCurrentLineIndex(data.lineIndex)
    }
    store.setIsPlaying(true)
  }))

  unsubs.push(manager.on('script_generation_progress', (data) => {
    const store = useScriptStore.getState()
    store.setGenerationProgress(data.percent)
    store.setGenerationPhase(data.phase)
    if (data.title) {
      store.setTitlePreview(data.title)
    }
    // Clear fake progress animation since we got real progress
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null }
  }))

  unsubs.push(manager.on('script_image_update', (imageUrl) => {
    const store = useScriptStore.getState()
    if (imageUrl && !imageUrl.includes('default-poster')) {
      store.setImageUrl(imageUrl)
    }
    store.setIsGeneratingImage(false)
  }))

  unsubs.push(manager.on('plot_twist_injected', (insertIndex, newLines) => {
    const store = useScriptStore.getState()
    const current = store.script
    if (!current) return
    const lines = [...current.lines]
    lines.splice(insertIndex, 0, ...newLines)
    store.setScript({ ...current, lines })
  }))

  // ── Selection Store ─────────────────────────────────────────

  unsubs.push(manager.on('available_cards', (cards) => {
    useSelectionStore.getState().setAvailableCards(cards)
  }))

  unsubs.push(manager.on('card_pack_selected', (_packId, packName) => {
    useSelectionStore.getState().setSelectedPackName(packName)
  }))

  // ── Connection Store ────────────────────────────────────────

  unsubs.push(manager.on('host_disconnected', (data) => {
    useConnectionStore.getState().setHostDisconnected(true)
    useConnectionStore.getState().setError(data.message)
    callbacks.toast.error('Host Disconnected')
  }))

  unsubs.push(manager.on('latency_pong_response', (data) => {
    useConnectionStore.getState().setLatency(data.latency)
  }))

  unsubs.push(manager.on('performance_paused', () => {
    useConnectionStore.getState().setHostDisconnected(true)
  }))

  unsubs.push(manager.on('performance_resumed', () => {
    useConnectionStore.getState().setHostDisconnected(false)
  }))

  unsubs.push(manager.on('player_reconnected', (data) => {
    useConnectionStore.getState().setHostDisconnected(false)
    callbacks.toast.success(`${data.name} reconnected`)
  }))

  unsubs.push(manager.on('player_disconnected', (data) => {
    callbacks.toast.info(`${data.name} disconnected`)
  }))

  unsubs.push(manager.on('error', (message) => {
    useConnectionStore.getState().setError(message)
    callbacks.toast.error(message)
  }))

  unsubs.push(manager.on('kicked', (data) => {
    callbacks.toast.error(data.reason || 'You were removed from the game')
    window.location.href = '/'
  }))

  // ── Audience Store ──────────────────────────────────────────

  unsubs.push(manager.on('spectator_message_received', (message) => {
    useAudienceStore.getState().addMessage(message)
  }))

  unsubs.push(manager.on('green_room_prompt', (question) => {
    useAudienceStore.getState().setGreenRoomQuestion(question)
  }))

  unsubs.push(manager.on('plot_twist_started', () => {
    useAudienceStore.getState().setChaosCooldown(true)
  }))

  // ── Voting Store ────────────────────────────────────────────

  unsubs.push(manager.on('game_over', (results) => {
    useVotingStore.getState().setResults(results)
  }))

  unsubs.push(manager.on('directors_review', (review) => {
    useVotingStore.getState().setDirectorsReview(review)
  }))

  unsubs.push(manager.on('xp_gained', (data) => {
    useVotingStore.getState().setXpEvents(data.events)
  }))

  unsubs.push(manager.on('level_up', (data) => {
    useVotingStore.getState().setLevelUpData({ level: data.newLevel, title: data.title })
  }))

  // ── Achievements ────────────────────────────────────────────

  unsubs.push(manager.on('achievement_unlocked', (achievement) => {
    callbacks.achievementToasts.addAchievement(achievement)
  }))

  // ── Cross-store: New Game Reset ─────────────────────────────

  unsubs.push(manager.on('new_game_started', () => {
    useGameStore.getState().setGameState('LOBBY')
    useGameStore.getState().setCountdown(null)
    useGameStore.getState().setMyCharacter('')
    useGameStore.getState().setAutoStartCountdown(null)
    useScriptStore.getState().reset()
    useSelectionStore.getState().reset()
    useAudienceStore.getState().reset()
    useVotingStore.getState().reset()
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null }
    if (loadingTimeout) { clearTimeout(loadingTimeout); loadingTimeout = null }
  }))

  // ── Latency ping/pong ──────────────────────────────────────

  unsubs.push(manager.on('latency_ping', (serverTimestamp) => {
    manager.emit('latency_pong', serverTimestamp, Date.now())
  }))

  // ── Cleanup ─────────────────────────────────────────────────

  return () => {
    for (const unsub of unsubs) {
      unsub()
    }
    if (countdownInterval) clearInterval(countdownInterval)
    if (loadingInterval) clearInterval(loadingInterval)
    if (loadingTimeout) clearTimeout(loadingTimeout)
  }
}
