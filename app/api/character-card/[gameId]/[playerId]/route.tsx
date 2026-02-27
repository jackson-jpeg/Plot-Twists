import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ gameId: string; playerId: string }> }
) {
  const { gameId, playerId } = await params
  const url = new URL(req.url)
  const format = url.searchParams.get('format') || 'feed'

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${wsUrl}/api/game-player/${gameId}/${playerId}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return new Response('Not found', { status: 404 })
    }

    const data = await res.json()
    const width = 1080
    const height = format === 'story' ? 1920 : 1350

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(160deg, #2A2722 0%, #1A1816 100%)',
            padding: format === 'story' ? '120px 80px' : '80px 80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top accent bar */}
          <div style={{ display: 'flex', width: '60px', height: '4px', background: '#F59E42', borderRadius: '2px' }} />

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'center' }}>
            {/* Player name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {data.isWinner ? 'MVP' : 'STARRING'}
              </span>
              <span style={{ fontSize: '72px', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.0 }}>
                {data.playerName}
              </span>
            </div>

            {/* Character */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.5)' }}>as</span>
              <span style={{ fontSize: '36px', color: '#F59E42', fontWeight: 600 }}>
                {data.character}
              </span>
            </div>

            {/* Best line */}
            {data.bestLine && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', width: '4px', background: '#F59E42', borderRadius: '2px', flexShrink: 0, minHeight: '40px' }} />
                <span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.4, maxWidth: '800px' }}>
                  &ldquo;{data.bestLine.length > 120 ? data.bestLine.slice(0, 120) + '...' : data.bestLine}&rdquo;
                </span>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '40px', color: '#FFFFFF', fontWeight: 700 }}>{data.votesReceived}</span>
                <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Votes</span>
              </div>
              {data.isWinner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: 'rgba(245,158,66,0.15)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '24px', color: '#F59E42', fontWeight: 700 }}>MVP</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)' }}>{data.title}</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)' }}>{data.setting}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Plot Twists</span>
            </div>
          </div>
        </div>
      ),
      { width, height }
    )
  } catch {
    return new Response('Error generating card', { status: 500 })
  }
}
