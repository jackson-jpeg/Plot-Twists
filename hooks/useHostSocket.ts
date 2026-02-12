'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import type {
  Player, Script, ScriptLine, GameState, GameResults, RoomSettings,
  TeleprompterSyncData, AvailableCards, Achievement, SpectatorMessage,
  CardSelection,
} from '@/lib/types'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface UseHostSocketOptions {
  socket: AppSocket | null
  isConnected: boolean
  settings: RoomSettings
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  achievementToasts: { addAchievement: (a: Achievement) => void }
}

export function useHostSocket({
  socket, isConnected, settings, toast, achievementToasts,
}: UseHostSocketOptions) {
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [players, setPlayers] = useState<Player[]>([])
  const [script, setScript] = useState<Script | null>(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [greenRoomQuestion, setGreenRoomQuestion] = useState('')
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [availableCards, setAvailableCards] = useState<AvailableCards>({ characters: [], settings: [], circumstances: [] })
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [scriptGenerationTimedOut, setScriptGenerationTimedOut] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [scriptTitlePreview, setScriptTitlePreview] = useState<string | null>(null)
  const [scriptImageUrl, setScriptImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [chaosCooldown, setChaosCooldown] = useState(false)
  const [creditBalance, setCreditBalance] = useState<{ free: number; banked: number; total: number } | null>(null)
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false)
  const [spectatorMessages, setSpectatorMessages] = useState<SpectatorMessage[]>([])

  // Solo card selection state
  const [selection, setSelection] = useState<CardSelection>({ character: '', setting: '', circumstance: '' })
  const [customInputActive, setCustomInputActive] = useState({ character: false, setting: false, circumstance: false })
  const [hasSubmittedSelection, setHasSubmittedSelection] = useState(false)

  const scriptGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Use refs to track state inside listeners without re-subscribing
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState
  const playersRef = useRef(players)
  playersRef.current = players

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    socket.on('players_update', setPlayers)
    socket.on('player_joined', (player: Player) => {
      if (gameStateRef.current === 'LOBBY' && !player.isHost) {
        toast.success(`${player.nickname} joined the show!`)
      }
    })

    socket.on('game_state_change', (newState: GameState) => {
      setGameState(newState)
      if (newState === 'SELECTION') {
        setHasSubmittedSelection(false)
      }
      if (newState !== 'LOADING') {
        if (scriptGenerationTimeoutRef.current) {
          clearTimeout(scriptGenerationTimeoutRef.current)
          scriptGenerationTimeoutRef.current = null
        }
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current)
          loadingIntervalRef.current = null
        }
        setScriptGenerationTimedOut(false)
        setLoadingProgress(0)
        setLoadingPhase('')
        setScriptTitlePreview(null)
      }
      if (newState === 'LOADING') {
        setScriptGenerationTimedOut(false)
        setLoadingProgress(0)
        setLoadingPhase('')
        setScriptTitlePreview(null)
        loadingIntervalRef.current = setInterval(() => {
          setLoadingProgress(prev => (prev >= 15 ? prev : prev + Math.random() * 3 + 1))
        }, 2000)
        scriptGenerationTimeoutRef.current = setTimeout(() => {
          setScriptGenerationTimedOut(true)
        }, 90000)
      }
    })

    socket.on('script_generation_progress', (data) => {
      setLoadingProgress(data.percent)
      setLoadingPhase(data.phase)
      if (data.title) setScriptTitlePreview(data.title)
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
    })

    socket.on('green_room_prompt', setGreenRoomQuestion)
    socket.on('script_ready', (newScript) => {
      setScript(newScript)
      setCurrentLineIndex(0)
      setScriptImageUrl(newScript.imageUrl || null)
      setIsGeneratingImage(true)
    })
    socket.on('script_image_update', (imageUrl) => {
      setIsGeneratingImage(false)
      if (imageUrl && !imageUrl.includes('default-poster')) {
        setScriptImageUrl(imageUrl)
      }
    })
    socket.on('available_cards', setAvailableCards)
    socket.on('sync_teleprompter', (data: TeleprompterSyncData | number) => {
      setCurrentLineIndex(typeof data === 'number' ? data : data.lineIndex)
    })
    socket.on('game_over', setGameResults)
    socket.on('new_game_started', () => {
      setGameState('LOBBY')
      setScript(null)
      setScriptImageUrl(null)
      setIsGeneratingImage(false)
      setCurrentLineIndex(0)
      setGameResults(null)
      setIsPlaying(true)
      setSelection({ character: '', setting: '', circumstance: '' })
      setCustomInputActive({ character: false, setting: false, circumstance: false })
      setHasSubmittedSelection(false)
    })
    socket.on('latency_ping', (ts: number) => socket.emit('latency_pong', ts, Date.now()))
    socket.on('latency_pong_response', (d) => setNetworkLatency(d.latency))
    socket.on('plot_twist_started', () => setChaosCooldown(true))
    socket.on('credit_balance', setCreditBalance)
    socket.on('insufficient_credits', () => setShowInsufficientCredits(true))
    socket.on('achievement_unlocked', (a: Achievement) => achievementToasts.addAchievement(a))
    socket.on('spectator_message_received', (msg: SpectatorMessage) => {
      setSpectatorMessages(prev => [...prev.slice(-49), msg])
    })
    socket.on('error', (errorMsg: string) => toast.error(errorMsg))
    socket.on('player_left', (playerId: string) => {
      const player = playersRef.current.find(p => p.id === playerId)
      if (player && !player.isHost) {
        toast.info(`${player.nickname} left the game`)
      }
    })
    socket.on('plot_twist_injected', (insertIndex: number, newLines: ScriptLine[]) => {
      setScript(prev => {
        if (!prev) return prev
        const lines = [...prev.lines]
        lines.splice(insertIndex, 0, ...newLines)
        return { ...prev, lines }
      })
    })

    return () => {
      socket.off('players_update'); socket.off('player_joined')
      socket.off('game_state_change'); socket.off('green_room_prompt')
      socket.off('script_ready'); socket.off('script_image_update')
      socket.off('sync_teleprompter'); socket.off('game_over')
      socket.off('available_cards'); socket.off('new_game_started')
      socket.off('script_generation_progress')
      socket.off('latency_ping'); socket.off('latency_pong_response')
      socket.off('plot_twist_started'); socket.off('credit_balance')
      socket.off('insufficient_credits')
      socket.off('achievement_unlocked')
      socket.off('spectator_message_received'); socket.off('error')
      socket.off('player_left'); socket.off('plot_twist_injected')
      if (scriptGenerationTimeoutRef.current) {
        clearTimeout(scriptGenerationTimeoutRef.current)
        scriptGenerationTimeoutRef.current = null
      }
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected])

  return {
    gameState, setGameState,
    players, setPlayers,
    script, setScript,
    currentLineIndex, setCurrentLineIndex,
    isPlaying, setIsPlaying,
    greenRoomQuestion,
    gameResults, setGameResults,
    availableCards,
    networkLatency,
    scriptGenerationTimedOut, setScriptGenerationTimedOut,
    loadingProgress, setLoadingProgress,
    loadingPhase,
    scriptTitlePreview,
    scriptImageUrl, setScriptImageUrl,
    isGeneratingImage,
    chaosCooldown, setChaosCooldown,
    creditBalance, setCreditBalance,
    showInsufficientCredits, setShowInsufficientCredits,
    spectatorMessages,
    selection, setSelection,
    customInputActive, setCustomInputActive,
    hasSubmittedSelection, setHasSubmittedSelection,
    scriptGenerationTimeoutRef,
    loadingIntervalRef,
  }
}
