'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { Player, Script, RoomSettings, GameResults, ScriptCustomization, AudioSettings, TeleprompterSyncData, CardSelection, ScriptLine, TeleprompterSettings } from '@/lib/types'
import type { GameState } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Modal } from '@/components/Modal'
import { downloadScript, copyScriptToClipboard, getCharactersInScene } from '@/lib/scriptUtils'
import { ScriptCustomizationPanel } from '@/components/ScriptCustomizationPanel'
import { CardPackSelector } from '@/components/CardPackSelector'
import { AudioSettingsPanel } from '@/components/AudioSettingsPanel'
import { AudienceReactionBar } from '@/components/AudienceReactionBar'
import { PlotTwistVoting } from '@/components/PlotTwistVoting'
import { SmartCardSelector } from '@/components/SmartCardSelector'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useTeleprompterSettings } from '@/hooks/useTeleprompterSettings'
import { TeleprompterSettings as TeleprompterSettingsPanel } from '@/components/TeleprompterSettings'
import { useAuth } from '@/contexts/AuthContext'
import { PurchaseCreditsModal } from '@/components/PurchaseCreditsModal'
import { getMoodIndicator, getVisibleLines } from '@/lib/teleprompterUtils'
import { MoviePosterFrame, MoviePosterSkeleton } from '@/components/MoviePosterFrame'
import { AchievementToast, useAchievementToasts } from '@/components/AchievementToast'
import { VARIANTS } from '@/lib/animations'
import { analytics } from '@/lib/analytics'
import { SpectatorTicker } from '@/components/SpectatorChat'
import type { Achievement, SpectatorMessage } from '@/lib/types'

