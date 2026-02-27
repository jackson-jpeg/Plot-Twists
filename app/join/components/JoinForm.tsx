'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Player, PlayerRole, GameMode } from '@/lib/types'
import { analytics } from '@/lib/analytics'
import { successHaptic, errorHaptic } from '@/hooks/useHaptics'
import { isCapacitorNative } from '@/lib/platform'
import { withTimeout } from '@/lib/socketTimeout'
import { MOTION } from '@/lib/animations'
import { EyeIcon, WarningIcon } from '@/components/GameIcons'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface JoinFormProps {
  socket: AppSocket | null
  isConnected: boolean
  initialRoomCode: string
  initialNickname?: string
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  onJoinSuccess: (data: { players: Player[]; myPlayerId: string; myRole: PlayerRole; roomCode: string; roomIsMature: boolean }) => void
  onShowOnboarding: () => void
  onNavigateHome: () => void
}

const VALID_ROOM_CODE_REGEX = /^[A-HJ-NP-Y2-9]{4}$/

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GameModeLabel({ mode }: { mode: GameMode }) {
  switch (mode) {
    case 'SOLO': return <>Solo Mode</>
    case 'HEAD_TO_HEAD': return <>Head-to-Head</>
    case 'ENSEMBLE': return <>Ensemble</>
    default: return <>{mode}</>
  }
}

