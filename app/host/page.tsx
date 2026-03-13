'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { RoomSettings, ScriptCustomization, AudioSettings, GameMode } from '@/lib/types'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SPRING_BOUNCY, ENTER_SCALE, ENTER_Y } from '@/lib/motion'
import { getVariants } from '@/lib/animations'
import { withTimeout } from '@/lib/socketTimeout'
import { useConfetti } from '@/hooks/useConfetti'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Modal } from '@/components/Modal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
const PurchaseCreditsModal = dynamic(() => import('@/components/PurchaseCreditsModal').then(m => ({ default: m.PurchaseCreditsModal })), { ssr: false, loading: () => null })
import { AchievementToast, useAchievementToasts } from '@/components/AchievementToast'
import { analytics } from '@/lib/analytics'
import { applyRoomRecoverySnapshot } from '@/lib/roomRecovery'

import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { initStoreSubscriptions } from '@/stores/subscriptions'
import { socketManager } from '@/lib/socketManager'
import { Button, PageContainer } from '@/components/ui'
import { Skeleton } from '@/components/EmptyState'
import { ReconnectingOverlay } from '@/components/ReconnectingOverlay'
import { ReconnectionBanner } from '@/components/ReconnectionBanner'
import { MoviePosterFrame } from '@/components/MoviePosterFrame'
import { GameShell } from '@/app/game/GameShell'

