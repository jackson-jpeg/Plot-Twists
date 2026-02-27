'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { RoomSettings, ScriptCustomization, AudioSettings, CardSelection, GameMode } from '@/lib/types'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { VARIANTS, MOTION, getVariants } from '@/lib/animations'
import { withTimeout } from '@/lib/socketTimeout'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Modal } from '@/components/Modal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useTeleprompterSettings } from '@/hooks/useTeleprompterSettings'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
const PurchaseCreditsModal = dynamic(() => import('@/components/PurchaseCreditsModal').then(m => ({ default: m.PurchaseCreditsModal })), { ssr: false, loading: () => null })
import { AchievementToast, useAchievementToasts } from '@/components/AchievementToast'
import { analytics } from '@/lib/analytics'
import { useHostSocket } from '@/hooks/useHostSocket'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { successHaptic } from '@/hooks/useHaptics'

import { GameErrorBoundary } from '@/components/GameErrorBoundary'
import { ReconnectingOverlay } from '@/components/ReconnectingOverlay'
import { MoviePosterFrame } from '@/components/MoviePosterFrame'
const HostLobby = dynamic(() => import('./components/HostLobby').then(m => ({ default: m.HostLobby })), { ssr: false, loading: () => null })
const HostSelection = dynamic(() => import('./components/HostSelection').then(m => ({ default: m.HostSelection })), { ssr: false, loading: () => null })
const HostLoading = dynamic(() => import('./components/HostLoading').then(m => ({ default: m.HostLoading })), { ssr: false, loading: () => null })
const HostPerforming = dynamic(() => import('./components/HostPerforming').then(m => ({ default: m.HostPerforming })), { ssr: false, loading: () => null })
const HostVoting = dynamic(() => import('./components/HostVoting').then(m => ({ default: m.HostVoting })), { ssr: false, loading: () => null })
const HostResults = dynamic(() => import('./components/HostResults').then(m => ({ default: m.HostResults })), { ssr: false, loading: () => null })

function HostPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { socket, isConnected } = useSocket()
  const confetti = useConfetti()
  const prefersReducedMotion = useReducedMotion()
  const variants = getVariants(prefersReducedMotion)
  useWakeLock()
  useAudioPlayer({ socket, isConnected })
  const toast = useToast()
  const achievementToasts = useAchievementToasts()

  const [roomCode, setRoomCode] = useState('')
  const [settings, setSettings] = useState<RoomSettings>({ isMature: false, gameMode: 'ENSEMBLE' })
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
  const [selectedPackId, setSelectedPackId] = useState('standard')
  const [gameSetupMode, setGameSetupMode] = useState<'quick' | 'custom'>('quick')
  const [isSubmittingCards, setIsSubmittingCards] = useState(false)
  const [hasTriggeredSelectionConfetti, setHasTriggeredSelectionConfetti] = useState(false)
  const [chaosCooldownRemaining, setChaosCooldownRemaining] = useState(0)
  const [chaosShaking, setChaosShaking] = useState(false)

  const roomCreatedRef = React.useRef(false)

  const {
    settings: teleprompterSettings,
    setPreset: setTeleprompterPreset,
    setCustom: setTeleprompterCustom,
    toggleAutoScroll: toggleTeleprompterAutoScroll,
    isLoading: teleprompterSettingsLoading,
  } = useTeleprompterSettings()

  const {
    gameState, setGameState,
    players,
    script,
    currentLineIndex, setCurrentLineIndex,
    isPlaying, setIsPlaying,
    greenRoomQuestion,
    gameResults,
    availableCards,
    networkLatency,
    scriptGenerationTimedOut,
    loadingProgress,
    loadingPhase,
    scriptTitlePreview,
    scriptImageUrl,
    isGeneratingImage,
    chaosCooldown, setChaosCooldown,
    creditBalance, setCreditBalance,
    showInsufficientCredits, setShowInsufficientCredits,
    spectatorMessages,
    countdown,
    selection, setSelection,
    hasSubmittedSelection, setHasSubmittedSelection,
    xpEvents,
    levelUpData, setLevelUpData,
  } = useHostSocket({ socket, isConnected, settings, roomCode, playerId: user?.uid || '', toast, achievementToasts })

  // Auth guard — require signed-in user
  useEffect(() => {
    if (!authLoading && !user) router.push('/')
  }, [user, authLoading, router])

  // Read pack ID from localStorage
  useEffect(() => {
    try {
      const savedPack = localStorage.getItem('plottwists_selected_pack')
      if (savedPack) { setSelectedPackId(savedPack); localStorage.removeItem('plottwists_selected_pack') }
    } catch { /* ignore */ }
  }, [])

  // Initialize public game from URL param
  useEffect(() => {
    if (searchParams.get('public') === 'true') {
      setSettings(prev => ({ ...prev, isPublic: true }))
    }
  }, [searchParams])

  // Lock body scroll when countdown overlay is visible
  useEffect(() => {
    if (countdown !== null) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [countdown])

  // Create room
  useEffect(() => {
    if (authLoading || !user) return
    if (!socket || !isConnected || roomCreatedRef.current) return
    roomCreatedRef.current = true
    withTimeout<{ success: boolean; code?: string }>(
      (cb) => socket.emit('create_room', settings, cb)
    ).then((response) => {
      if (response.success && response.code) {
        setRoomCode(response.code)
        analytics.gameCreated(settings.gameMode)
      }
    }).catch(() => {
      roomCreatedRef.current = false
      toast.error('Failed to create room — please refresh')
    })
    socket.emit('get_credit_balance', (response) => {
      if (response.success && response.balance) setCreditBalance(response.balance)
    })
  }, [socket, isConnected, settings, authLoading, user, setCreditBalance])

  // Reset orchestrator state when returning to LOBBY (new game)
  useEffect(() => {
    if (gameState === 'LOBBY') {
      setIsSubmittingCards(false)
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

  // CHAOS cooldown timer
  useEffect(() => {
    if (!chaosCooldown) return
    setChaosCooldownRemaining(30)
    const interval = setInterval(() => {
      setChaosCooldownRemaining(prev => {
        if (prev <= 0.1) { setChaosCooldown(false); clearInterval(interval); return 0 }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(interval)
  }, [chaosCooldown, setChaosCooldown])

  // --- Actions ---
  const startGame = () => {
    socket?.emit('update_room_settings', roomCode, { scriptCustomization, audioSettings, cardPackId: selectedPackId })
    socket?.emit('start_game', roomCode)
  }

  const handleSubmitSoloCards = () => {
    if (!socket || !roomCode || !selection.character || !selection.setting || !selection.circumstance) {
      toast.error('Please select all cards'); return
    }
    setIsSubmittingCards(true)
    socket.emit('submit_cards', roomCode, selection, (response) => {
      setIsSubmittingCards(false)
      if (response.success) { setHasSubmittedSelection(true); toast.success('Cards submitted!') }
      else toast.error(response.error || 'Failed to submit cards')
    })
  }

  const toggleMature = () => {
    if (!settings.isMature) {
      setShowAgeGate(true)
      return
    }
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

  const nextLine = useCallback(() => {
    if (script && currentLineIndex < script.lines.length - 1) {
      const newIndex = currentLineIndex + 1
      setCurrentLineIndex(newIndex)
      socket?.emit('jump_to_line', roomCode, newIndex)
    }
  }, [script, currentLineIndex, socket, roomCode])

  const previousLine = useCallback(() => {
    if (currentLineIndex > 0) {
      const newIndex = currentLineIndex - 1
      setCurrentLineIndex(newIndex)
      socket?.emit('jump_to_line', roomCode, newIndex)
    }
  }, [currentLineIndex, socket, roomCode])

  const togglePlayPause = useCallback(() => {
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)
    if (newPlayingState) socket?.emit('resume_script', roomCode)
    else socket?.emit('pause_script', roomCode)
  }, [isPlaying, socket, roomCode])

  const triggerChaos = useCallback(() => {
    if (!socket || chaosCooldown) return
    socket.emit('start_plot_twist', roomCode)
    setChaosCooldown(true)
    setChaosShaking(true)
    setTimeout(() => setChaosShaking(false), 500)
    successHaptic() // native haptics on iOS; no-op on web
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]) // Android web fallback
    toast.info(settings.gameMode === 'SOLO' ? 'PLOT TWIST incoming!' : 'CHAOS unleashed! Audience is voting on a plot twist...')
  }, [socket, roomCode, chaosCooldown, toast, setChaosCooldown])

  const handleSetupModeChange = (mode: 'quick' | 'custom') => {
    setGameSetupMode(mode)
    if (mode === 'quick') {
      const newSettings = { ...settings, gameMode: 'ENSEMBLE' as const }
      setSettings(newSettings)
      socket?.emit('update_room_settings', roomCode, { gameMode: 'ENSEMBLE' })
      setSelectedPackId('standard')
      setScriptCustomization({ comedyStyle: 'witty', scriptLength: 'standard', difficulty: 'intermediate', physicalComedy: 'minimal', enableCallbacks: true })
      setAudioSettings({
        voiceEnabled: false, voiceSettings: { enabled: false, provider: 'browser', speed: 1.0, pitch: 1.0, volume: 0.8 },
        soundEffectsEnabled: true, soundEffectsVolume: 0.5, ambienceEnabled: false, ambienceVolume: 0.3, turnChimeEnabled: true,
      })
    }
  }

  const requestSequel = () => { setGameState('LOADING'); socket?.emit('request_sequel', roomCode) }
  const requestNewGame = (keepSelections: boolean = false) => { socket?.emit('request_new_game', roomCode, { keepSelections }) }

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/invite/${roomCode}` : ''

  // Auth loading / unauthenticated
  if (authLoading || !user) {
    return (
      <div className="page-container items-center justify-center">
        <div className="text-center">
          <div className="skeleton skeleton-heading" style={{ margin: '0 auto' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', margin: '1rem auto' }} />
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="page-container items-center justify-center">
        <motion.div {...variants.scaleIn} className="text-center">
          <motion.div className="text-6xl mb-6" animate={prefersReducedMotion ? {} : { rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⚡</motion.div>
          <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Connecting...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="host" />
      <PurchaseCreditsModal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} />

      {/* Age Gate Modal for After Dark mode */}
      <Modal isOpen={showAgeGate} onClose={() => setShowAgeGate(false)} title="Age Verification" maxWidth="380px">
        <div className="text-center">
          <div className="text-5xl mb-4">🌙</div>
          <h3 className="text-lg font-display font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            After Dark Mode
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            This mode contains adult themes and mature humor. You must be at least 17 years old to enable it.
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
            By continuing, you confirm that you are 17 or older.
          </p>
          <div className="flex flex-col gap-2">
            <motion.button
              onClick={confirmMatureMode}
              className="btn btn-primary w-full"
              style={{ background: 'var(--color-purple)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              I'm 17 or Older — Enable
            </motion.button>
            <button
              onClick={() => setShowAgeGate(false)}
              className="text-sm py-2 cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Insufficient Credits Modal */}
      <Modal isOpen={showInsufficientCredits} onClose={() => setShowInsufficientCredits(false)} title="Out of scripts!" maxWidth="380px">
        <div className="text-center">
          <div className="text-5xl mb-3">🎬</div>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>Buy more credits to keep the show going.</p>
          <button onClick={() => { setShowInsufficientCredits(false); setShowPurchaseModal(true) }}
            className="btn btn-primary w-full mb-2">
            Buy Credits
          </button>
          <button onClick={() => setShowInsufficientCredits(false)}
            className="btn btn-ghost w-full text-sm">
            Dismiss
          </button>
        </div>
      </Modal>

      {/* Reconnection overlay for mid-game socket drops */}
      <ReconnectingOverlay gameState={gameState} />

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <MoviePosterFrame imageUrl={scriptImageUrl} title={script?.title} variant="lightbox" />
        )}
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
                transition={MOTION.bouncy}
                className="text-center">
                <div style={{ fontSize: '120px', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{countdown}</div>
                <div style={{ fontSize: '18px', color: 'var(--color-text-tertiary)', marginTop: '16px' }}>Curtain up!</div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <GameErrorBoundary phaseName="lobby" key="lobby-eb"><HostLobby
            key="lobby"
            roomCode={roomCode} joinUrl={joinUrl} isConnected={isConnected}
            players={players} settings={settings} creditBalance={creditBalance}
            gameSetupMode={gameSetupMode} selectedPackId={selectedPackId}
            scriptCustomization={scriptCustomization} audioSettings={audioSettings}
            socket={socket} toast={toast}
            onStartGame={startGame} onToggleMature={toggleMature}
            onUpdateGameMode={updateGameMode} onSetupModeChange={handleSetupModeChange}
            onSetSelectedPackId={setSelectedPackId}
            onSetScriptCustomization={setScriptCustomization}
            onSetAudioSettings={setAudioSettings}
            onSetSettings={setSettings}
            onShowOnboarding={() => setShowOnboarding(true)}
            onNavigateHome={() => router.push('/')}
          /></GameErrorBoundary>
        )}

        {gameState === 'SELECTION' && (
          <GameErrorBoundary phaseName="selection" key="selection-eb"><HostSelection
            key="selection"
            settings={settings} players={players}
            selection={selection} setSelection={setSelection}
            hasSubmittedSelection={hasSubmittedSelection}
            isSubmittingCards={isSubmittingCards}
            availableCards={availableCards}
            greenRoomQuestion={greenRoomQuestion}
            onSubmitSoloCards={handleSubmitSoloCards}
            onBackToLobby={() => { socket?.emit('request_new_game', roomCode); setGameState('LOBBY') }}
            toast={toast}
          /></GameErrorBoundary>
        )}

        {gameState === 'LOADING' && (
          <GameErrorBoundary phaseName="loading" key="loading-eb"><HostLoading
            key="loading"
            settings={settings}
            loadingProgress={loadingProgress} loadingPhase={loadingPhase}
            scriptTitlePreview={scriptTitlePreview}
            greenRoomQuestion={greenRoomQuestion}
            scriptGenerationTimedOut={scriptGenerationTimedOut}
            onRetry={() => { socket?.emit('retry_script_generation', roomCode) }}
            onBackToLobby={() => { socket?.emit('request_new_game', roomCode); setGameState('LOBBY') }}
          /></GameErrorBoundary>
        )}

        {gameState === 'PERFORMING' && script && (
          <GameErrorBoundary phaseName="performing" key="performing-eb"><HostPerforming
            key="performing"
            script={script} currentLineIndex={currentLineIndex}
            isPlaying={isPlaying} roomCode={roomCode}
            networkLatency={networkLatency}
            spectatorMessages={spectatorMessages}
            scriptImageUrl={scriptImageUrl}
            isGeneratingImage={isGeneratingImage}
            chaosCooldown={chaosCooldown}
            chaosCooldownRemaining={chaosCooldownRemaining}
            chaosShaking={chaosShaking}
            isSoloMode={settings.gameMode === 'SOLO'}
            teleprompterSettings={teleprompterSettings}
            teleprompterSettingsLoading={teleprompterSettingsLoading}
            onNextLine={nextLine} onPreviousLine={previousLine}
            onTogglePlayPause={togglePlayPause}
            onTriggerChaos={triggerChaos}
            onSetTeleprompterPreset={setTeleprompterPreset}
            onSetTeleprompterCustom={setTeleprompterCustom}
            onToggleTeleprompterAutoScroll={toggleTeleprompterAutoScroll}
            onShowPosterLightbox={() => setShowPosterLightbox(true)}
            onEndPerformance={() => socket?.emit('end_performance', roomCode)}
          /></GameErrorBoundary>
        )}

        {gameState === 'VOTING' && (
          <GameErrorBoundary phaseName="voting" key="voting-eb"><HostVoting key="voting" players={players} script={script} /></GameErrorBoundary>
        )}

        {gameState === 'RESULTS' && (
          <GameErrorBoundary phaseName="results" key="results-eb"><HostResults
            key="results"
            script={script} gameResults={gameResults}
            scriptImageUrl={scriptImageUrl}
            socket={socket} userUid={user?.uid || ''}
            toast={toast}
            xpEvents={xpEvents}
            levelUpData={levelUpData}
            onDismissLevelUp={() => setLevelUpData(null)}
            onShowPosterLightbox={() => setShowPosterLightbox(true)}
            onRequestSequel={requestSequel}
            onRequestNewGame={requestNewGame}
          /></GameErrorBoundary>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <AchievementToast achievements={achievementToasts.achievements} onDismiss={achievementToasts.dismissAchievement} />
    </div>
  )
}

export default function HostPage() {
  return (
    <Suspense fallback={
      <div className="page-container items-center justify-center">
        <div className="text-center">
          <div className="skeleton skeleton-heading" style={{ margin: '0 auto' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', margin: '1rem auto' }} />
        </div>
      </div>
    }>
      <HostPageContent />
    </Suspense>
  )
}
