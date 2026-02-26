'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Player, PlayerRole, GameMode } from '@/lib/types'
import { analytics } from '@/lib/analytics'
import { successHaptic, errorHaptic } from '@/hooks/useHaptics'
import { isCapacitorNative } from '@/lib/platform'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface JoinFormProps {
  socket: AppSocket | null
  isConnected: boolean
  initialRoomCode: string
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
  onJoinSuccess: (data: { players: Player[]; myPlayerId: string; myRole: PlayerRole; roomCode: string; roomIsMature: boolean }) => void
  onShowOnboarding: () => void
  onNavigateHome: () => void
}

const VALID_ROOM_CODE_REGEX = /^[A-HJ-NP-Y2-9]{4}$/

export function JoinForm({ socket, isConnected, initialRoomCode, toast, onJoinSuccess, onShowOnboarding, onNavigateHome }: JoinFormProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode)
  const [nickname, setNickname] = useState('')
  const nicknameInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [roomCodeError, setRoomCodeError] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [roomCodeTouched, setRoomCodeTouched] = useState(false)
  const [nicknameTouched, setNicknameTouched] = useState(false)
  const [shakeInvalid, setShakeInvalid] = useState(false)
  const [roomPreview, setRoomPreview] = useState<{
    gameMode: GameMode; playerCount: number; maxPlayers: number; isMature: boolean; gameState: string
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
    let timedOut = false
    const timeoutId = setTimeout(() => { timedOut = true; setIsJoining(false); setError('Connection timed out. Please try again.'); toast.error('Connection timed out') }, 8000)

    socket.emit('join_room', upperRoomCode, nickname, (response) => {
      clearTimeout(timeoutId)
      if (timedOut) return
      setIsJoining(false)
      if (response.success) {
        const role = response.role || 'PLAYER'
        analytics.gameJoined(role === 'SPECTATOR' ? 'spectator' : 'player')
        successHaptic()
        // Dismiss keyboard on iOS native after successful join
        if (isCapacitorNative()) {
          import('@capacitor/keyboard').then(({ Keyboard }) => Keyboard.hide().catch(() => {})).catch(() => {})
        }
        if (role === 'SPECTATOR') toast.info('Room is full! You joined as a Spectator.')
        else toast.success(`Joined room ${upperRoomCode}!`)

        let pid = ''
        if (response.players) {
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
    })
  }

  return (
    <div className="page-container items-center justify-center">
      <motion.button onClick={onNavigateHome} className="back-button" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}>
        <span className="back-arrow">←</span><span>Home</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card card-accent">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-display" style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}>Join Game</h1>
            <button onClick={onShowOnboarding} className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: '14px' }}><span>❓</span></button>
          </div>

          <div className="stack">
            <div>
              <label className="label">Room Code</label>
              <div className="input-wrapper">
                <input type="text" value={roomCode} onChange={(e) => handleRoomCodeChange(e.target.value)} onBlur={() => { setRoomCodeTouched(true); setRoomCodeError(validateRoomCode(roomCode)) }}
                  placeholder="Enter 4-letter code" maxLength={4} inputMode="text" autoCapitalize="characters" autoComplete="off" enterKeyHint="next"
                  className={`input font-script text-center text-3xl ${roomCodeTouched && roomCodeError ? 'input-error' : ''} ${isRoomCodeValid ? 'input-valid' : ''}`}
                  style={{ paddingRight: isRoomCodeValid ? '44px' : '16px' }} />
                {isRoomCodeValid && <span className="input-check">✓</span>}
              </div>
              {roomCodeTouched && roomCodeError && <p className="error-text">⚠️ {roomCodeError}</p>}

              {/* Room Preview */}
              <AnimatePresence>
                {isLoadingPreview && isRoomCodeValid && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 p-4 rounded-lg" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }} aria-busy="true" aria-label="Loading room info">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-[var(--color-surface)] animate-pulse rounded" />
                        <div className="h-3 w-16 bg-[var(--color-surface)] animate-pulse rounded" />
                      </div>
                      <div className="h-7 w-12 bg-[var(--color-surface)] animate-pulse rounded-full" />
                    </div>
                  </motion.div>
                )}
                {roomPreview && !isLoadingPreview && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-4 rounded-lg"
                    style={{
                      background: roomPreview.playerCount >= roomPreview.maxPlayers ? 'var(--color-highlight-pink)' : 'var(--color-highlight)',
                      border: roomPreview.playerCount >= roomPreview.maxPlayers ? '2px solid var(--color-warning)' : '2px solid var(--color-success)'
                    }}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <motion.span className="text-2xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
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
                        <div className="px-3 py-1 rounded-full text-sm font-semibold" style={{ background: roomPreview.playerCount >= roomPreview.maxPlayers ? 'var(--color-warning)' : 'var(--color-success)', color: 'white' }}>
                          {roomPreview.playerCount}/{roomPreview.maxPlayers}
                        </div>
                        {roomPreview.isMature && <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'var(--color-danger)', color: 'white' }}>18+</span>}
                      </div>
                    </div>
                    {roomPreview.playerCount >= roomPreview.maxPlayers && (
                      <motion.p className="text-sm text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--color-warning)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>👁️ Room is full — you'll join as a spectator</motion.p>
                    )}
                    {roomPreview.gameState !== 'LOBBY' && (
                      <motion.p className="text-sm text-center p-2 rounded mt-2" style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--color-danger)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>⚠️ Game already in progress — wait for next round</motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="label">Your Name</label>
              <div className="input-wrapper">
                <input ref={nicknameInputRef} type="text" value={nickname} onChange={(e) => handleNicknameChange(e.target.value)} onBlur={() => { setNicknameTouched(true); setNicknameError(validateNickname(nickname)) }}
                  onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300) }}
                  placeholder="Enter your name" maxLength={20} autoComplete="off" enterKeyHint="go"
                  className={`input text-lg ${nicknameTouched && nicknameError ? 'input-error' : ''} ${isNicknameValid ? 'input-valid' : ''}`}
                  style={{ paddingRight: isNicknameValid ? '44px' : '16px' }} />
                {isNicknameValid && <span className="input-check">✓</span>}
              </div>
              <div className="flex justify-between items-center">
                {nicknameTouched && nicknameError ? <p className="error-text">⚠️ {nicknameError}</p> : <span />}
                {nickname.length > 12 && <span className="text-xs" style={{ color: nickname.length >= 20 ? 'var(--color-danger)' : 'var(--color-text-tertiary)' }}>{nickname.length}/20</span>}
              </div>
            </div>

            {error && (
              <motion.div className="error-banner p-4 rounded-lg flex items-center gap-3 justify-center" style={{ background: 'var(--color-danger)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} role="alert" aria-live="polite">
                <span className="text-2xl" aria-hidden="true">{error.includes('not found') ? '🔍' : error.includes('full') ? '🚫' : error.includes('timeout') ? '⏱️' : '⚠️'}</span>
                <p className="text-white font-semibold">{error}</p>
              </motion.div>
            )}

            <div>
              <button onClick={handleJoin} disabled={!isFormValid() || isJoining} className={`btn btn-primary btn-large w-full ${shakeInvalid ? 'shake' : ''}`}>
                {isJoining ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span><span>Joining...</span></>
                ) : (
                  <><span>🚀</span><span>Join</span></>
                )}
              </button>
              {!isFormValid() && !isJoining && <p className="btn-helper-text">Fill in all fields to continue</p>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
