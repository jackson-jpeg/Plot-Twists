'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Clip {
  id: string
  quote: string
  showTitle: string
  players: string[]
  duration: number
  timeAgo: string
  likes: number
  reactions: number
  color: string
}

interface ClipGalleryProps {
  clips: Clip[]
  onPlayClip?: (clipId: string) => void
  onShareClip?: (clipId: string) => void
  onPlayGame?: () => void
}

const CLIP_COLORS = [
  'linear-gradient(180deg, #1a2a3a 0%, #2a1a0a 60%)',
  'linear-gradient(180deg, #2a1a2a 0%, #1a0a1a 60%)',
  'linear-gradient(180deg, #0a2a1a 0%, #0a1a0a 60%)',
]

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function WaveformIcon() {
  return (
    <svg width="120" height="32" viewBox="0 0 120 32" fill="none" style={{ opacity: 0.5 }}>
      {[0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112].map((x, i) => {
        const heights = [8, 16, 24, 12, 28, 20, 10, 26, 14, 22, 8, 18, 24, 12, 16]
        const h = heights[i % heights.length]
        return (
          <rect
            key={x}
            x={x}
            y={(32 - h) / 2}
            width="4"
            height={h}
            rx="2"
            fill="var(--color-accent)"
            opacity={0.4 + Math.random() * 0.4}
          />
        )
      })}
    </svg>
  )
}

function PlayButton({ size = 48 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: 'var(--color-accent)',
        boxShadow: '0 4px 20px rgba(245,158,66,0.4)',
      }}
    >
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 16 16" fill="white">
        <path d="M4 2l10 6-10 6V2z" />
      </svg>
    </div>
  )
}

export function ClipGallery({ clips, onPlayClip, onShareClip, onPlayGame }: ClipGalleryProps) {
  const [tab, setTab] = useState<'trending' | 'new'>('trending')

  const featured = clips[0]
  const rest = clips.slice(1)

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f0f', color: '#fff' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700 }}>Clips</h1>
        <div className="flex gap-2">
          {(['trending', 'new'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                background: tab === t ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
                border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                textTransform: 'capitalize' as const,
              }}
            >
              {t === 'trending' ? 'Trending' : 'New'}
            </button>
          ))}
        </div>
      </div>

      {/* Featured clip */}
      {featured && (
        <motion.div
          className="mx-5 mb-5 rounded-2xl overflow-hidden"
          style={{
            background: CLIP_COLORS[0],
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Quote */}
          <div style={{ padding: '20px 20px 0' }}>
            <p style={{ fontSize: '16px', lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>
              &ldquo;{featured.quote}&rdquo;
            </p>
          </div>

          {/* Play + waveform */}
          <div className="flex flex-col items-center py-6 gap-4">
            <button
              onClick={() => onPlayClip?.(featured.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Play clip"
            >
              <PlayButton size={56} />
            </button>
            <div className="flex items-center gap-3 w-full px-5">
              <WaveformIcon />
              <span
                className="px-2 py-0.5 rounded-md"
                style={{ fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              >
                {formatDuration(featured.duration)}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-center justify-between px-5 pb-5">
            <div>
              <p className="font-display" style={{ fontSize: '16px', fontWeight: 700 }}>{featured.showTitle}</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                {featured.players.join(', ')} &middot; {featured.timeAgo}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1" style={{ fontSize: '14px', color: 'var(--color-accent)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--color-accent)">
                  <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 3.5 4.5 2 6.5 2c1.1 0 2.1.5 2.5 1.3.4-.8 1.4-1.3 2.5-1.3 2 0 4 1.5 4 4.5S8 14 8 14z" />
                </svg>
                {featured.likes}
              </span>
              {onShareClip && (
                <button
                  onClick={() => onShareClip(featured.id)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                  aria-label="Share clip"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Clip list */}
      <div className="px-5 space-y-3">
        {rest.map((clip, i) => (
          <motion.div
            key={clip.id}
            className="flex gap-3 items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            {/* Thumbnail */}
            <button
              onClick={() => onPlayClip?.(clip.id)}
              className="relative rounded-xl overflow-hidden shrink-0"
              style={{
                width: 100,
                height: 80,
                background: CLIP_COLORS[(i + 1) % CLIP_COLORS.length],
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label={`Play ${clip.showTitle}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayButton size={32} />
              </div>
              <span
                className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded"
                style={{ fontSize: '10px', fontWeight: 600, background: 'rgba(0,0,0,0.6)', color: '#fff' }}
              >
                {formatDuration(clip.duration)}
              </span>
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-display" style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>{clip.showTitle}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                {clip.players.join(', ')} &middot; {clip.timeAgo}
              </p>
              <div className="flex items-center gap-3 mt-1" style={{ fontSize: '12px' }}>
                <span className="flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--color-accent)">
                    <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 3.5 4.5 2 6.5 2c1.1 0 2.1.5 2.5 1.3.4-.8 1.4-1.3 2.5-1.3 2 0 4 1.5 4 4.5S8 14 8 14z" />
                  </svg>
                  {clip.likes}
                </span>
                {clip.reactions > 0 && (
                  <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="8" cy="8" r="6" /><path d="M5 9.5s1 1.5 3 1.5 3-1.5 3-1.5" strokeLinecap="round" /><circle cx="6" cy="6.5" r="0.5" fill="currentColor" stroke="none" /><circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                    </svg>
                    {clip.reactions}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Play a game CTA */}
      {onPlayGame && (
        <div className="px-5 py-6">
          <motion.button
            onClick={onPlayGame}
            className="w-full flex items-center justify-center gap-2"
            style={{
              padding: '14px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 600,
              background: 'transparent',
              color: 'var(--color-accent)',
              border: '1px solid rgba(245,158,66,0.3)',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 8a7 7 0 1114 0A7 7 0 011 8z" /><path d="M8 4v4l2 2" />
            </svg>
            Play a game like this
          </motion.button>
        </div>
      )}
    </div>
  )
}
