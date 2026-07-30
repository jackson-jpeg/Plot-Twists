import { ImageResponse } from 'next/og'
import { SITE_URL } from '@/lib/siteUrl'

export const runtime = 'edge'
export const alt = 'PlotSlop - Watch This Scene!'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface GameMeta {
  title: string
  synopsis: string
  players: { nickname: string; character: string; isWinner: boolean }[]
  winner?: { playerName: string; character: string }
  gameMode: string
  setting: string
}

export default async function Image({ params }: { params: { code: string } }) {
  const baseUrl = SITE_URL
  let game: GameMeta | null = null

  try {
    const res = await fetch(`${baseUrl}/api/game/${params.code}`, { next: { revalidate: 300 } })
    if (res.ok) {
      game = await res.json()
    }
  } catch {
    // Fall back to generic image
  }

  const title = game?.title || 'Watch This Scene!'
  const synopsis = game?.synopsis || 'An AI-generated improv comedy script'
  const players = game?.players || []
  const winner = game?.winner
  const setting = game?.setting
  const gameMode = game?.gameMode

  const modeLabel = gameMode === 'SOLO' ? 'Solo' : gameMode === 'HEAD_TO_HEAD' ? 'Duel' : 'Ensemble'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#1C1A17',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Warm spotlight gradient */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(245,158,66,0.2) 0%, rgba(168,85,247,0.1) 40%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Curtain scallop top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #F59E42, #A855F7, #EC4899, #F59E42)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 60px', flex: 1 }}>
          {/* Header row: brand + badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '40px' }}>🎭</span>
              <span style={{ color: '#F59E42', fontSize: '22px', fontWeight: 700, letterSpacing: '0.08em' }}>
                PLOTSLOP
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {setting && (
                <div
                  style={{
                    display: 'flex',
                    padding: '6px 16px',
                    borderRadius: '999px',
                    background: 'rgba(245,158,66,0.15)',
                    border: '1px solid rgba(245,158,66,0.3)',
                    color: '#F59E42',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  {setting}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#A855F7',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                {modeLabel} {players.length > 0 ? `\u00B7 ${players.length} players` : ''}
              </div>
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 35 ? '44px' : '52px',
              fontWeight: 800,
              color: '#EDEBE8',
              lineHeight: 1.15,
              marginBottom: '14px',
              display: 'flex',
            }}
          >
            &ldquo;{title}&rdquo;
          </div>

          {/* Synopsis */}
          <div
            style={{
              fontSize: '21px',
              color: '#B8B5B0',
              lineHeight: 1.4,
              marginBottom: '28px',
              maxWidth: '800px',
              display: 'flex',
            }}
          >
            {synopsis.length > 130 ? synopsis.slice(0, 127) + '...' : synopsis}
          </div>

          {/* Cast pills */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {players.slice(0, 6).map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  background: p.isWinner
                    ? 'linear-gradient(135deg, rgba(245,158,66,0.25), rgba(245,158,66,0.08))'
                    : 'rgba(255,255,255,0.06)',
                  border: p.isWinner ? '1px solid rgba(245,158,66,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {p.isWinner && <span style={{ fontSize: '14px' }}>👑</span>}
                <span style={{ color: p.isWinner ? '#F59E42' : '#EDEBE8', fontSize: '16px', fontWeight: 600 }}>
                  {p.character}
                </span>
                <span style={{ color: '#7D7A75', fontSize: '14px' }}>({p.nickname})</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto',
            }}
          >
            {winner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>🏆</span>
                <span style={{ color: '#F59E42', fontSize: '19px', fontWeight: 700 }}>
                  MVP: {winner.playerName} as {winner.character}
                </span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginLeft: 'auto',
                padding: '10px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E42, #E68A2E)',
                color: '#1C1A17',
                fontSize: '17px',
                fontWeight: 700,
              }}
            >
              Watch the Replay
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
