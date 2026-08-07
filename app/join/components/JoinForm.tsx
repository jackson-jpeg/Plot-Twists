'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PublicPlayer, PlayerRole, GameMode, PublicRoomListing } from '@/lib/types'
import { analytics } from '@/lib/analytics'
import { successHaptic, errorHaptic } from '@/hooks/useHaptics'
import { withTimeout } from '@/lib/socketTimeout'
import { SPRING_GENTLE, ENTER_Y, STAGGER, PRESS } from '@/lib/motion'
import { EyeIcon, WarningIcon } from '@/components/GameIcons'
import { Badge } from '@/components/ui'
import { EmptyState } from '@/components/EmptyState'
import { PublicRoomCard } from './PublicRoomCard'
import { isBetaFeatureEnabled } from '@/lib/betaFeatures'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'
import { setReconnectToken } from '@/lib/playerSession'
import { performersLabel } from '@/lib/playerCounts'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface JoinFormProps {
  socket: AppSocket | null
  isConnected: boolean
  initialRoomCode: string
  initialNickname?: string
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  onJoinSuccess: (data: { players: PublicPlayer[]; myPlayerId: string; myRole: PlayerRole; roomCode: string; roomIsMature: boolean }) => void
  onShowOnboarding: () => void
  onNavigateHome: () => void
}

