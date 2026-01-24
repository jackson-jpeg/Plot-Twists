'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { Player, GameState, Script, RoomSettings, GameResults, ScriptCustomization, AudioSettings } from '@/lib/types'
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

// Helper function to get mood emoji and color
function getMoodIndicator(mood: string) {
  const moodMap: Record<string, { emoji: string; color: string; label: string }> = {
    angry: { emoji: '😠', color: '#D77A7A', label: 'Angry' },
    happy: { emoji: '😊', color: '#82B682', label: 'Happy' },
    confused: { emoji: '😕', color: '#E8A75D', label: 'Confused' },
    whispering: { emoji: '🤫', color: '#7C9FD9', label: 'Whispering' },
    neutral: { emoji: '😐', color: '#9B9590', label: 'Neutral' }
  }
  return moodMap[mood] || moodMap.neutral
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

  useEffect(() => {
    if (!socket || !isConnected) return
    socket.on('players_update', setPlayers)
    socket.on('game_state_change', setGameState)
    socket.on('green_room_prompt', setGreenRoomQuestion)
    socket.on('script_ready', (newScript) => { setScript(newScript); setCurrentLineIndex(0) })
    socket.on('sync_teleprompter', setCurrentLineIndex)
    socket.on('game_over', setGameResults)
    return () => {
      socket.off('players_update')
      socket.off('game_state_change')
      socket.off('green_room_prompt')
      socket.off('script_ready')
      socket.off('sync_teleprompter')
      socket.off('game_over')
    }
  }, [socket, isConnected])

  const startGame = () => {
    // Send customization settings along with start game command
    socket?.emit('update_room_settings', roomCode, {
      scriptCustomization,
      audioSettings,
      cardPackId: selectedPackId
    })
    socket?.emit('start_game', roomCode)
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

  const handleDownloadScript = () => {
    if (script) {
      downloadScript(script)
    }
  }

  const requestSequel = () => {
    setGameState('LOADING')
    socket?.emit('request_sequel', roomCode)
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
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
                  <div className="room-code-display">
                    {roomCode}
                  </div>
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
                  {nonHostPlayers.length === 0 && (
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
                        ⏳
                      </motion.p>
                      <p className="empty-state-description" style={{ fontSize: '14px', marginBottom: 0 }}>
                        Waiting for players to join...
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
                      background: settings.gameMode === 'ENSEMBLE' ? 'var(--color-highlight)' : 'var(--color-surface)'
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-2xl mb-2">🎭</div>
                    <div className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Ensemble</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>3-6 players</div>
                  </motion.button>
                </div>
              </div>

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
              />

              <ScriptCustomizationPanel
                customization={scriptCustomization}
                onChange={setScriptCustomization}
              />

              <AudioSettingsPanel
                settings={audioSettings}
                onChange={setAudioSettings}
              />

              <AnimatePresence>
                {((settings.gameMode === 'SOLO' && nonHostPlayers.length === 1) ||
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
                    <span>Start Game</span>
                  </motion.button>
                )}

                {/* Player count hints */}
                {nonHostPlayers.length === 0 && (
                  <motion.div
                    className="card text-center"
                    style={{ background: 'var(--color-surface-alt)', padding: '16px' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                      Waiting for players to join...
                    </p>
                  </motion.div>
                )}

                {settings.gameMode === 'SOLO' && nonHostPlayers.length === 0 && (
                  <motion.div
                    className="card text-center"
                    style={{ background: 'var(--color-highlight)', padding: '16px', border: '1px solid var(--color-warning)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                      🎤 Solo needs exactly 1 player (You vs. AI)
                    </p>
                  </motion.div>
                )}

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

        {gameState === 'SELECTION' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
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
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-8xl mb-8"
              >
                🤖
              </motion.div>
              <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                Claude is crafting your comedy...
              </p>
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
              <div className="progress mb-8">
                <motion.div
                  className="progress-bar"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, ease: "easeInOut" }}
                />
              </div>
              <AnimatePresence mode="wait">
                {greenRoomQuestion && (
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
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {gameState === 'PERFORMING' && script && (
          <motion.div
            key="performing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container max-w-5xl"
          >
            {/* Audience Interaction Components */}
            <AudienceReactionBar roomCode={roomCode} isPerforming={true} isHost={true} />
            <PlotTwistVoting roomCode={roomCode} isHost={true} />
            {/* Meta Info */}
            <motion.div
              className="mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-baseline gap-4 mb-2">
                <h2 className="text-3xl font-display" style={{ color: 'var(--color-text-primary)' }}>{script.title}</h2>
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

            {/* Script */}
            <motion.div
              className="script-container mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="script-title">{script.title}</div>
              <AnimatePresence mode="sync">
                {script.lines.map((line, index) => {
                  const moodIndicator = getMoodIndicator(line.mood)
                  return (
                    <motion.div
                      key={index}
                      className={`script-line ${
                        index === currentLineIndex ? 'script-line-active' :
                        index < currentLineIndex ? 'script-line-past' :
                        'script-line-upcoming'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="script-character">{line.speaker}</div>
                        {index === currentLineIndex && (
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
                  whileHover={{ scale: currentLineIndex === 0 ? 1 : 1.05 }}
                  whileTap={{ scale: currentLineIndex === 0 ? 1 : 0.95 }}
                >
                  ← Prev
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
                  whileHover={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 1.05 }}
                  whileTap={{ scale: currentLineIndex >= script.lines.length - 1 ? 1 : 0.95 }}
                >
                  Next →
                </motion.button>
              </div>
              <p className="text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Keyboard: ← | Space | →
              </p>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'VOTING' && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
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
                  onClick={() => window.location.reload()}
                  className="btn btn-secondary btn-large"
                  style={{ minWidth: '280px' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🔄</span>
                  <span>New Game</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
