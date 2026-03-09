import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('player')
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Fetch game data via internal API
  let title = 'Plot Twists'
  let players: Array<{ id?: string; nickname: string; character: string; isWinner: boolean }> = []
  let gameMode = 'ENSEMBLE'
  let comedyStyle = ''
  let winner: { nickname: string; character: string; isWinner: boolean } | undefined

  try {
    const res = await fetch(`${wsUrl}/api/game/${gameId}`, { cache: 'no-store' })
    if (res.ok) {
      const game = await res.json()
      title = game.title || title
      players = game.players || []
      gameMode = game.gameMode || gameMode
      comedyStyle = game.comedyStyle || ''
      winner = players.find(p => p.isWinner)
    }
  } catch {
    // Fall through to defaults
  }

  const targetPlayer = playerId ? players.find(p => p.id === playerId) : null
  const castList = players.map(p => p.nickname).join(', ')

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
        {/* Warm spotlight */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(245,158,66,0.3) 0%, rgba(168,85,247,0.12) 40%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Curtain strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(90deg, #F59E42, #A855F7, #EC4899, #F59E42)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 80px',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>🎭</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#9B9590', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
              Plot Twists
            </span>
          </div>

          {/* Script title */}
          <div style={{ fontSize: '52px', fontWeight: 800, color: '#EDEBE8', lineHeight: 1.1, marginBottom: '16px', display: 'flex' }}>
            {title}
          </div>

          {/* Player highlight or cast */}
          {targetPlayer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px', color: '#F59E42', fontWeight: 700 }}>{targetPlayer.nickname}</span>
              <span style={{ fontSize: '20px', color: '#9B9590' }}>as</span>
              <span style={{ fontSize: '24px', color: '#EDEBE8', fontWeight: 600 }}>{targetPlayer.character}</span>
              {targetPlayer.isWinner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(245,158,66,0.2)', border: '1px solid rgba(245,158,66,0.4)' }}>
                  <span style={{ fontSize: '16px' }}>⭐</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#F59E42' }}>MVP</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '20px', color: '#B8B5B0', marginBottom: '20px', display: 'flex' }}>
              Starring {castList || 'the cast'}
            </div>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {gameMode && (
              <div style={{ display: 'flex', padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#B8B5B0', fontSize: '14px', fontWeight: 600 }}>
                {gameMode === 'SOLO' ? 'Solo' : gameMode === 'HEAD_TO_HEAD' ? 'Head-to-Head' : 'Ensemble'}
              </div>
            )}
            {comedyStyle && (
              <div style={{ display: 'flex', padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#B8B5B0', fontSize: '14px', fontWeight: 600 }}>
                {comedyStyle.charAt(0).toUpperCase() + comedyStyle.slice(1)}
              </div>
            )}
            {winner && !targetPlayer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 16px', borderRadius: '8px', background: 'rgba(245,158,66,0.15)', border: '1px solid rgba(245,158,66,0.3)', color: '#F59E42', fontSize: '14px', fontWeight: 700 }}>
                ⭐ MVP: {winner.nickname}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 80px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '14px', color: '#6B6560' }}>plot-twists.com</span>
          <span style={{ fontSize: '14px', color: '#6B6560' }}>
            {players.length} player{players.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
