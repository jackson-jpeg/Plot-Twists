'use client'

import { useEffect } from 'react'

import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { useWakeLock } from '@/hooks/useWakeLock'
import { GameErrorBoundary } from '@/components/GameErrorBoundary'
import type { RoomSettings, ScriptCustomization, AudioSettings, GameMode } from '@/lib/types'

// ---------------------------------------------------------------------------
// Dynamic imports — Host phase components
// ---------------------------------------------------------------------------
const hostLoadingPlaceholder = () => <div style={{ minHeight: '100dvh' }} />

const HostLobby = dynamic(
  () => import('@/app/host/components/HostLobby').then(m => ({ default: m.HostLobby })),
  { ssr: false, loading: hostLoadingPlaceholder },
)
const HostSelection = dynamic(
  () => import('@/app/host/components/HostSelection').then(m => ({ default: m.HostSelection })),
  { ssr: false, loading: hostLoadingPlaceholder },
)
const HostLoading = dynamic(
  () => import('@/app/host/components/HostLoading').then(m => ({ default: m.HostLoading })),
  { ssr: false, loading: hostLoadingPlaceholder },
)
const HostPerforming = dynamic(
  () => import('@/app/host/components/HostPerforming').then(m => ({ default: m.HostPerforming })),
  { ssr: false, loading: hostLoadingPlaceholder },
)
const HostVoting = dynamic(
  () => import('@/app/host/components/HostVoting').then(m => ({ default: m.HostVoting })),
  { ssr: false, loading: hostLoadingPlaceholder },
)
const HostResults = dynamic(
  () => import('@/app/host/components/HostResults').then(m => ({ default: m.HostResults })),
  { ssr: false, loading: () => null },
)

// ---------------------------------------------------------------------------
// Dynamic imports — Join phase components (JoinForm is pre-game, stays in join/page.tsx)
// ---------------------------------------------------------------------------
const joinLoadingPlaceholder = () => <div style={{ minHeight: '100dvh' }} />

const JoinLobby = dynamic(
  () => import('@/app/join/components/JoinLobby').then(m => ({ default: m.JoinLobby })),
  { ssr: false, loading: joinLoadingPlaceholder },
)
const JoinSelection = dynamic(
  () => import('@/app/join/components/JoinSelection').then(m => ({ default: m.JoinSelection })),
  { ssr: false, loading: joinLoadingPlaceholder },
)
const JoinLoading = dynamic(
  () => import('@/app/join/components/JoinLoading').then(m => ({ default: m.JoinLoading })),
  { ssr: false, loading: joinLoadingPlaceholder },
)
const JoinPerforming = dynamic(
  () => import('@/app/join/components/JoinPerforming').then(m => ({ default: m.JoinPerforming })),
  { ssr: false, loading: joinLoadingPlaceholder },
)
const JoinVoting = dynamic(
  () => import('@/app/join/components/JoinVoting').then(m => ({ default: m.JoinVoting })),
  { ssr: false, loading: joinLoadingPlaceholder },
)
const JoinResults = dynamic(
  () => import('@/app/join/components/JoinResults').then(m => ({ default: m.JoinResults })),
  { ssr: false, loading: () => null },
)

// ---------------------------------------------------------------------------
// Shared toast type used by multiple components
// ---------------------------------------------------------------------------
type Toast = {
  success: (m: string, opts?: { duration?: number }) => void
  error: (m: string) => void
  info: (m: string) => void
}

// ---------------------------------------------------------------------------
// Host-specific props that GameShell needs from the host page
// ---------------------------------------------------------------------------
export interface HostGameShellProps {
  role: 'host'
  toast: Toast
  userUid: string
  // Lobby settings (owned by host page)
  settings: RoomSettings
  scriptCustomization: ScriptCustomization
  audioSettings: AudioSettings
  onSetSettings: React.Dispatch<React.SetStateAction<RoomSettings>>
  onSetScriptCustomization: React.Dispatch<React.SetStateAction<ScriptCustomization>>
  onSetAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>
  // Lobby actions
  onStartGame: () => void
  onToggleMature: () => void
  onUpdateGameMode: (mode: GameMode) => void
  onSetupModeChange: (mode: 'quick' | 'custom') => void
  onShowOnboarding: () => void
  onNavigateHome: () => void
  // Selection actions
  onSubmitSoloCards: () => void
  onBackToLobby: () => void
  // Loading actions
  onRetry: () => void
  // Performing/Results actions
  onShowPosterLightbox: () => void
  onRequestNewGame: (keepSelections: boolean) => void
}

// ---------------------------------------------------------------------------
// Join-specific props that GameShell needs from the join page
// ---------------------------------------------------------------------------
export interface JoinGameShellProps {
  role: 'player' | 'spectator'
  toast: Toast
  userUid: string
  isGuest: boolean
  // Join actions
  onSubmitCards: () => void
  onLeave: () => void
  onShowPosterLightbox: () => void
}

export type GameShellProps = HostGameShellProps | JoinGameShellProps

