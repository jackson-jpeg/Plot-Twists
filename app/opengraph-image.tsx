import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Plot Twists - AI Improv Party Game'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1f3d 50%, #1a1625 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            right: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Logo */}
        <div style={{ fontSize: '96px', marginBottom: '24px', display: 'flex' }}>🎭</div>

        {/* Title */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            marginBottom: '16px',
            display: 'flex',
          }}
        >
          Plot Twists
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#c4b5d4',
            fontWeight: 500,
            marginBottom: '40px',
            display: 'flex',
          }}
        >
          AI Improv Party Game
        </div>

        {/* Features */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {['1-6 Players', 'AI-Written Scripts', 'Vote for MVP', 'Free to Play'].map((text, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                padding: '10px 24px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e0d6eb',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
