import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Plot Twists - Watch This Scene!'
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://plottwists.app'
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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a1625 100%)',
          padding: '48px 60px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative spotlight */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <span style={{ fontSize: '48px' }}>🎭</span>
          <span style={{ color: '#A855F7', fontSize: '24px', fontWeight: 700, letterSpacing: '0.05em' }}>
            PLOT TWISTS
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 30 ? '48px' : '56px',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.1,
            marginBottom: '16px',
            display: 'flex',
          }}
        >
          "{title}"
        </div>

        {/* Synopsis */}
        <div
          style={{
            fontSize: '22px',
            color: '#c4b5d4',
            lineHeight: 1.4,
            marginBottom: '32px',
            maxWidth: '800px',
            display: 'flex',
          }}
        >
          {synopsis.length > 120 ? synopsis.slice(0, 117) + '...' : synopsis}
        </div>

        {/* Cast */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {players.slice(0, 6).map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                background: p.isWinner
                  ? 'linear-gradient(135deg, rgba(245,158,66,0.3), rgba(245,158,66,0.1))'
                  : 'rgba(255,255,255,0.08)',
                border: p.isWinner ? '1px solid rgba(245,158,66,0.5)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {p.isWinner && <span style={{ fontSize: '16px' }}>👑</span>}
              <span style={{ color: p.isWinner ? '#F59E42' : '#e0d6eb', fontSize: '18px', fontWeight: 600 }}>
                {p.character}
              </span>
              <span style={{ color: '#9B9590', fontSize: '16px' }}>({p.nickname})</span>
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
              <span style={{ fontSize: '24px' }}>🏆</span>
              <span style={{ color: '#F59E42', fontSize: '20px', fontWeight: 700 }}>
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
              padding: '8px 20px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #A855F7, #EC4899)',
              color: '#FFFFFF',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            Watch the Replay
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
