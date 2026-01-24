// Force rebuild: Writer's Room Update
'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import type { Player, GameState, Script, CardSelection, GameResults, PlayerRole } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useConfetti } from '@/hooks/useConfetti'
import { useWakeLock } from '@/hooks/useWakeLock'
import { OnboardingModal } from '@/components/OnboardingModal'
import { CardCarousel } from '@/components/CardCarousel'
import { downloadScript, copyScriptToClipboard, getCharactersInScene } from '@/lib/scriptUtils'
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
  const [script, setScript] = useState<Script | null>(null)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [myCharacter, setMyCharacter] = useState('')
  const [myPlayerId, setMyPlayerId] = useState<string>('')
  const [greenRoomQuestion, setGreenRoomQuestion] = useState<string>('')
  const [gameResults, setGameResults] = useState<GameResults | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [myRole, setMyRole] = useState<PlayerRole>('PLAYER')
  const previousSpeaker = React.useRef<string>('')

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

  useEffect(() => {
    if (!socket || !isConnected) return
    socket.on('players_update', setPlayers)
    socket.on('game_state_change', setGameState)
    socket.on('available_cards', setAvailableCards)
    socket.on('green_room_prompt', setGreenRoomQuestion)
    socket.on('script_ready', (newScript) => {
      setScript(newScript)
      setCurrentLineIndex(0)
      // Only set character if not a spectator
      if (myRole !== 'SPECTATOR') {
        setMyCharacter(selection.character)
      }
    })
    socket.on('sync_teleprompter', setCurrentLineIndex)
    socket.on('game_over', setGameResults)
    socket.on('error', (errorMsg: string) => {
      toast.error(errorMsg)
      setError(errorMsg)
    })
    return () => {
      socket.off('players_update')
      socket.off('game_state_change')
      socket.off('available_cards')
      socket.off('green_room_prompt')
      socket.off('script_ready')
      socket.off('sync_teleprompter')
      socket.off('game_over')
      socket.off('error')
    }
  }, [socket, isConnected, selection, myRole])

  const handleJoin = () => {
    if (!socket || !roomCode || !nickname) {
      toast.error('Please enter both room code and nickname')
      return
    }
    if (roomCode.length !== 4) {
      toast.error('Room code must be 4 characters')
      return
    }
    setError('')
    const upperRoomCode = roomCode.toUpperCase()
    socket.emit('join_room', upperRoomCode, nickname, (response) => {
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
        toast.error(response.error || 'Failed to join room')
      }
    })
  }

  const handleSubmitCards = () => {
    if (!socket || !roomCode || !selection.character || !selection.setting || !selection.circumstance) {
      toast.error('Please select all cards')
      return
    }
    socket.emit('submit_cards', roomCode, selection, (response) => {
      if (response.success) {
        setHasSubmitted(true)
        toast.success('Cards submitted!')
      } else {
        toast.error(response.error || 'Failed to submit cards')
      }
    })
  }

  const handleVote = (playerId: string) => socket?.emit('submit_vote', roomCode, playerId)

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
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="input font-script text-center text-3xl"
                />
              </div>

              <div>
                <label className="label">Your Name</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="input text-lg"
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg" style={{ background: 'var(--color-danger)', border: '2px solid var(--color-bg)' }}>
                  <p className="text-white text-center font-semibold">⚠️ {error}</p>
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={!roomCode || !nickname}
                className="btn btn-primary btn-large w-full"
              >
                <span>🚀</span>
                <span>Join</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} mode="join" />
      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container max-w-lg text-center"
          >
            <div className="card">
              <div className="text-6xl mb-6">{myRole === 'SPECTATOR' ? '👁️' : '🎉'}</div>
              <h1 className="text-4xl font-display mb-4" style={{ color: 'var(--color-success)' }}>
                {myRole === 'SPECTATOR' ? 'Spectator Mode' : "You're In!"}
              </h1>
              <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                {myRole === 'SPECTATOR'
                  ? 'Sit back and enjoy the show! You can vote at the end.'
                  : 'Waiting for game to start...'}
              </p>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                  <div className="flex items-center justify-between mb-3">
                    <label className="label" style={{ marginBottom: 0 }}>🎭 Character</label>
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
                  ) : (
                    <CardCarousel
                      label="Character"
                      icon="🎭"
                      options={availableCards.characters}
                      value={selection.character}
                      onChange={(value) => {
                        setSelection({ ...selection, character: value })
                        if ('vibrate' in navigator) {
                          navigator.vibrate(50)
                        }
                      }}
                      color="var(--color-accent)"
                    />
                  )}
                </div>

                {/* Setting Input */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="label" style={{ marginBottom: 0 }}>🏛️ Setting</label>
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
                  ) : (
                    <CardCarousel
                      label="Setting"
                      icon="🏛️"
                      options={availableCards.settings}
                      value={selection.setting}
                      onChange={(value) => {
                        setSelection({ ...selection, setting: value })
                        if ('vibrate' in navigator) {
                          navigator.vibrate(50)
                        }
                      }}
                      color="var(--color-accent-2)"
                    />
                  )}
                </div>

                {/* Circumstance Input */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="label" style={{ marginBottom: 0 }}>⚡ Circumstance</label>
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
                  ) : (
                    <CardCarousel
                      label="Circumstance"
                      icon="⚡"
                      options={availableCards.circumstances}
                      value={selection.circumstance}
                      onChange={(value) => {
                        setSelection({ ...selection, circumstance: value })
                        if ('vibrate' in navigator) {
                          navigator.vibrate(50)
                        }
                      }}
                      color="var(--color-warning)"
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
                  disabled={!selection.character || !selection.setting || !selection.circumstance}
                  className="btn btn-primary btn-large w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    marginTop: '24px',
                    opacity: (!selection.character || !selection.setting || !selection.circumstance) ? 0.5 : 1
                  }}
                  animate={
                    (selection.character && selection.setting && selection.circumstance)
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
                    (selection.character && selection.setting && selection.circumstance)
                      ? { duration: 2, repeat: Infinity }
                      : {}
                  }
                >
                  <span>✨</span>
                  <span>
                    {(!selection.character || !selection.setting || !selection.circumstance)
                      ? `Submit Cards (${[selection.character, selection.setting, selection.circumstance].filter(Boolean).length}/3)`
                      : 'Submit Cards - Ready!'}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'SELECTION' && hasSubmitted && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container max-w-lg text-center"
          >
            <div className="card">
              <h1 className="text-3xl font-display mb-8" style={{ color: 'var(--color-text-primary)' }}>Get Ready!</h1>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-8xl mb-8"
              >
                🤖
              </motion.div>
              <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>Claude is writing your script...</p>

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Audience Interaction - show for spectators and players not currently speaking */}
            <AudienceReactionBar roomCode={roomCode.toUpperCase()} isPerforming={true} isHost={false} />
            <PlotTwistVoting roomCode={roomCode.toUpperCase()} isHost={false} />
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
                    className="card p-8"
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
          </motion.div>
        )}

        {gameState === 'VOTING' && (
          <motion.div
            key="voting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container max-w-lg"
          >
            <div className="card text-center">
              {gameResults && gameResults.winner ? (
                <>
                  <motion.div
                    className="text-8xl mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  >
                    🏆
                  </motion.div>
                  <motion.h1
                    className="text-4xl font-display mb-2"
                    style={{ color: 'var(--color-accent)' }}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {gameResults.winner.playerName} Wins!
                  </motion.h1>
                  <motion.p
                    className="text-xl mb-8"
                    style={{ color: 'var(--color-text-secondary)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    MVP with {gameResults.winner.votes} vote{gameResults.winner.votes !== 1 ? 's' : ''}
                  </motion.p>

                  {gameResults.allResults && gameResults.allResults.length > 1 && (
                    <motion.div
                      className="mb-8 text-left"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h3 className="font-display text-lg mb-4 text-center" style={{ color: 'var(--color-text-primary)' }}>
                        Final Standings
                      </h3>
                      <div className="stack-sm">
                        {gameResults.allResults.map((result, index) => (
                          <motion.div
                            key={result.playerId}
                            className="split p-4 rounded-lg"
                            style={{
                              background: index === 0 ? 'var(--color-highlight)' : 'var(--color-surface-alt)',
                              border: index === 0 ? '2px solid var(--color-accent)' : '1px solid var(--color-border)'
                            }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎭'}</span>
                              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                {result.playerName}
                              </span>
                            </div>
                            <span className="badge badge-accent">{result.votes} vote{result.votes !== 1 ? 's' : ''}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-8xl mb-8">🎉</div>
                  <h1 className="text-4xl font-display mb-6" style={{ color: 'var(--color-text-primary)' }}>Performance Complete!</h1>
                  <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>Thanks for playing!</p>
                </>
              )}

              {script && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
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

              <motion.button
                onClick={() => window.location.reload()}
                className="btn btn-primary btn-large"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>🔄</span>
                <span>Play Again</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
