import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PlotSlop - AI Improv Party Game'
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
          background: '#1C1A17',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Warm spotlight from top */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(245,158,66,0.25) 0%, rgba(168,85,247,0.1) 40%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Pink accent bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-100px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Curtain strip top */}
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

        {/* Logo */}
        <div style={{ fontSize: '88px', marginBottom: '20px', display: 'flex' }}>🎭</div>

        {/* Title */}
        <div
          style={{
            fontSize: '68px',
            fontWeight: 800,
            color: '#EDEBE8',
            letterSpacing: '-0.02em',
            marginBottom: '12px',
            display: 'flex',
          }}
        >
          PlotSlop
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '26px',
            color: '#B8B5B0',
            fontWeight: 500,
            marginBottom: '40px',
            display: 'flex',
          }}
        >
          AI Improv Party Game
        </div>

        {/* Feature badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { icon: '🎤', text: '1-6 Players' },
            { icon: '🤖', text: 'AI Scripts' },
            { icon: '🏆', text: 'Vote MVP' },
            { icon: '🎬', text: 'Free to Play' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#EDEBE8',
                fontSize: '17px',
                fontWeight: 600,
              }}
            >
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
