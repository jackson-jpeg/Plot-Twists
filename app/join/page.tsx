// Force rebuild: Writer's Room Update
'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { Player, GameState, Script, CardSelection, GameResults, PlayerRole, TeleprompterSyncData } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { OnboardingModal } from '@/components/OnboardingModal'
import { SmartCardSelector } from '@/components/SmartCardSelector'
import { Modal } from '@/components/Modal'
import { downloadScript, copyScriptToClipboard, getCharactersInScene } from '@/lib/scriptUtils'
import { AudienceReactionBar } from '@/components/AudienceReactionBar'
import { PlotTwistVoting } from '@/components/PlotTwistVoting'
import { getMoodIndicator } from '@/lib/teleprompterUtils'

function JoinPageContent() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code')
  const toast = useToast()
  const confetti = useConfetti()
  useWakeLock() // Prevent screen sleep during gameplay

  const [roomCode, setRoomCode] = useState(codeFromUrl || '')
  const [nickname, setNickname] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [error, setError] = useState('')
  const [roomCodeError, setRoomCodeError] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [roomCodeTouched, setRoomCodeTouched] = useState(false)
  const [nicknameTouched, setNicknameTouched] = useState(false)
  const [shakeInvalid, setShakeInvalid] = useState(false)
  const [roomPreview, setRoomPreview] = useState<{
    gameMode: 'SOLO' | 'HEAD_TO_HEAD' | 'ENSEMBLE'
    playerCount: number
    maxPlayers: number
    isMature: boolean
    gameState: string
  } | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // Room code validation regex (matches server's ROOM_CODE_CHARS: A-Z excluding I, L, O and 2-9)
  const VALID_ROOM_CODE_REGEX = /^[A-HJ-NP-Y2-9]{4}$/

  const validateRoomCode = (code: string): string => {
    if (!code) return 'Room code is required'
    if (code.length !== 4) return 'Room code must be 4 characters'
    if (!VALID_ROOM_CODE_REGEX.test(code.toUpperCase())) return 'Invalid room code format'
    return ''
  }

  const validateNickname = (name: string): string => {
    if (!name) return 'Nickname is required'
    if (name.trim().length < 1) return 'Nickname cannot be empty'
    if (name.length > 20) return 'Nickname must be 20 characters or less'
    return ''
  }

  const isRoomCodeValid = roomCode && VALID_ROOM_CODE_REGEX.test(roomCode.toUpperCase())
  const isNicknameValid = nickname && nickname.trim().length >= 1 && nickname.length <= 20
  const isFormValid = () => isRoomCodeValid && isNicknameValid

  const handleRoomCodeBlur = () => {
    setRoomCodeTouched(true)
    setRoomCodeError(validateRoomCode(roomCode))
  }

  const handleNicknameBlur = () => {
    setNicknameTouched(true)
    setNicknameError(validateNickname(nickname))
  }

  const handleRoomCodeChange = (value: string) => {
    setRoomCode(value.toUpperCase())
    setRoomPreview(null) // Clear preview when code changes
    if (roomCodeTouched) {
      setRoomCodeError(validateRoomCode(value))
    }
  }

  // Fetch room preview when valid room code is entered
  React.useEffect(() => {
    if (!socket || !isConnected) return

    const upperCode = roomCode.toUpperCase()
    if (!VALID_ROOM_CODE_REGEX.test(upperCode)) {
      setRoomPreview(null)
      return
    }

    setIsLoadingPreview(true)
    socket.emit('get_room_preview', upperCode, (response) => {
      setIsLoadingPreview(false)
      if (response.success && response.preview) {
        setRoomPreview(response.preview)
        setRoomIsMature(response.preview.isMature)
      } else {
        setRoomPreview(null)
      }
    })
  }, [socket, isConnected, roomCode])

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    if (nicknameTouched) {
      setNicknameError(validateNickname(value))
    }
  }
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [players, setPlayers] = useState<Player[]>([])
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
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTriggeredSelectionConfetti, setHasTriggeredSelectionConfetti] = useState(false)
  const [script, setScript] = useState<Script | null>(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [myCharacter, setMyCharacter] = useState('')
  const [myPlayerId, setMyPlayerId] = useState<string>('')
  const [greenRoomQuestion, setGreenRoomQuestion] = useState<string>('')
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [myRole, setMyRole] = useState<PlayerRole>('PLAYER')
  const [selectedPackName, setSelectedPackName] = useState<string | null>(null)
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [hostDisconnected, setHostDisconnected] = useState(false)
  const [roomIsMature, setRoomIsMature] = useState(false)
  const [scriptImageUrl, setScriptImageUrl] = useState<string | null>(null)
  const [showPosterLightbox, setShowPosterLightbox] = useState(false)
  const previousSpeaker = React.useRef<string>('')

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

  // Loading stage messages based on progress
  const [loadingProgress, setLoadingProgress] = useState(0)
  const loadingIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

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

  // Start/stop loading progress animation when entering/leaving LOADING state
  useEffect(() => {
    if (gameState === 'LOADING') {
      setLoadingProgress(0)
      loadingIntervalRef.current = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return 95
          return prev + Math.random() * 8 + 2
        })
      }, 1500)
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
      setLoadingProgress(0)
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
      }
    }
  }, [gameState])

  useEffect(() => {
    if (!script || gameState !== 'PERFORMING') return
    const currentSpeaker = script.lines[currentLineIndex]?.speaker
    if (currentSpeaker === myCharacter && previousSpeaker.current !== myCharacter) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
    }
    previousSpeaker.current = currentSpeaker
  }, [currentLineIndex, script, myCharacter, gameState])

  // Trigger confetti when results appear
  useEffect(() => {
    if (gameState === 'RESULTS' && gameResults?.winner) {
      setTimeout(() => confetti.fireCelebration(), 500)
    }
  }, [gameState, gameResults, confetti])

  // Trigger mini confetti when all cards are selected for the first time
  useEffect(() => {
    if (
      selection.character &&
      selection.setting &&
      selection.circumstance &&
      !hasTriggeredSelectionConfetti &&
      gameState === 'SELECTION' &&
      !hasSubmitted
    ) {
      setHasTriggeredSelectionConfetti(true)
      confetti.fireWinnerConfetti()
      toast.success('All cards selected! Ready to submit!')
    }
  }, [selection, hasTriggeredSelectionConfetti, gameState, hasSubmitted, confetti, toast])

  // Reset confetti trigger when selection resets
  useEffect(() => {
    if (!selection.character && !selection.setting && !selection.circumstance) {
      setHasTriggeredSelectionConfetti(false)
    }
  }, [selection])

  useEffect(() => {
    if (!socket || !isConnected) return
    socket.on('players_update', setPlayers)
    socket.on('player_joined', (player: Player) => {
      if (gameState === 'LOBBY' && player.id !== myPlayerId && !player.isHost) {
        toast.success(`${player.nickname} joined!`)
      }
    })
    socket.on('game_state_change', setGameState)
    socket.on('available_cards', setAvailableCards)
    socket.on('green_room_prompt', setGreenRoomQuestion)
    socket.on('script_ready', (newScript) => {
      setScript(newScript)
      setCurrentLineIndex(0)
      setScriptImageUrl(newScript.imageUrl || null)
      // Only set character if not a spectator
      if (myRole !== 'SPECTATOR') {
        setMyCharacter(selection.character)
      }
    })
    socket.on('script_image_update', (imageUrl) => {
      // Only display real generated images, not fallback placeholder
      if (imageUrl && !imageUrl.includes('default-poster')) {
        setScriptImageUrl(imageUrl)
      }
    })
    // Handle both legacy (number) and new (object) sync formats
    socket.on('sync_teleprompter', (data: TeleprompterSyncData | number) => {
      if (typeof data === 'number') {
        setCurrentLineIndex(data)
      } else {
        setCurrentLineIndex(data.lineIndex)
      }
    })
    socket.on('game_over', setGameResults)
    socket.on('error', (errorMsg: string) => {
      toast.error(errorMsg)
      setError(errorMsg)
    })
    socket.on('host_disconnected', (data: { message: string }) => {
      toast.error('Host Disconnected')
      setError(data.message)
      // Set a flag to show recovery UI
      setHostDisconnected(true)
    })
    socket.on('card_pack_selected', (packId: string) => {
      // Display a friendly name based on pack ID
      if (packId === 'standard') {
        setSelectedPackName('Standard Pack')
      } else if (packId === 'example-office-comedy') {
        setSelectedPackName('Office Comedy')
      } else if (packId === 'example-scifi-adventures') {
        setSelectedPackName('Sci-Fi Adventures')
      } else {
        setSelectedPackName('Custom Pack')
      }
    })
    // Handle new game started (play again without reload)
    socket.on('new_game_started', () => {
      setGameState('LOBBY')
      setScript(null)
      setScriptImageUrl(null)  // Clear previous poster
      setCurrentLineIndex(0)
      setGameResults(null)
      setHasSubmitted(false)
      setMyCharacter('')
      setSelection({ character: '', setting: '', circumstance: '' })
      setGreenRoomQuestion('')
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
      socket.off('available_cards')
      socket.off('green_room_prompt')
      socket.off('script_ready')
      socket.off('script_image_update')
      socket.off('sync_teleprompter')
      socket.off('game_over')
      socket.off('error')
      socket.off('host_disconnected')
      socket.off('card_pack_selected')
      socket.off('new_game_started')
      socket.off('latency_ping')
      socket.off('latency_pong_response')
    }
  }, [socket, isConnected, selection, myRole, gameState, myPlayerId, toast])

  const handleJoin = () => {
    // Validate all fields first
    const roomErr = validateRoomCode(roomCode)
    const nickErr = validateNickname(nickname)

    setRoomCodeTouched(true)
    setNicknameTouched(true)
    setRoomCodeError(roomErr)
    setNicknameError(nickErr)

    if (roomErr || nickErr) {
      setShakeInvalid(true)
      setTimeout(() => setShakeInvalid(false), 500)
      toast.error('Please fix the errors above')
      return
    }

    if (!socket) {
      toast.error('Not connected to server')
      return
    }

    setError('')
    setIsJoining(true)
    const upperRoomCode = roomCode.toUpperCase()

    // Set up timeout
    const timeoutId = setTimeout(() => {
      setIsJoining(false)
      setError('Connection timed out. Please try again.')
      toast.error('Connection timed out')
    }, 5000)

    socket.emit('join_room', upperRoomCode, nickname, (response) => {
      clearTimeout(timeoutId)
      setIsJoining(false)

      if (response.success) {
        setHasJoined(true)

        // Set role from server response
        if (response.role) {
          setMyRole(response.role)
          if (response.role === 'SPECTATOR') {
            toast.info('Room is full! You joined as a Spectator.')
          } else {
            toast.success(`Joined room ${upperRoomCode}!`)
          }
        } else {
          toast.success(`Joined room ${upperRoomCode}!`)
        }

        if (response.players) {
          setPlayers(response.players)
          // Find my player ID by matching nickname
          const myPlayer = response.players.find(p => p.nickname === nickname && !p.isHost)
          if (myPlayer) setMyPlayerId(myPlayer.id)
        }
      } else {
        const errorMsg = response.error || 'Room not found'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    })
  }

  const handleSubmitCards = () => {
    if (!socket || !roomCode || !selection.character || !selection.setting || !selection.circumstance) {
      toast.error('Please select all cards')
      return
    }
    setIsSubmitting(true)
    socket.emit('submit_cards', roomCode, selection, (response) => {
      setIsSubmitting(false)
      if (response.success) {
        setHasSubmitted(true)
        toast.success('Cards submitted!')
      } else {
        toast.error(response.error || 'Failed to submit cards')
      }
    })
  }

  const handleVote = (playerId: string) => socket?.emit('submit_vote', roomCode, playerId)

  // Player navigation (synced with all clients)
  const goToPreviousLine = () => {
    if (currentLineIndex > 0) {
      socket?.emit('player_jump_to_line', roomCode.toUpperCase(), currentLineIndex - 1)
    }
  }

  const goToNextLine = () => {
    if (script && currentLineIndex < script.lines.length - 1) {
      socket?.emit('player_jump_to_line', roomCode.toUpperCase(), currentLineIndex + 1)
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

  if (!isConnected) {
    return (
      <div className="page-container items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚡</div>
          <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Connecting...</p>
        </div>
      </div>
    )
  }

  if (!hasJoined) {
    return (
      <div className="page-container items-center justify-center">
        <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="join" />

        {/* Back Button */}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="card card-accent">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-display" style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}>
                Join Game
              </h1>
              <button
                onClick={() => setShowOnboarding(true)}
                className="btn btn-ghost"
                style={{ padding: '8px 12px', fontSize: '14px' }}
              >
                <span>❓</span>
              </button>
            </div>

            <div className="stack">
              <div>
                <label className="label">Room Code</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => handleRoomCodeChange(e.target.value)}
                    onBlur={handleRoomCodeBlur}
                    placeholder="Enter code (e.g., QUIZ)"
                    maxLength={4}
                    className={`input font-script text-center text-3xl ${
                      roomCodeTouched && roomCodeError ? 'input-error' : ''
                    } ${isRoomCodeValid ? 'input-valid' : ''}`}
                    style={{ paddingRight: isRoomCodeValid ? '44px' : '16px' }}
                  />
                  {isRoomCodeValid && (
                    <span className="input-check">✓</span>
                  )}
                </div>
                {roomCodeTouched && roomCodeError && (
                  <p className="error-text">⚠️ {roomCodeError}</p>
                )}

                {/* Room Preview */}
                <AnimatePresence>
                  {isLoadingPreview && isRoomCodeValid && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 rounded-lg"
                      style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          🔍
                        </motion.span>
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Looking for room...
                        </span>
                      </div>
                    </motion.div>
                  )}
                  {roomPreview && !isLoadingPreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-4 rounded-lg"
                      style={{
                        background: roomPreview.playerCount >= roomPreview.maxPlayers
                          ? 'var(--color-highlight-pink)'
                          : 'var(--color-highlight)',
                        border: roomPreview.playerCount >= roomPreview.maxPlayers
                          ? '2px solid var(--color-warning)'
                          : '2px solid var(--color-success)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <motion.span
                            className="text-2xl"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                          >
                            {roomPreview.gameMode === 'SOLO' ? '🎤' : roomPreview.gameMode === 'HEAD_TO_HEAD' ? '⚔️' : '🎭'}
                          </motion.span>
                          <div>
                            <span className="font-semibold text-sm block" style={{ color: 'var(--color-text-primary)' }}>
                              {roomPreview.gameMode === 'SOLO' ? 'Solo Mode' : roomPreview.gameMode === 'HEAD_TO_HEAD' ? 'Head-to-Head' : 'Ensemble'}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              {roomPreview.gameMode === 'SOLO' ? 'You vs. AI' : roomPreview.gameMode === 'HEAD_TO_HEAD' ? '1v1 showdown' : 'Group improv'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="px-3 py-1 rounded-full text-sm font-semibold"
                            style={{
                              background: roomPreview.playerCount >= roomPreview.maxPlayers ? 'var(--color-warning)' : 'var(--color-success)',
                              color: 'white'
                            }}
                          >
                            {roomPreview.playerCount}/{roomPreview.maxPlayers}
                          </div>
                          {roomPreview.isMature && (
                            <span
                              className="px-2 py-1 rounded text-xs font-bold"
                              style={{ background: 'var(--color-danger)', color: 'white' }}
                            >
                              18+
                            </span>
                          )}
                        </div>
                      </div>

                      {roomPreview.playerCount >= roomPreview.maxPlayers && (
                        <motion.p
                          className="text-xs text-center p-2 rounded"
                          style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--color-warning)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          👁️ Room is full — you'll join as a spectator
                        </motion.p>
                      )}

                      {roomPreview.gameState !== 'LOBBY' && (
                        <motion.p
                          className="text-xs text-center p-2 rounded mt-2"
                          style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--color-danger)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          ⚠️ Game already in progress — wait for next round
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="label">Your Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => handleNicknameChange(e.target.value)}
                    onBlur={handleNicknameBlur}
                    placeholder="Enter your name"
                    maxLength={20}
                    className={`input text-lg ${
                      nicknameTouched && nicknameError ? 'input-error' : ''
                    } ${isNicknameValid ? 'input-valid' : ''}`}
                    style={{ paddingRight: isNicknameValid ? '44px' : '16px' }}
                  />
                  {isNicknameValid && (
                    <span className="input-check">✓</span>
                  )}
                </div>
                {nicknameTouched && nicknameError && (
                  <p className="error-text">⚠️ {nicknameError}</p>
                )}
              </div>

              {error && (
                <motion.div
                  className="error-banner p-4 rounded-lg flex items-center gap-3 justify-center"
                  style={{ background: 'var(--color-danger)', border: '2px solid var(--color-bg)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="text-2xl">
                    {error.includes('not found') ? '🔍' :
                     error.includes('full') ? '🚫' :
                     error.includes('timeout') ? '⏱️' : '⚠️'}
                  </span>
                  <p className="text-white font-semibold">{error}</p>
                </motion.div>
              )}

              <div>
                <button
                  onClick={handleJoin}
                  disabled={!isFormValid() || isJoining}
                  className={`btn btn-primary btn-large w-full ${shakeInvalid ? 'shake' : ''}`}
                >
                  {isJoining ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        ⏳
                      </motion.span>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Join</span>
                    </>
                  )}
                </button>
                {!isFormValid() && !isJoining && (
                  <p className="btn-helper-text">Fill in all fields to continue</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="join" />

      {/* Host Disconnected Overlay */}
      <AnimatePresence>
        {hostDisconnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-md w-full text-center"
            >
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-2xl font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Host Disconnected
              </h2>
              <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                The host has left the game. You can wait for them to reconnect or return to the home page.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={() => setHostDisconnected(false)}
                  className="btn btn-secondary w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Wait for Reconnection
                </motion.button>
                <motion.button
                  onClick={() => router.push('/')}
                  className="btn btn-primary w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Return Home
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <motion.div
            key="lobby"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-lg text-center"
          >
            <div className="card">
              <div className="text-6xl mb-6">{myRole === 'SPECTATOR' ? '👁️' : '🎉'}</div>
              <h1 className="text-4xl font-display mb-4" style={{ color: 'var(--color-success)' }}>
                {myRole === 'SPECTATOR' ? 'Spectator Mode' : "You're In!"}
              </h1>
              <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {myRole === 'SPECTATOR'
                  ? 'Sit back and enjoy the show! You can vote at the end.'
                  : 'Waiting for game to start...'}
              </p>
              {selectedPackName && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                  style={{ background: 'var(--color-highlight)', border: '1px solid var(--color-border)' }}
                >
                  <span>📦</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {selectedPackName}
                  </span>
                </motion.div>
              )}
              <div className="stack-sm">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: 'var(--color-surface-alt)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold"
                      style={{ background: 'var(--color-accent)', color: 'white' }}
                    >
                      {player.nickname[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                      {player.nickname}
                      {player.isHost && '👑'}
                      {player.role === 'SPECTATOR' && <span title="Spectator">👁️</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'SELECTION' && !hasSubmitted && myRole === 'SPECTATOR' && (
          <motion.div
            key="spectator-waiting"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-lg text-center"
          >
            <div className="card">
              <div className="text-8xl mb-6">🍿</div>
              <h1 className="text-3xl font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>Grab Some Popcorn</h1>
              <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                Waiting for the actors to pick their cards...
              </p>
            </div>
          </motion.div>
        )}

        {gameState === 'SELECTION' && !hasSubmitted && myRole !== 'SPECTATOR' && (
          <motion.div
            key="selection"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-2xl"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-display" style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}>
                  {customInputActive.character || customInputActive.setting || customInputActive.circumstance
                    ? '✎ Writer\'s Room'
                    : '🎴 Pick Your Cards'}
                </h1>

                {/* Progress Indicator */}
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

              {/* Feeling Lucky Button */}
              {!customInputActive.character && !customInputActive.setting && !customInputActive.circumstance && (
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

                      if ('vibrate' in navigator) {
                        navigator.vibrate([50, 50, 50])
                      }

                      toast.success('Shuffled! 🎲')
                    }
                  }}
                  className="btn btn-ghost w-full mb-6"
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

              <div className="stack">
                {/* Character Input */}
                <div>
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onClick={() => {
                        setCustomInputActive({ ...customInputActive, character: !customInputActive.character })
                        if (!customInputActive.character) {
                          // Switching to custom mode - clear the selection
                          setSelection({ ...selection, character: '' })
                        }
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        background: customInputActive.character ? 'var(--color-accent)' : '#f0f0f0',
                        color: customInputActive.character ? 'white' : 'var(--color-text-secondary)'
                      }}
                    >
                      <span>{customInputActive.character ? '✎ Write Custom' : '🃏 Pick Card'}</span>
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
                          background: '#f0f0f0',
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
                      onChange={(value) => {
                        setSelection({ ...selection, character: value })
                        if ('vibrate' in navigator) {
                          navigator.vibrate(50)
                        }
                      }}
                      color="var(--color-accent)"
                      isMature={roomIsMature}
                    />
                  )}
                </div>

                {/* Setting Input */}
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
                        background: customInputActive.setting ? 'var(--color-accent-2)' : '#f0f0f0',
                        color: customInputActive.setting ? 'white' : 'var(--color-text-secondary)'
                      }}
                    >
                      <span>{customInputActive.setting ? '✎ Write Custom' : '🃏 Pick Card'}</span>
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
                          background: '#f0f0f0',
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
                      onChange={(value) => {
                        setSelection({ ...selection, setting: value })
                        if ('vibrate' in navigator) {
                          navigator.vibrate(50)
                        }
                      }}
                      color="var(--color-accent-2)"
                      isMature={roomIsMature}
                    />
                  )}
                </div>

                {/* Circumstance Input */}
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
                        background: customInputActive.circumstance ? 'var(--color-warning)' : '#f0f0f0',
                        color: customInputActive.circumstance ? 'white' : 'var(--color-text-secondary)'
                      }}
                    >
                      <span>{customInputActive.circumstance ? '✎ Write Custom' : '🃏 Pick Card'}</span>
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
                        placeholder="Enter custom circumstance (e.g., Must apologize for a misunderstanding)..."
                        maxLength={80}
                        className="input font-script text-lg"
                        style={{
                          background: '#f0f0f0',
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
                      onChange={(value) => {
                        setSelection({ ...selection, circumstance: value })
                        if ('vibrate' in navigator) {
                          navigator.vibrate(50)
                        }
                      }}
                      color="var(--color-warning)"
                      isMature={roomIsMature}
                    />
                  )}
                </div>

                {error && (
                  <div className="p-4 rounded-lg" style={{ background: 'var(--color-danger)', border: '2px solid var(--color-bg)' }}>
                    <p className="text-white text-center font-semibold">⚠️ {error}</p>
                  </div>
                )}

                {/* Selection Preview */}
                {(selection.character || selection.setting || selection.circumstance) && (
                  <motion.div
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--color-highlight)', border: '2px solid var(--color-accent)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
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
                  onClick={handleSubmitCards}
                  disabled={!selection.character || !selection.setting || !selection.circumstance || isSubmitting}
                  className="btn btn-primary btn-large w-full"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  style={{
                    marginTop: '24px',
                    opacity: (!selection.character || !selection.setting || !selection.circumstance || isSubmitting) ? 0.5 : 1
                  }}
                  animate={
                    (selection.character && selection.setting && selection.circumstance && !isSubmitting)
                      ? {
                          boxShadow: [
                            '0 0 0 0 rgba(245, 158, 66, 0)',
                            '0 0 0 10px rgba(245, 158, 66, 0)',
                            '0 0 0 0 rgba(245, 158, 66, 0)'
                          ]
                        }
                      : {}
                  }
                  transition={
                    (selection.character && selection.setting && selection.circumstance && !isSubmitting)
                      ? { duration: 2, repeat: Infinity }
                      : {}
                  }
                >
                  {isSubmitting ? (
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
            </div>
          </motion.div>
        )}

        {gameState === 'SELECTION' && hasSubmitted && (
          <motion.div
            key="waiting"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-lg text-center"
          >
            <div className="card">
              <div className="text-8xl mb-6">✓</div>
              <h1 className="text-4xl font-display mb-4" style={{ color: 'var(--color-success)' }}>Submitted!</h1>
              <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Waiting for others...</p>
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
            className="container max-w-lg text-center"
          >
            <div className="card">
              <h1 className="text-3xl font-display mb-6" style={{ color: 'var(--color-text-primary)' }}>Get Ready!</h1>

              {/* Animated stage icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={getCurrentLoadingStage().icon}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-8xl mb-4"
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
                {greenRoomQuestion && (
                  <motion.div
                    className="card card-accent-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className="font-display text-lg mb-3" style={{ color: 'var(--color-accent-2)' }}>💭 While You Wait</h3>
                    <p className="text-base italic" style={{ color: 'var(--color-text-primary)' }}>"{greenRoomQuestion}"</p>
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
            className="min-h-screen flex flex-col"
          >
            {/* Audience Interaction - show for spectators and players not currently speaking */}
            <AudienceReactionBar roomCode={roomCode.toUpperCase()} isPerforming={true} isHost={false} />
            <PlotTwistVoting roomCode={roomCode.toUpperCase()} isHost={false} />

            {/* Generated Poster (mobile-friendly) */}
            <AnimatePresence mode="wait">
              {scriptImageUrl && (
                <motion.div
                  key="poster"
                  className="mx-auto my-4 flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    onClick={() => setShowPosterLightbox(true)}
                    style={{
                      maxWidth: 240,
                      maxHeight: 200,
                      borderRadius: 'var(--radius-xl, 16px)',
                      border: '3px solid var(--color-border)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)',
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img
                      src={scriptImageUrl}
                      alt={`${script.title} Poster`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </motion.div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Tap poster to enlarge</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="p-4" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-script">{script.title}</span>
                <span className="font-script">{currentLineIndex + 1}/{script.lines.length}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${((currentLineIndex + 1) / script.lines.length) * 100}%`,
                    background: 'var(--color-accent)'
                  }}
                />
              </div>
              <p className="px-4 pt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Characters: {getCharactersInScene(script).join(', ')}
              </p>
            </div>

            {/* Script Display */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              {script.lines[currentLineIndex] && (() => {
                const moodIndicator = getMoodIndicator(script.lines[currentLineIndex].mood)
                return (
                  <motion.div
                    key={currentLineIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-center w-full max-w-2xl"
                  >
                    {script.lines[currentLineIndex].speaker === myCharacter && (
                      <div className="script-your-turn mb-6">
                        ★ YOUR TURN
                      </div>
                    )}

                    <div
                      className="inline-block px-6 py-2 rounded-lg mb-3"
                      style={{
                        background: script.lines[currentLineIndex].speaker === myCharacter
                          ? 'var(--color-highlight-pink)'
                          : 'var(--color-surface-alt)',
                        border: `2px solid ${script.lines[currentLineIndex].speaker === myCharacter ? 'var(--color-accent)' : 'var(--color-border)'}`
                      }}
                    >
                      <p className="font-script font-bold text-lg" style={{
                        color: 'var(--color-text-primary)'
                      }}>
                        {script.lines[currentLineIndex].speaker}
                      </p>
                    </div>

                    <motion.div
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 inline-flex"
                      style={{
                        background: `${moodIndicator.color}20`,
                        border: `1px solid ${moodIndicator.color}60`,
                        color: moodIndicator.color
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    >
                      <span className="text-lg">{moodIndicator.emoji}</span>
                      <span>{moodIndicator.label}</span>
                    </motion.div>

                  <div
                    className={`card p-8 ${script.lines[currentLineIndex].speaker === myCharacter ? 'your-turn-enhanced' : ''}`}
                    style={{
                      borderLeft: script.lines[currentLineIndex].speaker === myCharacter
                        ? '3px solid var(--color-accent)'
                        : '1px solid var(--color-border)'
                    }}
                  >
                    <p className="font-script text-2xl leading-relaxed" style={{
                      color: 'var(--color-text-primary)',
                      fontSize: script.lines[currentLineIndex].speaker === myCharacter ? '28px' : '24px'
                    }}>
                      {script.lines[currentLineIndex].text}
                    </p>
                  </div>

                  {currentLineIndex < script.lines.length - 1 && (
                    <div className="mt-6 p-4 rounded-lg text-left" style={{ background: 'var(--color-surface-alt)' }}>
                      <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>COMING UP:</p>
                      <p className="font-script font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {script.lines[currentLineIndex + 1].speaker}
                      </p>
                      <p className="font-script text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {script.lines[currentLineIndex + 1].text}
                      </p>
                    </div>
                  )}
                </motion.div>
                )
              })()}
            </div>

            {/* Player Navigation Controls */}
            <div className="p-4 pb-safe" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between max-w-md mx-auto">
                <motion.button
                  onClick={goToPreviousLine}
                  disabled={currentLineIndex === 0}
                  className="btn btn-ghost"
                  style={{
                    opacity: currentLineIndex === 0 ? 0.5 : 1,
                    padding: '12px 20px'
                  }}
                  whileHover={currentLineIndex > 0 ? { scale: 1.05, x: -2 } : {}}
                  whileTap={currentLineIndex > 0 ? { scale: 0.95 } : {}}
                >
                  ← Previous
                </motion.button>

                <span className="font-script text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {currentLineIndex + 1} / {script.lines.length}
                </span>

                <motion.button
                  onClick={goToNextLine}
                  disabled={currentLineIndex >= script.lines.length - 1}
                  className="btn btn-ghost"
                  style={{
                    opacity: currentLineIndex >= script.lines.length - 1 ? 0.5 : 1,
                    padding: '12px 20px'
                  }}
                  whileHover={currentLineIndex < script.lines.length - 1 ? { scale: 1.05, x: 2 } : {}}
                  whileTap={currentLineIndex < script.lines.length - 1 ? { scale: 0.95 } : {}}
                >
                  Next →
                </motion.button>
              </div>
              <motion.p
                className="text-center text-xs mt-2"
                style={{ color: 'var(--color-text-tertiary)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                🔄 Navigation syncs with all players
              </motion.p>
            </div>
          </motion.div>
        )}

        {gameState === 'VOTING' && (
          <motion.div
            key="voting"
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="container max-w-lg"
          >
            <div className="card">
              <h1 className="text-3xl font-display text-center mb-4" style={{ color: 'var(--color-text-primary)' }}>🏆 Vote for MVP</h1>
              <p className="text-center mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                Who had the best performance?
              </p>

              {/* Show if current player has already voted */}
              {players.find(p => p.id === myPlayerId)?.hasSubmittedVote ? (
                <motion.div
                  className="card text-center"
                  style={{ background: 'var(--color-highlight)', padding: '32px' }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="text-6xl mb-4">✓</div>
                  <p className="text-xl font-display" style={{ color: 'var(--color-text-primary)' }}>Vote Submitted!</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                    Waiting for others...
                  </p>
                </motion.div>
              ) : (
                <div className="stack-sm">
                  {players.filter((p) => p.role === 'PLAYER' && p.id !== myPlayerId).map((player) => (
                    <motion.button
                      key={player.id}
                      onClick={() => handleVote(player.id)}
                      className="btn btn-secondary w-full"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {player.nickname}
                    </motion.button>
                  ))}
                </div>
              )}
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
            className="container max-w-lg"
          >
            <div className="card text-center">
              {gameResults && gameResults.winner ? (
                <>
                  {/* Trophy with pulsing glow */}
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
                        pointerEvents: 'none',
                      }}
                      animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.1, 0.9] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="text-8xl"
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
                    <motion.div
                      className="mx-auto mb-4 flex flex-col items-center"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      style={{ perspective: 1000 }}
                    >
                      <motion.div
                        onClick={() => setShowPosterLightbox(true)}
                        style={{
                          maxWidth: 200,
                          borderRadius: 'var(--radius-xl, 16px)',
                          border: '3px solid var(--color-accent)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)',
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src={scriptImageUrl}
                          alt={`${script?.title} Poster`}
                          style={{ width: '100%', display: 'block', objectFit: 'contain' }}
                        />
                      </motion.div>
                      {script && (
                        <motion.p
                          className="font-display text-base mt-2"
                          style={{ color: 'var(--color-text-secondary)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {script.title}
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  {/* Winner name with blur reveal */}
                  <motion.h1
                    className="text-4xl font-display mb-2"
                    style={{ color: 'var(--color-accent)' }}
                    initial={{ y: -20, opacity: 0, filter: 'blur(8px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {gameResults.winner.playerName} Wins!
                  </motion.h1>

                  {/* MVP badge */}
                  <motion.p
                    className="text-xl mb-8"
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
                        className="mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <h3 className="font-display text-lg mb-4 text-center" style={{ color: 'var(--color-text-primary)' }}>
                          Final Standings
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                                  padding: '16px',
                                  textAlign: 'left',
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + index * 0.15 }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <motion.span
                                      style={{ fontSize: isWinner ? 28 : 22, display: 'inline-block' }}
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{ type: 'spring', bounce: 0.5, delay: 0.95 + index * 0.15 }}
                                    >
                                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎭'}
                                    </motion.span>
                                    <span style={{
                                      fontSize: isWinner ? 18 : 16,
                                      fontWeight: isWinner ? 700 : 600,
                                      color: 'var(--color-text-primary)',
                                    }}>
                                      {result.playerName}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: isWinner ? 18 : 16, fontWeight: 700, color: barColor }}>
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
                                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
                                  {percentage}% of votes
                                </p>
                              </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )
                  })()}
                </>
              ) : (
                <>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, var(--color-accent-2) 0%, transparent 70%)',
                        pointerEvents: 'none',
                      }}
                      animate={{ opacity: [0.1, 0.25, 0.1], scale: [0.9, 1.1, 0.9] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="text-8xl"
                      style={{ position: 'relative' }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    >
                      🎉
                    </motion.div>
                  </div>

                  {scriptImageUrl && (
                    <motion.div
                      className="mx-auto mb-4 flex flex-col items-center"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      style={{ perspective: 1000 }}
                    >
                      <motion.div
                        onClick={() => setShowPosterLightbox(true)}
                        style={{
                          maxWidth: 200,
                          borderRadius: 'var(--radius-xl, 16px)',
                          border: '3px solid var(--color-accent-2)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)',
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src={scriptImageUrl}
                          alt={`${script?.title ?? 'Movie'} Poster`}
                          style={{ width: '100%', display: 'block', objectFit: 'contain' }}
                        />
                      </motion.div>
                      {script && (
                        <motion.p
                          className="font-display text-base mt-2"
                          style={{ color: 'var(--color-text-secondary)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {script.title}
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  <motion.h1
                    className="text-4xl font-display mb-6"
                    style={{ color: 'var(--color-text-primary)' }}
                    initial={{ y: -20, opacity: 0, filter: 'blur(8px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    Performance Complete!
                  </motion.h1>
                  <motion.p
                    className="text-xl mb-8"
                    style={{ color: 'var(--color-text-secondary)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    Thanks for playing!
                  </motion.p>
                </>
              )}

              {script && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <div className="flex gap-3 justify-center flex-wrap">
                    <motion.button
                      onClick={handleDownloadScript}
                      className="btn btn-secondary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>💾</span>
                      <span>Save Script</span>
                    </motion.button>
                    <motion.button
                      onClick={handleCopyScript}
                      className="btn btn-ghost"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{copySuccess ? '✓' : '📋'}</span>
                      <span>{copySuccess ? 'Copied!' : 'Copy Script'}</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              <motion.div
                className="card text-center"
                style={{ background: 'var(--color-highlight)', padding: '24px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <motion.div
                  className="text-4xl mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⏳
                </motion.div>
                <p className="font-display text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Waiting for Host...
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  The host will start the next game
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Lightbox Modal */}
      <Modal isOpen={showPosterLightbox} onClose={() => setShowPosterLightbox(false)} title={script?.title ?? 'Movie Poster'} maxWidth="600px">
        {scriptImageUrl && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={scriptImageUrl}
              alt={`${script?.title ?? 'Movie'} Poster`}
              style={{ maxHeight: '75vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg, 12px)' }}
            />
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="page-container items-center justify-center">
        <p className="text-xl font-display" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  )
}