function HostPageContent() {
  const ACTIVE_ROOM_KEY = 'plottwists_active_room'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, getToken } = useAuth()
  const { socket, isConnected, connectionState, reconnectAttempt, setActiveRoom, playerSessionId } = useSocket()
  const confetti = useConfetti()
  const prefersReducedMotion = useReducedMotion()
  const variants = getVariants(prefersReducedMotion)
  const toast = useToast()
  const achievementToasts = useAchievementToasts()

  // Subscriptions ref to avoid double-init
  const subscriptionsRef = useRef<(() => void) | null>(null)

  // Host-owned state: room settings, modals, UI
  const [settings, setSettings] = useState<RoomSettings>(() => ({
    isMature: false,
    gameMode: searchParams.get('mode') === 'solo' ? 'SOLO' : 'ENSEMBLE',
    isPublic: searchParams.get('public') === 'true' || undefined,
  }))
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPosterLightbox, setShowPosterLightbox] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showAgeGate, setShowAgeGate] = useState(false)
  const [scriptCustomization, setScriptCustomization] = useState<ScriptCustomization>({
    comedyStyle: 'witty', scriptLength: 'standard', difficulty: 'intermediate',
    physicalComedy: 'minimal', enableCallbacks: true,
  })
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    voiceEnabled: false,
    voiceSettings: { enabled: false, provider: 'browser', speed: 1.0, pitch: 1.0, volume: 0.8 },
    soundEffectsEnabled: true, soundEffectsVolume: 0.5,
    ambienceEnabled: false, ambienceVolume: 0.3, turnChimeEnabled: true,
  })
  const [hasTriggeredSelectionConfetti, setHasTriggeredSelectionConfetti] = useState(false)
  const roomCreatedRef = useRef(false)
  const recoveryAttemptRef = useRef<string | null>(null)
  const [recoveryResolved, setRecoveryResolved] = useState(false)

  // Store selectors
  const gameState = useGameStore((s) => s.gameState)
  const players = useGameStore((s) => s.players)
  const roomCode = useGameStore((s) => s.roomCode)
  const countdown = useGameStore((s) => s.countdown)
  const showInsufficientCredits = useGameStore((s) => s.showInsufficientCredits)
  const setShowInsufficientCredits = useGameStore((s) => s.setShowInsufficientCredits)
  const script = useScriptStore((s) => s.script)
  const scriptImageUrl = useScriptStore((s) => s.imageUrl)
  const selection = useSelectionStore((s) => s.selection)
  const hasSubmittedSelection = useSelectionStore((s) => s.hasSubmitted)
  const setHasSubmittedSelection = useSelectionStore((s) => s.setHasSubmitted)

  // ── Initialize store subscriptions when socket is ready ──
  useEffect(() => {
    if (!socket || !isConnected) return
    if (subscriptionsRef.current) return
    // Wire socket events to Zustand stores via socketManager
    // During migration, socketManager uses SocketContext's raw socket
    if (!socketManager.raw) {
      // Connect socketManager using the existing socket's connection info
      // For now, we bridge by subscribing directly through the socket
    }
    subscriptionsRef.current = initStoreSubscriptions(socketManager.raw ? socketManager : {
      // Adapter: wrap the existing socket to match SocketManager interface
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

    // Set role
    useGameStore.getState().setRole('host')

    return () => {
      if (subscriptionsRef.current) {
        subscriptionsRef.current()
        subscriptionsRef.current = null
      }
    }
  }, [socket, isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/sign-in')
  }, [user, authLoading, router])

  // Read pack ID from localStorage
  useEffect(() => {
    try {
      const savedPack = localStorage.getItem('plottwists_selected_pack')
      if (savedPack) {
        useSelectionStore.getState().setSelectedPackId(savedPack)
        localStorage.removeItem('plottwists_selected_pack')
      }
    } catch { /* ignore */ }
  }, [])

  // Lock body scroll when countdown overlay is visible
  useEffect(() => {
    if (countdown !== null) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [countdown])

  // Recover active room on initial connect / reconnect before creating a new room.
  useEffect(() => {
    if (authLoading || !user || !socket || !isConnected) return

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
        useGameStore.getState().setRole('host')
        setSettings(response.snapshot.roomSettings ?? settings)
        setScriptCustomization(response.snapshot.roomSettings?.scriptCustomization ?? scriptCustomization)
        setAudioSettings(response.snapshot.roomSettings?.audioSettings ?? audioSettings)
        roomCreatedRef.current = true
        setActiveRoom(response.snapshot.roomCode)
      } else {
        roomCreatedRef.current = false
        setActiveRoom(null)
      }
      setRecoveryResolved(true)
    })
  }, [socket, isConnected, authLoading, user, playerSessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Create room
  useEffect(() => {
    if (authLoading || !user) return
    if (!recoveryResolved) return
    if (!socket || !isConnected || roomCreatedRef.current) return
    roomCreatedRef.current = true
    withTimeout<{ success: boolean; code?: string }>(
      (cb) => socket.emit('create_room', settings, cb)
    ).then((response) => {
      if (response.success && response.code) {
        useGameStore.getState().setRoomCode(response.code)
        setActiveRoom(response.code)
        analytics.gameCreated(settings.gameMode)
      }
    }).catch(() => {
      roomCreatedRef.current = false
      toast.error('Failed to create room — please refresh')
    })
    socket.emit('get_credit_balance', (response) => {
      if (response.success && response.balance) {
        useGameStore.getState().setCreditBalance(response.balance)
      }
    })
  }, [socket, isConnected, settings, authLoading, user, recoveryResolved]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset orchestrator state when returning to LOBBY
  useEffect(() => {
    if (gameState === 'LOBBY') {
      setHasTriggeredSelectionConfetti(false)
      setShowPosterLightbox(false)
    }
  }, [gameState])

  // Confetti on results
  useEffect(() => {
    if (gameState === 'RESULTS') {
      setTimeout(() => confetti.fireWinnerConfetti(), 500)
      analytics.gameCompleted(settings.gameMode, players.length)
    }
  }, [gameState, confetti, settings.gameMode, players.length])

  // Confetti when all cards selected (solo)
  useEffect(() => {
    if (settings.gameMode === 'SOLO' && selection.character && selection.setting && selection.circumstance &&
        !hasTriggeredSelectionConfetti && gameState === 'SELECTION' && !hasSubmittedSelection) {
      setHasTriggeredSelectionConfetti(true)
      setTimeout(() => confetti.fireWinnerConfetti(), 250)
    }
  }, [selection, hasTriggeredSelectionConfetti, gameState, hasSubmittedSelection, settings.gameMode, confetti])

  useEffect(() => {
    if (!selection.character && !selection.setting && !selection.circumstance) setHasTriggeredSelectionConfetti(false)
  }, [selection])

  // --- Actions ---
  const startGame = () => {
    const packId = useSelectionStore.getState().selectedPackId || 'standard'
    socket?.emit('update_room_settings', roomCode, { scriptCustomization, audioSettings, cardPackId: packId })
    socket?.emit('start_game', roomCode)
  }

  const handleSubmitSoloCards = () => {
    const sel = useSelectionStore.getState().selection
    if (!socket || !roomCode || !sel.character || !sel.setting || !sel.circumstance) {
      toast.error('Please select all cards'); return
    }
    useSelectionStore.getState().setIsSubmitting(true)
    socket.emit('submit_cards', roomCode, sel, (response) => {
      useSelectionStore.getState().setIsSubmitting(false)
      if (response.success) { setHasSubmittedSelection(true); toast.success('Cards submitted!') }
      else toast.error(response.error || 'Failed to submit cards')
    })
  }

  const toggleMature = () => {
    if (!settings.isMature) { setShowAgeGate(true); return }
    const newSettings = { ...settings, isMature: false }
    setSettings(newSettings)
    socket?.emit('update_room_settings', roomCode, { isMature: false })
  }

  const confirmMatureMode = () => {
    setShowAgeGate(false)
    const newSettings = { ...settings, isMature: true }
    setSettings(newSettings)
    socket?.emit('update_room_settings', roomCode, { isMature: true })
  }

  const updateGameMode = (newMode: GameMode) => {
    const newSettings = { ...settings, gameMode: newMode }
    setSettings(newSettings)
    socket?.emit('update_room_settings', roomCode, { gameMode: newMode })
  }

  const handleSetupModeChange = (mode: 'quick' | 'custom') => {
    useSelectionStore.getState().setGameSetupMode(mode)
    if (mode === 'quick') {
      const newSettings = { ...settings, gameMode: 'ENSEMBLE' as const }
      setSettings(newSettings)
      socket?.emit('update_room_settings', roomCode, { gameMode: 'ENSEMBLE' })
      useSelectionStore.getState().setSelectedPackId('standard')
      setScriptCustomization({ comedyStyle: 'witty', scriptLength: 'standard', difficulty: 'intermediate', physicalComedy: 'minimal', enableCallbacks: true })
      setAudioSettings({
        voiceEnabled: false, voiceSettings: { enabled: false, provider: 'browser', speed: 1.0, pitch: 1.0, volume: 0.8 },
        soundEffectsEnabled: true, soundEffectsVolume: 0.5, ambienceEnabled: false, ambienceVolume: 0.3, turnChimeEnabled: true,
      })
    }
  }

  const handleBackToLobby = () => {
    socket?.emit('request_new_game', roomCode)
    useGameStore.getState().setGameState('LOBBY')
  }

  const requestNewGame = (keepSelections: boolean = false) => {
    socket?.emit('request_new_game', roomCode, { keepSelections })
  }

  const navigateHome = () => {
    setActiveRoom(null)
    router.push('/')
  }

  // Auth loading / unauthenticated
  if (authLoading || !user) {
    return (
      <PageContainer centered>
        <div className="text-center">
          <Skeleton variant="rect" width={200} height={28} className="mx-auto" />
          <Skeleton variant="text" width="60%" height={16} className="mx-auto mt-4" />
        </div>
      </PageContainer>
    )
  }

  if (!isConnected) {
    return (
      <PageContainer centered>
        <motion.div {...variants.scaleIn} className="text-center">
          <motion.div className="text-6xl mb-6" animate={prefersReducedMotion ? {} : { rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⚡</motion.div>
          <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Connecting...</p>
        </motion.div>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="full" className="flex flex-col" style={{ padding: 0 }}>
      <ReconnectionBanner reconnecting={connectionState === 'reconnecting'} attempt={reconnectAttempt} />
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="host" />
      <PurchaseCreditsModal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} />

      {/* Age Gate Modal */}
      <Modal isOpen={showAgeGate} onClose={() => setShowAgeGate(false)} title="Age Verification" maxWidth="380px">
        <div className="text-center">
          <div className="text-5xl mb-4">🌙</div>
          <h3 className="text-lg font-display font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>After Dark Mode</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>This mode contains adult themes and mature humor. You must be at least 17 years old to enable it.</p>
          <p className="text-xs mb-6" style={{ color: 'var(--color-text-tertiary)' }}>By continuing, you confirm that you are 17 or older.</p>
          <div className="flex flex-col gap-2">
            <Button variant="primary" fullWidth onClick={confirmMatureMode}>I'm 17 or Older — Enable</Button>
            <Button variant="ghost" fullWidth size="sm" onClick={() => setShowAgeGate(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Insufficient Credits Modal */}
      <Modal isOpen={showInsufficientCredits} onClose={() => setShowInsufficientCredits(false)} title="Out of scripts!" maxWidth="380px">
        <div className="text-center">
          <div className="text-5xl mb-3" style={{ fontSize: '48px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="var(--color-text-tertiary)" strokeWidth="1.5"/><path d="M10 8l6 4-6 4V8z" fill="var(--color-text-tertiary)"/></svg>
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>Buy more credits to keep the show going.</p>
          <Button variant="primary" fullWidth className="mb-2" onClick={() => { setShowInsufficientCredits(false); setShowPurchaseModal(true) }}>Buy Credits</Button>
          <Button variant="secondary" fullWidth size="sm" onClick={() => setShowInsufficientCredits(false)}>Dismiss</Button>
        </div>
      </Modal>

      {/* Reconnection overlay */}
      <ReconnectingOverlay gameState={gameState} />

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && <MoviePosterFrame imageUrl={scriptImageUrl} title={script?.title} variant="lightbox" />}
      </Modal>

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
                transition={SPRING_BOUNCY}
                className="text-center" role="status" aria-live="assertive">
                <div style={{ fontSize: '120px', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{countdown}</div>
                <div style={{ fontSize: '18px', color: 'var(--color-text-tertiary)', marginTop: '16px' }}>Curtain up!</div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <GameShell
        role="host"
        toast={toast}
        userUid={user.uid}
        settings={settings}
        scriptCustomization={scriptCustomization}
        audioSettings={audioSettings}
        onSetSettings={setSettings}
        onSetScriptCustomization={setScriptCustomization}
        onSetAudioSettings={setAudioSettings}
        onStartGame={startGame}
        onToggleMature={toggleMature}
        onUpdateGameMode={updateGameMode}
        onSetupModeChange={handleSetupModeChange}
        onShowOnboarding={() => setShowOnboarding(true)}
        onNavigateHome={navigateHome}
        onSubmitSoloCards={handleSubmitSoloCards}
        onBackToLobby={handleBackToLobby}
        onRetry={() => socket?.emit('retry_script_generation', roomCode)}
        onShowPosterLightbox={() => setShowPosterLightbox(true)}
        onRequestNewGame={requestNewGame}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <AchievementToast achievements={achievementToasts.achievements} onDismiss={achievementToasts.dismissAchievement} />
    </PageContainer>
  )
}

export default function HostPage() {
  return (
    <Suspense fallback={
      <PageContainer centered>
        <div className="text-center">
          <Skeleton variant="rect" width={200} height={28} className="mx-auto" />
          <Skeleton variant="text" width="60%" height={16} className="mx-auto mt-4" />
        </div>
      </PageContainer>
    }>
      <HostPageContent />
    </Suspense>
  )
}
