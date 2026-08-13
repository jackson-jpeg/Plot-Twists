import Link from 'next/link'

// Rendered at request time rather than prerendered. This page needs no auth,
// but it inherits <ClerkProvider> from the root layout, and prerendering it
// instantiates Clerk — which failed the whole build when
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY was absent from the build environment.
export const dynamic = 'force-dynamic'

// A cutting-room-floor title card (NORTH-STAR: deadpan studio register, one
// gold accent on void — matches the landing page world).
export default function NotFound() {
  return (
    <div
      className="flex items-center justify-center text-center"
      style={{ minHeight: '100dvh', padding: '24px', background: '#08070b' }}
    >
      <div className="max-w-md w-full px-6">
        <p
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#c9a24d',
            margin: '0 0 18px',
          }}
        >
          PlotSlop Pictures regrets
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(36px, 9vw, 48px)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.015em',
            color: '#f0ece4',
            margin: '0 0 16px',
          }}
        >
          Scene not found.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(240,236,228,0.62)',
            margin: '0 auto 32px',
            maxWidth: '38ch',
          }}
        >
          This page was left on the cutting-room floor. The rest of the
          production is still running.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          style={{
            background: '#c9a24d',
            color: '#120f08',
            padding: '14px 30px',
            borderRadius: 'var(--radius-button, 14px)',
            fontSize: '16px',
            fontWeight: 650,
            textDecoration: 'none',
            boxShadow: '0 8px 28px rgba(201,162,77,0.28)',
          }}
        >
          Back to the lobby
        </Link>
        <p
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(240,236,228,0.56)',
            margin: '36px 0 0',
          }}
        >
          Error 404 · no scenes were harmed
        </p>
      </div>
    </div>
  )
}
