'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface CharacterCardShareProps {
  playerName: string
  characterName: string
  bestLine?: string
  votes: number
  isMvp: boolean
  reactions: number
  showTitle: string
  gameId: string
  playerId: string
  onClose?: () => void
}

export function CharacterCardShare({
  playerName,
  characterName,
  bestLine,
  votes,
  isMvp,
  reactions,
  showTitle,
  gameId,
  playerId,
  onClose,
}: CharacterCardShareProps) {
  const [format, setFormat] = useState<'story' | 'feed'>('story')
  const [sharing, setSharing] = useState(false)

  const cardUrl = `/api/character-card/${gameId}/${playerId}?format=${format}`

  const handleShareImage = async () => {
    setSharing(true)
    try {
      const response = await fetch(cardUrl)
      const blob = await response.blob()
      const file = new File([blob], `character-card-${format}.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${playerName} as ${characterName} — Plot Twists` })
      } else {
        window.open(cardUrl, '_blank')
      }
    } catch {
      window.open(cardUrl, '_blank')
    }
    setSharing(false)
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${cardUrl}`
    await navigator.clipboard?.writeText(url)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = cardUrl
    a.download = `character-card-${format}.png`
    a.click()
  }

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100dvh', background: 'var(--color-theater-bg, #0f0f0f)', color: 'white' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
          Your Character Card
        </span>
        <div className="flex gap-2">
          {(['story', 'feed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="px-4 py-1.5 rounded-full"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                background: format === f ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
                color: format === f ? '#fff' : 'rgba(255,255,255,0.6)',
                border: format === f ? 'none' : '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                textTransform: 'capitalize' as const,
              }}
            >
              {f === 'story' ? 'Story' : 'Post'}
            </button>
          ))}
        </div>
      </div>

      {/* Card preview */}
      <div className="flex-1 flex items-center justify-center px-5 pb-4">
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            maxWidth: '340px',
            background: 'linear-gradient(180deg, #1a2a3a 0%, #2a1a0a 60%, #1a1008 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '28px 24px',
            aspectRatio: format === 'story' ? '9/16' : '4/5',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Top — decorative dots + branding */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: `rgba(255,255,255,${0.15 + i * 0.05})` }} />
              ))}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const }}>
              Plot Twists
            </span>
          </div>

          {/* Starring */}
          <div className="flex-1">
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
              Starring
            </p>
            <h2 className="font-display" style={{ fontSize: '36px', fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: '4px' }}>
              {playerName}
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--color-accent)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>as </span>
              <span className="font-display" style={{ fontWeight: 600 }}>{characterName}</span>
            </p>

            {/* Divider */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--color-accent) 0%, transparent 100%)', margin: '20px 0', maxWidth: '200px' }} />

            {/* Best line */}
            {bestLine && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
                  Best Line
                </p>
                <p style={{ fontSize: '18px', lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}>
                  &ldquo;{bestLine}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-around mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-center">
              <div className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>{votes}</div>
              <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const }}>Votes</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
            <div className="text-center">
              {isMvp ? (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#F59E42" style={{ margin: '0 auto 2px' }}>
                    <path d="M12 2l2.09 6.26L20.18 9l-4.64 4.14L16.82 20 12 16.77 7.18 20l1.28-6.86L3.82 9l6.09-.74L12 2z" />
                  </svg>
                  <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'var(--color-accent)', textTransform: 'uppercase' as const, fontWeight: 700 }}>MVP</div>
                </>
              ) : (
                <>
                  <div className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>—</div>
                  <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const }}>MVP</div>
                </>
              )}
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
            <div className="text-center">
              <div className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>{reactions}</div>
              <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const }}>Reactions</div>
            </div>
          </div>

          {/* Show title footer */}
          <div className="text-center mt-4">
            <p className="font-display" style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{showTitle}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>plottwists.live</p>
          </div>
        </div>
      </div>

      {/* Share actions */}
      <div className="px-5 pb-6">
        <motion.button
          onClick={handleShareImage}
          disabled={sharing}
          className="w-full flex items-center justify-center gap-2 mb-4"
          style={{
            padding: '16px',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            cursor: sharing ? 'default' : 'pointer',
            opacity: sharing ? 0.7 : 1,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 15v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
            <polyline points="10 3 10 13" /><polyline points="6 7 10 3 14 7" />
          </svg>
          {sharing ? 'Sharing...' : 'Share to Instagram'}
        </motion.button>

        <div className="flex justify-center gap-3">
          {[
            { label: 'Open', icon: <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />, onClick: () => window.open(cardUrl, '_blank') },
            { label: 'Download', icon: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>, onClick: handleDownload },
            { label: 'Link', icon: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>, onClick: handleCopyLink },
            { label: 'Copy', icon: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>, onClick: handleCopyLink },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="w-11 h-11 flex items-center justify-center rounded-full"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
              }}
              aria-label={action.label}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {action.icon}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Close if in modal context */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer' }}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  )
}