export function JoinForm({ socket, isConnected, initialRoomCode, initialNickname = '', toast, onJoinSuccess, onShowOnboarding, onNavigateHome }: JoinFormProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode)
  const [nickname, setNickname] = useState(initialNickname)
  const hasAutoSubmitted = useRef(false)
  const nicknameInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [roomCodeError, setRoomCodeError] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [roomCodeTouched, setRoomCodeTouched] = useState(false)
  const [nicknameTouched, setNicknameTouched] = useState(false)
  const [shakeInvalid, setShakeInvalid] = useState(false)
  const [roomPreview, setRoomPreview] = useState<{
    gameMode: GameMode; playerCount: number; maxPlayers: number; isMature: boolean; gameState: string; hostName: string; players: { nickname: string }[]
  } | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

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

  const handleRoomCodeChange = (value: string) => {
    const upper = value.toUpperCase()
    setRoomCode(upper)
    setRoomPreview(null)
    if (roomCodeTouched) setRoomCodeError(validateRoomCode(value))
    if (upper.length === 4 && VALID_ROOM_CODE_REGEX.test(upper)) nicknameInputRef.current?.focus()
  }

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    if (nicknameTouched) setNicknameError(validateNickname(value))
  }

  // Fetch room preview
  useEffect(() => {
    if (!socket || !isConnected) return
    const upperCode = roomCode.toUpperCase()
    if (!VALID_ROOM_CODE_REGEX.test(upperCode)) { setRoomPreview(null); return }
    setIsLoadingPreview(true)
    socket.emit('get_room_preview', upperCode, (response) => {
      setIsLoadingPreview(false)
      if (response.success && response.preview) {
        setRoomPreview(response.preview)
      } else {
        setRoomPreview(null)
      }
    })
  }, [socket, isConnected, roomCode])

  // Auto-submit when arriving from invite page with both code and nickname
  useEffect(() => {
    if (hasAutoSubmitted.current) return
    if (!socket || !isConnected) return
    if (!initialRoomCode || !initialNickname) return
    const roomErr = validateRoomCode(initialRoomCode)
    const nickErr = validateNickname(initialNickname)
    if (roomErr || nickErr) return
    hasAutoSubmitted.current = true
    const timer = setTimeout(() => handleJoin(), 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected])

  const handleJoin = () => {
    const roomErr = validateRoomCode(roomCode)
    const nickErr = validateNickname(nickname)
    setRoomCodeTouched(true); setNicknameTouched(true)
    setRoomCodeError(roomErr); setNicknameError(nickErr)
    if (roomErr || nickErr) {
      setShakeInvalid(true); setTimeout(() => setShakeInvalid(false), 500)
      errorHaptic()
      toast.error('Please fix the errors above'); return
    }
    if (!socket) { toast.error('Not connected to server'); return }
    setError(''); setIsJoining(true)
    const upperRoomCode = roomCode.toUpperCase()

    withTimeout<{ success: boolean; error?: string; role?: string; players?: Player[]; playerId?: string }>(
      (cb) => socket.emit('join_room', upperRoomCode, nickname, cb),
      8000
    ).then((response) => {
      setIsJoining(false)
      if (response.success) {
        const role = response.role || 'PLAYER'
        analytics.gameJoined(role === 'SPECTATOR' ? 'spectator' : 'player')
        successHaptic()
        if (isCapacitorNative()) {
          import('@capacitor/keyboard').then(({ Keyboard }) => Keyboard.hide().catch(() => {})).catch(() => {})
        }
        if (role === 'SPECTATOR') toast.info('Room is full! You joined as a Spectator.')
        else toast.success(`Joined room ${upperRoomCode}!`)

        let pid = response.playerId || ''
        if (!pid && response.players) {
          const myPlayer = response.players.find(p => p.nickname === nickname && !p.isHost)
          if (myPlayer) pid = myPlayer.id
        }
        onJoinSuccess({
          players: response.players || [],
          myPlayerId: pid,
          myRole: role as PlayerRole,
          roomCode: upperRoomCode,
          roomIsMature: roomPreview?.isMature ?? false,
        })
      } else {
        const errorMsg = response.error || 'Room not found'
        setError(errorMsg); toast.error(errorMsg)
      }
    }).catch(() => {
      setIsJoining(false)
      setError('Connection timed out. Please try again.')
      toast.error('Connection timed out')
    })
  }

  const isFull = roomPreview ? roomPreview.playerCount >= roomPreview.maxPlayers : false

  return (
    <main
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100dvh', padding: '24px 16px', background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Back button */}
        <motion.button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 mb-8"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            fontSize: '15px',
            padding: '8px 4px',
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <BackArrowIcon />
          <span>Home</span>
        </motion.button>

        {/* Heading */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
        >
          <div className="flex items-center justify-between">
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 8vw, 40px)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Join a game
            </h1>
            <button
              onClick={onShowOnboarding}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              How to Play
            </button>
          </div>
        </motion.div>

        {/* Room code input */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, ...MOTION.gentle }}
        >
          <label
            htmlFor="join-room-code"
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: 'var(--color-text-tertiary)',
              marginBottom: '6px',
            }}
          >
            Room Code
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="join-room-code"
              type="text"
              value={roomCode}
              onChange={(e) => handleRoomCodeChange(e.target.value)}
              onBlur={() => { setRoomCodeTouched(true); setRoomCodeError(validateRoomCode(roomCode)) }}
              placeholder="ABCD"
              maxLength={4}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              enterKeyHint="next"
              style={{
                width: '100%',
                fontFamily: 'var(--font-script)',
                fontSize: '28px',
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '0.15em',
                padding: '14px 16px',
                borderRadius: '12px',
                border: roomCodeTouched && roomCodeError
                  ? '2px solid var(--color-danger)'
                  : isRoomCodeValid
                  ? '2px solid var(--color-success)'
                  : '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            {isRoomCodeValid && (
              <span
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-success)',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                {'\u2713'}
              </span>
            )}
          </div>
          {roomCodeTouched && roomCodeError && (
            <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginTop: '4px' }}>{roomCodeError}</p>
          )}
        </motion.div>

        {/* Room Preview */}
        <AnimatePresence>
          {isLoadingPreview && isRoomCodeValid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5"
            >
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
              >
                <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'var(--color-border)' }} />
                <div className="flex-1">
                  <div className="h-4 w-24 rounded animate-pulse mb-1" style={{ background: 'var(--color-border)' }} />
                  <div className="h-3 w-16 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                </div>
              </div>
            </motion.div>
          )}
          {roomPreview && !isLoadingPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5"
            >
              <div
                className="p-4 rounded-xl"
                style={{
                  background: isFull ? 'rgba(232, 167, 93, 0.06)' : 'rgba(130, 182, 130, 0.06)',
                  border: isFull ? '1.5px solid var(--color-warning)' : '1.5px solid var(--color-success)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <GameModeLabel mode={roomPreview.gameMode} />
                    </span>
                    <span
                      className="ml-2"
                      style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}
                    >
                      by {roomPreview.hostName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: isFull ? 'var(--color-warning)' : 'var(--color-success)',
                        color: 'white',
                      }}
                    >
                      {roomPreview.playerCount}/{roomPreview.maxPlayers}
                    </span>
                    {roomPreview.isMature && (
                      <span
                        style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
                      >
                        18+
                      </span>
                    )}
                  </div>
                </div>
                {roomPreview.players.length > 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {roomPreview.players.map(p => p.nickname).join(', ')}
                    {roomPreview.playerCount > 6 ? ` +${roomPreview.playerCount - 6} more` : ''}
                  </p>
                )}
                {isFull && (
                  <div
                    className="flex items-center gap-2 mt-2 p-2 rounded-lg text-sm"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-warning)', border: '1px solid var(--color-border)' }}
                  >
                    <EyeIcon size={16} color="var(--color-warning)" />
                    <span>Room is full — you'll join as a spectator</span>
                  </div>
                )}
                {roomPreview.gameState !== 'LOBBY' && (
                  <div
                    className="flex items-center gap-2 mt-2 p-2 rounded-lg text-sm"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-danger)', border: '1px solid var(--color-border)' }}
                  >
                    <WarningIcon size={16} color="var(--color-danger)" />
                    <span>Game in progress — wait for next round</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nickname input */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...MOTION.gentle }}
        >
          <label
            htmlFor="join-nickname"
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: 'var(--color-text-tertiary)',
              marginBottom: '6px',
            }}
          >
            Your Name
          </label>
          <div style={{ position: 'relative' }}>
            <input
              ref={nicknameInputRef}
              id="join-nickname"
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              onBlur={() => { setNicknameTouched(true); setNicknameError(validateNickname(nickname)) }}
              onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300) }}
              placeholder="Enter your name"
              maxLength={20}
              autoComplete="off"
              enterKeyHint="go"
              style={{
                width: '100%',
                fontSize: '17px',
                padding: '14px 16px',
                paddingRight: isNicknameValid ? '44px' : '16px',
                borderRadius: '12px',
                border: nicknameTouched && nicknameError
                  ? '2px solid var(--color-danger)'
                  : isNicknameValid
                  ? '2px solid var(--color-success)'
                  : '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            {isNicknameValid && (
              <span
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-success)',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                {'\u2713'}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center mt-1">
            {nicknameTouched && nicknameError ? (
              <p style={{ fontSize: '13px', color: 'var(--color-danger)' }}>{nicknameError}</p>
            ) : <span />}
            {nickname.length > 12 && (
              <span style={{ fontSize: '12px', color: nickname.length >= 20 ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>
                {nickname.length}/20
              </span>
            )}
          </div>
        </motion.div>

        {/* Error banner */}
        {error && (
          <motion.div
            className="mb-5 p-3 rounded-xl text-center"
            style={{ background: 'var(--color-danger)', color: 'white' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            aria-live="polite"
          >
            <p className="font-semibold text-sm">{error}</p>
          </motion.div>
        )}

        {/* Join button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...MOTION.gentle }}
        >
          <motion.button
            onClick={handleJoin}
            disabled={!isFormValid() || isJoining}
            className={`w-full ${shakeInvalid ? 'shake' : ''}`}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 600,
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: isFormValid() && !isJoining ? 'var(--color-accent)' : 'var(--color-surface-alt)',
              color: isFormValid() && !isJoining ? 'white' : 'var(--color-text-tertiary)',
              cursor: isFormValid() && !isJoining ? 'pointer' : 'not-allowed',
              opacity: isFormValid() && !isJoining ? 1 : 0.6,
              transition: 'background 0.2s, opacity 0.2s',
            }}
            whileHover={isFormValid() && !isJoining ? { scale: 1.02 } : {}}
            whileTap={isFormValid() && !isJoining ? { scale: 0.98 } : {}}
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </motion.button>
          {!isFormValid() && !isJoining && (
            <p className="text-center mt-2" style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
              Fill in all fields to continue
            </p>
          )}
        </motion.div>
      </div>
    </main>
  )
}
