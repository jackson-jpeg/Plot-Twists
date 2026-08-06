'use client'

import type { HomepageShowcaseEntry } from '@/lib/homepageShowcase'
import { POSTER_ASPECT } from '@/design/tokens'

/**
 * A typographic film one-sheet, 2:3 exactly (design/tokens POSTER_ASPECT).
 * One-sheet grammar per design/NORTH-STAR.md §2: studio credit up top, title
 * anchored in the bottom fifth, billing-block micro-type as the base texture.
 * Deliberately no artwork — see lib/homepageShowcase.ts for why none is
 * coming. The poster is typography wearing a genre palette.
 */

// Film grain: inline SVG turbulence so the surface reads photographic, not flat
// (NORTH-STAR §1). Data URI keeps it self-contained; opacity stays subtle.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`

const BILLING_CREDITS = [
  'DIRECTED BY THE ROOM',
  'SCREENPLAY WRITTEN LIVE',
  'CASTING BY DUMB LUCK',
  'WARDROBE BY WHOEVER SHOWED UP',
]

export function PosterOneSheet({ entry }: { entry: HomepageShowcaseEntry }) {
  const { title, hook, palette } = entry
  return (
    <article
      aria-label={`Poster: ${title}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: POSTER_ASPECT,
        width: '100%',
        borderRadius: '8px',
        background: palette.background,
        boxShadow:
          '0 24px 60px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Vignette — light falls off toward the edges like a printed sheet */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(0,0,0,0.28) 100%)',
        }}
      />
      {/* Spotlight — the title area gets the light (NORTH-STAR §4) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(75% 55% at 50% 42%, ${palette.accent}24, transparent 72%)`,
        }}
      />
      {/* Grain */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: GRAIN,
          backgroundSize: '240px 240px',
          opacity: 0.1,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Studio credit — top, micro, tracked */}
      <div
        style={{
          position: 'relative',
          padding: '7% 8% 0',
          textAlign: 'center',
          fontFamily: 'var(--font-code)',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: palette.text,
          opacity: 0.55,
        }}
      >
        PlotSlop Pictures presents
      </div>

      {/* The title IS the art — a type-driven one-sheet, star centered and lit
          (NORTH-STAR §4). An empty image area reads as a poster-shaped hole. */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '0 9%',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(34px, 3.4vw, 44px)',
            fontWeight: 400,
            lineHeight: 1.02,
            letterSpacing: '-0.015em',
            color: palette.text,
            margin: 0,
            textWrap: 'balance',
          }}
        >
          {title}
        </h2>
      </div>

      {/* Bottom fifth — hook and billing */}
      <div style={{ position: 'relative', padding: '0 8% 6%' }}>
        <div
          aria-hidden
          style={{
            width: '32px',
            height: '3px',
            background: palette.accent,
            marginBottom: '12px',
          }}
        />
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12.5px',
            lineHeight: 1.45,
            color: palette.text,
            opacity: 0.78,
            margin: 0,
          }}
        >
          {hook}
        </p>

        {/* Billing block — the signature texture of legitimacy */}
        <div
          style={{
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: `1px solid ${palette.text}22`,
            fontFamily: 'var(--font-code)',
            fontSize: '7.5px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            lineHeight: 1.8,
            textTransform: 'uppercase',
            color: palette.text,
            opacity: 0.5,
            textAlign: 'center',
          }}
        >
          {BILLING_CREDITS.join(' · ')}
        </div>
      </div>
    </article>
  )
}
