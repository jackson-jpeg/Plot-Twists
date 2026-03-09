'use client'

interface PlayerConnectionDotProps {
  connected?: boolean
  size?: number
}

export function PlayerConnectionDot({ connected = true, size = 8 }: PlayerConnectionDotProps) {
  const color = connected === false ? 'var(--color-text-tertiary)' : 'var(--color-success)'

  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        animation: connected === false ? 'none' : 'pulse-live 2s ease-in-out infinite',
      }}
      aria-label={connected === false ? 'Disconnected' : 'Connected'}
    />
  )
}
