// WIP: Phase components will be migrated to read from stores (Tasks 11-13)
// Until then, components are rendered without props and won't compile.

'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { useWakeLock } from '@/hooks/useWakeLock'
import { GameErrorBoundary } from '@/components/GameErrorBoundary'

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
// GameShell — unified phase routing
// ---------------------------------------------------------------------------
interface GameShellProps {
  role: 'host' | 'player' | 'spectator'
}

export function GameShell({ role }: GameShellProps) {
  const gameState = useGameStore((s) => s.gameState)
  useWakeLock()

  const isHost = role === 'host'

  return (
    <AnimatePresence mode="wait">
      {/* ---- LOBBY ---- */}
      {gameState === 'LOBBY' && (
        <GameErrorBoundary phaseName="lobby" key="lobby-eb">
          {/* @ts-expect-error — WIP: props will be removed in Tasks 11-13 */}
          {isHost ? <HostLobby /> : <JoinLobby />}
        </GameErrorBoundary>
      )}

      {/* ---- SELECTION ---- */}
      {gameState === 'SELECTION' && (
        <GameErrorBoundary phaseName="selection" key="selection-eb">
          {/* @ts-expect-error — WIP: props will be removed in Tasks 11-13 */}
          {isHost ? <HostSelection /> : <JoinSelection />}
        </GameErrorBoundary>
      )}

      {/* ---- LOADING ---- */}
      {gameState === 'LOADING' && (
        <GameErrorBoundary phaseName="loading" key="loading-eb">
          {/* @ts-expect-error — WIP: props will be removed in Tasks 11-13 */}
          {isHost ? <HostLoading /> : <JoinLoading />}
        </GameErrorBoundary>
      )}

      {/* ---- PERFORMING ---- */}
      {gameState === 'PERFORMING' && (
        <GameErrorBoundary phaseName="performing" key="performing-eb">
          {/* @ts-expect-error — WIP: props will be removed in Tasks 11-13 */}
          {isHost ? <HostPerforming /> : <JoinPerforming />}
        </GameErrorBoundary>
      )}

      {/* ---- VOTING ---- */}
      {gameState === 'VOTING' && (
        <GameErrorBoundary phaseName="voting" key="voting-eb">
          {/* @ts-expect-error — WIP: props will be removed in Tasks 11-13 */}
          {isHost ? <HostVoting /> : <JoinVoting />}
        </GameErrorBoundary>
      )}

      {/* ---- RESULTS ---- */}
      {gameState === 'RESULTS' && (
        <GameErrorBoundary phaseName="results" key="results-eb">
          {/* @ts-expect-error — WIP: props will be removed in Tasks 11-13 */}
          {isHost ? <HostResults /> : <JoinResults />}
        </GameErrorBoundary>
      )}
    </AnimatePresence>
  )
}
