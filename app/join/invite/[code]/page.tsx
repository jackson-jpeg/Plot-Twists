'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MOTION } from '@/lib/animations'
import { analytics } from '@/lib/analytics'
import { useBreakpoint } from '@/hooks/useBreakpoint'
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
  '#F59E42', '#EC4899', '#3B82F6', '#10B981', '#A855F7',
  '#EF4444', '#8B5CF6', '#14B8A6', '#F97316', '#6366F1',
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
          <div key={i} className="w-7 h-7 rounded-full animate-pulse" style={{ background: 'var(--color-border)' }} />
        ))}
      </div>
    </div>
  )
}

export function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const breakpoint = useBreakpoint()
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
      <main className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
          style={{ padding: '24px 16px' }}
        >
          <div className="rounded-xl" style={{ padding: '48px 32px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
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
              className="w-full"
              style={{ padding: '14px 24px', borderRadius: '14px', fontSize: '16px', fontWeight: 600, background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
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
    <main className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
      <div className="w-full" style={{ maxWidth: breakpoint !== 'mobile' ? 480 : undefined, padding: '24px 20px' }}>
        {/* Logo — centered */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
        >
          <TheaterMasks size={28} />
          <span
            className="font-display"
            style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-primary)' }}
          >
            Plot Twists
          </span>
        </motion.div>

        {/* Host avatar */}
        <motion.div
          className="flex justify-center mb-5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, ...MOTION.gentle }}
        >
          {loading ? (
            <div className="rounded-full animate-pulse" style={{ width: 80, height: 80, background: 'var(--color-border)' }} />
          ) : preview ? (
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 80,
                height: 80,
                background: 'var(--color-surface-alt)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {preview.hostName?.[0]?.toUpperCase() || '?'}
            </div>
          ) : null}
        </motion.div>

        {/* Hero text — centered */}
        <motion.div
          className="text-center mb-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, ...MOTION.gentle }}
        >
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(28px, 8vw, 36px)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            {loading ? 'Loading...' : preview ? `${preview.hostName} invited you to play` : 'You\u2019re invited'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
            Join the game in 2 seconds. No account needed.
          </p>
        </motion.div>

        {/* Room card */}
        <motion.div
          className="my-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, ...MOTION.gentle }}
        >
          {loading ? (
            <SkeletonCard />
          ) : preview ? (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            >
              {/* Top: Room code + mode/count */}
              <div className="flex items-start justify-between p-5 pb-3">
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' as const }}>
                    Room
                  </span>
                  <div
                    className="font-script"
                    style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-primary)', lineHeight: 1.2 }}
                  >
                    {code}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{ background: isFull ? 'var(--color-warning-light, rgba(245,158,66,0.12))' : 'var(--color-success-light, rgba(16,185,129,0.1))', color: isFull ? 'var(--color-warning)' : 'var(--color-success)', fontSize: '13px', fontWeight: 600 }}
                  >
                    {!isFull && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />}
                    {preview.playerCount} of {preview.maxPlayers} joined
                  </span>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                    {getGameModeLabel(preview.gameMode)}
                    {preview.isMature && (
                      <span
                        className="ml-2"
                        style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
                      >
                        18+
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider + player list */}
              {preview.players.length > 0 && (
                <div className="px-5 pb-4 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex" style={{ marginLeft: 0 }}>
                      {preview.players.slice(0, 5).map((player, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-center rounded-full"
                          style={{
                            width: 32,
                            height: 32,
                            background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'white',
                            border: '2px solid var(--color-surface)',
                            marginLeft: i > 0 ? '-8px' : 0,
                            position: 'relative',
                            zIndex: preview.players.length - i,
                          }}
                        >
                          {player.nickname[0]?.toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {preview.players.map(p => p.nickname).join(', ')}
                    </span>
                    <span
                      className="ml-auto px-2.5 py-0.5 rounded-full"
                      style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-success)', background: 'var(--color-success-light, rgba(16,185,129,0.1))' }}
                    >
                      {preview.playerCount}/{preview.maxPlayers}
                    </span>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {isFull && (
                <div className="px-5 pb-4">
                  <div className="p-2.5 rounded-lg text-sm text-center" style={{ background: 'var(--color-highlight-pink, var(--color-surface-alt))', color: 'var(--color-warning)', border: '1px solid var(--color-border)' }}>
                    Room is full — you&apos;ll join as a spectator
                  </div>
                </div>
              )}
              {preview.gameState !== 'LOBBY' && (
                <div className="px-5 pb-4">
                  <div className="p-2.5 rounded-lg text-sm text-center" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-danger)', border: '1px solid var(--color-border)' }}>
                    Game in progress — wait for next round
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </motion.div>

        {/* Nickname + Join */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, ...MOTION.gentle }}
        >
          <label
            className="block mb-2"
            htmlFor="invite-nickname"
            style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}
          >
            What should we call you?
          </label>
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
            placeholder="Your nickname"
            maxLength={20}
            autoComplete="off"
            enterKeyHint="go"
            className="w-full mb-3"
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: nicknameTouched && nicknameError ? '2px solid var(--color-danger)' : '1.5px solid var(--color-border)',
              background: 'var(--color-surface-alt)',
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              outline: 'none',
            }}
          />
          {nicknameTouched && nicknameError && (
            <p className="mb-3" style={{ fontSize: '13px', color: 'var(--color-danger)' }}>{nicknameError}</p>
          )}
          <motion.button
            type="submit"
            disabled={loading || error}
            className="w-full"
            style={{
              padding: '16px 24px',
              borderRadius: '14px',
              fontSize: '17px',
              fontWeight: 700,
              background: loading || error ? 'var(--color-surface-alt)' : 'var(--color-accent)',
              color: loading || error ? 'var(--color-text-tertiary)' : '#fff',
              border: 'none',
              cursor: loading || error ? 'not-allowed' : 'pointer',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Join the game
          </motion.button>
        </motion.form>

        {/* Subtitle */}
        <motion.p
          className="text-center mt-3 mb-8"
          style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          No account needed. Just pick a name and play.
        </motion.p>

        {/* 3-step how it works */}
        <motion.div
          className="flex items-center justify-center gap-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ...MOTION.gentle }}
        >
          {[
            { num: '1', label: 'Pick cards' },
            { num: '2', label: 'AI writes' },
            { num: '3', label: 'Perform' },
          ].map((step, i) => (
            <React.Fragment key={step.num}>
              {i > 0 && (
                <div style={{ width: 32, height: 2, background: 'var(--color-border)', flexShrink: 0 }} />
              )}
              <div className="flex flex-col items-center" style={{ minWidth: 72 }}>
                <div
                  className="flex items-center justify-center rounded-full mb-1.5"
                  style={{
                    width: 36,
                    height: 36,
                    background: 'var(--color-surface-alt)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {step.num}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{step.label}</span>
              </div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </main>
  )
}

export default InvitePage
