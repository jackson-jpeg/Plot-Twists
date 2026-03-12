'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Player, PlayerRole, GameMode, PublicRoomListing } from '@/lib/types'
import { analytics } from '@/lib/analytics'
import { successHaptic, errorHaptic } from '@/hooks/useHaptics'
import { isCapacitorNative } from '@/lib/platform'
import { withTimeout } from '@/lib/socketTimeout'
import { SPRING_GENTLE, ENTER_Y, STAGGER, PRESS } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { EyeIcon, WarningIcon } from '@/components/GameIcons'
import { PageContainer, Button, Input, Card, Badge } from '@/components/ui'
import { EmptyState } from '@/components/EmptyState'
import { PublicRoomCard } from './PublicRoomCard'
import { isBetaFeatureEnabled } from '@/lib/betaFeatures'
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
  const publicMatchmakingEnabled = isBetaFeatureEnabled('publicMatchmaking')

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
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Extract digits for the 4-box display
  const digits = roomCode.padEnd(4, '').split('').slice(0, 4)

  return (
    <PageContainer size="narrow" centered>
      {/* Back button */}
      <motion.div
        className="mb-6"
        {...ENTER_Y}
        transition={SPRING_GENTLE}
      >
        <motion.button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
          style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', padding: 0 }}
          {...PRESS}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </motion.button>
      </motion.div>

      {/* Title */}
      <motion.div
        className="mb-8 text-center"
        {...ENTER_Y}
        transition={SPRING_GENTLE}
      >
        <h1
          className="font-bold leading-tight tracking-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            color: 'var(--color-text-primary)',
          }}
        >
          Join a Game
        </h1>
      </motion.div>

      {/* Room code — 4 separate boxes */}
      <motion.div
        className="mb-6"
        {...ENTER_Y}
        transition={{ delay: STAGGER, ...SPRING_GENTLE }}
      >
        <label
          className="block text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--color-text-tertiary)' }}
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
              maxLength={4}
              value={digits[i] || ''}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(i, e)}
              onBlur={() => { setFocusedDigit(null); setRoomCodeTouched(true); setRoomCodeError(validateRoomCode(roomCode)) }}
              onFocus={(e) => { setFocusedDigit(i); e.target.select() }}
              className="text-center outline-none transition-all duration-200"
              style={{
                width: '56px',
                height: '56px',
                fontFamily: 'var(--font-mono)',
                fontSize: '28px',
                fontWeight: 700,
                borderRadius: '12px',
                background: 'var(--color-surface-inset)',
                color: 'var(--color-text-primary)',
                border: focusedDigit === i
                  ? '2px solid var(--color-accent)'
                  : roomCodeTouched && roomCodeError
                  ? '2px solid var(--color-danger)'
                  : isRoomCodeValid
                  ? '2px solid var(--color-success)'
                  : '2px solid transparent',
              }}
            />
          ))}
        </div>
        {roomCodeTouched && roomCodeError && (
          <p className="text-center mt-2 text-xs" style={{ color: 'var(--color-danger)' }}>{roomCodeError}</p>
        )}
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
              style={{ background: 'var(--color-surface-inset)', border: '1px solid var(--color-border)' }}
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={SPRING_GENTLE}
            className="mb-5"
          >
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: 'var(--color-surface-inset)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 40, height: 40, background: 'rgba(245, 158, 66, 0.15)' }}
              >
                <span className="text-lg">🎬</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px]" style={{ color: 'var(--color-text-primary)' }}>
                  {roomPreview.hostName}&apos;s Room
                </p>
                <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
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
                style={{ background: 'var(--color-surface-inset)', color: 'var(--color-warning)', border: '1px solid var(--color-border)' }}
              >
                <EyeIcon size={16} color="var(--color-warning)" />
                <span>Room is full — you&apos;ll join as a spectator</span>
              </div>
            )}
            {roomPreview.gameState !== 'LOBBY' && (
              <div
                className="flex items-center gap-2 mt-2 p-2 rounded-lg text-sm"
                style={{ background: 'var(--color-surface-inset)', color: 'var(--color-danger)', border: '1px solid var(--color-border)' }}
              >
                <WarningIcon size={16} color="var(--color-danger)" />
                <span>Game in progress — wait for next round</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nickname input */}
      <motion.div
        className="mb-5"
        {...ENTER_Y}
        transition={{ delay: STAGGER * 2, ...SPRING_GENTLE }}
      >
        <Input
          ref={nicknameInputRef}
          label="Nickname"
          error={nicknameTouched && nicknameError ? nicknameError : undefined}
          success={!!isNicknameValid}
          value={nickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          onBlur={() => { setNicknameTouched(true); setNicknameError(validateNickname(nickname)) }}
          onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleJoin() }}
          placeholder="e.g. Captain Chaos"
          maxLength={20}
          autoComplete="off"
          enterKeyHint="go"
          hint={nickname.length > 12 ? `${nickname.length}/20` : undefined}
        />
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          className="mb-5 p-3 rounded-xl text-center"
          style={{ background: 'var(--color-danger)', color: 'white' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_GENTLE}
          role="alert"
          aria-live="polite"
        >
          <p className="font-semibold text-sm">{error}</p>
        </motion.div>
      )}

      {/* Join button */}
      <motion.div
        {...ENTER_Y}
        transition={{ delay: STAGGER * 3, ...SPRING_GENTLE }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isJoining}
          disabled={!isFormValid()}
          onClick={handleJoin}
          className={shakeInvalid ? 'shake' : ''}
        >
          {isJoining ? 'Joining...' : 'Join Game'}
        </Button>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-8">
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {publicMatchmakingEnabled ? 'or browse public games' : 'private beta'}
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
      </div>

      {publicMatchmakingEnabled && (
        <motion.div
          className="grid grid-cols-2 gap-3 mb-4"
          {...ENTER_Y}
          transition={{ delay: STAGGER * 4, ...SPRING_GENTLE }}
        >
          <Card
            variant="interactive"
            padding="md"
            onClick={() => !isMatching && handleQuickPlay('ENSEMBLE')}
            className="relative text-center"
          >
            <div className="text-2xl mb-1">👥</div>
            <div
              className="text-[13px] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
            >
              Ensemble
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>3-6 performers</div>
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
          </Card>
          <Card
            variant="interactive"
            padding="md"
            onClick={() => !isMatching && handleQuickPlay('HEAD_TO_HEAD')}
            className="relative text-center"
          >
            <div className="text-2xl mb-1">⚔️</div>
            <div
              className="text-[13px] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
            >
              Head-to-Head
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>2-player duel</div>
          </Card>
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
    </PageContainer>
  )
}
