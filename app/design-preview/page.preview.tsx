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
import { useVotingStore } from '@/stores/votingStore'
import { HostResults } from '@/app/host/components/HostResults'
import { HostVoting } from '@/app/host/components/HostVoting'
import { HostPerforming } from '@/app/host/components/HostPerforming'
import { MobileTeleprompter } from '@/components/MobileTeleprompter'

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

const RESULT_CAST = [
  'Insists nothing is wrong at increasing volume',
  'Solves every problem in the first minute and is ignored',
  'Has already searched your bag',
  'Narrates their own exit',
  'Apologizes to furniture',
  'Treats every task as a heist',
  'Quotes a rule that does not exist',
  'Keeps upgrading small promises',
]

function applyResultsFixture(state: string) {
  useGameStore.setState({
    players: RESULT_CAST.map((trait, i) => ({
      publicId: `p${i}`,
      nickname: ['Dana', 'Marco', 'Priya', 'Sam', 'Lee', 'Iris', 'Theo', 'Noor'][i],
      role: 'PLAYER',
      isHost: i === 0,
      connected: true,
      assignedCharacter: trait,
      score: [7, 4, 3, 3, 2, 2, 1, 0][i],
    })) as never,
    settings: { gameMode: 'ENSEMBLE' } as never,
  } as never)
  useScriptStore.setState({
    script: {
      title: 'The Intervention Goes to Space',
      synopsis:
        'Eight acquaintances stage a gentle confrontation at the worst possible altitude.',
      lines: [],
    } as never,
  } as never)
  useVotingStore.setState({
    gameResults:
      state === 'nowinner'
        ? { allResults: [] }
        : {
            winner: { playerName: 'Dana', votes: 5 },
            allResults: [
              { playerName: 'Dana', votes: 5 },
              { playerName: 'Marco', votes: 2 },
              { playerName: 'Priya', votes: 1 },
            ],
            highlights: [
              { label: 'Longest silence survived', value: '11 seconds', icon: 'clock' },
              { label: 'Lines delivered standing on a chair', value: '4', icon: 'star' },
            ],
          },
    directorsReview: {
      rating: 4,
      headline: 'A Masterclass in Escalating Reassurance',
      review:
        'What begins as a wellness check becomes cinema. The ensemble commits to the bit with the discipline of a much better-funded production. One chair did not survive, and it was worth it.',
      bestMoment: 'The unanimous decision to whisper the loudest line.',
    },
    xpEvents: [],
    levelUpData: null,
  } as never)
}

function applyPerformingFixture(state: string) {
  useGameStore.setState({
    roomCode: 'T22X',
    players: RESULT_CAST.map((trait, i) => ({
      publicId: `p${i}`,
      nickname: ['Dana', 'Marco', 'Priya', 'Sam', 'Lee', 'Iris', 'Theo', 'Noor'][i],
      role: 'PLAYER',
      isHost: false,
      connected: true,
      assignedCharacter: trait,
    })) as never,
    settings: { gameMode: 'ENSEMBLE' } as never,
  } as never)
  useScriptStore.setState({
    script: {
      title: 'The Intervention Goes to Space',
      synopsis: 'Eight acquaintances stage a gentle confrontation at the worst possible altitude.',
      lines: [
        { speaker: 'STAGE DIRECTIONS', text: '[A BORROWED CONFERENCE ROOM ON A COMMERCIAL SPACEFLIGHT. A BANNER READS "WE NEED TO TALK." ZERO GRAVITY IS NOT HELPING.]' },
        { speaker: RESULT_CAST[0], text: 'Nothing is wrong. NOTHING IS WRONG.' },
        { speaker: RESULT_CAST[1], text: 'We could simply land the shuttle. I said this an hour ago.' },
        { speaker: RESULT_CAST[2], text: 'Whose bag is this. Answer carefully.' },
        { speaker: RESULT_CAST[3], text: 'And with that, I drift meaningfully toward the airlock.' },
        { speaker: RESULT_CAST[4], text: 'Sorry, table. You deserved a better meeting.' },
        { speaker: RESULT_CAST[5], text: 'Phase one: everyone act natural. Phase two: the vents.' },
        { speaker: RESULT_CAST[6], text: 'Regulation 9 clearly forbids crying in zero gravity.' },
        { speaker: RESULT_CAST[7], text: 'I promised a small intervention. It is now a summit.' },
      ],
    } as never,
    currentLineIndex: state === 'start' ? 0 : 4,
    isPlaying: true,
  } as never)
}

function applyVotingFixture(state: string) {
  const voted = state === 'complete' ? 8 : 5
  useGameStore.setState({
    players: RESULT_CAST.map((trait, i) => ({
      publicId: `p${i}`,
      nickname: ['Dana', 'Marco', 'Priya', 'Sam', 'Lee', 'Iris', 'Theo', 'Noor'][i],
      role: 'PLAYER',
      isHost: false,
      connected: true,
      assignedCharacter: trait,
      hasSubmittedVote: i < voted,
    })) as never,
    settings: { gameMode: 'ENSEMBLE' } as never,
  } as never)
  useScriptStore.setState({
    script: {
      title: 'The Intervention Goes to Space',
      synopsis: '',
      lines: [],
    } as never,
  } as never)
}

function PreviewInner() {
  const params = useSearchParams()
  const screen = params.get('screen') ?? 'loading'
  const state = params.get('state') ?? 'start'

  // Sync fixtures into the external zustand stores; subscribers re-render on
  // their own, so no local ready-state is needed.
  useEffect(() => {
    if (screen === 'loading') applyLoadingFixture(state)
    if (screen === 'results') applyResultsFixture(state)
    if (screen === 'voting') applyVotingFixture(state)
    if (screen === 'performing') applyPerformingFixture(state)
  }, [screen, state])
  if (screen === 'loading') {
    return <HostLoading onRetry={() => {}} onBackToLobby={() => {}} />
  }
  if (screen === 'voting') {
    return <HostVoting />
  }
  if (screen === 'performing') {
    return <HostPerforming onShowPosterLightbox={() => {}} />
  }
  if (screen === 'teleprompter') {
    const lines = [
      { speaker: RESULT_CAST[1], text: 'We could simply land the shuttle. I said this an hour ago.' },
      { speaker: RESULT_CAST[0], text: 'Nothing is wrong. NOTHING IS WRONG.' },
      { speaker: RESULT_CAST[3], text: 'And with that, I drift meaningfully toward the airlock.' },
      { speaker: RESULT_CAST[0], text: 'Okay. One thing is wrong. The door is now open.' },
    ]
    const idx = state === 'myturn' ? 1 : 0
    return (
      <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
        <h1 className="sr-only">Teleprompter preview</h1>
        <MobileTeleprompter
          script={{ title: 'The Intervention Goes to Space', synopsis: '', lines } as never}
          currentLineIndex={idx}
          myCharacter={RESULT_CAST[0]}
          onNextLine={() => {}}
          onPreviousLine={() => {}}
        />
      </div>
    )
  }
  if (screen === 'results') {
    return (
      <HostResults
        userUid=""
        toast={{ success: () => {}, error: () => {} }}
        onShowPosterLightbox={() => {}}
        onRequestNewGame={() => {}}
      />
    )
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
