'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { Player, Script, RoomSettings, GameResults, ScriptCustomization, AudioSettings, TeleprompterSyncData, CardSelection, ScriptLine, TeleprompterSettings } from '@/lib/types'
import type { GameState } from '@/lib/types'
import { DEFAULT_TELEPROMPTER_SETTINGS } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { OnboardingModal } from '@/components/OnboardingModal'
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

// Helper function to get mood emoji and color
// Uses CSS custom properties for consistent theming
function getMoodIndicator(mood: string) {
  const moodMap: Record<string, { emoji: string; color: string; label: string }> = {
    angry: { emoji: '😠', color: 'var(--color-danger)', label: 'Angry' },
    happy: { emoji: '😊', color: 'var(--color-success)', label: 'Happy' },
    confused: { emoji: '😕', color: 'var(--color-warning)', label: 'Confused' },
    whispering: { emoji: '🤫', color: 'var(--color-accent-2)', label: 'Whispering' },
    neutral: { emoji: '😐', color: 'var(--color-text-tertiary)', label: 'Neutral' }
  }
  return moodMap[mood] || moodMap.neutral
}

// Helper function to get visible lines based on teleprompter settings
function getVisibleLines(
  lines: ScriptLine[],
  currentIndex: number,
  settings: TeleprompterSettings
): { line: ScriptLine; originalIndex: number }[] {
  const result: { line: ScriptLine; originalIndex: number }[] = []

  // Calculate start index (past lines)
  let startIndex: number
  if (settings.pastLinesVisible === 'all') {
    startIndex = 0
  } else {
    startIndex = Math.max(0, currentIndex - settings.pastLinesVisible)
  }

  // Calculate end index (upcoming lines)
  let endIndex: number
  if (settings.upcomingLinesVisible === 'all') {
    endIndex = lines.length - 1
  } else {
    endIndex = Math.min(lines.length - 1, currentIndex + settings.upcomingLinesVisible)
  }

  for (let i = startIndex; i <= endIndex; i++) {
    result.push({ line: lines[i], originalIndex: i })
  }

  return result
}

