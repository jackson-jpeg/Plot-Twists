import { ImageResponse } from 'next/og'
import { SITE_DOMAIN, API_ORIGIN } from '@/lib/siteUrl'

export const runtime = 'edge'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const url = new URL(req.url)
  const format = url.searchParams.get('format') || 'story'

  try {
    // The /api/game/:id endpoint accepts both shareCode and gameId
    const res = await fetch(`${API_ORIGIN}/api/game/${gameId}`, { cache: 'no-store' })
    if (!res.ok) return new Response('Not found', { status: 404 })
    const game = await res.json()

    const width = 1080
    const height = format === 'feed' ? 1350 : 1920

    return new ImageResponse(
      (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#1A1816',
          fontFamily: 'sans-serif',
        }}>
          {/* Poster area */}
          <div style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: format === 'story' ? '80px 60px 40px' : '60px 60px 30px',
          }}>
            {game.posterUrl ? (
              <img
                src={game.posterUrl}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '16px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              // Fallback: title card if no poster
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                padding: '60px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                width: '100%',
                aspectRatio: format === 'story' ? '2/3' : '3/4',
              }}>
                <span style={{ fontSize: '56px', color: '#FFFFFF', fontWeight: 700, textAlign: 'center' }}>
                  {game.title}
                </span>
                <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)' }}>
                  {game.setting}
                </span>
              </div>
            )}
          </div>

          {/* Info section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: format === 'story' ? '0 60px 80px' : '0 60px 60px',
            gap: '16px',
          }}>
            {/* Title */}
            <span style={{ fontSize: '36px', color: '#FFFFFF', fontWeight: 700, lineHeight: 1.2 }}>
              {game.title}
            </span>

            {/* Synopsis for feed format */}
            {format === 'feed' && game.synopsis && (
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                {game.synopsis.length > 150 ? game.synopsis.slice(0, 150) + '...' : game.synopsis}
              </span>
            )}

            {/* Cast */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {game.players?.slice(0, 6).map((p: { nickname: string; character: string }, i: number) => (
                <span key={i} style={{
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.4)',
                  padding: '4px 12px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                }}>
                  {p.nickname}
                </span>
              ))}
            </div>

            {/* Branding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '18px', color: '#F59E42', fontWeight: 600 }}>PlotSlop</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>{SITE_DOMAIN}</span>
            </div>
          </div>
        </div>
      ),
      { width, height }
    )
  } catch {
    return new Response('Error generating poster', { status: 500 })
  }
}
