'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MOTION } from '@/lib/animations'
import { analytics } from '@/lib/analytics'
import type { GameMode } from '@/lib/types'

interface RoomPreview {
  gameMode: GameMode
  playerCount: number
  maxPlayers: number
  hostName: string
  isMature: boolean
  gameState: string
  players: { nickname: string }[]
}

const AVATAR_COLORS = [
  '#F59E42', '#A855F7', '#EC4899', '#3B82F6', '#10B981', '#EF4444',
  '#8B5CF6', '#14B8A6', '#F97316', '#6366F1',
]

function TheaterMasks({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="16" cy="24" r="13" stroke="var(--color-text-primary)" strokeWidth="2" />
      <circle cx="12" cy="22" r="1.5" fill="var(--color-text-primary)" />
      <circle cx="20" cy="22" r="1.5" fill="var(--color-text-primary)" />
      <path d="M11 28q5 4 10 0" stroke="var(--color-text-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="24" r="13" stroke="var(--color-text-primary)" strokeWidth="2" />
      <circle cx="28" cy="22" r="1.5" fill="var(--color-text-primary)" />
      <circle cx="36" cy="22" r="1.5" fill="var(--color-text-primary)" />
      <path d="M27 28q5-4 10 0" stroke="var(--color-text-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-28 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
        <div className="h-6 w-14 rounded-full animate-pulse" style={{ background: 'var(--color-border)' }} />
      </div>
      <div className="h-4 w-20 rounded animate-pulse mb-3" style={{ background: 'var(--color-border)' }} />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full animate-pulse" style={{ background: 'var(--color-border)' }} />
            <div className="h-3 w-12 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string || '').toUpperCase()

  const [preview, setPreview] = useState<RoomPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [nickname, setNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [nicknameTouched, setNicknameTouched] = useState(false)
  const nicknameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!code || code.length !== 4) {
      setError(true)
      setLoading(false)
      return
    }

    analytics.invitePageViewed(code)

    const fetchPreview = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const res = await fetch(`${baseUrl}/api/room-preview/${code}`)
        if (!res.ok) throw new Error('Room not found')
        const data = await res.json()
        setPreview(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [code])

  const validateNickname = (name: string): string => {
    if (!name) return 'Nickname is required'
    if (name.trim().length < 1) return 'Nickname cannot be empty'
    if (name.length > 20) return 'Nickname must be 20 characters or less'
    return ''
  }

  const isNicknameValid = nickname.trim().length >= 1 && nickname.length <= 20

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateNickname(nickname)
    setNicknameTouched(true)
    setNicknameError(err)
    if (err) return

    analytics.inviteJoinClicked(code)
    router.push(`/join?code=${code}&nickname=${encodeURIComponent(nickname.trim())}`)
  }

  const getGameModeLabel = (mode: GameMode) => {
    switch (mode) {
      case 'SOLO': return 'Solo Mode'
      case 'HEAD_TO_HEAD': return 'Head-to-Head'
      case 'ENSEMBLE': return 'Ensemble'
      default: return mode
    }
  }

  const isFull = preview ? preview.playerCount >= preview.maxPlayers : false

  // Error state
  if (!loading && error) {
    return (
      <main className="page-container items-center justify-center">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
        >
          <div className="card" style={{ padding: '48px 32px' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true" style={{ margin: '0 auto 16px' }}>
              <circle cx="24" cy="24" r="20" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M18 18l12 12M30 18L18 30" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h1
              className="font-display"
              style={{ fontSize: '24px', color: 'var(--color-text-primary)', marginBottom: '8px' }}
            >
              Room Not Found
            </h1>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '15px', marginBottom: '24px' }}>
              This room has ended or doesn&apos;t exist.
            </p>
            <motion.button
              onClick={() => router.push('/join')}
              className="btn btn-primary btn-large w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Join a Different Game
            </motion.button>
          </div>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="page-container items-center justify-center" style={{ minHeight: '100dvh' }}>
      <div className="w-full max-w-md" style={{ padding: '24px 16px' }}>
        {/* Logo + branding */}
        <motion.div
          className="flex items-center gap-2 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
        >
          <TheaterMasks size={32} />
          <span
            className="font-display"
            style={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--color-text-primary)',
            }}
          >
            PLOT TWISTS
          </span>
        </motion.div>

        {/* Hero text */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, ...MOTION.gentle }}
        >
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(36px, 10vw, 44px)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            You&apos;re invited
          </h1>
          {loading ? (
            <div className="h-5 w-56 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
          ) : preview ? (
            <p style={{ fontSize: '16px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
              {preview.hostName} wants you to join the show
            </p>
          ) : null}
        </motion.div>

        {/* Room card */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...MOTION.gentle }}
        >
          {loading ? (
            <SkeletonCard />
          ) : preview ? (
            <div
              className="rounded-xl p-5"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            >
              {/* Room code + player badge */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="font-script"
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {code}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    background: isFull ? 'var(--color-warning)' : 'var(--color-success)',
                    color: 'white',
                  }}
                >
                  {preview.playerCount}/{preview.maxPlayers}
                </span>
              </div>

              {/* Game mode label */}
              <p
                className="text-sm font-medium mb-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {getGameModeLabel(preview.gameMode)}
                {preview.isMature && (
                  <span
                    className="ml-2 px-2 py-0.5 rounded text-xs font-bold"
                    style={{ background: 'var(--color-danger)', color: 'white' }}
                  >
                    18+
                  </span>
                )}
              </p>

              {/* Player list */}
              {preview.players.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preview.players.map((player, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: '22px',
                          height: '22px',
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'white',
                        }}
                      >
                        {player.nickname[0]?.toUpperCase()}
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {player.nickname}
                      </span>
                    </div>
                  ))}
                  {preview.playerCount > preview.players.length && (
                    <span
                      className="text-xs self-center"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      +{preview.playerCount - preview.players.length} more
                    </span>
                  )}
                </div>
              )}

              {/* Full room warning */}
              {isFull && (
                <motion.div
                  className="mt-3 p-2.5 rounded-lg text-sm text-center"
                  style={{
                    background: 'var(--color-highlight-pink, var(--color-surface-alt))',
                    color: 'var(--color-warning)',
                    border: '1px solid var(--color-border)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Room is full — you&apos;ll join as a spectator
                </motion.div>
              )}

              {/* Game in progress warning */}
              {preview.gameState !== 'LOBBY' && (
                <motion.div
                  className="mt-3 p-2.5 rounded-lg text-sm text-center"
                  style={{
                    background: 'var(--color-surface-alt, var(--color-surface))',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-border)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Game in progress — wait for next round
                </motion.div>
              )}
            </div>
          ) : null}
        </motion.div>

        {/* Join form */}
        <motion.form
          onSubmit={handleSubmit}
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...MOTION.gentle }}
        >
          <label
            className="label"
            htmlFor="invite-nickname"
            style={{ marginBottom: '6px' }}
          >
            Your nickname
          </label>
          <div className="input-wrapper mb-3">
            <input
              ref={nicknameRef}
              id="invite-nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                if (nicknameTouched) setNicknameError(validateNickname(e.target.value))
              }}
              onBlur={() => {
                setNicknameTouched(true)
                setNicknameError(validateNickname(nickname))
              }}
              placeholder="Enter your name"
              maxLength={20}
              autoComplete="off"
              enterKeyHint="go"
              className={`input text-lg ${nicknameTouched && nicknameError ? 'input-error' : ''} ${isNicknameValid ? 'input-valid' : ''}`}
              style={{ paddingRight: isNicknameValid ? '44px' : '16px' }}
            />
            {isNicknameValid && <span className="input-check">{'\u2713'}</span>}
          </div>
          {nicknameTouched && nicknameError && (
            <p className="error-text mb-3">{nicknameError}</p>
          )}
          <motion.button
            type="submit"
            disabled={loading || error}
            className="btn btn-primary btn-large w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Join the Show
          </motion.button>
        </motion.form>

        {/* No account hint */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-6"
          style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ClockIcon />
          <span>No account needed — jump straight in</span>
        </motion.div>

        {/* Post-game hint */}
        <motion.div
          className="rounded-xl p-4"
          style={{
            border: '1px dashed var(--color-border)',
            background: 'transparent',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ...MOTION.gentle }}
        >
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-tertiary)', lineHeight: 1.5, textAlign: 'center' }}
          >
            After the game: Sign up to keep your XP, stats, and unlocked achievements
          </p>
        </motion.div>
      </div>
    </main>
  )
}

export default InvitePage
