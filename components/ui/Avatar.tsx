'use client'

export interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  highlighted?: boolean
  className?: string
  style?: React.CSSProperties
}

const sizeMap = {
  sm: { wh: 32, fontSize: '13px' },
  md: { wh: 40, fontSize: '16px' },
  lg: { wh: 64, fontSize: '24px' },
} as const

export function Avatar({
  name,
  size = 'md',
  highlighted = false,
  className = '',
  style,
}: AvatarProps) {
  const { wh, fontSize } = sizeMap[size]
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{
        width: wh,
        height: wh,
        background: 'linear-gradient(135deg, #F59E42, #E88A2E)',
        color: 'white',
        fontSize,
        fontWeight: 700,
        fontFamily: 'var(--font-display)',
        ...(highlighted && {
          boxShadow: `0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-accent)`,
        }),
        ...style,
      }}
    >
      {initial}
    </div>
  )
}