export default function HostPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { socket, isConnected } = useSocket()
  const confetti = useConfetti()
  useWakeLock() // Prevent screen sleep during gameplay
  const [roomCode, setRoomCode] = useState<string>('')
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [script, setScript] = useState<Script | null>(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [greenRoomQuestion, setGreenRoomQuestion] = useState<string>('')
  const [settings, setSettings] = useState<RoomSettings>({
    isMature: false,
    gameMode: 'ENSEMBLE'
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const roomCreatedRef = React.useRef(false)
  const [scriptCustomization, setScriptCustomization] = useState<ScriptCustomization>({
    comedyStyle: 'witty',
    scriptLength: 'standard',
    difficulty: 'intermediate',
    physicalComedy: 'minimal',
    enableCallbacks: true
  })
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    voiceEnabled: false,
    voiceSettings: { enabled: false, provider: 'browser', speed: 1.0, pitch: 1.0, volume: 0.8 },
    soundEffectsEnabled: true,
    soundEffectsVolume: 0.5,
    ambienceEnabled: false,
    ambienceVolume: 0.3,
    turnChimeEnabled: true
  })
  const [selectedPackId, setSelectedPackId] = useState('standard')
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [gameSetupMode, setGameSetupMode] = useState<'quick' | 'custom'>('quick')
  const [scriptGenerationTimedOut, setScriptGenerationTimedOut] = useState(false)
  const scriptGenerationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [scriptTitlePreview, setScriptTitlePreview] = useState<string | null>(null)
  const loadingIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const scriptContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [scriptImageUrl, setScriptImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [showPosterLightbox, setShowPosterLightbox] = useState(false)
  const [chaosCooldown, setChaosCooldown] = useState(false)
  const [chaosCooldownRemaining, setChaosCooldownRemaining] = useState(0)
  const [chaosShaking, setChaosShaking] = useState(false)

  // Credit system state
  const [creditBalance, setCreditBalance] = useState<{ free: number; banked: number; total: number } | null>(null)
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // Share state
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [spectatorMessages, setSpectatorMessages] = useState<SpectatorMessage[]>([])

  // Teleprompter settings hook
  const {
    settings: teleprompterSettings,
    setPreset: setTeleprompterPreset,
    setCustom: setTeleprompterCustom,
    toggleAutoScroll: toggleTeleprompterAutoScroll,
    isLoading: teleprompterSettingsLoading
  } = useTeleprompterSettings()

  // Loading stage messages — driven by real server progress when available
  const loadingStages = [
    { percent: 0, message: "Gathering inspiration...", icon: "🎬" },
    { percent: 10, message: "Connecting to AI...", icon: "🔌" },
    { percent: 20, message: "Assembling characters...", icon: "🎭" },
    { percent: 40, message: "Writing dialogue...", icon: "✍️" },
    { percent: 60, message: "Adding comedic timing...", icon: "😂" },
    { percent: 80, message: "Polishing the script...", icon: "✨" },
    { percent: 95, message: "Almost ready...", icon: "🎪" }
  ]

  const getCurrentLoadingStage = () => {
    // If we have a real phase from the server, use it
    if (loadingPhase) {
      const icon = loadingProgress < 20 ? "🔌" :
                   loadingProgress < 40 ? "🎭" :
                   loadingProgress < 80 ? "✍️" :
                   loadingProgress < 95 ? "✨" : "🎪"
      return { percent: loadingProgress, message: loadingPhase, icon }
    }
    for (let i = loadingStages.length - 1; i >= 0; i--) {
      if (loadingProgress >= loadingStages[i].percent) {
        return loadingStages[i]
      }
    }
    return loadingStages[0]
  }

  // Use centralized animation variants
  const pageTransitionVariants = VARIANTS.pageTransition

  // Solo mode card selection state
  const toast = useToast()
  const achievementToasts = useAchievementToasts()
  const [availableCards, setAvailableCards] = useState<{
    characters: string[]
    settings: string[]
    circumstances: string[]
  }>({ characters: [], settings: [], circumstances: [] })
  const [selection, setSelection] = useState<CardSelection>({
    character: '',
    setting: '',
    circumstance: ''
  })
  const [customInputActive, setCustomInputActive] = useState({
    character: false,
    setting: false,
    circumstance: false
  })
  const [hasSubmittedSelection, setHasSubmittedSelection] = useState(false)
  const [isSubmittingCards, setIsSubmittingCards] = useState(false)
  const [hasTriggeredSelectionConfetti, setHasTriggeredSelectionConfetti] = useState(false)

  // Auth guard: redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && (!user || user.isAnonymous)) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Don't create room until auth resolves and user is authenticated
    if (authLoading || !user || user.isAnonymous) return
    if (!socket || !isConnected || roomCreatedRef.current) return
    roomCreatedRef.current = true
    socket.emit('create_room', settings, (response) => {
      if (response.success && response.code) {
        setRoomCode(response.code)
        analytics.gameCreated(settings.gameMode)
      }
    })
    // Fetch initial credit balance
    socket.emit('get_credit_balance', (response) => {
      if (response.success && response.balance) {
        setCreditBalance(response.balance)
      }
    })
  }, [socket, isConnected, settings, authLoading, user])

  useEffect(() => {
    if (gameState !== 'PERFORMING') return
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextLine()
      else if (e.key === 'ArrowLeft') previousLine()
      else if (e.key === ' ') { e.preventDefault(); togglePlayPause() }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, currentLineIndex, isPlaying])

  // Trigger confetti when results appear
  useEffect(() => {
    if (gameState === 'RESULTS') {
      setTimeout(() => confetti.fireWinnerConfetti(), 500)
      analytics.gameCompleted(settings.gameMode, players.length)
    }
  }, [gameState, confetti, settings.gameMode, players.length])

  // Trigger mini confetti when all cards are selected for the first time (solo mode)
  useEffect(() => {
    if (
      settings.gameMode === 'SOLO' &&
      selection.character &&
      selection.setting &&
      selection.circumstance &&
      !hasTriggeredSelectionConfetti &&
      gameState === 'SELECTION' &&
      !hasSubmittedSelection
    ) {
      setHasTriggeredSelectionConfetti(true)
      confetti.fireWinnerConfetti()
      toast.success('All cards selected! Ready to submit!')
    }
  }, [selection, hasTriggeredSelectionConfetti, gameState, hasSubmittedSelection, settings.gameMode, confetti, toast])

  // Reset confetti trigger when selection resets
  useEffect(() => {
    if (!selection.character && !selection.setting && !selection.circumstance) {
      setHasTriggeredSelectionConfetti(false)
    }
  }, [selection])

  // Auto-scroll to current line when teleprompter settings enable it
  useEffect(() => {
    if (gameState !== 'PERFORMING' || !teleprompterSettings.autoScroll || !scriptContainerRef.current) return

    const currentLineElement = scriptContainerRef.current.querySelector(`[data-line-index="${currentLineIndex}"]`)
    if (currentLineElement) {
      currentLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentLineIndex, gameState, teleprompterSettings.autoScroll])

  useEffect(() => {
    if (!socket || !isConnected) return
    socket.on('players_update', setPlayers)
    socket.on('player_joined', (player: Player) => {
      if (gameState === 'LOBBY' && !player.isHost) {
        toast.success(`${player.nickname} joined the show!`)
      }
    })
    socket.on('game_state_change', (newState: GameState) => {
      setGameState(newState)
      // Reset submission state when kicked back to SELECTION (error recovery)
      if (newState === 'SELECTION') {
        setHasSubmittedSelection(false)
      }
      // Clear timeout and progress interval when leaving LOADING state
      if (newState !== 'LOADING') {
        if (scriptGenerationTimeoutRef.current) {
          clearTimeout(scriptGenerationTimeoutRef.current)
          scriptGenerationTimeoutRef.current = null
        }
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current)
          loadingIntervalRef.current = null
        }
        setScriptGenerationTimedOut(false)
        setLoadingProgress(0)
        setLoadingPhase('')
        setScriptTitlePreview(null)
      }
      // Start timeout when entering LOADING state (real progress comes from server)
      if (newState === 'LOADING') {
        setScriptGenerationTimedOut(false)
        setLoadingProgress(0)
        setLoadingPhase('')
        setScriptTitlePreview(null)
        // Fallback: slow fake progress only if server progress doesn't arrive
        loadingIntervalRef.current = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 15) return prev // Stop fake progress once server should be sending real updates
            return prev + Math.random() * 3 + 1
          })
        }, 2000)
        scriptGenerationTimeoutRef.current = setTimeout(() => {
          setScriptGenerationTimedOut(true)
        }, 90000) // 90 second timeout with abort+retry
      }
    })
    // Real-time script generation progress from server streaming
    socket.on('script_generation_progress', (data: { phase: string; percent: number; title?: string }) => {
      setLoadingProgress(data.percent)
      setLoadingPhase(data.phase)
      if (data.title) setScriptTitlePreview(data.title)
      // Clear fake progress interval once we get real progress
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
    })
    socket.on('green_room_prompt', setGreenRoomQuestion)
    socket.on('script_ready', (newScript) => {
      setScript(newScript)
      setCurrentLineIndex(0)
      setScriptImageUrl(newScript.imageUrl || null)
      setIsGeneratingImage(true)  // Start loading indicator for poster
    })
    socket.on('script_image_update', (imageUrl) => {
      setIsGeneratingImage(false)  // Always stop loading indicator
      // Only display real generated images, not fallback placeholder
      if (imageUrl && !imageUrl.includes('default-poster')) {
        setScriptImageUrl(imageUrl)
      }
    })
    socket.on('available_cards', setAvailableCards)
    // Handle both legacy (number) and new (object) sync formats
    socket.on('sync_teleprompter', (data: TeleprompterSyncData | number) => {
      if (typeof data === 'number') {
        setCurrentLineIndex(data)
      } else {
        setCurrentLineIndex(data.lineIndex)
      }
    })
    socket.on('game_over', setGameResults)
    // Handle new game started (play again without reload)
    socket.on('new_game_started', () => {
      setGameState('LOBBY')
      setScript(null)
      setScriptImageUrl(null)  // Clear previous poster
      setIsGeneratingImage(false)  // Reset loading state
      setCurrentLineIndex(0)
      setGameResults(null)
      setIsPlaying(true)
      // Reset solo mode selection state
      setSelection({ character: '', setting: '', circumstance: '' })
      setCustomInputActive({ character: false, setting: false, circumstance: false })
      setHasSubmittedSelection(false)
    })
    // Latency measurement
    socket.on('latency_ping', (serverTimestamp: number) => {
      socket.emit('latency_pong', serverTimestamp, Date.now())
    })
    socket.on('latency_pong_response', (data: { latency: number }) => {
      setNetworkLatency(data.latency)
    })
    // Auto-set cooldown when a plot twist starts (resilience for reconnection)
    socket.on('plot_twist_started', () => {
      setChaosCooldown(true)
    })
    // Credit system events
    socket.on('credit_balance', (balance) => {
      setCreditBalance(balance)
    })
    socket.on('insufficient_credits', () => {
      setShowInsufficientCredits(true)
    })
    socket.on('achievement_unlocked' as never, (achievement: Achievement) => {
      achievementToasts.addAchievement(achievement)
    })
    socket.on('spectator_message_received', (message: SpectatorMessage) => {
      setSpectatorMessages(prev => [...prev.slice(-49), message])
    })
    socket.on('error', (errorMsg: string) => {
      toast.error(errorMsg)
    })
    return () => {
      socket.off('players_update')
      socket.off('player_joined')
      socket.off('game_state_change')
      socket.off('green_room_prompt')
      socket.off('script_ready')
      socket.off('script_image_update')
      socket.off('sync_teleprompter')
      socket.off('game_over')
      socket.off('available_cards')
      socket.off('new_game_started')
      socket.off('script_generation_progress')
      socket.off('latency_ping')
      socket.off('latency_pong_response')
      socket.off('plot_twist_started')
      socket.off('credit_balance')
      socket.off('insufficient_credits')
      socket.off('achievement_unlocked' as never)
      socket.off('spectator_message_received')
      socket.off('error')
    }
  }, [socket, isConnected, gameState, toast, achievementToasts])

  const startGame = () => {
    // Send customization settings along with start game command
    socket?.emit('update_room_settings', roomCode, {
      scriptCustomization,
      audioSettings,
      cardPackId: selectedPackId
    })
    socket?.emit('start_game', roomCode)
  }

  // Solo mode card submission (host plays directly)
  const handleSubmitSoloCards = () => {
    if (!socket || !roomCode || !selection.character || !selection.setting || !selection.circumstance) {
      toast.error('Please select all cards')
      return
    }
    setIsSubmittingCards(true)
    socket.emit('submit_cards', roomCode, selection, (response) => {
      setIsSubmittingCards(false)
      if (response.success) {
        setHasSubmittedSelection(true)
        toast.success('Cards submitted!')
      } else {
        toast.error(response.error || 'Failed to submit cards')
      }
    })
  }
  const toggleMature = () => {
    const newSettings = { ...settings, isMature: !settings.isMature }
    setSettings(newSettings)
    socket?.emit('update_room_settings', roomCode, { isMature: newSettings.isMature })
  }
  const updateGameMode = (newMode: 'SOLO' | 'HEAD_TO_HEAD' | 'ENSEMBLE') => {
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
    if (newPlayingState) {
      socket?.emit('resume_script', roomCode)
    } else {
      socket?.emit('pause_script', roomCode)
    }
  }

  // CHAOS cooldown timer
  useEffect(() => {
    if (!chaosCooldown) return
    setChaosCooldownRemaining(30)
    const interval = setInterval(() => {
      setChaosCooldownRemaining(prev => {
        if (prev <= 0.1) {
          setChaosCooldown(false)
          clearInterval(interval)
          return 0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(interval)
  }, [chaosCooldown])

  const triggerChaos = useCallback(() => {
    if (!socket || chaosCooldown) return
    socket.emit('start_plot_twist', roomCode)
    setChaosCooldown(true)
    setChaosShaking(true)
    setTimeout(() => setChaosShaking(false), 500)
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])
    toast.info('CHAOS unleashed! Audience is voting on a plot twist...')
  }, [socket, roomCode, chaosCooldown, toast])

  const handleCopyScript = async () => {
    if (script) {
      const success = await copyScriptToClipboard(script)
      if (success) {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      }
    }
  }

  const handleSetupModeChange = (mode: 'quick' | 'custom') => {
    setGameSetupMode(mode)
    if (mode === 'quick') {
      // Reset to recommended defaults, but preserve user's content rating choice
      const newSettings = { ...settings, gameMode: 'ENSEMBLE' as const }
      setSettings(newSettings)
      socket?.emit('update_room_settings', roomCode, { gameMode: 'ENSEMBLE' })
      setSelectedPackId('standard')
      setScriptCustomization({
        comedyStyle: 'witty',
        scriptLength: 'standard',
        difficulty: 'intermediate',
        physicalComedy: 'minimal',
        enableCallbacks: true
      })
      setAudioSettings({
        voiceEnabled: false,
        voiceSettings: { enabled: false, provider: 'browser', speed: 1.0, pitch: 1.0, volume: 0.8 },
        soundEffectsEnabled: true,
        soundEffectsVolume: 0.5,
        ambienceEnabled: false,
        ambienceVolume: 0.3,
        turnChimeEnabled: true
      })
    }
  }

  const handleDownloadScript = () => {
    if (script) {
      downloadScript(script)
    }
  }

  const requestSequel = () => {
    setGameState('LOADING')
    socket?.emit('request_sequel', roomCode)
  }

  const requestNewGame = (keepSelections: boolean = false) => {
    socket?.emit('request_new_game', roomCode, { keepSelections })
  }

  const handleShareScene = () => {
    if (!socket || !script) return

    if (shareUrl) {
      // Already have share URL, trigger share
      triggerShare(shareUrl)
      return
    }

    setIsSharing(true)
    // The server doesn't have a savedGameId on the client, so we need to use
    // the share_game flow. First we need to find the game by looking it up.
    // Since the game was just saved by the server in calculateResults,
    // we can get the most recent game for this room via get_game_history
    socket.emit('get_game_history', user?.uid || '', 1, (response) => {
      if (response.success && response.games && response.games.length > 0) {
        const latestGame = response.games[0]
        socket.emit('share_game', latestGame.id, (shareResponse) => {
          setIsSharing(false)
          if (shareResponse.success && shareResponse.shareUrl) {
            setShareUrl(shareResponse.shareUrl)
            triggerShare(shareResponse.shareUrl)
          }
        })
      } else {
        setIsSharing(false)
      }
    })
  }

  const triggerShare = (url: string) => {
    analytics.replayShared('host_results')
    const text = `I just played "${script?.title}" on Plot Twists!`

    if (navigator.share) {
      navigator.share({ title: 'Plot Twists', text, url }).catch(() => {
        // User cancelled or share failed, copy to clipboard instead
        copyShareUrl(url)
      })
    } else {
      copyShareUrl(url)
    }
  }

  const copyShareUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setShareCopied(true)
    toast.success('Share link copied!')
    setTimeout(() => setShareCopied(false), 3000)
  }

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${roomCode}` : ''
  const nonHostPlayers = players.filter(p => !p.isHost)

  // Show loading while auth resolves or redirecting unauthenticated users
  if (authLoading || !user || user.isAnonymous) {
    return (
      <div className="page-container items-center justify-center">
        <div className="text-center">
          <div className="skeleton skeleton-heading" style={{ margin: '0 auto' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '60%', margin: '1rem auto' }}></div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="page-container items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="text-6xl mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ⚡
          </motion.div>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInsufficientCredits(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: '1rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)', border: '2px solid var(--color-border)',
                borderRadius: '1rem', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                Out of scripts!
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                Buy more to keep the show going.
              </p>
              <button
                onClick={() => { setShowInsufficientCredits(false); setShowPurchaseModal(true) }}
                className="user-menu-btn user-menu-btn-primary"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '1rem', marginBottom: '0.5rem' }}
              >
                Buy Credits
              </button>
              <button
                onClick={() => setShowInsufficientCredits(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      {gameState === 'LOBBY' && (
        <motion.button
          onClick={() => router.push('/')}
          className="back-button"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="back-arrow">←</span>
          <span>Home</span>
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <motion.div
            key="lobby"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-6xl"
          >
            {/* Header */}
            <div className="mb-12">
              <div className="flex items-start justify-between gap-4 mb-6">
                <motion.h1
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 80, delay: 0.1 }}
                  className="hero-title"
                  style={{ marginBottom: 0 }}
                >
                  Plot Twists
                </motion.h1>
                <motion.button
                  onClick={() => setShowOnboarding(true)}
                  className="btn btn-ghost"
                  style={{ marginTop: '8px' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>❓</span>
                  <span>How to Play</span>
                </motion.button>
              </div>

              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
              >
                {roomCode ? (
                  <>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Share this code with players:
                      </p>
                      <div className={`connection-indicator ${isConnected ? 'connection-indicator-connected' : 'connection-indicator-disconnected'}`}>
                        <span>{isConnected ? '🟢 Room Active' : '🔴 Reconnecting...'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <div className="room-code-display">
                        {roomCode}
                      </div>
                      <motion.button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(joinUrl)
                            toast.success('Link copied!')
                          } catch {
                            toast.error('Failed to copy')
                          }
                        }}
                        className="btn btn-ghost"
                        style={{ padding: '12px' }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Copy join link"
                      >
                        <span className="text-xl">📋</span>
                      </motion.button>
                    </div>
                    {/* Credit display */}
                    {creditBalance && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.85rem',
                        color: creditBalance.total === 0
                          ? 'var(--color-danger, #f87171)'
                          : creditBalance.free > 0
                            ? 'var(--color-success, #4ade80)'
                            : '#facc15',
                        fontWeight: 600
                      }}>
                        {creditBalance.total} script{creditBalance.total !== 1 ? 's' : ''} remaining
                      </div>
                    )}
                  </>
                ) : (
                  <div className="skeleton" style={{ width: '280px', height: '88px', display: 'inline-block' }}></div>
                )}
              </motion.div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              {/* QR Card */}
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", delay: 0.25 }}
                className="card"
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.span
                    className="text-4xl"
                    initial={{ rotate: -20 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    📱
                  </motion.span>
                  <h2 className="text-2xl font-display" style={{ color: 'var(--color-text-primary)' }}>Scan to Join</h2>
                </div>
                {joinUrl ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="qr-wrapper">
                      <QRCodeSVG value={joinUrl} size={180} level="H" />
                    </div>
                  </motion.div>
                ) : (
                  <div className="skeleton" style={{ width: '228px', height: '228px' }}></div>
                )}
                <motion.p
                  className="mt-4"
                  style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Or visit <span className="font-script font-bold" style={{ color: 'var(--color-text-primary)' }}>plot-twists.com</span>
                </motion.p>

                {/* Player progress indicator */}
                {settings.gameMode !== 'SOLO' && (
                  <motion.div
                    className="mt-4 p-3 rounded-lg"
                    style={{ background: 'var(--color-surface-alt)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Players joined</span>
                      <span className="text-sm font-semibold" style={{
                        color: (settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length === 2) ||
                               (settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length >= 3)
                          ? 'var(--color-success)'
                          : 'var(--color-text-secondary)'
                      }}>
                        {nonHostPlayers.length}/{settings.gameMode === 'HEAD_TO_HEAD' ? 2 : 3}+
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: (settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length >= 2) ||
                                     (settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length >= 3)
                            ? 'var(--color-success)'
                            : 'var(--color-accent)'
                        }}
                        initial={{ width: '0%' }}
                        animate={{
                          width: `${Math.min(
                            (nonHostPlayers.length / (settings.gameMode === 'HEAD_TO_HEAD' ? 2 : 3)) * 100,
                            100
                          )}%`
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Players Card */}
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", delay: 0.25 }}
                className="card card-accent"
              >
                <div className="split mb-6">
                  <div className="flex items-center gap-3">
                    <motion.span
                      className="text-4xl"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      🎭
                    </motion.span>
                    <h2 className="text-2xl font-display" style={{ color: 'var(--color-text-primary)' }}>Players</h2>
                  </div>
                  <motion.div
                    className="badge badge-accent"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.35 }}
                  >
                    {nonHostPlayers.length}
                  </motion.div>
                </div>
                <div className="stack-sm max-h-[320px] overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {nonHostPlayers.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ x: 60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -60, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 150,
                          delay: index * 0.05
                        }}
                        className="card-interactive flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: 'var(--color-surface-alt)' }}
                      >
                        <div className="player-avatar">
                          {player.nickname[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</p>
                          {player.hasSubmittedSelection && (
                            <motion.p
                              className="text-xs font-medium"
                              style={{ color: 'var(--color-success)' }}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                            >
                              ✓ Ready
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {nonHostPlayers.length === 0 && settings.gameMode !== 'SOLO' && (
                    <motion.div
                      className="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.p
                        className="empty-state-icon"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                      >
                        📱
                      </motion.p>
                      <p className="empty-state-description" style={{ fontSize: '14px', marginBottom: '8px' }}>
                        Waiting for players to join...
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        Share the room code or scan the QR
                      </p>
                    </motion.div>
                  )}
                  {nonHostPlayers.length === 0 && settings.gameMode === 'SOLO' && (
                    <motion.div
                      className="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.p
                        className="empty-state-icon"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🎤
                      </motion.p>
                      <p className="empty-state-description" style={{ fontSize: '14px', marginBottom: '8px' }}>
                        You're the star!
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        Click "Start Solo Game" when ready
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <motion.div
              className="stack-sm"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Quick/Custom Game Mode Tabs */}
              <div className="card">
                <div className="flex gap-2 mb-4">
                  <motion.button
                    onClick={() => handleSetupModeChange('quick')}
                    className="btn flex-1"
                    style={{
                      background: gameSetupMode === 'quick' ? 'var(--color-success)' : 'var(--color-surface-alt)',
                      color: gameSetupMode === 'quick' ? 'white' : 'var(--color-text-secondary)',
                      border: gameSetupMode === 'quick' ? '2px solid var(--color-success)' : '1px solid var(--color-border)'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>⚡</span>
                    <span>Quick Game</span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleSetupModeChange('custom')}
                    className="btn flex-1"
                    style={{
                      background: gameSetupMode === 'custom' ? 'var(--color-purple)' : 'var(--color-surface-alt)',
                      color: gameSetupMode === 'custom' ? 'white' : 'var(--color-text-secondary)',
                      border: gameSetupMode === 'custom' ? '2px solid var(--color-purple)' : '1px solid var(--color-border)'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>🎛️</span>
                    <span>Custom Game</span>
                  </motion.button>
                </div>
                <p className="text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {gameSetupMode === 'quick'
                    ? 'Recommended settings for fast setup'
                    : 'Customize all game options'}
                </p>
              </div>

              {/* Game Mode Selection */}
              <div className="card">
                <h3 className="font-display text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  🎮 Game Mode
                </h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <motion.button
                    onClick={() => updateGameMode('SOLO')}
                    className={`card ${settings.gameMode === 'SOLO' ? 'card-accent' : ''}`}
                    style={{
                      padding: '16px',
                      border: settings.gameMode === 'SOLO' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: settings.gameMode === 'SOLO' ? 'var(--color-highlight)' : 'var(--color-surface)'
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-2xl mb-2">🎤</div>
                    <div className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Solo</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>1 player vs AI</div>
                  </motion.button>

                  <motion.button
                    onClick={() => updateGameMode('HEAD_TO_HEAD')}
                    className={`card ${settings.gameMode === 'HEAD_TO_HEAD' ? 'card-accent' : ''}`}
                    style={{
                      padding: '16px',
                      border: settings.gameMode === 'HEAD_TO_HEAD' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: settings.gameMode === 'HEAD_TO_HEAD' ? 'var(--color-highlight)' : 'var(--color-surface)'
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-2xl mb-2">⚔️</div>
                    <div className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Head-to-Head</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>2 players compete</div>
                  </motion.button>

                  <motion.button
                    onClick={() => updateGameMode('ENSEMBLE')}
                    className={`card ${settings.gameMode === 'ENSEMBLE' ? 'card-accent' : ''}`}
                    style={{
                      padding: '16px',
                      border: settings.gameMode === 'ENSEMBLE' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: settings.gameMode === 'ENSEMBLE' ? 'var(--color-highlight)' : 'var(--color-surface)',
                      position: 'relative',
                      overflow: 'visible'
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {gameSetupMode === 'quick' && (
                      <div
                        className="badge badge-success"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          fontSize: '9px',
                          padding: '2px 6px'
                        }}
                      >
                        Recommended
                      </div>
                    )}
                    <div className="text-2xl mb-2">🎭</div>
                    <div className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Ensemble</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>3-6 players</div>
                  </motion.button>
                </div>

                {/* Solo Mode Info */}
                <AnimatePresence>
                  {settings.gameMode === 'SOLO' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 rounded-lg"
                      style={{ background: 'var(--color-highlight-blue)', border: '1px solid var(--color-accent-2)' }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                          <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                            How Solo Mode Works
                          </p>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            You'll pick cards and the AI will create a scene with you as the star.
                            AI characters from the setting will join your performance!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content Rating - Quick Game Mode */}
              {gameSetupMode === 'quick' && (
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{settings.isMature ? '🔞' : '👨‍👩‍👧‍👦'}</span>
                      <div>
                        <h3 className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>
                          {settings.isMature ? 'After Dark' : 'Family Friendly'}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {settings.isMature
                            ? 'Adult themes, mature humor'
                            : 'Fun for all ages'}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={toggleMature}
                      className="btn btn-secondary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Switch
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Custom settings - only shown in custom mode */}
              {gameSetupMode === 'custom' && (
                <>
                  <div className="card split">
                    <div>
                      <h3 className="font-display text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        {settings.isMature ? '🔞 After Dark' : '👨‍👩‍👧‍👦 Family Friendly'}
                      </h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Content Rating</p>
                    </div>
                    <motion.button
                      onClick={toggleMature}
                      className={settings.isMature ? 'btn btn-ghost' : 'btn btn-secondary'}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Switch Mode
                    </motion.button>
                  </div>

                  {/* New Feature Panels */}
                  <CardPackSelector
                    roomCode={roomCode}
                    selectedPackId={selectedPackId}
                    onSelect={setSelectedPackId}
                    showCreateButton={true}
                  />

                  {/* Theme Night Presets */}
                  <div style={{
                    padding: '12px',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      Quick Themes
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Horror Comedy', icon: '👻', style: 'dark' as const, mature: false },
                        { label: 'Kids Party', icon: '🎈', style: 'slapstick' as const, mature: false },
                        { label: 'Office Shenanigans', icon: '💼', style: 'sitcom' as const, mature: false },
                        { label: 'After Hours', icon: '🌙', style: 'dark' as const, mature: true },
                      ].map((theme) => (
                        <button
                          key={theme.label}
                          onClick={() => {
                            setScriptCustomization(prev => ({ ...prev, comedyStyle: theme.style }))
                            if (theme.mature !== settings.isMature) {
                              const newSettings = { ...settings, isMature: theme.mature }
                              setSettings(newSettings)
                              socket?.emit('update_room_settings', roomCode, { isMature: theme.mature })
                            }
                            toast.success(`${theme.icon} ${theme.label} theme activated!`)
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            color: 'var(--color-text-secondary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {theme.icon} {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ScriptCustomizationPanel
                    customization={scriptCustomization}
                    onChange={setScriptCustomization}
                  />

                  <AudioSettingsPanel
                    settings={audioSettings}
                    onChange={setAudioSettings}
                  />
                </>
              )}

              {/* Always visible Start Game button */}
              {(() => {
                const canStartGame =
                  settings.gameMode === 'SOLO' ||
                  (settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length === 2) ||
                  (settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length >= 3)

                const getStartGameRequirement = () => {
                  if (settings.gameMode === 'HEAD_TO_HEAD') {
                    const needed = 2 - nonHostPlayers.length
                    return `Need ${needed} more player${needed !== 1 ? 's' : ''} to start`
                  }
                  if (settings.gameMode === 'ENSEMBLE') {
                    const needed = 3 - nonHostPlayers.length
                    if (needed > 0) {
                      return `Need ${needed} more player${needed !== 1 ? 's' : ''} to start`
                    }
                  }
                  return ''
                }

                return (
                  <>
                    <motion.button
                      onClick={startGame}
                      disabled={!canStartGame}
                      className="btn btn-primary btn-large w-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ opacity: canStartGame ? 1 : 0.6 }}
                      whileHover={canStartGame ? { scale: 1.02 } : {}}
                      whileTap={canStartGame ? { scale: 0.98 } : {}}
                    >
                      <span>🎬</span>
                      <span>{settings.gameMode === 'SOLO' ? 'Start Solo Game' : 'Start Game'}</span>
                    </motion.button>

                    {/* Explanation when disabled */}
                    {!canStartGame && (
                      <motion.p
                        className="text-sm text-center mt-2"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {getStartGameRequirement()}
                      </motion.p>
                    )}
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}

        {gameState === 'SELECTION' && settings.gameMode === 'SOLO' && !hasSubmittedSelection && (
          <motion.div
            key="solo-selection"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-2xl"
          >
            {/* Back to Lobby Button */}
            <motion.button
              onClick={() => {
                socket?.emit('request_new_game', roomCode, { keepSelections: false })
              }}
              className="back-button mb-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="back-arrow">←</span>
              <span>Back to Lobby</span>
            </motion.button>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-display" style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}>
                  🎴 Pick Your Cards
                </h1>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[selection.character, selection.setting, selection.circumstance].map((value, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded-full transition-all duration-300"
                        style={{
                          background: value ? 'var(--color-success)' : 'var(--color-border)',
                          transform: value ? 'scale(1)' : 'scale(0.8)'
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    {[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3
                  </span>
                </div>
              </div>

              {/* Loading state if cards haven't loaded */}
              {availableCards.characters.length === 0 && (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="text-4xl mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    🎴
                  </motion.div>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</p>
                </motion.div>
              )}

              {/* Feeling Lucky Button */}
              {availableCards.characters.length > 0 && !customInputActive.character && !customInputActive.setting && !customInputActive.circumstance && (
                <motion.button
                  onClick={() => {
                    if (availableCards.characters.length && availableCards.settings.length && availableCards.circumstances.length) {
                      const randomCharacter = availableCards.characters[Math.floor(Math.random() * availableCards.characters.length)]
                      const randomSetting = availableCards.settings[Math.floor(Math.random() * availableCards.settings.length)]
                      const randomCircumstance = availableCards.circumstances[Math.floor(Math.random() * availableCards.circumstances.length)]
                      setSelection({
                        character: randomCharacter,
                        setting: randomSetting,
                        circumstance: randomCircumstance
                      })
                      toast.success('Shuffled! 🎲')
                    }
                  }}
                  className="btn btn-ghost w-full mb-4"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-highlight-pink), var(--color-highlight-yellow))',
                    border: '2px solid var(--color-accent)',
                    fontWeight: 'bold'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span>🎲</span>
                  <span>Feeling Lucky? Shuffle All!</span>
                </motion.button>
              )}

              {availableCards.characters.length > 0 && (
              <div className="stack">
                {/* Character */}
                <div>
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onClick={() => {
                        setCustomInputActive({ ...customInputActive, character: !customInputActive.character })
                        if (!customInputActive.character) {
                          setSelection({ ...selection, character: '' })
                        }
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        background: customInputActive.character ? 'var(--color-accent)' : 'var(--color-surface-alt)',
                        color: customInputActive.character ? 'white' : 'var(--color-text-secondary)'
                      }}
                    >
                      <span>{customInputActive.character ? '✎ Custom' : '🃏 Cards'}</span>
                    </button>
                  </div>
                  {customInputActive.character ? (
                    <>
                      <label className="label flex items-center gap-2 mb-3">
                        <span className="text-2xl">🎭</span>
                        <span className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>Character</span>
                      </label>
                      <input
                        type="text"
                        value={selection.character}
                        onChange={(e) => setSelection({ ...selection, character: e.target.value })}
                        placeholder="Enter custom character (e.g., SpongeBob)..."
                        maxLength={50}
                        className="input font-script text-lg"
                        style={{
                          background: 'var(--color-surface-alt)',
                          border: '2px solid var(--color-accent)',
                          fontStyle: 'italic'
                        }}
                      />
                    </>
                  ) : (
                    <SmartCardSelector
                      label="Character"
                      icon="🎭"
                      type="characters"
                      value={selection.character}
                      onChange={(value) => setSelection({ ...selection, character: value })}
                      color="var(--color-accent)"
                      isMature={settings.isMature}
                    />
                  )}
                </div>

                {/* Setting */}
                <div>
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onClick={() => {
                        setCustomInputActive({ ...customInputActive, setting: !customInputActive.setting })
                        if (!customInputActive.setting) {
                          setSelection({ ...selection, setting: '' })
                        }
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        background: customInputActive.setting ? 'var(--color-accent-2)' : 'var(--color-surface-alt)',
                        color: customInputActive.setting ? 'white' : 'var(--color-text-secondary)'
                      }}
                    >
                      <span>{customInputActive.setting ? '✎ Custom' : '🃏 Cards'}</span>
                    </button>
                  </div>
                  {customInputActive.setting ? (
                    <>
                      <label className="label flex items-center gap-2 mb-3">
                        <span className="text-2xl">🏛️</span>
                        <span className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>Setting</span>
                      </label>
                      <input
                        type="text"
                        value={selection.setting}
                        onChange={(e) => setSelection({ ...selection, setting: e.target.value })}
                        placeholder="Enter custom setting (e.g., The Simpsons Living Room)..."
                        maxLength={50}
                        className="input font-script text-lg"
                        style={{
                          background: 'var(--color-surface-alt)',
                          border: '2px solid var(--color-accent-2)',
                          fontStyle: 'italic'
                        }}
                      />
                    </>
                  ) : (
                    <SmartCardSelector
                      label="Setting"
                      icon="🏛️"
                      type="settings"
                      value={selection.setting}
                      onChange={(value) => setSelection({ ...selection, setting: value })}
                      color="var(--color-accent-2)"
                      isMature={settings.isMature}
                    />
                  )}
                </div>

                {/* Circumstance */}
                <div>
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onClick={() => {
                        setCustomInputActive({ ...customInputActive, circumstance: !customInputActive.circumstance })
                        if (!customInputActive.circumstance) {
                          setSelection({ ...selection, circumstance: '' })
                        }
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        background: customInputActive.circumstance ? 'var(--color-warning)' : 'var(--color-surface-alt)',
                        color: customInputActive.circumstance ? 'white' : 'var(--color-text-secondary)'
                      }}
                    >
                      <span>{customInputActive.circumstance ? '✎ Custom' : '🃏 Cards'}</span>
                    </button>
                  </div>
                  {customInputActive.circumstance ? (
                    <>
                      <label className="label flex items-center gap-2 mb-3">
                        <span className="text-2xl">⚡</span>
                        <span className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>Circumstance</span>
                      </label>
                      <input
                        type="text"
                        value={selection.circumstance}
                        onChange={(e) => setSelection({ ...selection, circumstance: e.target.value })}
                        placeholder="Enter custom circumstance..."
                        maxLength={80}
                        className="input font-script text-lg"
                        style={{
                          background: 'var(--color-surface-alt)',
                          border: '2px solid var(--color-warning)',
                          fontStyle: 'italic'
                        }}
                      />
                    </>
                  ) : (
                    <SmartCardSelector
                      label="Circumstance"
                      icon="⚡"
                      type="circumstances"
                      value={selection.circumstance}
                      onChange={(value) => setSelection({ ...selection, circumstance: value })}
                      color="var(--color-warning)"
                      isMature={settings.isMature}
                    />
                  )}
                </div>

                {/* Selection Preview */}
                {(selection.character || selection.setting || selection.circumstance) && (
                  <motion.div
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--color-highlight)', border: '2px solid var(--color-accent)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>YOUR SELECTION:</p>
                    <div className="text-sm space-y-1">
                      {selection.character && (
                        <p style={{ color: 'var(--color-text-primary)' }}>
                          <span className="font-bold">🎭 Character:</span> {selection.character}
                        </p>
                      )}
                      {selection.setting && (
                        <p style={{ color: 'var(--color-text-primary)' }}>
                          <span className="font-bold">🏛️ Setting:</span> {selection.setting}
                        </p>
                      )}
                      {selection.circumstance && (
                        <p style={{ color: 'var(--color-text-primary)' }}>
                          <span className="font-bold">⚡ Circumstance:</span> {selection.circumstance}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                <motion.button
                  onClick={handleSubmitSoloCards}
                  disabled={!selection.character || !selection.setting || !selection.circumstance || isSubmittingCards}
                  className="btn btn-primary btn-large w-full"
                  style={{
                    marginTop: '24px',
                    opacity: (!selection.character || !selection.setting || !selection.circumstance || isSubmittingCards) ? 0.6 : 1
                  }}
                  whileHover={{ scale: isSubmittingCards ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmittingCards ? 1 : 0.98 }}
                  animate={
                    (selection.character && selection.setting && selection.circumstance && !isSubmittingCards)
                      ? {
                          boxShadow: [
                            '0 0 0 0 rgba(245, 158, 66, 0)',
                            '0 0 0 10px rgba(245, 158, 66, 0.3)',
                            '0 0 0 0 rgba(245, 158, 66, 0)'
                          ]
                        }
                      : {}
                  }
                  transition={
                    (selection.character && selection.setting && selection.circumstance && !isSubmittingCards)
                      ? { duration: 2, repeat: Infinity }
                      : {}
                  }
                >
                  {isSubmittingCards ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        ⏳
                      </motion.span>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>
                        {(!selection.character || !selection.setting || !selection.circumstance)
                          ? `Submit Cards (${[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3)`
                          : 'Submit Cards - Ready!'}
                      </span>
                    </>
                  )}
                </motion.button>
              </div>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'SELECTION' && settings.gameMode === 'SOLO' && hasSubmittedSelection && (
          <motion.div
            key="solo-waiting"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-lg text-center"
          >
            <div className="card">
              <motion.div
                className="text-8xl mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                ✓
              </motion.div>
              <motion.h1
                className="text-4xl font-display mb-4"
                style={{ color: 'var(--color-success)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Cards Submitted!
              </motion.h1>
              <motion.p
                className="text-lg mb-6"
                style={{ color: 'var(--color-text-secondary)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Generating your scene...
              </motion.p>

              {/* Selection Summary */}
              <motion.div
                className="p-4 rounded-lg text-left"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>YOUR SCENE:</p>
                <div className="space-y-2 text-sm">
                  <p style={{ color: 'var(--color-text-primary)' }}>
                    <span className="font-bold">🎭</span> {selection.character}
                  </p>
                  <p style={{ color: 'var(--color-text-primary)' }}>
                    <span className="font-bold">🏛️</span> {selection.setting}
                  </p>
                  <p style={{ color: 'var(--color-text-primary)' }}>
                    <span className="font-bold">⚡</span> {selection.circumstance}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {gameState === 'SELECTION' && settings.gameMode !== 'SOLO' && (
          <motion.div
            key="selection"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-2xl text-center"
          >
            <motion.h1
              className="hero-title mb-12"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
            >
              🎴 Selecting Cards
            </motion.h1>
            <div className="card">
              <div className="stack-sm">
                {nonHostPlayers.map((player, i) => (
                  <motion.div
                    key={player.id}
                    className="split p-4 rounded-lg"
                    style={{ background: 'var(--color-surface-alt)' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{player.nickname}</span>
                    <motion.span
                      className={`text-sm font-medium badge ${player.hasSubmittedSelection ? 'badge-success' : 'badge-warning'}`}
                      animate={player.hasSubmittedSelection ? {} : { scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {player.hasSubmittedSelection ? '✓ Ready' : '⏳ Selecting'}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'LOADING' && (
          <motion.div
            key="loading"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-2xl text-center"
          >
            <motion.h1
              className="hero-title mb-12"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎬 Writing Script
            </motion.h1>
            <div className="card">
              {/* Animated stage icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={getCurrentLoadingStage().icon}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-8xl mb-6"
                >
                  {getCurrentLoadingStage().icon}
                </motion.div>
              </AnimatePresence>

              {/* Dynamic stage message */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={getCurrentLoadingStage().message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl mb-8 font-display"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {getCurrentLoadingStage().message}
                </motion.p>
              </AnimatePresence>

              {/* Show script title preview when available from streaming */}
              {scriptTitlePreview && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg mb-4 font-bold"
                  style={{ color: 'var(--color-accent-1)' }}
                >
                  &ldquo;{scriptTitlePreview}&rdquo;
                </motion.p>
              )}

              {settings.gameMode === 'SOLO' && (
                <motion.div
                  className="card"
                  style={{ background: 'var(--color-highlight-blue)', padding: '16px', marginBottom: '32px', border: '1px solid var(--color-accent-2)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    🎭 Solo mode: AI characters are joining your performance
                  </p>
                </motion.div>
              )}

              {/* Progress bar with shimmer */}
              <div className="progress mb-8" style={{ position: 'relative' }}>
                <motion.div
                  className="progress-bar progress-bar-shimmer"
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <AnimatePresence mode="wait">
                {greenRoomQuestion && !scriptGenerationTimedOut && (
                  <motion.div
                    className="card card-accent-2 mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className="font-display text-lg mb-3" style={{ color: 'var(--color-accent-2)' }}>💭 While You Wait</h3>
                    <p className="italic" style={{ color: 'var(--color-text-primary)' }}>"{greenRoomQuestion}"</p>
                  </motion.div>
                )}
                {scriptGenerationTimedOut && (
                  <motion.div
                    className="card mt-8"
                    style={{ background: 'var(--color-highlight-pink)', border: '2px solid var(--color-danger)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className="font-display text-lg mb-3" style={{ color: 'var(--color-danger)' }}>⏰ Taking longer than expected</h3>
                    <p className="mb-4" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                      Script generation is taking longer than usual. You can wait, retry, or go back.
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <motion.button
                        onClick={() => {
                          // Reset and retry - go back to selection
                          socket?.emit('update_room_settings', roomCode, {
                            scriptCustomization,
                            audioSettings,
                            cardPackId: selectedPackId
                          })
                          socket?.emit('start_game', roomCode)
                          setScriptGenerationTimedOut(false)
                          // Restart the timeout
                          if (scriptGenerationTimeoutRef.current) {
                            clearTimeout(scriptGenerationTimeoutRef.current)
                          }
                          scriptGenerationTimeoutRef.current = setTimeout(() => {
                            setScriptGenerationTimedOut(true)
                          }, 45000) // 45 second timeout (scripts can take up to 60s)
                        }}
                        className="btn btn-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>🔄</span>
                        <span>Retry</span>
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          // Go back to selection state
                          socket?.emit('request_new_game', roomCode, { keepSelections: false })
                        }}
                        className="btn btn-ghost"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>←</span>
                        <span>Back to Lobby</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {gameState === 'PERFORMING' && script && (
          <motion.div
            key="performing"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-5xl"
          >
            {/* Spectator Chat Ticker (Twitch-style overlay) */}
            <SpectatorTicker messages={spectatorMessages} />

            {/* Audience Interaction Components */}
            <AudienceReactionBar roomCode={roomCode} isPerforming={true} isHost={true} />
            <PlotTwistVoting roomCode={roomCode} isHost={true} />

            {/* Generated Poster */}
            <AnimatePresence mode="wait">
              {scriptImageUrl ? (
                <motion.div key="poster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MoviePosterFrame
                    imageUrl={scriptImageUrl}
                    title={script.title}
                    onClick={() => setShowPosterLightbox(true)}
                    maxWidth={320}
                    showNowShowing={true}
                    variant="performance"
                  />
                </motion.div>
              ) : isGeneratingImage && script ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MoviePosterSkeleton maxWidth={240} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Meta Info */}
            <motion.div
              className="mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <h2 className="text-3xl font-display" style={{ color: 'var(--color-text-primary)' }}>{script.title}</h2>
                {networkLatency !== null && (
                  <motion.div
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                    style={{
                      background: networkLatency < 100 ? 'var(--color-success)' : networkLatency < 300 ? 'var(--color-warning)' : 'var(--color-danger)',
                      color: 'white',
                      opacity: 0.8
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.8, scale: 1 }}
                    title={`Network latency: ${networkLatency}ms`}
                  >
                    <span>{networkLatency < 100 ? '🟢' : networkLatency < 300 ? '🟡' : '🔴'}</span>
                    <span>{networkLatency}ms</span>
                  </motion.div>
                )}
              </div>
              <p className="text-lg italic mb-4" style={{ color: 'var(--color-text-secondary)' }}>{script.synopsis}</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                Characters: {getCharactersInScene(script).join(', ')}
              </p>
              <div className="flex items-center gap-4">
                <span className="font-script font-bold" style={{ color: 'var(--color-accent)' }}>
                  LINE {currentLineIndex + 1}/{script.lines.length}
                </span>
                <div className="progress flex-1">
                  <motion.div
                    className="progress-bar"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentLineIndex + 1) / script.lines.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Teleprompter Settings */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <TeleprompterSettingsPanel
                settings={teleprompterSettings}
                onPresetChange={setTeleprompterPreset}
                onCustomChange={setTeleprompterCustom}
                onAutoScrollToggle={toggleTeleprompterAutoScroll}
                disabled={teleprompterSettingsLoading}
              />
            </motion.div>

            {/* Script */}
            <motion.div
              ref={scriptContainerRef}
              className="script-container mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="script-title">{script.title}</div>
              <AnimatePresence mode="sync">
                {getVisibleLines(script.lines, currentLineIndex, teleprompterSettings).map(({ line, originalIndex }) => {
                  const moodIndicator = getMoodIndicator(line.mood)
                  return (
                    <motion.div
                      key={originalIndex}
                      className={`script-line ${
                        originalIndex === currentLineIndex ? 'script-line-active' :
                        originalIndex < currentLineIndex ? 'script-line-past' :
                        'script-line-upcoming'
                      }`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      data-line-index={originalIndex}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="script-character">{line.speaker}</div>
                        {originalIndex === currentLineIndex && (
                          <motion.div
                            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: `${moodIndicator.color}20`,
                              border: `1px solid ${moodIndicator.color}60`,
                              color: moodIndicator.color
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <span className="text-base">{moodIndicator.emoji}</span>
                            <span>{moodIndicator.label}</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="script-dialogue">{line.text}</div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>

            {/* Controls */}
            <motion.div
              className="card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-4 mb-3">
                <motion.button
                  onClick={previousLine}
                  disabled={currentLineIndex === 0}
                  className="btn btn-ghost"
                  style={{ opacity: currentLineIndex === 0 ? 0.5 : 1 }}
                  whileHover={{ scale: currentLineIndex === 0 ? 1 : 1.05, x: currentLineIndex === 0 ? 0 : -2 }}
                  whileTap={{ scale: currentLineIndex === 0 ? 1 : 0.95 }}
                >
                  ← Previous
                </motion.button>
                <motion.button
                  onClick={togglePlayPause}
                  className="btn btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </motion.button>
                <motion.button
                  onClick={triggerChaos}
                  disabled={chaosCooldown}
                  className={`btn relative overflow-hidden ${chaosShaking ? 'animate-chaos-shake' : ''}`}
                  style={{
                    background: chaosCooldown
                      ? 'linear-gradient(135deg, #6b21a8, #9d174d)'
                      : 'linear-gradient(135deg, #a855f7, #ec4899)',
                    color: 'white',
                    opacity: chaosCooldown ? 0.7 : 1,
                    boxShadow: chaosCooldown ? 'none' : '0 0 15px rgba(168, 85, 247, 0.4)',
                  }}
                  whileHover={!chaosCooldown ? { scale: 1.05 } : {}}
                  whileTap={!chaosCooldown ? { scale: 0.95 } : {}}
                  animate={!chaosCooldown ? {
                    boxShadow: [
                      '0 0 10px rgba(168, 85, 247, 0.3)',
                      '0 0 25px rgba(168, 85, 247, 0.5)',
                      '0 0 10px rgba(168, 85, 247, 0.3)',
                    ],
                  } : {}}
                  transition={!chaosCooldown ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  {chaosCooldown ? (
                    <span className="flex items-center gap-2">
                      🌀 {Math.ceil(chaosCooldownRemaining)}s
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      >
                        🌀
                      </motion.span>
                      CHAOS
                    </span>
                  )}
                  {chaosCooldown && (
                    <div
                      className="absolute bottom-0 left-0 h-1 rounded-full"
                      style={{
                        width: `${(chaosCooldownRemaining / 30) * 100}%`,
                        background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                        transition: 'width 0.1s linear',
                      }}
                    />
                  )}
                </motion.button>
                <motion.button
                  onClick={nextLine}
                  disabled={currentLineIndex >= script.lines.length - 1}
                  className="btn btn-ghost"
                  style={{ opacity: currentLineIndex >= script.lines.length - 1 ? 0.5 : 1 }}
                  whileHover={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 1.05, x: currentLineIndex >= script.lines.length - 1 ? 0 : 2 }}
                  whileTap={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 0.95 }}
                >
                  Next →
                </motion.button>
              </div>
              <motion.p
                className="text-center text-xs flex items-center justify-center gap-2"
                style={{ color: 'var(--color-text-tertiary)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <kbd style={{ background: 'var(--color-surface-alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>←</kbd>
                <span>Previous</span>
                <kbd style={{ background: 'var(--color-surface-alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Space</kbd>
                <span>Play/Pause</span>
                <kbd style={{ background: 'var(--color-surface-alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>→</kbd>
                <span>Next</span>
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'VOTING' && (
          <motion.div
            key="voting"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-4xl text-center"
          >
            <motion.h1
              className="hero-title mb-12"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
            >
              🗳️ Voting Time
            </motion.h1>
            <div className="card">
              <h2 className="text-2xl font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Players are voting for MVP...
              </h2>
              <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                Who had the best performance?
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {nonHostPlayers.map((player, i) => (
                  <motion.div
                    key={player.id}
                    className="card split"
                    style={{
                      background: player.hasSubmittedVote ? 'var(--color-highlight)' : 'var(--color-surface-alt)',
                      border: player.hasSubmittedVote ? '2px solid var(--color-success)' : '1px solid var(--color-border)'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="player-avatar">
                        {player.nickname[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {player.nickname}
                      </span>
                    </div>
                    {player.hasSubmittedVote ? (
                      <span className="badge badge-success">✓ Voted</span>
                    ) : (
                      <motion.span
                        className="badge badge-warning"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Voting...
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'RESULTS' && (
          <motion.div
            key="results"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-4xl"
          >
            <div className="card text-center">
              {gameResults && gameResults.winner ? (
                <>
                  {/* Trophy with pulsing glow */}
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 180,
                        height: 180,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
                        pointerEvents: 'none',
                      }}
                      animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.1, 0.9] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="text-9xl"
                      style={{ position: 'relative' }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    >
                      🏆
                    </motion.div>
                  </div>

                  {/* Poster card with flip animation */}
                  {scriptImageUrl && (
                    <MoviePosterFrame
                      imageUrl={scriptImageUrl}
                      title={script?.title}
                      onClick={() => setShowPosterLightbox(true)}
                      maxWidth={280}
                      variant="results"
                    />
                  )}

                  {/* Winner name with blur reveal */}
                  <motion.h1
                    className="hero-title mb-4"
                    style={{ color: 'var(--color-accent)' }}
                    initial={{ y: -30, opacity: 0, filter: 'blur(8px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {gameResults.winner.playerName} Wins!
                  </motion.h1>

                  {/* MVP badge */}
                  <motion.p
                    className="text-2xl mb-12"
                    style={{ color: 'var(--color-text-secondary)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>MVP</span> with {gameResults.winner.votes} vote{gameResults.winner.votes !== 1 ? 's' : ''}
                  </motion.p>

                  {/* Standings with vote bars */}
                  {gameResults.allResults && gameResults.allResults.length > 1 && (() => {
                    const maxVotes = Math.max(...gameResults.allResults.map(r => r.votes), 1)
                    const totalVotes = gameResults.allResults.reduce((sum, r) => sum + r.votes, 0)
                    return (
                      <motion.div
                        className="mb-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--color-text-primary)' }}>
                          Final Standings
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {gameResults.allResults.map((result, index) => {
                            const percentage = totalVotes > 0 ? Math.round((result.votes / totalVotes) * 100) : 0
                            const barColor = index === 0 ? 'var(--color-accent)' : index === 1 ? 'var(--color-accent-2)' : 'var(--color-border-strong)'
                            const isWinner = index === 0
                            return (
                              <motion.div
                                key={result.playerId}
                                style={{
                                  background: isWinner ? 'var(--color-highlight)' : 'var(--color-surface-alt)',
                                  border: isWinner ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                  borderRadius: 'var(--radius-lg, 12px)',
                                  padding: '20px 24px',
                                  textAlign: 'left',
                                }}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + index * 0.15 }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <motion.span
                                      style={{ fontSize: isWinner ? 36 : 28, display: 'inline-block' }}
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{ type: 'spring', bounce: 0.5, delay: 0.95 + index * 0.15 }}
                                    >
                                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎭'}
                                    </motion.span>
                                    <span className="font-display" style={{
                                      fontSize: isWinner ? 22 : 18,
                                      fontWeight: isWinner ? 700 : 600,
                                      color: 'var(--color-text-primary)',
                                    }}>
                                      {result.playerName}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: isWinner ? 22 : 18, fontWeight: 700, color: barColor }}>
                                    {result.votes}
                                  </span>
                                </div>
                                {/* Vote bar */}
                                <div style={{
                                  width: '100%',
                                  height: isWinner ? 12 : 8,
                                  borderRadius: 999,
                                  background: 'var(--color-border)',
                                  overflow: 'hidden',
                                  position: 'relative',
                                }}>
                                  <motion.div
                                    style={{
                                      height: '100%',
                                      borderRadius: 999,
                                      background: barColor,
                                      position: 'relative',
                                      overflow: 'hidden',
                                    }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${maxVotes > 0 ? (result.votes / maxVotes) * 100 : 0}%` }}
                                    transition={{ delay: 0.9 + index * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                  >
                                    {isWinner && (
                                      <div className="progress-bar-shimmer" style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                      }} />
                                    )}
                                  </motion.div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                                  {percentage}% of votes
                                </p>
                              </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )
                  })()}

                  {/* Condensed script summary */}
                  {script && (
                    <motion.div
                      className="card"
                      style={{ background: 'var(--color-surface-alt)', padding: '20px 24px', textAlign: 'left' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      {!scriptImageUrl && (
                        <>
                          <p className="font-script font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>{script.title}</p>
                          <p className="italic text-sm mb-3" style={{ color: 'var(--color-text-tertiary)' }}>{script.synopsis}</p>
                        </>
                      )}
                      <div className="flex gap-3 flex-wrap">
                        <motion.button
                          onClick={handleDownloadScript}
                          className="btn btn-secondary"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span>💾</span>
                          <span>Download Script</span>
                        </motion.button>
                        <motion.button
                          onClick={handleCopyScript}
                          className="btn btn-ghost"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span>{copySuccess ? '✓' : '📋'}</span>
                          <span>{copySuccess ? 'Copied!' : 'Copy to Clipboard'}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 160,
                        height: 160,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, var(--color-accent-2) 0%, transparent 70%)',
                        pointerEvents: 'none',
                      }}
                      animate={{ opacity: [0.1, 0.25, 0.1], scale: [0.9, 1.1, 0.9] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="text-9xl"
                      style={{ position: 'relative' }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    >
                      🎉
                    </motion.div>
                  </div>

                  {scriptImageUrl && (
                    <MoviePosterFrame
                      imageUrl={scriptImageUrl}
                      title={script?.title}
                      onClick={() => setShowPosterLightbox(true)}
                      maxWidth={280}
                      variant="results"
                    />
                  )}

                  <motion.h1
                    className="hero-title mb-6"
                    style={{ color: 'var(--color-text-primary)' }}
                    initial={{ y: -30, opacity: 0, filter: 'blur(8px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    Performance Complete!
                  </motion.h1>
                  <motion.p
                    className="text-2xl mb-12"
                    style={{ color: 'var(--color-text-secondary)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    Thanks for playing!
                  </motion.p>
                </>
              )}

              {/* Post-Game Highlights */}
              {gameResults?.highlights && gameResults.highlights.length > 0 && (
                <motion.div
                  className="w-full max-w-md mx-auto mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <details className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                    <summary className="p-4 cursor-pointer text-center font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      🏆 Game Highlights
                    </summary>
                    <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                      {gameResults.highlights.map((h, i) => (
                        <motion.div
                          key={h.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="text-center p-3 rounded-lg"
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        >
                          <div className="text-2xl mb-1">{h.icon}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{h.label}</div>
                          <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{h.value}</div>
                        </motion.div>
                      ))}
                    </div>
                  </details>
                </motion.div>
              )}

              <div className="flex flex-col gap-4 items-center mt-8">
                {script && (
                  <motion.button
                    onClick={handleShareScene}
                    className="btn btn-large"
                    style={{
                      minWidth: '280px',
                      background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
                      color: 'white',
                      border: 'none',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSharing}
                  >
                    <span>{shareCopied ? '✓' : '🔗'}</span>
                    <span>{isSharing ? 'Sharing...' : shareCopied ? 'Link Copied!' : 'Share This Scene'}</span>
                  </motion.button>
                )}
                {script && (
                  <motion.button
                    onClick={requestSequel}
                    className="btn btn-primary btn-large"
                    style={{ minWidth: '280px' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>🎬</span>
                    <span>Generate Sequel</span>
                  </motion.button>
                )}

                <motion.button
                  onClick={() => requestNewGame(false)}
                  className="btn btn-secondary btn-large"
                  style={{ minWidth: '280px' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🔄</span>
                  <span>New Game (Same Players)</span>
                </motion.button>

                <motion.button
                  onClick={() => window.location.reload()}
                  className="btn btn-ghost"
                  style={{ minWidth: '280px' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🚪</span>
                  <span>Exit to Home</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Lightbox Modal */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <MoviePosterFrame
            imageUrl={scriptImageUrl}
            title={script?.title}
            variant="lightbox"
          />
        )}
      </Modal>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <AchievementToast achievements={achievementToasts.achievements} onDismiss={achievementToasts.dismissAchievement} />
    </div>
  )
}
