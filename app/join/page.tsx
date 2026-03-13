'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { Player, PlayerRole } from '@/lib/types'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useConfetti } from '@/hooks/useConfetti'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Modal } from '@/components/Modal'
import { AchievementToast, useAchievementToasts } from '@/components/AchievementToast'
import { SPRING_BOUNCY } from '@/lib/motion'
import { getVariants } from '@/lib/animations'
import { withTimeout } from '@/lib/socketTimeout'
import { analytics } from '@/lib/analytics'
import { useAuth } from '@/contexts/AuthContext'
import { applyRoomRecoverySnapshot } from '@/lib/roomRecovery'

import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useVotingStore } from '@/stores/votingStore'
import { initStoreSubscriptions } from '@/stores/subscriptions'
import { socketManager } from '@/lib/socketManager'

import dynamic from 'next/dynamic'
import { GameErrorBoundary } from '@/components/GameErrorBoundary'
import { ReconnectingOverlay } from '@/components/ReconnectingOverlay'
import { ReconnectionBanner } from '@/components/ReconnectionBanner'
import { MoviePosterFrame } from '@/components/MoviePosterFrame'
import { PageContainer } from '@/components/ui/PageContainer'
import { Button } from '@/components/ui/Button'
import { GameShell } from '@/app/game/GameShell'

const JoinForm = dynamic(() => import('./components/JoinForm').then(m => ({ default: m.JoinForm })), { ssr: false, loading: () => <div style={{ minHeight: '100dvh' }} /> })