const VALID_ROOM_CODE_REGEX = /^[A-HJ-NP-Y2-9]{4}$/

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

  // Individual digit refs for 4-box room code
  const digitRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])
  const [focusedDigit, setFocusedDigit] = useState<number | null>(null)

  // Public games state
  const [publicRooms, setPublicRooms] = useState<PublicRoomListing[]>([])
  const [isMatching, setIsMatching] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [showPublicGames, setShowPublicGames] = useState(false)
  const publicMatchmakingEnabled = isBetaFeatureEnabled('publicMatchmaking')

  // Same strip bug as the landing page: body is light --color-bg and shows
  // through around a dark route. Scoped override with cleanup.
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#08070b'
    return () => {
      document.body.style.background = prev
    }
  }, [])

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
    const error = validateRoomCode(upper)
    if (roomCodeTouched || !error) setRoomCodeError(error)
    if (upper.length === 4 && VALID_ROOM_CODE_REGEX.test(upper)) nicknameInputRef.current?.focus()
  }

  // Handle individual digit input for 4-box layout
  const handleDigitChange = (index: number, value: string) => {
    // Take only the last character typed
    const char = value.slice(-1).toUpperCase()
    const digits = roomCode.padEnd(4, ' ').split('')

    if (char) {
      digits[index] = char
      const newCode = digits.join('').replace(/ /g, '')
      // If pasting a full code
      if (value.length > 1) {
        const pasted = value.toUpperCase().slice(0, 4)
        handleRoomCodeChange(pasted)
        if (pasted.length === 4) {
          nicknameInputRef.current?.focus()
        } else {
          digitRefs.current[Math.min(pasted.length, 3)]?.focus()
        }
        return
      }
      handleRoomCodeChange(newCode.slice(0, 4))
      // Auto-advance to next box
      if (index < 3) {
        digitRefs.current[index + 1]?.focus()
      } else {
        nicknameInputRef.current?.focus()
      }
    }
  }

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const digits = roomCode.padEnd(4, ' ').split('')
      if (digits[index] && digits[index] !== ' ') {
        digits[index] = ' '
        handleRoomCodeChange(digits.join('').replace(/ /g, ''))
      } else if (index > 0) {
        digits[index - 1] = ' '
        handleRoomCodeChange(digits.join('').replace(/ /g, ''))
        digitRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 3) {
      digitRefs.current[index + 1]?.focus()
    }
  }

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    if (nicknameTouched) setNicknameError(validateNickname(value))
  }

  // Fetch room preview. Deferred a tick so the effect body has no synchronous
  // setState (react-hooks/set-state-in-effect); the stale-preview reset is
  // already handled in handleRoomCodeChange.
  useEffect(() => {
    if (!socket || !isConnected) return
    const upperCode = roomCode.toUpperCase()
    if (!VALID_ROOM_CODE_REGEX.test(upperCode)) return
    const timer = setTimeout(() => {
      setIsLoadingPreview(true)
      socket.emit('get_room_preview', upperCode, (response) => {
        setIsLoadingPreview(false)
        if (response.success && response.preview) {
          setRoomPreview(response.preview)
        } else {
          setRoomPreview(null)
        }
      })
    }, 0)
    return () => clearTimeout(timer)
  }, [socket, isConnected, roomCode])

  // Subscribe to public rooms
  useEffect(() => {
    if (!publicMatchmakingEnabled) return
    if (!socket || !isConnected) return

    socket.emit('list_public_rooms', undefined, (res) => {
      if (res.success && res.rooms) setPublicRooms(res.rooms)
    })

    socket.emit('subscribe_public_rooms')
    socket.on('public_rooms_update', (updatedRooms) => {
      setPublicRooms(updatedRooms)
    })

    return () => {
      socket.emit('unsubscribe_public_rooms')
      socket.off('public_rooms_update')
    }
  }, [socket, isConnected, publicMatchmakingEnabled])

  const handleQuickPlay = useCallback((gameMode: GameMode) => {
    if (!publicMatchmakingEnabled) {
      setMatchError('Public matchmaking is disabled for this beta build.')
      return
    }
    if (!socket || !isConnected) return
    setIsMatching(true)
    setMatchError(null)

    socket.emit('quick_play', { gameMode, isMature: false }, (res) => {
      setIsMatching(false)
      if (res.success && res.code) {
        const code = res.code
        handleRoomCodeChange(code)
        if (nickname.trim()) {
          setTimeout(() => {
            setRoomCode(code)
            nicknameInputRef.current?.focus()
          }, 100)
        }
        toast.success(`Found a game! Code: ${code}`)
      } else {
        setMatchError(res.error || 'Failed to find a game')
      }
    })
  }, [socket, isConnected, nickname, toast, publicMatchmakingEnabled])

  const handleJoinPublicRoom = useCallback((code: string) => {
    handleRoomCodeChange(code)
    nicknameInputRef.current?.focus()
  }, [])

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

    withTimeout<{ success: boolean; error?: string; role?: string; players?: PublicPlayer[]; publicId?: string; reconnectToken?: string }>(
      (cb) => socket.emit('join_room', upperRoomCode, nickname, cb),
      8000
    ).then((response) => {
      setIsJoining(false)
      if (response.success) {
        // Chunk 2 item 5b. This ack is the ONLY time the server sends this value; if it is not
        // stored here, this seat can never be reclaimed after a disconnect.
        if (response.reconnectToken) setReconnectToken(upperRoomCode, response.reconnectToken)
        const role = response.role || 'PLAYER'
        analytics.gameJoined(role === 'SPECTATOR' ? 'spectator' : 'player')
        successHaptic()
        if (role === 'SPECTATOR') toast.info('Room is full! You joined as a Spectator.')
        else toast.success(`Joined room ${upperRoomCode}!`)

        let pid = response.publicId || ''
        if (!pid && response.players) {
          const myPlayer = response.players.find(p => p.nickname === nickname && !p.isHost)
          if (myPlayer) pid = myPlayer.publicId
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

  // Auto-submit when arriving from invite page with both code and nickname.
  // Lives below handleJoin so the reference is declared before use.
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


  const isFull = roomPreview ? roomPreview.playerCount >= roomPreview.maxPlayers : false

  // Extract digits for the 4-box display
  const digits = roomCode.padEnd(4, '').split('').slice(0, 4)

  // Ticket theme colors
  const TICKET_BG = '#faf7f0'
  const TICKET_TEXT = '#1a1812'
  const TICKET_RED = 'var(--color-stage-red, #c23b22)'
  const TICKET_MUTED = 'rgba(26,24,18,0.66)'
  const TICKET_DIVIDER = 'rgba(26,24,18,0.14)'

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-void)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px 40px',
    }}>
      {/* Back button above the ticket */}
      <motion.div
        style={{ width: '100%', maxWidth: '420px', marginBottom: '12px' }}
        {...ENTER_Y}
        transition={SPRING_GENTLE}
      >
        <motion.button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
          style={{ color: 'rgba(240,236,228,0.65)', background: 'none', border: 'none', padding: 0 }}
          {...PRESS}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </motion.button>
      </motion.div>

      {/* Ticket container */}
      <motion.div
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)',
        }}
        {...ENTER_Y}
        transition={{ delay: STAGGER, ...SPRING_GENTLE }}
        className={shakeInvalid ? 'shake' : ''}
      >
        {/* Red stripe header */}
        <div style={{
          background: TICKET_RED,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}>
            Join the show
          </span>
        </div>

        {/* Ticket body */}
        <div style={{
          background: TICKET_BG,
          padding: '28px 24px 24px',
          color: TICKET_TEXT,
        }}>
          {/* Heading */}
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '28px',
            fontWeight: 400,
            color: TICKET_TEXT,
            textAlign: 'center',
            marginBottom: '24px',
            lineHeight: 1.2,
          }}>
            Enter your code
          </h1>

          {/* Room code — 4 separate boxes */}
          <motion.div
            className="mb-6"
            {...ENTER_Y}
            transition={{ delay: STAGGER, ...SPRING_GENTLE }}
          >
            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-3 text-center"
              style={{ color: TICKET_MUTED }}
            >
              Room Code
            </label>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  ref={(el) => { digitRefs.current[i] = el }}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  aria-label={`Room code, character ${i + 1} of 4`}
                  maxLength={4}
                  value={digits[i] || ''}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  onBlur={() => { setFocusedDigit(null); setRoomCodeTouched(true); setRoomCodeError(validateRoomCode(roomCode)) }}
                  onFocus={(e) => { setFocusedDigit(i); e.target.select() }}
                  className="text-center outline-none"
                  style={{
                    width: '56px',
                    height: '60px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '28px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    background: 'white',
                    color: TICKET_TEXT,
                    border: focusedDigit === i
                      ? `2px solid ${TICKET_RED}`
                      : roomCodeTouched && roomCodeError && !isRoomCodeValid
                      ? '2px solid var(--color-danger)'
                      : isRoomCodeValid
                      ? '2px solid rgba(26,24,18,0.15)'
                      : '2px solid rgba(26,24,18,0.12)',
                    boxShadow: focusedDigit === i ? '0 0 0 3px rgba(194,59,34,0.1)' : 'none',
                    transform: focusedDigit === i ? 'scale(1.05)' : 'scale(1)',
                    transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
                  }}
                />
              ))}
            </div>
            <AnimatePresence>
              {roomCodeTouched && roomCodeError && !isRoomCodeValid && (
                <motion.p
                  key="roomCodeError"
                  className="text-center mt-2 text-xs"
                  style={{ color: TICKET_RED }}
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={SPRING_GENTLE}
                >
                  {roomCodeError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Room Preview */}
          <AnimatePresence>
            {isLoadingPreview && isRoomCodeValid && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={SPRING_GENTLE}
                className="mb-5"
              >
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(26,24,18,0.04)', border: '1px solid rgba(26,24,18,0.08)' }}
                >
                  <div className="w-8 h-8 rounded-full skeleton-shimmer" style={{ background: 'rgba(26,24,18,0.08)' }} />
                  <div className="flex-1">
                    <div className="h-4 w-24 rounded skeleton-shimmer mb-1" style={{ background: 'rgba(26,24,18,0.08)' }} />
                    <div className="h-3 w-16 rounded skeleton-shimmer" style={{ background: 'rgba(26,24,18,0.08)' }} />
                  </div>
                </div>
              </motion.div>
            )}
            {roomPreview && !isLoadingPreview && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={SPRING_GENTLE}
                className="mb-5"
              >
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: 'rgba(26,24,18,0.04)',
                    border: '1px solid rgba(26,24,18,0.08)',
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 40, height: 40, background: 'rgba(194,59,34,0.1)' }}
                  >
                    <span className="text-lg">🎬</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px]" style={{ color: TICKET_TEXT }}>
                      {roomPreview.hostName}&apos;s Room
                    </p>
                    <p className="text-[13px]" style={{ color: TICKET_MUTED }}>
                      {roomPreview.playerCount} player{roomPreview.playerCount !== 1 ? 's' : ''} · <GameModeLabel mode={roomPreview.gameMode} />
                      {roomPreview.isMature && (
                        <Badge variant="danger" size="sm" className="ml-1.5">18+</Badge>
                      )}
                    </p>
                  </div>
                  <div
                    className="shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{
                      background: isFull ? 'var(--color-warning)' : 'var(--color-success)',
                    }}
                  />
                </div>
                {isFull && (
                  <div
                    className="flex items-center gap-2 mt-2 p-2 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--color-warning)', border: '1px solid rgba(26,24,18,0.08)' }}
                  >
                    <EyeIcon size={16} color="var(--color-warning)" />
                    <span>Room is full — you&apos;ll join as a spectator</span>
                  </div>
                )}
                {roomPreview.gameState !== 'LOBBY' && (
                  <div
                    className="flex items-center gap-2 mt-2 p-2 rounded-lg text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', border: '1px solid rgba(26,24,18,0.08)' }}
                  >
                    <WarningIcon size={16} color="var(--color-danger)" />
                    <span>Game in progress — wait for next round</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nickname input — underline style */}
          <motion.div
            className="mb-5"
            {...ENTER_Y}
            transition={{ delay: STAGGER * 2, ...SPRING_GENTLE }}
          >
            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: TICKET_MUTED }}
            >
              Nickname
            </label>
            <input
              ref={nicknameInputRef}
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              onBlur={() => { setNicknameTouched(true); setNicknameError(validateNickname(nickname)) }}
              onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin() }}
              placeholder="e.g. Captain Chaos"
              maxLength={20}
              autoComplete="off"
              enterKeyHint="go"
              className="w-full outline-none text-base"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: nicknameTouched && nicknameError
                  ? '1.5px solid var(--color-danger)'
                  : '1.5px solid rgba(26,24,18,0.3)',
                borderRadius: 0,
                padding: '8px 0',
                color: TICKET_TEXT,
                fontFamily: 'inherit',
                fontSize: '16px',
              }}
            />
            {nickname.length > 12 && (
              <p className="text-right text-xs mt-1" style={{ color: TICKET_MUTED }}>{nickname.length}/20</p>
            )}
            <AnimatePresence>
              {nicknameTouched && nicknameError && (
                <motion.p
                  key="nicknameError"
                  className="text-xs mt-1"
                  style={{ color: TICKET_RED }}
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={SPRING_GENTLE}
                >
                  {nicknameError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error-banner"
                className="mb-5 p-3 rounded-xl text-center"
                style={{ background: 'var(--color-danger)', color: 'white' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={SPRING_GENTLE}
                role="alert"
                aria-live="polite"
              >
                <p className="font-semibold text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join button */}
          <motion.div
            {...ENTER_Y}
            transition={{ delay: STAGGER * 3, ...SPRING_GENTLE }}
          >
            <motion.button
              onClick={handleJoin}
              disabled={!isFormValid() || isJoining}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: isFormValid() && !isJoining ? TICKET_RED : '#e8e2d4',
                color: isFormValid() && !isJoining ? 'white' : 'rgba(26,24,18,0.45)',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                cursor: isFormValid() && !isJoining ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {isJoining ? 'Joining...' : 'Take Your Seat'}
            </motion.button>
          </motion.div>

          {/* Perforated tear line — punched notches make it a ticket, not a card */}
          <div style={{ position: 'relative', margin: '20px -24px 0', height: '0' }}>
            <div aria-hidden style={{
              position: 'absolute', left: '-11px', top: '-11px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'var(--color-void)',
            }} />
            <div aria-hidden style={{
              position: 'absolute', right: '-11px', top: '-11px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'var(--color-void)',
            }} />
            <div style={{ borderTop: `2px dashed rgba(26,24,18,0.22)`, margin: '0 20px' }} />
          </div>

          {/* Below the tear */}
          <p style={{
            textAlign: 'center',
            fontSize: '13px',
            color: 'rgba(26,24,18,0.66)',
            marginTop: '16px',
            marginBottom: '4px',
            lineHeight: 1.4,
          }}>
            or scan the QR code on your host&apos;s screen
          </p>

          {/* Browse public games toggle */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowPublicGames((v) => !v)}
              className="text-sm cursor-pointer"
              style={{
                color: TICKET_MUTED,
                background: 'none',
                border: 'none',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                fontWeight: 500,
              }}
            >
              {showPublicGames ? 'hide public games' : 'or browse public games'}
            </button>
          </div>

        </div>{/* end ticket body */}

        {/* Public games panel — dark, outside the cream body */}
        <AnimatePresence>
          {showPublicGames && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING_GENTLE}
              style={{
                overflow: 'hidden',
                background: 'var(--color-surface)',
                padding: '0 24px',
              }}
            >
              <div style={{ padding: '20px 0' }}>
                {publicMatchmakingEnabled && (
                  <motion.div
                    className="grid grid-cols-2 gap-3 mb-4"
                    {...ENTER_Y}
                    transition={{ delay: STAGGER * 4, ...SPRING_GENTLE }}
                  >
                    <button
                      onClick={() => !isMatching && handleQuickPlay('ENSEMBLE')}
                      className="relative text-center rounded-xl p-4 cursor-pointer"
                      style={{
                        background: 'var(--color-surface-inset)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <div className="text-2xl mb-1">👥</div>
                      <div className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                        Ensemble
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{performersLabel('ENSEMBLE')}</div>
                      {isMatching && (
                        <motion.div
                          className="absolute inset-0 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(245, 158, 66, 0.1)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <span className="text-[13px] font-medium" style={{ color: 'var(--color-accent)' }}>Matching...</span>
                        </motion.div>
                      )}
                    </button>
                    <button
                      onClick={() => !isMatching && handleQuickPlay('HEAD_TO_HEAD')}
                      className="relative text-center rounded-xl p-4 cursor-pointer"
                      style={{
                        background: 'var(--color-surface-inset)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <div className="text-2xl mb-1">⚔️</div>
                      <div className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                        Head-to-Head
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>2-player duel</div>
                    </button>
                  </motion.div>
                )}

                {/* Match error */}
                <AnimatePresence>
                  {matchError && (
                    <motion.div
                      className="mb-4 p-3 rounded-lg text-center text-sm"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={SPRING_GENTLE}
                    >
                      {matchError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {publicMatchmakingEnabled ? (
                  <div className="flex flex-col gap-3">
                    {publicRooms.length === 0 ? (
                      <EmptyState
                        variant="games"
                        title="No public games right now"
                        description="Create the first one and invite friends!"
                        action={{ label: 'Host a Public Game', onClick: onNavigateHome }}
                      />
                    ) : (
                      publicRooms.map((room, i) => (
                        <PublicRoomCard
                          key={room.code}
                          room={room}
                          index={i}
                          onJoin={() => handleJoinPublicRoom(room.code)}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  <EmptyState
                    variant="games"
                    title="Private beta mode"
                    description="Public matchmaking is currently disabled while we harden the core loop."
                    action={{ label: 'Host a Private Game', onClick: onNavigateHome }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
