'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { RoomSettings, ScriptCustomization, AudioSettings, CardSelection, GameMode } from '@/lib/types'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { VARIANTS, MOTION, BUTTON, getVariants, getTransition } from '@/lib/animations'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Modal } from '@/components/Modal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useTeleprompterSettings } from '@/hooks/useTeleprompterSettings'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
const PurchaseCreditsModal = dynamic(() => import('@/components/PurchaseCreditsModal').then(m => ({ default: m.PurchaseCreditsModal })), { ssr: false })
import { AchievementToast, useAchievementToasts } from '@/components/AchievementToast'
import { analytics } from '@/lib/analytics'
import { useHostSocket } from '@/hooks/useHostSocket'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { successHaptic } from '@/hooks/useHaptics'

import { HostLobby } from './components/HostLobby'
import { HostSelection } from './components/HostSelection'
import { HostLoading } from './components/HostLoading'
import { HostPerforming } from './components/HostPerforming'
import { HostVoting } from './components/HostVoting'
import { HostResults } from './components/HostResults'

export default function HostPage() {
  const router = useRouter()
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
    selection, setSelection,
    hasSubmittedSelection, setHasSubmittedSelection,
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

  // Create room
  useEffect(() => {
    if (authLoading || !user) return
    if (!socket || !isConnected || roomCreatedRef.current) return
    roomCreatedRef.current = true
    socket.emit('create_room', settings, (response) => {
      if (response.success && response.code) {
        setRoomCode(response.code)
        analytics.gameCreated(settings.gameMode)
      }
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
      // Confirm before enabling mature content
      if (!window.confirm('Enable "After Dark" mode? This allows adult themes and mature humor. Only for players 17+.')) return
    }
    const newSettings = { ...settings, isMature: !settings.isMature }
    setSettings(newSettings)
    socket?.emit('update_room_settings', roomCode, { isMature: newSettings.isMature })
  }

  const updateGameMode = (newMode: GameMode) => {
    const newSettings = { ...settings, gameMode: newMode }
    setSettings(newSettings)
    socket?.emit('update_room_settings', roomCode, { gameMode: newMode })
  }

  const nextLine = () => {
    if (script && currentLineIndex < script.lines.length - 1) {
      const newIndex = currentLineIndex + 1
      setCurrentLineIndex(newIndex)
      socket?.emit('jump_to_line', roomCode, newIndex)
    }
  }

  const previousLine = () => {
    if (currentLineIndex > 0) {
      const newIndex = currentLineIndex - 1
      setCurrentLineIndex(newIndex)
      socket?.emit('jump_to_line', roomCode, newIndex)
    }
  }

  const togglePlayPause = () => {
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)
    if (newPlayingState) socket?.emit('resume_script', roomCode)
    else socket?.emit('pause_script', roomCode)
  }

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

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${roomCode}` : ''

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

      {/* Insufficient Credits Modal */}
      <AnimatePresence>
        {showInsufficientCredits && (
          <motion.div {...variants.fade}
            onClick={() => setShowInsufficientCredits(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <motion.div {...variants.scaleIn}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: '1rem', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>Out of scripts!</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>Buy more to keep the show going.</p>
              <button onClick={() => { setShowInsufficientCredits(false); setShowPurchaseModal(true) }}
                className="user-menu-btn user-menu-btn-primary"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '1rem', marginBottom: '0.5rem' }}>
                Buy Credits
              </button>
              <button onClick={() => setShowInsufficientCredits(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Lightbox */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <div className="flex justify-center">
            <img src={scriptImageUrl} alt={`${script?.title ?? 'Movie'} Poster`}
              style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg, 12px)' }} />
          </div>
        )}
      </Modal>

      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <HostLobby
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
          />
        )}

        {gameState === 'SELECTION' && (
          <HostSelection
            key="selection"
            settings={settings} players={players}
            selection={selection} setSelection={setSelection}
            hasSubmittedSelection={hasSubmittedSelection}
            isSubmittingCards={isSubmittingCards}
            availableCards={availableCards}
            onSubmitSoloCards={handleSubmitSoloCards}
            onBackToLobby={() => setGameState('LOBBY')}
            toast={toast}
          />
        )}

        {gameState === 'LOADING' && (
          <HostLoading
            key="loading"
            settings={settings}
            loadingProgress={loadingProgress} loadingPhase={loadingPhase}
            scriptTitlePreview={scriptTitlePreview}
            greenRoomQuestion={greenRoomQuestion}
            scriptGenerationTimedOut={scriptGenerationTimedOut}
            onRetry={() => { socket?.emit('start_game', roomCode) }}
            onBackToLobby={() => { setGameState('LOBBY') }}
          />
        )}

        {gameState === 'PERFORMING' && script && (
          <HostPerforming
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
          />
        )}

        {gameState === 'VOTING' && (
          <HostVoting key="voting" players={players} />
        )}

        {gameState === 'RESULTS' && (
          <HostResults
            key="results"
            script={script} gameResults={gameResults}
            scriptImageUrl={scriptImageUrl}
            socket={socket} userUid={user?.uid || ''}
            toast={toast}
            onShowPosterLightbox={() => setShowPosterLightbox(true)}
            onRequestSequel={requestSequel}
            onRequestNewGame={requestNewGame}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <AchievementToast achievements={achievementToasts.achievements} onDismiss={achievementToasts.dismissAchievement} />
    </div>
  )
}
