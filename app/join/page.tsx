'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { CardSelection, PlayerRole } from '@/lib/types'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Modal } from '@/components/Modal'
import { AchievementToast, useAchievementToasts } from '@/components/AchievementToast'
import { MOTION, getVariants } from '@/lib/animations'
import { withTimeout } from '@/lib/socketTimeout'
import { analytics } from '@/lib/analytics'
import { useJoinSocket } from '@/hooks/useJoinSocket'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useAuth } from '@/contexts/AuthContext'

import dynamic from 'next/dynamic'
import { GameErrorBoundary } from '@/components/GameErrorBoundary'
import { ReconnectingOverlay } from '@/components/ReconnectingOverlay'
import { MoviePosterFrame } from '@/components/MoviePosterFrame'
const JoinForm = dynamic(() => import('./components/JoinForm').then(m => ({ default: m.JoinForm })), { ssr: false, loading: () => null })
const JoinLobby = dynamic(() => import('./components/JoinLobby').then(m => ({ default: m.JoinLobby })), { ssr: false, loading: () => null })
const JoinSelection = dynamic(() => import('./components/JoinSelection').then(m => ({ default: m.JoinSelection })), { ssr: false, loading: () => null })
const JoinLoading = dynamic(() => import('./components/JoinLoading').then(m => ({ default: m.JoinLoading })), { ssr: false, loading: () => null })
const JoinPerforming = dynamic(() => import('./components/JoinPerforming').then(m => ({ default: m.JoinPerforming })), { ssr: false, loading: () => null })
const JoinVoting = dynamic(() => import('./components/JoinVoting').then(m => ({ default: m.JoinVoting })), { ssr: false, loading: () => null })
const JoinResults = dynamic(() => import('./components/JoinResults').then(m => ({ default: m.JoinResults })), { ssr: false, loading: () => null })

function JoinPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code')
  const nicknameFromUrl = searchParams.get('nickname')
  const toast = useToast()
  const achievementToasts = useAchievementToasts()
  const confetti = useConfetti()
  const prefersReducedMotion = useReducedMotion()
  const variants = getVariants(prefersReducedMotion)
  useWakeLock()
  useAudioPlayer({ socket, isConnected })

  const [roomCode, setRoomCode] = useState(codeFromUrl || '')
  const [hasJoined, setHasJoined] = useState(false)
  const [myPlayerId, setMyPlayerId] = useState('')
  const [myRole, setMyRole] = useState<PlayerRole>('PLAYER')
  const [roomIsMature, setRoomIsMature] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPosterLightbox, setShowPosterLightbox] = useState(false)

  // Card selection state (kept in orchestrator so socket actions can use it)
  const [selection, setSelection] = useState<CardSelection>({ character: '', setting: '', circumstance: '' })
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTriggeredSelectionConfetti, setHasTriggeredSelectionConfetti] = useState(false)

  const {
    gameState,
    players,
    script,
    currentLineIndex,
    myCharacter,
    greenRoomQuestion,
    gameResults,
    availableCards,
    hostDisconnected, setHostDisconnected,
    selectedPackName,
    scriptImageUrl,
    countdown,
    spectatorMessages,
    loadingProgress,
    loadingPhase,
    scriptTitlePreview,
    loadingTimedOut,
    error,
    autoStartCountdown,
    xpEvents,
    levelUpData, setLevelUpData,
  } = useJoinSocket({
    socket, isConnected, myPlayerId, myRole,
    selectionCharacter: selection.character,
    roomCode,
    toast, achievementToasts,
  })

  // Auto-show onboarding for first-time users
  useEffect(() => {
    if (!localStorage.getItem('pt-onboarding-seen')) {
      setShowOnboarding(true)
      localStorage.setItem('pt-onboarding-seen', '1')
    }
  }, [])

  // Lock body scroll when overlays are visible
  useEffect(() => {
    if (hostDisconnected || countdown !== null) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [hostDisconnected, countdown])

  // Reset orchestrator state when returning to LOBBY (new game) or SELECTION (generation failure)
  useEffect(() => {
    if (gameState === 'LOBBY') {
      setSelection({ character: '', setting: '', circumstance: '' })
      setHasSubmitted(false)
      setIsSubmitting(false)
      setHasTriggeredSelectionConfetti(false)
    }
    if (gameState === 'SELECTION') {
      setHasSubmitted(false)
      setIsSubmitting(false)
    }
  }, [gameState])

  // Confetti on results
  useEffect(() => {
    if (gameState === 'RESULTS' && gameResults?.winner) {
      setTimeout(() => confetti.fireCelebration(), 500)
    }
  }, [gameState, gameResults, confetti])

  // Confetti when all cards selected
  useEffect(() => {
    if (selection.character && selection.setting && selection.circumstance &&
        !hasTriggeredSelectionConfetti && gameState === 'SELECTION' && !hasSubmitted) {
      setHasTriggeredSelectionConfetti(true)
      setTimeout(() => confetti.fireWinnerConfetti(), 250)
    }
  }, [selection, hasTriggeredSelectionConfetti, gameState, hasSubmitted, confetti])

  useEffect(() => {
    if (!selection.character && !selection.setting && !selection.circumstance) setHasTriggeredSelectionConfetti(false)
  }, [selection])

  // --- Actions ---
  const handleJoinSuccess = (data: { players: typeof players; myPlayerId: string; myRole: PlayerRole; roomCode: string; roomIsMature: boolean }) => {
    setHasJoined(true)
    setMyPlayerId(data.myPlayerId)
    setMyRole(data.myRole)
    setRoomCode(data.roomCode)
    setRoomIsMature(data.roomIsMature)
  }

  const handleSubmitCards = () => {
    if (!socket || !roomCode || !selection.character || !selection.setting || !selection.circumstance) {
      toast.error('Please select all cards'); return
    }
    setIsSubmitting(true)
    withTimeout<{ success: boolean; error?: string }>(
      (cb) => socket.emit('submit_cards', roomCode, selection, cb)
    ).then((response) => {
      setIsSubmitting(false)
      if (response.success) { setHasSubmitted(true); toast.success('Cards submitted!') }
      else toast.error(response.error || 'Failed to submit cards')
    }).catch(() => {
      setIsSubmitting(false)
      toast.error('Request timed out — please try again')
    })
  }

  const handleVote = useCallback((playerId: string) => socket?.emit('submit_vote', roomCode, playerId), [socket, roomCode])

  const goToNextLine = useCallback(() => {
    if (script && currentLineIndex < script.lines.length - 1) {
      socket?.emit('player_jump_to_line', roomCode.toUpperCase(), currentLineIndex + 1)
    }
  }, [script, currentLineIndex, socket, roomCode])

  const goToPreviousLine = useCallback(() => {
    if (currentLineIndex > 0) {
      socket?.emit('player_jump_to_line', roomCode.toUpperCase(), currentLineIndex - 1)
    }
  }, [currentLineIndex, socket, roomCode])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-center">
          <div className="text-6xl mb-6">⚡</div>
          <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Connecting...</p>
        </div>
      </div>
    )
  }

  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
        <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="join" />
        <AnimatePresence mode="wait">
          <motion.div
            key="join-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
            transition={{ duration: 0.3 }}
          >
            <GameErrorBoundary phaseName="join">
              <JoinForm
                socket={socket} isConnected={isConnected}
                initialRoomCode={codeFromUrl || ''}
                initialNickname={nicknameFromUrl || ''}
                toast={toast}
                onJoinSuccess={handleJoinSuccess}
                onShowOnboarding={() => setShowOnboarding(true)}
                onNavigateHome={() => router.push('/')}
              />
            </GameErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="join" />

      {/* Host Disconnected Overlay */}
      <AnimatePresence>
        {hostDisconnected && (
          <motion.div {...variants.fade}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
            <motion.div {...variants.scaleIn}
              className="max-w-md w-full text-center"
              style={{ padding: '32px 24px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="mb-4 flex justify-center">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><path d="M9.17 14.83a4 4 0 015.66 0" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="10" r="1" fill="var(--color-text-tertiary)"/><circle cx="15" cy="10" r="1" fill="var(--color-text-tertiary)"/><circle cx="12" cy="12" r="10" stroke="var(--color-text-tertiary)" strokeWidth="1.5"/></svg>
              </div>
              <h2 className="text-2xl font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>Host Disconnected</h2>
              <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                The host has left the game. You can wait for them to reconnect or return to the home page.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button onClick={() => setHostDisconnected(false)} className="w-full"
                  style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Wait for Reconnection</motion.button>
                <motion.button onClick={() => router.push('/')} className="w-full"
                  style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Return Home</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-Performance Countdown */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div {...variants.fade}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={countdown}
                initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.3, opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { scale: 2, opacity: 0 }}
                transition={MOTION.bouncy}
                className="text-center">
                <div style={{ fontSize: '120px', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{countdown}</div>
                <div style={{ fontSize: '18px', color: 'var(--color-text-tertiary)', marginTop: '16px' }}>Get ready to perform!</div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnection overlay for mid-game socket drops */}
      <ReconnectingOverlay gameState={gameState} />

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <MoviePosterFrame imageUrl={scriptImageUrl} title={script?.title} variant="lightbox" />
        )}
      </Modal>

      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <GameErrorBoundary phaseName="lobby" key="lobby-eb">
            <JoinLobby key="lobby" players={players} myPlayerId={myPlayerId} myRole={myRole} selectedPackName={selectedPackName} autoStartCountdown={autoStartCountdown} />
          </GameErrorBoundary>
        )}

        {gameState === 'SELECTION' && (
          <GameErrorBoundary phaseName="selection" key="selection-eb">
            <JoinSelection
              key="selection"
              myRole={myRole} hasSubmitted={hasSubmitted} isSubmitting={isSubmitting}
              selection={selection} setSelection={setSelection}
              availableCards={availableCards} roomIsMature={roomIsMature}
              error={error} players={players} onSubmitCards={handleSubmitCards} toast={toast}
              onBack={() => router.push('/')}
            />
          </GameErrorBoundary>
        )}

        {gameState === 'LOADING' && (
          <GameErrorBoundary phaseName="loading" key="loading-eb">
            <JoinLoading key="loading" loadingProgress={loadingProgress} loadingPhase={loadingPhase} scriptTitlePreview={scriptTitlePreview} greenRoomQuestion={greenRoomQuestion} loadingTimedOut={loadingTimedOut} onLeave={() => router.push('/')} />
          </GameErrorBoundary>
        )}

        {gameState === 'PERFORMING' && script && (
          <GameErrorBoundary phaseName="performing" key="performing-eb">
            <JoinPerforming
              key="performing"
              script={script} currentLineIndex={currentLineIndex}
              myCharacter={myCharacter} myRole={myRole}
              roomCode={roomCode} spectatorMessages={spectatorMessages}
              socket={socket}
              scriptImageUrl={scriptImageUrl}
              onNextLine={goToNextLine} onPreviousLine={goToPreviousLine}
              onShowPosterLightbox={() => setShowPosterLightbox(true)}
            />
          </GameErrorBoundary>
        )}

        {gameState === 'VOTING' && (
          <GameErrorBoundary phaseName="voting" key="voting-eb">
            <JoinVoting key="voting" players={players} myPlayerId={myPlayerId} script={script} myCharacter={myCharacter} onVote={handleVote} />
          </GameErrorBoundary>
        )}

        {gameState === 'RESULTS' && (
          <GameErrorBoundary phaseName="results" key="results-eb">
            <JoinResults
              key="results"
              script={script} gameResults={gameResults}
              scriptImageUrl={scriptImageUrl}
              showPosterLightbox={showPosterLightbox}
              socket={socket}
              myPlayerId={myPlayerId}
              userUid={user?.uid || ''}
              isGuest={!user}
              xpEvents={xpEvents}
              levelUpData={levelUpData}
              onDismissLevelUp={() => setLevelUpData(null)}
              onShowPosterLightbox={() => setShowPosterLightbox(true)}
              onClosePosterLightbox={() => setShowPosterLightbox(false)}
            />
          </GameErrorBoundary>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <AchievementToast achievements={achievementToasts.achievements} onDismiss={achievementToasts.dismissAchievement} />
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
        <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  )
}
