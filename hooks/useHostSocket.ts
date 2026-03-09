'use client'

import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type {
  Player, Script, GameState, RoomSettings, Achievement,
  CardSelection, LevelReward,
} from '@/lib/types'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'
import { useGameSocket } from './useGameSocket'

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
  // Host-only state
  const [isPlaying, setIsPlaying] = useState(true)
  const [scriptGenerationTimedOut, setScriptGenerationTimedOut] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [chaosCooldown, setChaosCooldown] = useState(false)
  const [creditBalance, setCreditBalance] = useState<{ free: number; banked: number; total: number } | null>(null)
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false)
  const [selection, setSelection] = useState<CardSelection>({ character: '', setting: '', circumstance: '' })
  const [hasSubmittedSelection, setHasSubmittedSelection] = useState(false)

  const scriptGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const base = useGameSocket({
    socket,
    isConnected,
    roomCode,
    playerId,
    toast,
    achievementToasts,
    onPlayerJoined: (player: Player) => {
      if (base.gameStateRef.current === 'LOBBY' && !player.isHost) {
        toast.success(`${player.nickname} joined the show!`)
      }
    },
    onPlayerLeft: (leftPlayerId: string) => {
      const player = base.playersRef.current.find(p => p.id === leftPlayerId)
      if (player && !player.isHost) {
        toast.info(`${player.nickname} left the game`)
      }
    },
    onGameStateChange: (newState: GameState) => {
      if (newState === 'SELECTION') {
        setHasSubmittedSelection(false)
      }
      if (newState !== 'LOADING') {
        if (scriptGenerationTimeoutRef.current) {
          clearTimeout(scriptGenerationTimeoutRef.current)
          scriptGenerationTimeoutRef.current = null
        }
        if (base.loadingIntervalRef.current) {
          clearInterval(base.loadingIntervalRef.current)
          base.loadingIntervalRef.current = null
        }
        setScriptGenerationTimedOut(false)
        base.setLoadingProgress(0)
        base.setScriptTitlePreview(null)
      }
      if (newState === 'LOADING') {
        setScriptGenerationTimedOut(false)
        base.setLoadingProgress(0)
        base.setScriptTitlePreview(null)
        if (base.loadingIntervalRef.current) clearInterval(base.loadingIntervalRef.current)
        if (scriptGenerationTimeoutRef.current) clearTimeout(scriptGenerationTimeoutRef.current)
        base.loadingIntervalRef.current = setInterval(() => {
          base.setLoadingProgress(prev => (prev >= 15 ? prev : prev + Math.random() * 2 + 0.5))
        }, 500)
        scriptGenerationTimeoutRef.current = setTimeout(() => {
          setScriptGenerationTimedOut(true)
        }, 90000)
      }
    },
    onScriptReady: (_script: Script) => {
      setIsGeneratingImage(true)
    },
    onScriptImageUpdate: (_imageUrl: string) => {
      setIsGeneratingImage(false)
    },
    onNewGameStarted: () => {
      setIsPlaying(true)
      setIsGeneratingImage(false)
      setSelection({ character: '', setting: '', circumstance: '' })
      setHasSubmittedSelection(false)
    },
  })

  // Host-only socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    socket.on('plot_twist_started', () => setChaosCooldown(true))
    socket.on('credit_balance', setCreditBalance)
    socket.on('insufficient_credits', () => setShowInsufficientCredits(true))

    return () => {
      socket.off('plot_twist_started')
      socket.off('credit_balance')
      socket.off('insufficient_credits')
      if (scriptGenerationTimeoutRef.current) {
        clearTimeout(scriptGenerationTimeoutRef.current)
        scriptGenerationTimeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected])

  return {
    // Shared state from base
    gameState: base.gameState, setGameState: base.setGameState,
    players: base.players, setPlayers: base.setPlayers,
    script: base.script, setScript: base.setScript,
    currentLineIndex: base.currentLineIndex, setCurrentLineIndex: base.setCurrentLineIndex,
    greenRoomQuestion: base.greenRoomQuestion,
    gameResults: base.gameResults, setGameResults: base.setGameResults,
    availableCards: base.availableCards,
    networkLatency: base.networkLatency,
    spectatorMessages: base.spectatorMessages,
    countdown: base.countdown,
    xpEvents: base.xpEvents,
    levelUpData: base.levelUpData, setLevelUpData: base.setLevelUpData,
    scriptImageUrl: base.scriptImageUrl, setScriptImageUrl: base.setScriptImageUrl,
    loadingProgress: base.loadingProgress, setLoadingProgress: base.setLoadingProgress,
    loadingPhase: base.loadingPhase,
    scriptTitlePreview: base.scriptTitlePreview,
    // Host-only state
    isPlaying, setIsPlaying,
    scriptGenerationTimedOut, setScriptGenerationTimedOut,
    isGeneratingImage,
    chaosCooldown, setChaosCooldown,
    creditBalance, setCreditBalance,
    showInsufficientCredits, setShowInsufficientCredits,
    selection, setSelection,
    hasSubmittedSelection, setHasSubmittedSelection,
    scriptGenerationTimeoutRef,
    loadingIntervalRef: base.loadingIntervalRef,
  }
}
