'use client'

/**
 * DESIGN PREVIEW HARNESS — not a product surface.
 *
 * Renders game-phase screens with fixture store state so the design pass can
 * screenshot states that normally require a live game (LOADING, timeout,
 * green room …). Gated: production builds 404 unless the build set
 * NEXT_PUBLIC_DESIGN_PREVIEW=1 (inlined at build time; the real deploy never
 * sets it). Added in design(2); delete freely once a storybook exists.
 *
 * Usage: /design-preview?screen=loading&state=start|writing|greenroom|timeout
 */

import React, { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { HostLoading } from '@/app/host/components/HostLoading'
import { ConnectionBanner } from '@/components/ConnectionStatus'
import { GamePausedOverlay } from '@/components/GamePausedOverlay'
import { GameErrorBoundary } from '@/components/GameErrorBoundary'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { useAudienceStore } from '@/stores/audienceStore'

const ENABLED =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_DESIGN_PREVIEW === '1'

function applyLoadingFixture(state: string) {
  const script = useScriptStore.setState
  const audience = useAudienceStore.setState
  const game = useGameStore.setState
  game({ settings: { gameMode: 'ENSEMBLE' } as never })
  switch (state) {
    case 'start':
      script({ generationProgress: 8, titlePreview: null, generationTimedOut: false })
      audience({ greenRoomQuestion: null })
      break
    case 'writing':
      script({
        generationProgress: 62,
        titlePreview: 'The Intervention Goes to Space',
        generationTimedOut: false,
      })
      audience({ greenRoomQuestion: null })
      break
    case 'greenroom':
      script({
        generationProgress: 45,
        titlePreview: null,
        generationTimedOut: false,
      })
      audience({
        greenRoomQuestion:
          'Which of you would survive longest in a haunted grocery store?',
      })
      break
    case 'timeout':
      script({
        generationProgress: 71,
        titlePreview: 'The Intervention Goes to Space',
        generationTimedOut: true,
      })
      audience({ greenRoomQuestion: null })
      break
  }
}

function PreviewInner() {
  const params = useSearchParams()
  const screen = params.get('screen') ?? 'loading'
  const state = params.get('state') ?? 'start'

  // Sync fixtures into the external zustand stores; subscribers re-render on
  // their own, so no local ready-state is needed.
  useEffect(() => {
    if (screen === 'loading') applyLoadingFixture(state)
  }, [screen, state])
  if (screen === 'loading') {
    return <HostLoading onRetry={() => {}} onBackToLobby={() => {}} />
  }
  if (screen === 'system') {
    // Harness pages have no product h1; give axe one so heading checks
    // measure the component under test, not the scaffold.
    const dark: React.CSSProperties = { minHeight: '100dvh', background: '#08070b', padding: 24 }
    const H1 = <h1 className="sr-only">Design preview: {state}</h1>
    if (state === 'reconnecting')
      return (
        <div style={dark}>
          {H1}
          <ConnectionBanner online connectionState="reconnecting" reconnectAttempt={3} onRetry={() => {}} />
        </div>
      )
    if (state === 'lost')
      return (
        <div style={dark}>
          {H1}
          <ConnectionBanner online connectionState="disconnected" reconnectAttempt={5} onRetry={() => {}} />
        </div>
      )
    if (state === 'paused')
      return (
        <div style={dark}>
          {H1}
          <GamePausedOverlay visible reason="Host disconnected" />
        </div>
      )
    if (state === 'errorboundary')
      return (
        <div style={{ ...dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {H1}
          <div style={{ maxWidth: 420, width: '100%' }}>
            <GameErrorBoundary phaseName="the performance">
              <Thrower />
            </GameErrorBoundary>
          </div>
        </div>
      )
  }
  return <p style={{ padding: 40 }}>Unknown screen: {screen}</p>
}

/** Throws on render so the error-boundary fallback can be screenshot. */
function Thrower(): never {
  throw new Error('design-preview: deliberate render error')
}

export default function DesignPreviewPage() {
  if (!ENABLED) notFound()
  return (
    <Suspense fallback={null}>
      <PreviewInner />
    </Suspense>
  )
}
