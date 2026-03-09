import type { SocketManager } from '@/lib/socketManager'
import type { TeleprompterSyncData } from '@/lib/types'
import { useGameStore } from './gameStore'
import { useScriptStore } from './scriptStore'
import { useConnectionStore } from './connectionStore'
import { useAudienceStore } from './audienceStore'
import { useSelectionStore } from './selectionStore'
import { useVotingStore } from './votingStore'

/**
 * Register all socket event handlers that dispatch to Zustand stores.
 * Returns a cleanup function that unsubscribes everything.
 */
export function initStoreSubscriptions(manager: SocketManager): () => void {
  const unsubs: (() => void)[] = []

  // ── Game Store ──────────────────────────────────────────────

  unsubs.push(manager.on('game_state_change', (newState) => {
    useGameStore.getState().setGameState(newState)
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
  }))

  unsubs.push(manager.on('player_left', (playerId) => {
    const current = useGameStore.getState().players
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

  // ── Script Store ────────────────────────────────────────────

  unsubs.push(manager.on('script_ready', (script) => {
    const store = useScriptStore.getState()
    store.setScript(script)
    store.setImageUrl(script.imageUrl || null)
    store.setIsGeneratingImage(true)
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

  unsubs.push(manager.on('host_disconnected', () => {
    useConnectionStore.getState().setHostDisconnected(true)
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

  unsubs.push(manager.on('player_reconnected', () => {
    useConnectionStore.getState().setHostDisconnected(false)
  }))

  unsubs.push(manager.on('error', (message) => {
    useConnectionStore.getState().setError(message)
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

  unsubs.push(manager.on('xp_gained', (data) => {
    useVotingStore.getState().setXpEvents(data.events)
  }))

  unsubs.push(manager.on('level_up', (data) => {
    useVotingStore.getState().setLevelUpData({ level: data.newLevel, title: data.title })
  }))

  // ── Cross-store: New Game Reset ─────────────────────────────

  unsubs.push(manager.on('new_game_started', () => {
    useGameStore.getState().setGameState('LOBBY')
    useScriptStore.getState().reset()
    useSelectionStore.getState().reset()
    useAudienceStore.getState().reset()
    useVotingStore.getState().reset()
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
  }
}
