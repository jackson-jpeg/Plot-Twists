'use client'

import { motion } from 'framer-motion'

interface WeeklyDigestProps {
  dateRange: { start: string; end: string }
  stats: {
    gamesPlayed: number
    mvpsWon: number
    reactionsEarned: number
  }
  lineOfTheWeek?: {
    quote: string
    playerName: string
    characterName: string
    showTitle: string
  }
  funniestCharacter?: {
    name: string
    gamesAppeared: number
    isMvp: boolean
  }
  freeCreditsRefreshed?: boolean
  onShare?: () => void
  onPlay?: () => void
}

export function WeeklyDigest({
  dateRange,
  stats,
  lineOfTheWeek,
  funniestCharacter,
  freeCreditsRefreshed,
  onShare,
  onPlay,
}: WeeklyDigestProps) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="w-full max-w-md mx-auto" style={{ padding: '32px 20px' }}>
      {/* Date range */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', letterSpacing: '0.02em', marginBottom: '4px' }}
      >
        {formatDate(dateRange.start)} — {formatDate(dateRange.end)}
      </motion.p>

      {/* Title */}
      <motion.h1
        className="font-display"
        style={{
          fontSize: 'clamp(32px, 9vw, 40px)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: '24px',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        Your Week in Comedy
      </motion.h1>

      {/* Stats grid — asymmetric: large left, 2 stacked right */}
      <motion.div
        className="flex gap-3 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ minHeight: '180px' }}
      >
        {/* Large card — Games played */}
        <div
          className="flex-1 rounded-2xl flex flex-col justify-end"
          style={{
            padding: '20px',
            background: 'var(--color-text-primary)',
            color: '#fff',
            minHeight: '180px',
          }}
        >
          <span className="font-display" style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1, color: 'var(--color-accent)' }}>
            {stats.gamesPlayed}
          </span>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>Games played</span>
        </div>

        {/* Right stack */}
        <div className="flex flex-col gap-3" style={{ width: '45%' }}>
          <div
            className="flex-1 rounded-2xl flex flex-col justify-end"
            style={{
              padding: '16px',
              background: 'var(--color-accent-light, rgba(245,158,66,0.08))',
              border: '1px solid var(--color-border)',
            }}
          >
            <span className="font-display" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, color: 'var(--color-accent)' }}>
              {stats.mvpsWon}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>MVPs won</span>
          </div>
          <div
            className="flex-1 rounded-2xl flex flex-col justify-end"
            style={{
              padding: '16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <span className="font-display" style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1, color: 'var(--color-text-primary)' }}>
              {stats.reactionsEarned}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Reactions earned</span>
          </div>
        </div>
      </motion.div>

      {/* Line of the Week */}
      {lineOfTheWeek && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '12px' }}>
            Line of the Week
          </p>
          <div
            className="rounded-xl"
            style={{
              padding: '20px',
              paddingLeft: '24px',
              background: 'var(--color-surface-alt)',
              borderLeft: '3px solid var(--color-accent)',
            }}
          >
            <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--color-text-primary)', fontStyle: 'italic', marginBottom: '12px' }}>
              &ldquo;{lineOfTheWeek.quote}&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full"
                style={{ background: '#EC4899', flexShrink: 0 }}
              />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                You, as {lineOfTheWeek.characterName} — {lineOfTheWeek.showTitle}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Funniest Character */}
      {funniestCharacter && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--color-text-tertiary)', marginBottom: '12px' }}>
            Funniest Character
          </p>
          <div
            className="flex items-center gap-4 rounded-xl"
            style={{
              padding: '16px 20px',
              background: 'var(--color-text-primary)',
              color: '#fff',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)', fontSize: '20px' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
                <circle cx="9" cy="9" r="1" fill="rgba(255,255,255,0.7)" stroke="none" />
                <circle cx="15" cy="9" r="1" fill="rgba(255,255,255,0.7)" stroke="none" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display" style={{ fontSize: '18px', fontWeight: 700 }}>{funniestCharacter.name}</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                Appeared in {funniestCharacter.gamesAppeared} game{funniestCharacter.gamesAppeared !== 1 ? 's' : ''} this week
              </p>
            </div>
            {funniestCharacter.isMvp && (
              <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-accent)' }}>MVP</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Share CTA */}
      {onShare && (
        <motion.button
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 mb-3"
          style={{
            padding: '16px',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: 700,
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 15v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
            <polyline points="10 3 10 13" /><polyline points="6 7 10 3 14 7" />
          </svg>
          Share Your Week
        </motion.button>
      )}

      {/* Footer */}
      {(freeCreditsRefreshed || onPlay) && (
        <motion.p
          className="text-center"
          style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {freeCreditsRefreshed && '5 free credits refreshed'}
          {freeCreditsRefreshed && onPlay && ' \u00B7 '}
          {onPlay && (
            <button
              onClick={onPlay}
              style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
            >
              Play now
            </button>
          )}
        </motion.p>
      )}
    </div>
  )
}