export default function HostPage() {
  const router = useRouter()
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
  const loadingIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const scriptContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [scriptImageUrl, setScriptImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // Teleprompter settings hook
  const {
    settings: teleprompterSettings,
    setPreset: setTeleprompterPreset,
    setCustom: setTeleprompterCustom,
    toggleAutoScroll: toggleTeleprompterAutoScroll,
    isLoading: teleprompterSettingsLoading
  } = useTeleprompterSettings()

  // Loading stage messages based on progress
  const loadingStages = [
    { percent: 0, message: "Gathering inspiration...", icon: "🎬" },
    { percent: 20, message: "Assembling characters...", icon: "🎭" },
    { percent: 40, message: "Writing dialogue...", icon: "✍️" },
    { percent: 60, message: "Adding comedic timing...", icon: "😂" },
    { percent: 80, message: "Polishing the script...", icon: "✨" },
    { percent: 95, message: "Almost ready...", icon: "🎪" }
  ]

  const getCurrentLoadingStage = () => {
    for (let i = loadingStages.length - 1; i >= 0; i--) {
      if (loadingProgress >= loadingStages[i].percent) {
        return loadingStages[i]
      }
    }
    return loadingStages[0]
  }

  // Enhanced page transition variants with blur/scale effects
  const pageTransitionVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' },
    animate: {
      opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
    },
    exit: {
      opacity: 0, scale: 1.02, y: -10, filter: 'blur(4px)',
      transition: { duration: 0.25 }
    }
  }

  // Solo mode card selection state
  const toast = useToast()
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

  useEffect(() => {
    if (!socket || !isConnected || roomCreatedRef.current) return
    roomCreatedRef.current = true
    socket.emit('create_room', settings, (response) => {
      if (response.success && response.code) setRoomCode(response.code)
    })
  }, [socket, isConnected, settings])

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
    }
  }, [gameState, confetti])

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
      }
      // Start timeout and progress animation when entering LOADING state
      if (newState === 'LOADING') {
        setScriptGenerationTimedOut(false)
        setLoadingProgress(0)
        // Animate progress in stages - slower to match 45s timeout
        loadingIntervalRef.current = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 95) return 95
            // Slow down as we get higher to avoid reaching 95% too quickly
            const increment = prev < 50
              ? Math.random() * 6 + 2  // 2-8% early on
              : prev < 80
                ? Math.random() * 4 + 1  // 1-5% mid-way
                : Math.random() * 2 + 0.5  // 0.5-2.5% near the end
            return prev + increment
          })
        }, 2000) // Update every 2 seconds instead of 1.5s
        scriptGenerationTimeoutRef.current = setTimeout(() => {
          setScriptGenerationTimedOut(true)
        }, 45000) // 45 second timeout (scripts can take up to 60s)
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
      socket.off('latency_ping')
      socket.off('latency_pong_response')
    }
  }, [socket, isConnected, gameState, toast])

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

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${roomCode}` : ''
  const nonHostPlayers = players.filter(p => !p.isHost)

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
                        <div className="connection-indicator-dot" />
                        <span>{isConnected ? 'Live' : 'Offline'}</span>
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
                      position: 'relative'
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

              <AnimatePresence>
                {((settings.gameMode === 'SOLO') ||
                  (settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length === 2) ||
                  (settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length >= 3)) && (
                  <motion.button
                    onClick={startGame}
                    className="btn btn-primary btn-large w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>🎬</span>
                    <span>{settings.gameMode === 'SOLO' ? 'Start Solo Game' : 'Start Game'}</span>
                  </motion.button>
                )}

                {/* Player count hints - only for multiplayer modes */}
                {settings.gameMode === 'HEAD_TO_HEAD' && nonHostPlayers.length === 1 && (
                  <motion.div
                    className="card text-center"
                    style={{ background: 'var(--color-highlight)', padding: '16px', border: '1px solid var(--color-warning)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                      ⚔️ Head-to-Head needs exactly 2 players
                    </p>
                  </motion.div>
                )}

                {settings.gameMode === 'ENSEMBLE' && nonHostPlayers.length > 0 && nonHostPlayers.length < 3 && (
                  <motion.div
                    className="card text-center"
                    style={{ background: 'var(--color-highlight)', padding: '16px', border: '1px solid var(--color-warning)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                      🎭 Ensemble needs 3-6 players ({nonHostPlayers.length}/3)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
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
            {/* Audience Interaction Components */}
            <AudienceReactionBar roomCode={roomCode} isPerforming={true} isHost={true} />
            <PlotTwistVoting roomCode={roomCode} isHost={true} />

            {/* Generated Poster */}
            <AnimatePresence>
              {scriptImageUrl && (
                <motion.img
                  src={scriptImageUrl}
                  alt={`${script.title} Poster`}
                  className="mx-auto mb-6 max-h-64 rounded-lg shadow-2xl object-contain"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>

            {/* Subtle loading indicator when poster is generating */}
            <AnimatePresence>
              {isGeneratingImage && script && (
                <motion.div
                  className="text-center mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-sm animate-pulse" style={{ color: 'var(--color-text-tertiary)' }}>
                    🎬 Generating movie poster...
                  </span>
                </motion.div>
              )}
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
                  <motion.div
                    className="text-9xl mb-8"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  >
                    🏆
                  </motion.div>
                  <motion.h1
                    className="hero-title mb-4"
                    style={{ color: 'var(--color-accent)' }}
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {gameResults.winner.playerName} Wins!
                  </motion.h1>
                  <motion.p
                    className="text-2xl mb-12"
                    style={{ color: 'var(--color-text-secondary)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    MVP with {gameResults.winner.votes} vote{gameResults.winner.votes !== 1 ? 's' : ''}
                  </motion.p>

                  {gameResults.allResults && gameResults.allResults.length > 1 && (
                    <motion.div
                      className="mb-12"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--color-text-primary)' }}>
                        Final Standings
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        {gameResults.allResults.map((result, index) => (
                          <motion.div
                            key={result.playerId}
                            className="card split"
                            style={{
                              background: index === 0 ? 'var(--color-highlight)' : 'var(--color-surface-alt)',
                              border: index === 0 ? '3px solid var(--color-accent)' : '1px solid var(--color-border)',
                              padding: '24px'
                            }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + index * 0.1 }}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-4xl">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎭'}
                              </span>
                              <span className="font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                {result.playerName}
                              </span>
                            </div>
                            <div className="badge badge-accent" style={{ fontSize: '18px', padding: '12px 20px' }}>
                              {result.votes} vote{result.votes !== 1 ? 's' : ''}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {script && (
                    <motion.div
                      className="card"
                      style={{ background: 'var(--color-surface-alt)', padding: '24px' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Script: <span className="font-script font-bold" style={{ color: 'var(--color-text-primary)' }}>{script.title}</span>
                      </p>
                      <p className="italic mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                        {script.synopsis}
                      </p>
                      <div className="flex gap-3 justify-center flex-wrap">
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
                  <div className="text-9xl mb-8">🎉</div>
                  <h1 className="hero-title mb-6" style={{ color: 'var(--color-text-primary)' }}>Performance Complete!</h1>
                  <p className="text-2xl mb-12" style={{ color: 'var(--color-text-secondary)' }}>Thanks for playing!</p>
                </>
              )}

              <div className="flex flex-col gap-4 items-center mt-8">
                {script && (
                  <motion.button
                    onClick={requestSequel}
                    className="btn btn-primary btn-large"
                    style={{ minWidth: '280px' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
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
                  transition={{ delay: 1.3 }}
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
                  transition={{ delay: 1.4 }}
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
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}
