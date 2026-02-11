'use client'

import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type {
  Player, Script, GameState, GameResults, PlayerRole,
  TeleprompterSyncData, AvailableCards, Achievement, SpectatorMessage,
  CardSelection,
} from '@/lib/types'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface UseJoinSocketOptions {
  socket: AppSocket | null
  isConnected: boolean
  myPlayerId: string
  myRole: PlayerRole
  selectionCharacter: string
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  achievementToasts: { addAchievement: (a: Achievement) => void }
}

export function useJoinSocket({
  socket, isConnected, myPlayerId, myRole, selectionCharacter, toast, achievementToasts,
}: UseJoinSocketOptions) {
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [players, setPlayers] = useState<Player[]>([])
  const [script, setScript] = useState<Script | null>(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [myCharacter, setMyCharacter] = useState('')
  const [greenRoomQuestion, setGreenRoomQuestion] = useState('')
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [availableCards, setAvailableCards] = useState<AvailableCards>({ characters: [], settings: [], circumstances: [] })
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [hostDisconnected, setHostDisconnected] = useState(false)
  const [selectedPackName, setSelectedPackName] = useState<string | null>(null)
  const [scriptImageUrl, setScriptImageUrl] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [spectatorMessages, setSpectatorMessages] = useState<SpectatorMessage[]>([])
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState('')

  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousSpeaker = useRef<string>('')
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState
  const myPlayerIdRef = useRef(myPlayerId)
  myPlayerIdRef.current = myPlayerId
  const selectionCharacterRef = useRef(selectionCharacter)
  selectionCharacterRef.current = selectionCharacter
  const myRoleRef = useRef(myRole)
  myRoleRef.current = myRole

  // Loading progress animation
  useEffect(() => {
    if (gameState === 'LOADING') {
      setLoadingProgress(0)
      loadingIntervalRef.current = setInterval(() => {
        setLoadingProgress(prev => (prev >= 95 ? 95 : prev + Math.random() * 8 + 2))
      }, 1500)
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
      setLoadingProgress(0)
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current)
    }
  }, [gameState])

  // Vibrate on speaker change
  useEffect(() => {
    if (!script || gameState !== 'PERFORMING') return
    const currentSpeaker = script.lines[currentLineIndex]?.speaker
    if (currentSpeaker === myCharacter && previousSpeaker.current !== myCharacter) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
    }
    previousSpeaker.current = currentSpeaker
  }, [currentLineIndex, script, myCharacter, gameState])

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    socket.on('players_update', setPlayers)
    socket.on('player_joined', (player: Player) => {
      if (gameStateRef.current === 'LOBBY' && player.id !== myPlayerIdRef.current && !player.isHost) {
        toast.success(`${player.nickname} joined!`)
      }
    })

    socket.on('game_state_change', (newState: GameState) => {
      if (newState === 'PERFORMING' && gameStateRef.current !== 'PERFORMING') {
        setCountdown(3)
        let count = 3
        const interval = setInterval(() => {
          count--
          if (count > 0) {
            setCountdown(count)
          } else {
            clearInterval(interval)
            setCountdown(null)
            setGameState('PERFORMING')
          }
        }, 800)
      } else {
        setGameState(newState)
      }
    })

    socket.on('available_cards', setAvailableCards)
    socket.on('green_room_prompt', setGreenRoomQuestion)
    socket.on('script_ready', (newScript) => {
      setScript(newScript)
      setCurrentLineIndex(0)
      setScriptImageUrl(newScript.imageUrl || null)
      if (myRoleRef.current !== 'SPECTATOR') {
        setMyCharacter(selectionCharacterRef.current)
      }
    })
    socket.on('script_image_update', (imageUrl) => {
      if (imageUrl && !imageUrl.includes('default-poster')) setScriptImageUrl(imageUrl)
    })
    socket.on('sync_teleprompter', (data: TeleprompterSyncData | number) => {
      setCurrentLineIndex(typeof data === 'number' ? data : data.lineIndex)
    })
    socket.on('game_over', setGameResults)
    socket.on('achievement_unlocked' as never, (a: Achievement) => achievementToasts.addAchievement(a))
    socket.on('spectator_message_received', (msg: SpectatorMessage) => {
      setSpectatorMessages(prev => [...prev.slice(-49), msg])
    })
    socket.on('error', (errorMsg: string) => { toast.error(errorMsg); setError(errorMsg) })
    socket.on('host_disconnected', (data) => { toast.error('Host Disconnected'); setError(data.message); setHostDisconnected(true) })
    socket.on('card_pack_selected', (packId: string) => {
      if (packId === 'standard') setSelectedPackName('Standard Pack')
      else if (packId === 'example-office-comedy') setSelectedPackName('Office Comedy')
      else if (packId === 'example-scifi-adventures') setSelectedPackName('Sci-Fi Adventures')
      else setSelectedPackName('Custom Pack')
    })
    socket.on('new_game_started', () => {
      setGameState('LOBBY')
      setScript(null)
      setScriptImageUrl(null)
      setCurrentLineIndex(0)
      setGameResults(null)
      setMyCharacter('')
      setGreenRoomQuestion('')
    })
    socket.on('latency_ping', (ts: number) => socket.emit('latency_pong', ts, Date.now()))
    socket.on('latency_pong_response', (d) => setNetworkLatency(d.latency))

    return () => {
      socket.off('players_update'); socket.off('player_joined')
      socket.off('game_state_change'); socket.off('available_cards')
      socket.off('green_room_prompt'); socket.off('script_ready')
      socket.off('script_image_update'); socket.off('sync_teleprompter')
      socket.off('game_over'); socket.off('achievement_unlocked' as never)
      socket.off('spectator_message_received'); socket.off('error')
      socket.off('host_disconnected'); socket.off('card_pack_selected')
      socket.off('new_game_started'); socket.off('latency_ping')
      socket.off('latency_pong_response')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected])

  return {
    gameState, setGameState,
    players, setPlayers,
    script,
    currentLineIndex, setCurrentLineIndex,
    myCharacter,
    greenRoomQuestion,
    gameResults,
    availableCards,
    networkLatency,
    hostDisconnected, setHostDisconnected,
    selectedPackName,
    scriptImageUrl, setScriptImageUrl,
    countdown,
    spectatorMessages,
    loadingProgress,
    error, setError,
  }
}