function JoinPageContent() {
  const ACTIVE_ROOM_KEY = 'plottwists_active_room'
  const router = useRouter()
  const { user } = useAuth()
  const { socket, isConnected, connectionState, reconnectAttempt, setActiveRoom, playerSessionId } = useSocket()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code')
  const nicknameFromUrl = searchParams.get('nickname')
  const toast = useToast()
  const achievementToasts = useAchievementToasts()
  const confetti = useConfetti()
  const prefersReducedMotion = useReducedMotion()
  const variants = getVariants(prefersReducedMotion)

  // Subscriptions ref
  const subscriptionsRef = useRef<(() => void) | null>(null)

  // Page-owned state
  const [hasJoined, setHasJoined] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPosterLightbox, setShowPosterLightbox] = useState(false)
  const [hasTriggeredSelectionConfetti, setHasTriggeredSelectionConfetti] = useState(false)
  const recoveryAttemptRef = useRef<string | null>(null)
  const [recoveryResolved, setRecoveryResolved] = useState(false)

  // Store selectors
  const gameState = useGameStore((s) => s.gameState)
  const countdown = useGameStore((s) => s.countdown)
  const roomCode = useGameStore((s) => s.roomCode)
  const script = useScriptStore((s) => s.script)
  const scriptImageUrl = useScriptStore((s) => s.imageUrl)
  const selection = useSelectionStore((s) => s.selection)
  const hasSubmitted = useSelectionStore((s) => s.hasSubmitted)
  const setHasSubmitted = useSelectionStore((s) => s.setHasSubmitted)
  const hostDisconnected = useConnectionStore((s) => s.hostDisconnected)
  const setHostDisconnected = useConnectionStore((s) => s.setHostDisconnected)
  const gameResults = useVotingStore((s) => s.gameResults)

  // ── Initialize store subscriptions when socket is ready ──
  useEffect(() => {
    if (!socket || !isConnected) return
    if (subscriptionsRef.current) return

    subscriptionsRef.current = initStoreSubscriptions(socketManager.raw ? socketManager : {
      on: (event: string, handler: (...args: unknown[]) => void) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on(event as any, handler as any)
        return () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          socket.off(event as any, handler as any)
        }
      },
      emit: (event: string, ...args: unknown[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(socket as any).emit(event, ...args)
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, { toast, achievementToasts })

    return () => {
      if (subscriptionsRef.current) {
        subscriptionsRef.current()
        subscriptionsRef.current = null
      }
    }
  }, [socket, isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Recover active room on initial connect / reconnect before showing the join form.
  useEffect(() => {
    if (!socket || !isConnected) return

    let activeRoom: string | null = null
    try {
      activeRoom = sessionStorage.getItem(ACTIVE_ROOM_KEY)
    } catch {
      activeRoom = null
    }

    if (!activeRoom) {
      setRecoveryResolved(true)
      return
    }

    if (recoveryAttemptRef.current === `${socket.id}:${activeRoom}`) return
    recoveryAttemptRef.current = `${socket.id}:${activeRoom}`

    socket.emit('rejoin_room', activeRoom, playerSessionId, (response) => {
      if (response.success && response.snapshot) {
        applyRoomRecoverySnapshot(response.snapshot)
        useGameStore.getState().setRole(response.snapshot.myRole === 'SPECTATOR' ? 'spectator' : 'player')
        setActiveRoom(response.snapshot.roomCode)
        setHasJoined(true)
      } else {
        setActiveRoom(null)
      }
      setRecoveryResolved(true)
    })
  }, [socket, isConnected, playerSessionId, setActiveRoom])

  // Reset orchestrator state when returning to LOBBY
  useEffect(() => {
    if (gameState === 'LOBBY') {
      useSelectionStore.getState().setSelection({ character: '', setting: '', circumstance: '' })
      useSelectionStore.getState().setHasSubmitted(false)
      useSelectionStore.getState().setIsSubmitting(false)
      setHasTriggeredSelectionConfetti(false)
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
  const handleJoinSuccess = (data: { players: Player[]; myPlayerId: string; myRole: PlayerRole; roomCode: string; roomIsMature: boolean }) => {
    setHasJoined(true)
    useGameStore.getState().setMyPlayerId(data.myPlayerId)
    useGameStore.getState().setMyRole(data.myRole)
    useGameStore.getState().setRoomCode(data.roomCode)
    useGameStore.getState().setRoomIsMature(data.roomIsMature)
    useGameStore.getState().setRole(data.myRole === 'SPECTATOR' ? 'spectator' : 'player')
    useGameStore.getState().setPlayers(data.players)
    setActiveRoom(data.roomCode)
  }

  const handleSubmitCards = () => {
    const sel = useSelectionStore.getState().selection
    if (!socket || !roomCode || !sel.character || !sel.setting || !sel.circumstance) {
      toast.error('Please select all cards'); return
    }
    useSelectionStore.getState().setIsSubmitting(true)
    withTimeout<{ success: boolean; error?: string }>(
      (cb) => socket.emit('submit_cards', roomCode, sel, cb)
    ).then((response) => {
      useSelectionStore.getState().setIsSubmitting(false)
      if (response.success) { setHasSubmitted(true); toast.success('Cards submitted!') }
      else toast.error(response.error || 'Failed to submit cards')
    }).catch(() => {
      useSelectionStore.getState().setIsSubmitting(false)
      toast.error('Request timed out — please try again')
    })
  }

  const leaveRoom = async () => {
    if (socket && roomCode) {
      try {
        await withTimeout<{ success: boolean; error?: string }>(
          (cb) => socket.emit('leave_room', roomCode, cb),
          3000
        )
      } catch {
        // If leave_room fails we still clear local recovery state and navigate away.
      }
    }
    setActiveRoom(null)
    router.push('/')
  }

  if (!isConnected) {
    return (
      <PageContainer size="narrow" centered>
        <div className="text-center">
          <div className="text-6xl mb-6">⚡</div>
          <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Connecting...</p>
        </div>
      </PageContainer>
    )
  }

  if (!recoveryResolved || !hasJoined) {
    return (
      <PageContainer size="narrow" centered>
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
              {recoveryResolved ? (
                <JoinForm
                  socket={socket} isConnected={isConnected}
                  initialRoomCode={codeFromUrl || ''}
                  initialNickname={nicknameFromUrl || ''}
                  toast={toast}
                  onJoinSuccess={handleJoinSuccess}
                  onShowOnboarding={() => setShowOnboarding(true)}
                  onNavigateHome={() => router.push('/')}
                />
              ) : (
                <div style={{ minHeight: '30vh' }} />
              )}
            </GameErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </PageContainer>
    )
  }

  const myRole = useGameStore.getState().myRole

  return (
    <PageContainer size="full" style={{ padding: 0 }}>
      <ReconnectionBanner reconnecting={connectionState === 'reconnecting'} attempt={reconnectAttempt} />
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="join" />

      {/* Host Disconnected Overlay */}
      <AnimatePresence>
        {hostDisconnected && (
          <motion.div {...variants.fade}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            role="alert" aria-live="assertive">
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
                <Button variant="secondary" fullWidth onClick={() => setHostDisconnected(false)}>Wait for Reconnection</Button>
                <Button variant="primary" fullWidth onClick={leaveRoom}>Return Home</Button>
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
            style={{ background: 'rgba(0, 0, 0, 0.85)' }}
            role="alert" aria-live="assertive">
            <AnimatePresence mode="wait">
              <motion.div key={countdown}
                initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.3, opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { scale: 2, opacity: 0 }}
                transition={SPRING_BOUNCY}
                className="text-center">
                <div style={{ fontSize: '120px', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{countdown}</div>
                <div style={{ fontSize: '18px', color: 'var(--color-text-tertiary)', marginTop: '16px' }}>Get ready to perform!</div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnection overlay */}
      <ReconnectingOverlay gameState={gameState} />

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && <MoviePosterFrame imageUrl={scriptImageUrl} title={script?.title} variant="lightbox" />}
      </Modal>

      <GameShell
        role={myRole === 'SPECTATOR' ? 'spectator' : 'player'}
        toast={toast}
        userUid={user?.uid || ''}
        isGuest={!user}
        onSubmitCards={handleSubmitCards}
        onLeave={leaveRoom}
        onShowPosterLightbox={() => setShowPosterLightbox(true)}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <AchievementToast achievements={achievementToasts.achievements} onDismiss={achievementToasts.dismissAchievement} />
    </PageContainer>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <PageContainer size="narrow" centered>
        <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </PageContainer>
    }>
      <JoinPageContent />
    </Suspense>
  )
}
