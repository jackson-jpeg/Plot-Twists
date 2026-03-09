'use client'

import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type {
  Player, PlayerRole, RoomSettings,
  Achievement, CardSelection, SpectatorMessage,
} from '@/lib/types'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'
import { successHaptic } from '@/hooks/useHaptics'
import { useGameSocket } from './useGameSocket'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface UseJoinSocketOptions {
  socket: AppSocket | null
  isConnected: boolean
  myPlayerId: string
  myRole: PlayerRole
  selectionCharacter: string
  roomCode: string
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  achievementToasts: { addAchievement: (a: Achievement) => void }
}

export function useJoinSocket({
  socket, isConnected, myPlayerId, myRole, selectionCharacter, roomCode, toast, achievementToasts,
}: UseJoinSocketOptions) {
  // Join-only state
  const [myCharacter, setMyCharacter] = useState('')
  const [hostDisconnected, setHostDisconnected] = useState(false)
  const [selectedPackName, setSelectedPackName] = useState<string | null>(null)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)
  const [error, setError] = useState('')
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null)
  const [roomSettings, setRoomSettings] = useState<RoomSettings | null>(null)
  const [resyncData, setResyncData] = useState<{ hasSubmittedSelection?: boolean; selection?: CardSelection } | null>(null)

  const previousSpeaker = useRef<string>('')
  const myRoleRef = useRef(myRole)
  myRoleRef.current = myRole
  const selectionCharacterRef = useRef(selectionCharacter)
  selectionCharacterRef.current = selectionCharacter

  const base = useGameSocket({
    socket,
    isConnected,
    roomCode,
    playerId: myPlayerId,
    toast,
    achievementToasts,
    onPlayersUpdate: (_players: Player[]) => {
      setHostDisconnected(false)
    },
    onPlayerJoined: (player: Player) => {
      if (base.gameStateRef.current === 'LOBBY' && player.id !== base.playerIdRef.current && !player.isHost) {
        toast.success(`${player.nickname} joined!`)
      }
    },
    onPlayerLeft: (leftPlayerId: string) => {
      if (leftPlayerId === base.playerIdRef.current) return
      const player = base.playersRef.current.find(p => p.id === leftPlayerId)
      if (player && !player.isHost) {
        toast.info(`${player.nickname} left the game`)
      }
    },
    onScriptReady: (_script) => {
      if (myRoleRef.current !== 'SPECTATOR') {
        setMyCharacter(selectionCharacterRef.current)
      }
    },
    onNewGameStarted: () => {
      setMyCharacter('')
      base.setGreenRoomQuestion('')
      base.setLoadingProgress(0)
      base.setScriptTitlePreview(null)
      setError('')
      base.setSpectatorMessages([])
    },
    onError: (errorMsg: string) => {
      setError(errorMsg)
    },
    onResync: (response) => {
      if (response.assignedCharacter) setMyCharacter(response.assignedCharacter as string)
      setResyncData({
        hasSubmittedSelection: response.hasSubmittedSelection as boolean | undefined,
        selection: response.selection as CardSelection | undefined,
      })
    },
  })

  // Loading progress animation + timeout escape
  useEffect(() => {
    if (base.gameState === 'LOADING') {
      base.setLoadingProgress(0)
      base.setScriptTitlePreview(null)
      setLoadingTimedOut(false)
      base.loadingIntervalRef.current = setInterval(() => {
        base.setLoadingProgress(prev => (prev >= 95 ? 95 : prev + Math.random() * 2 + 0.5))
      }, 500)
      const timeoutId = setTimeout(() => setLoadingTimedOut(true), 90_000)
      return () => {
        if (base.loadingIntervalRef.current) clearInterval(base.loadingIntervalRef.current)
        clearTimeout(timeoutId)
      }
    } else {
      if (base.loadingIntervalRef.current) {
        clearInterval(base.loadingIntervalRef.current)
        base.loadingIntervalRef.current = null
      }
      base.setLoadingProgress(0)
      setLoadingTimedOut(false)
    }
    return () => {
      if (base.loadingIntervalRef.current) clearInterval(base.loadingIntervalRef.current)
    }
  }, [base.gameState]) // eslint-disable-line react-hooks/exhaustive-deps

  // Vibrate on speaker change
  useEffect(() => {
    if (!base.script || base.gameState !== 'PERFORMING') return
    const currentSpeaker = base.script.lines[base.currentLineIndex]?.speaker
    if (currentSpeaker === myCharacter && previousSpeaker.current !== myCharacter) {
      successHaptic()
    }
    previousSpeaker.current = currentSpeaker
  }, [base.currentLineIndex, base.script, myCharacter, base.gameState])

  // Join-only socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    socket.on('host_disconnected', (data) => {
      toast.error('Host Disconnected')
      setError(data.message)
      setHostDisconnected(true)
    })
    socket.on('card_pack_selected', (_packId: string, packName: string) => {
      setSelectedPackName(packName)
    })
    socket.on('room_settings_update', setRoomSettings)
    socket.on('auto_start_countdown', (seconds) => setAutoStartCountdown(seconds))

    // Reconnection-aware events
    socket.on('performance_paused', () => {
      setHostDisconnected(true)
    })
    socket.on('performance_resumed', () => {
      setHostDisconnected(false)
    })
    socket.on('player_reconnected', (data) => {
      toast.success(`${data.name} reconnected`)
      // If the reconnected player is the host, clear host disconnected state
      setHostDisconnected(false)
    })

    return () => {
      socket.off('host_disconnected')
      socket.off('card_pack_selected')
      socket.off('room_settings_update')
      socket.off('auto_start_countdown')
      socket.off('performance_paused')
      socket.off('performance_resumed')
      socket.off('player_reconnected')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected])

  return {
    // Shared state from base
    gameState: base.gameState, setGameState: base.setGameState,
    players: base.players, setPlayers: base.setPlayers,
    script: base.script,
    currentLineIndex: base.currentLineIndex, setCurrentLineIndex: base.setCurrentLineIndex,
    greenRoomQuestion: base.greenRoomQuestion,
    gameResults: base.gameResults,
    availableCards: base.availableCards,
    networkLatency: base.networkLatency,
    spectatorMessages: base.spectatorMessages,
    countdown: base.countdown,
    xpEvents: base.xpEvents,
    levelUpData: base.levelUpData, setLevelUpData: base.setLevelUpData,
    scriptImageUrl: base.scriptImageUrl, setScriptImageUrl: base.setScriptImageUrl,
    loadingProgress: base.loadingProgress,
    loadingPhase: base.loadingPhase,
    scriptTitlePreview: base.scriptTitlePreview,
    // Join-only state
    myCharacter,
    hostDisconnected, setHostDisconnected,
    selectedPackName,
    loadingTimedOut,
    error, setError,
    autoStartCountdown,
    roomSettings,
    resyncData,
  }
}
