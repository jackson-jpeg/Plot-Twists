'use client'

import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type {
  Player, Script, ScriptLine, GameState, GameResults,
  TeleprompterSyncData, AvailableCards, Achievement, SpectatorMessage,
  XPEvent, LevelReward,
} from '@/lib/types'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'
import { useGameErrors } from './useGameErrors'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface UseGameSocketParams {
  socket: AppSocket | null
  isConnected: boolean
  roomCode: string
  playerId: string
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  achievementToasts: { addAchievement: (a: Achievement) => void }
  // Callbacks for role-specific behavior
  onPlayersUpdate?: (players: Player[]) => void
  onGameStateChange?: (newState: GameState) => void
  onScriptReady?: (script: Script) => void
  onNewGameStarted?: () => void
  onError?: (msg: string) => void
  onPlayerJoined?: (player: Player) => void
  onPlayerLeft?: (playerId: string) => void
  onScriptImageUpdate?: (imageUrl: string) => void
  // Custom resync handler for role-specific resync data
  onResync?: (response: Record<string, unknown>) => void
}

export function useGameSocket(params: UseGameSocketParams) {
  const {
    socket, isConnected, toast, achievementToasts,
  } = params

  // Error/warning handling for all game sessions
  useGameErrors({ socket, toast: params.toast })

  // Shared state
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [players, setPlayers] = useState<Player[]>([])
  const [script, setScript] = useState<Script | null>(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [greenRoomQuestion, setGreenRoomQuestion] = useState('')
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [availableCards, setAvailableCards] = useState<AvailableCards>({ characters: [], settings: [], circumstances: [] })
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [spectatorMessages, setSpectatorMessages] = useState<SpectatorMessage[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([])
  const [levelUpData, setLevelUpData] = useState<{ level: number; title: string; reward?: LevelReward } | null>(null)
  const [scriptImageUrl, setScriptImageUrl] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [scriptTitlePreview, setScriptTitlePreview] = useState<string | null>(null)

  // Shared refs
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState
  const playersRef = useRef(players)
  playersRef.current = players
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const roomCodeRef = useRef(params.roomCode)
  roomCodeRef.current = params.roomCode
  const playerIdRef = useRef(params.playerId)
  playerIdRef.current = params.playerId

  // Store callbacks in refs to avoid re-subscribing
  const callbacksRef = useRef(params)
  callbacksRef.current = params

  // Resync on reconnect
  useEffect(() => {
    if (!socket || !isConnected) return
    const code = roomCodeRef.current
    const pid = playerIdRef.current
    if (!code || !pid) return
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
        callbacksRef.current.onResync?.(response as unknown as Record<string, unknown>)
      }
    })
  }, [socket, isConnected])

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    socket.on('players_update', (updatedPlayers) => {
      setPlayers(updatedPlayers)
      callbacksRef.current.onPlayersUpdate?.(updatedPlayers)
    })

    socket.on('player_joined', (player: Player) => {
      callbacksRef.current.onPlayerJoined?.(player)
    })

    socket.on('game_state_change', (newState: GameState) => {
      if (newState === 'PERFORMING' && gameStateRef.current !== 'PERFORMING') {
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
      callbacksRef.current.onGameStateChange?.(newState)
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

    socket.on('available_cards', setAvailableCards)
    socket.on('green_room_prompt', setGreenRoomQuestion)

    socket.on('script_ready', (newScript) => {
      setScript(newScript)
      setCurrentLineIndex(0)
      setScriptImageUrl(newScript.imageUrl || null)
      callbacksRef.current.onScriptReady?.(newScript)
    })

    socket.on('script_image_update', (imageUrl) => {
      if (imageUrl && !imageUrl.includes('default-poster')) {
        setScriptImageUrl(imageUrl)
      }
      callbacksRef.current.onScriptImageUpdate?.(imageUrl)
    })

    socket.on('sync_teleprompter', (data: TeleprompterSyncData | number) => {
      setCurrentLineIndex(typeof data === 'number' ? data : data.lineIndex)
    })

    socket.on('game_over', setGameResults)

    socket.on('new_game_started', () => {
      setGameState('LOBBY')
      setScript(null)
      setScriptImageUrl(null)
      setCurrentLineIndex(0)
      setGameResults(null)
      setCountdown(null)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      callbacksRef.current.onNewGameStarted?.()
    })

    socket.on('latency_ping', (ts: number) => socket.emit('latency_pong', ts, Date.now()))
    socket.on('latency_pong_response', (d) => setNetworkLatency(d.latency))

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

    socket.on('error', (errorMsg: string) => {
      toast.error(errorMsg)
      callbacksRef.current.onError?.(errorMsg)
    })

    socket.on('player_left', (leftPlayerId: string) => {
      callbacksRef.current.onPlayerLeft?.(leftPlayerId)
    })

    socket.on('player_disconnected', (data: { name: string }) => {
      toast.info(`${data.name} disconnected`)
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
      socket.off('game_state_change'); socket.off('available_cards')
      socket.off('green_room_prompt'); socket.off('script_generation_progress')
      socket.off('script_ready'); socket.off('script_image_update')
      socket.off('sync_teleprompter'); socket.off('game_over')
      socket.off('new_game_started'); socket.off('latency_ping')
      socket.off('latency_pong_response')
      socket.off('achievement_unlocked'); socket.off('xp_gained')
      socket.off('level_up'); socket.off('spectator_message_received')
      socket.off('kicked'); socket.off('error')
      socket.off('player_left'); socket.off('player_disconnected')
      socket.off('plot_twist_injected')
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected])

  return {
    // State
    gameState, setGameState,
    players, setPlayers,
    script, setScript,
    currentLineIndex, setCurrentLineIndex,
    greenRoomQuestion, setGreenRoomQuestion,
    gameResults, setGameResults,
    availableCards,
    networkLatency,
    spectatorMessages, setSpectatorMessages,
    countdown, setCountdown,
    xpEvents,
    levelUpData, setLevelUpData,
    scriptImageUrl, setScriptImageUrl,
    loadingProgress, setLoadingProgress,
    loadingPhase,
    scriptTitlePreview, setScriptTitlePreview,
    // Refs
    gameStateRef,
    playersRef,
    countdownIntervalRef,
    loadingIntervalRef,
    playerIdRef,
    roomCodeRef,
  }
}
