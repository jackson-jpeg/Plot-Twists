'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import type {
  Player, Script, ScriptLine, GameState, GameResults, RoomSettings,
  TeleprompterSyncData, AvailableCards, Achievement, SpectatorMessage,
  CardSelection, XPEvent, LevelReward,
} from '@/lib/types'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface UseHostSocketOptions {
  socket: AppSocket | null
  isConnected: boolean
  settings: RoomSettings
  roomCode: string
  playerId: string
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  achievementToasts: { addAchievement: (a: Achievement) => void }
}

export function useHostSocket({
  socket, isConnected, settings, roomCode, playerId, toast, achievementToasts,
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
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([])
  const [levelUpData, setLevelUpData] = useState<{ level: number; title: string; reward?: LevelReward } | null>(null)

  // Solo card selection state
  const [selection, setSelection] = useState<CardSelection>({ character: '', setting: '', circumstance: '' })

  const [hasSubmittedSelection, setHasSubmittedSelection] = useState(false)

  const scriptGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Use refs to track state inside listeners without re-subscribing
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState
  const playersRef = useRef(players)
  playersRef.current = players
  const roomCodeRef = useRef(roomCode)
  roomCodeRef.current = roomCode
  const playerIdRef = useRef(playerId)
  playerIdRef.current = playerId

  // Resync on reconnect
  useEffect(() => {
    if (!socket || !isConnected) return
    const code = roomCodeRef.current
    const pid = playerIdRef.current
    if (!code || !pid) return
    // Only resync if we were past LOBBY (i.e. had a game in progress)
    if (gameStateRef.current === 'LOBBY') return

    socket.emit('request_resync', code, pid, (response) => {
      if (response.success) {
        if (response.gameState) setGameState(response.gameState as GameState)
        if (response.players) setPlayers(response.players)
        if (response.script) {
          setScript(response.script)
          setScriptImageUrl(response.script.imageUrl || null)
        }
        if (response.currentLineIndex !== undefined) setCurrentLineIndex(response.currentLineIndex)
      }
    })
  }, [socket, isConnected])

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
      if (newState === 'PERFORMING' && gameStateRef.current !== 'PERFORMING') {
        // Show 3-2-1 countdown before performing
        gameStateRef.current = 'PERFORMING'
        setCountdown(3)
        let count = 3
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = setInterval(() => {
          count--
          if (count > 0) {
            setCountdown(count)
          } else {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
            setCountdown(null)
            setGameState('PERFORMING')
          }
        }, 800)
      } else {
        setGameState(newState)
      }
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
        if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current)
        if (scriptGenerationTimeoutRef.current) clearTimeout(scriptGenerationTimeoutRef.current)
        loadingIntervalRef.current = setInterval(() => {
          setLoadingProgress(prev => (prev >= 15 ? prev : prev + Math.random() * 2 + 0.5))
        }, 500)
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
      setHasSubmittedSelection(false)
      setCountdown(null)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    })
    socket.on('latency_ping', (ts: number) => socket.emit('latency_pong', ts, Date.now()))
    socket.on('latency_pong_response', (d) => setNetworkLatency(d.latency))
    socket.on('plot_twist_started', () => setChaosCooldown(true))
    socket.on('credit_balance', setCreditBalance)
    socket.on('insufficient_credits', () => setShowInsufficientCredits(true))
    socket.on('achievement_unlocked', (a: Achievement) => achievementToasts.addAchievement(a))
    socket.on('xp_gained', (data) => setXpEvents(data.events))
    socket.on('level_up', (data) => setLevelUpData({ level: data.newLevel, title: data.title, reward: data.reward }))
    socket.on('spectator_message_received', (msg: SpectatorMessage) => {
      setSpectatorMessages(prev => [...prev.slice(-49), msg])
    })
    socket.on('kicked', (data: { reason: string }) => {
      toast.error(data.reason || 'You were removed from the game')
      window.location.href = '/'
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
      socket.off('xp_gained'); socket.off('level_up')
      socket.off('kicked')
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
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
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
    countdown,
    selection, setSelection,
    hasSubmittedSelection, setHasSubmittedSelection,
    scriptGenerationTimeoutRef,
    loadingIntervalRef,
    xpEvents,
    levelUpData, setLevelUpData,
  }
}
