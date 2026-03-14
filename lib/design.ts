/**
 * Physical Design Language — shared constants
 * Every screen is a physical object, not a digital layout.
 */

// Category color system — used across selection, voting, results
export const CATEGORY_COLORS = {
  character: { color: 'var(--color-stage-red)', bg: 'rgba(194,59,34,0.12)', border: 'rgba(194,59,34,0.3)' },
  setting: { color: 'var(--color-stage-blue)', bg: 'rgba(58,90,140,0.12)', border: 'rgba(58,90,140,0.3)' },
  circumstance: { color: 'var(--color-stage-gold)', bg: 'rgba(201,162,77,0.12)', border: 'rgba(201,162,77,0.3)' },
} as const

// Paper texture SVG — subtle noise for physical paper feel
export const PAPER_TEXTURE = "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E\")"

// Clapperboard stripes pattern
export const CLAP_STRIPES = 'repeating-linear-gradient(-45deg, #fff 0px, #fff 8px, transparent 8px, transparent 16px)'

// Film strip sprocket holes
export const SPROCKET_HOLES = `repeating-linear-gradient(to bottom, transparent 0px, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 14px, transparent 14px, transparent 24px)`

// Chase light dots for marquee
export const CHASE_LIGHTS = 'repeating-linear-gradient(90deg, transparent 0px, transparent 14px, rgba(201,162,77,0.15) 14px, rgba(201,162,77,0.15) 18px)'