// ---------------------------------------------------------------------------
// GameShell — unified phase routing
// ---------------------------------------------------------------------------
export function GameShell(props: GameShellProps) {
  const gameState = useGameStore((s) => s.gameState)
  const script = useScriptStore((s) => s.script)
  useWakeLock()

  // Every game phase is a dark theater surface, but body is light --color-bg,
  // which shows through as a pale strip under any phase shorter than the
  // viewport padding (same bug fixed per-route on landing and /join).
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#08070b'
    return () => {
      document.body.style.background = prev
    }
  }, [])

  const isHost = props.role === 'host'

  return (
    <AnimatePresence mode="wait">
      {/* ---- LOBBY ---- */}
      {gameState === 'LOBBY' && (
        <GameErrorBoundary phaseName="lobby" key="lobby-eb">
          {isHost ? (
            <HostLobby
              settings={(props as HostGameShellProps).settings}
              scriptCustomization={(props as HostGameShellProps).scriptCustomization}
              audioSettings={(props as HostGameShellProps).audioSettings}
              toast={props.toast}
              onStartGame={(props as HostGameShellProps).onStartGame}
              onToggleMature={(props as HostGameShellProps).onToggleMature}
              onUpdateGameMode={(props as HostGameShellProps).onUpdateGameMode}
              onSetupModeChange={(props as HostGameShellProps).onSetupModeChange}
              onSetScriptCustomization={(props as HostGameShellProps).onSetScriptCustomization}
              onSetAudioSettings={(props as HostGameShellProps).onSetAudioSettings}
              onSetSettings={(props as HostGameShellProps).onSetSettings}
              onShowOnboarding={(props as HostGameShellProps).onShowOnboarding}
              onNavigateHome={(props as HostGameShellProps).onNavigateHome}
            />
          ) : (
            <JoinLobbyWrapper />
          )}
        </GameErrorBoundary>
      )}

      {/* ---- SELECTION ---- */}
      {gameState === 'SELECTION' && (
        <GameErrorBoundary phaseName="selection" key="selection-eb">
          {isHost ? (
            <HostSelection
              onSubmitSoloCards={(props as HostGameShellProps).onSubmitSoloCards}
              onBackToLobby={(props as HostGameShellProps).onBackToLobby}
              toast={props.toast}
            />
          ) : (
            <JoinSelectionWrapper
              onSubmitCards={(props as JoinGameShellProps).onSubmitCards}
              toast={props.toast}
            />
          )}
        </GameErrorBoundary>
      )}

      {/* ---- LOADING ---- */}
      {gameState === 'LOADING' && (
        <GameErrorBoundary phaseName="loading" key="loading-eb">
          {isHost ? (
            <HostLoading
              onRetry={(props as HostGameShellProps).onRetry}
              onBackToLobby={(props as HostGameShellProps).onBackToLobby}
            />
          ) : (
            <JoinLoading onLeave={(props as JoinGameShellProps).onLeave} />
          )}
        </GameErrorBoundary>
      )}

      {/* ---- PERFORMING ---- */}
      {gameState === 'PERFORMING' && script && (
        <GameErrorBoundary phaseName="performing" key="performing-eb">
          {isHost ? (
            <HostPerforming
              onShowPosterLightbox={isHost ? (props as HostGameShellProps).onShowPosterLightbox : (props as JoinGameShellProps).onShowPosterLightbox}
            />
          ) : (
            <JoinPerformingWrapper
              onShowPosterLightbox={(props as JoinGameShellProps).onShowPosterLightbox}
            />
          )}
        </GameErrorBoundary>
      )}

      {/* ---- VOTING ---- */}
      {gameState === 'VOTING' && (
        <GameErrorBoundary phaseName="voting" key="voting-eb">
          {isHost ? (
            <HostVoting />
          ) : (
            <JoinVotingWrapper />
          )}
        </GameErrorBoundary>
      )}

      {/* ---- RESULTS ---- */}
      {gameState === 'RESULTS' && (
        <GameErrorBoundary phaseName="results" key="results-eb">
          {isHost ? (
            <HostResults
              userUid={props.userUid}
              toast={props.toast}
              onShowPosterLightbox={(props as HostGameShellProps).onShowPosterLightbox}
              onRequestNewGame={(props as HostGameShellProps).onRequestNewGame}
            />
          ) : (
            <JoinResultsWrapper
              userUid={props.userUid}
              isGuest={(props as JoinGameShellProps).isGuest}
              onShowPosterLightbox={(props as JoinGameShellProps).onShowPosterLightbox}
            />
          )}
        </GameErrorBoundary>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Thin wrapper components that read join-specific state from stores
// ---------------------------------------------------------------------------

function JoinLobbyWrapper() {
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const myRole = useGameStore((s) => s.myRole)
  const autoStartCountdown = useGameStore((s) => s.autoStartCountdown)
  return <JoinLobby myPlayerId={myPlayerId} myRole={myRole} autoStartCountdown={autoStartCountdown} />
}

function JoinSelectionWrapper({ onSubmitCards, toast }: { onSubmitCards: () => void; toast: Toast }) {
  const myRole = useGameStore((s) => s.myRole)
  const roomIsMature = useGameStore((s) => s.roomIsMature)
  return <JoinSelection myRole={myRole} roomIsMature={roomIsMature} onSubmitCards={onSubmitCards} toast={toast} />
}

function JoinPerformingWrapper({ onShowPosterLightbox }: { onShowPosterLightbox: () => void }) {
  const myCharacter = useGameStore((s) => s.myCharacter)
  const myRole = useGameStore((s) => s.myRole)
  return <JoinPerforming myCharacter={myCharacter} myRole={myRole} onShowPosterLightbox={onShowPosterLightbox} />
}

function JoinVotingWrapper() {
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const myCharacter = useGameStore((s) => s.myCharacter)
  return <JoinVoting myPlayerId={myPlayerId} myCharacter={myCharacter} />
}

function JoinResultsWrapper({ userUid, isGuest, onShowPosterLightbox }: { userUid: string; isGuest: boolean; onShowPosterLightbox: () => void }) {
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  return <JoinResults myPlayerId={myPlayerId} userUid={userUid} isGuest={isGuest} onShowPosterLightbox={onShowPosterLightbox} />
}
