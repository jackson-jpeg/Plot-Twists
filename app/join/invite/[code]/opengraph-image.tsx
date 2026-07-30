import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Join a PlotSlop game'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface RoomPreview {
  gameMode: string
  playerCount: number
  maxPlayers: number
  hostName: string
  isMature: boolean
  gameState: string
  players: { nickname: string }[]
}

export default async function Image({ params }: { params: { code: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const code = params.code.toUpperCase()

  let preview: RoomPreview | null = null
  try {
    const res = await fetch(`${baseUrl}/api/room-preview/${code}`, { next: { revalidate: 30 } })
    if (res.ok) {
      preview = await res.json()
    }
  } catch {
    // Fall back to generic image
  }

  const hostName = preview?.hostName || 'Someone'
  const playerCount = preview?.playerCount ?? 0
  const maxPlayers = preview?.maxPlayers ?? 8
  const gameMode = preview?.gameMode || 'ENSEMBLE'
  const modeLabel = gameMode === 'SOLO' ? 'Solo' : gameMode === 'HEAD_TO_HEAD' ? 'Head-to-Head' : 'Ensemble'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#2A2722',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Warm spotlight gradient */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(245,158,66,0.18) 0%, rgba(168,85,247,0.08) 40%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #F59E42, #A855F7, #EC4899, #F59E42)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '60px 72px', flex: 1, justifyContent: 'center' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <span style={{ fontSize: '36px' }}>🎭</span>
            <span style={{ color: '#F59E42', fontSize: '20px', fontWeight: 700, letterSpacing: '0.08em' }}>
              PLOTSLOP
            </span>
          </div>

          {/* Main text */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#EDEBE8',
              lineHeight: 1.15,
              marginBottom: '20px',
              display: 'flex',
            }}
          >
            Join {hostName}&apos;s game
          </div>

          {/* Room code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div
              style={{
                display: 'flex',
                padding: '12px 28px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#EDEBE8',
                fontSize: '36px',
                fontWeight: 700,
                letterSpacing: '0.15em',
              }}
            >
              {code}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#A855F7',
                  fontSize: '17px',
                  fontWeight: 600,
                }}
              >
                {modeLabel}
              </div>
              <div
                style={{
                  display: 'flex',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: playerCount >= maxPlayers ? 'rgba(250,204,21,0.15)' : 'rgba(74,222,128,0.15)',
                  border: playerCount >= maxPlayers ? '1px solid rgba(250,204,21,0.3)' : '1px solid rgba(74,222,128,0.3)',
                  color: playerCount >= maxPlayers ? '#FACC15' : '#4ADE80',
                  fontSize: '17px',
                  fontWeight: 600,
                }}
              >
                {playerCount}/{maxPlayers} players
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', marginTop: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 36px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #F59E42, #E68A2E)',
                color: '#1C1A17',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              Tap to Join
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
