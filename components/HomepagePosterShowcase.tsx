'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HOMEPAGE_POSTER_BRIEFS } from '@/lib/homepagePosterBriefs'
import { useBreakpoint } from '@/hooks/useBreakpoint'

interface HomepagePosterCardProps {
  title: string
  hook: string
  imagePath?: string
  fallbackBackground: string
  accent: string
  text: string
  active?: boolean
}

function HomepagePosterCard({
  title,
  hook,
  imagePath,
  fallbackBackground,
  accent,
  text,
  active = false,
}: HomepagePosterCardProps) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '28px',
        border: active ? `2px solid ${accent}` : '1.5px solid rgba(16, 24, 32, 0.16)',
        background: fallbackBackground,
        color: text,
        boxShadow: active
          ? '0 28px 64px rgba(16, 24, 32, 0.24)'
          : '0 18px 44px rgba(16, 24, 32, 0.14)',
        minHeight: '100%',
      }}
    >
      {imagePath && !imageFailed && (
        <img
          src={imagePath}
          alt={title}
          onError={() => setImageFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: imageFailed || !imagePath
            ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(16,24,32,0.08) 100%)'
            : 'linear-gradient(180deg, rgba(10, 12, 18, 0.08) 0%, rgba(10, 12, 18, 0.28) 38%, rgba(10, 12, 18, 0.84) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 520,
          padding: '22px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: 'fit-content',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.24)',
            background: 'rgba(10, 12, 18, 0.42)',
            backdropFilter: 'blur(10px)',
            color: '#fff7ef',
            fontSize: '12px',
            fontWeight: 900,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <span>Now Showing</span>
          {active && <span style={{ color: '#ffd56e' }}>Featured</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255, 247, 239, 0.82)',
            }}
          >
            One night only
          </div>

          <h3
            className="font-display"
            style={{
              fontSize: 'clamp(34px, 5vw, 52px)',
              lineHeight: 0.94,
              letterSpacing: '-0.04em',
              color: '#fffaf2',
              textWrap: 'balance',
              textShadow: '0 10px 26px rgba(0, 0, 0, 0.35)',
            }}
          >
            {title}
          </h3>

          <p
            style={{
              maxWidth: '28rem',
              color: 'rgba(255, 247, 239, 0.92)',
              fontSize: '14px',
              lineHeight: 1.45,
              fontWeight: 700,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
            }}
          >
            {hook}
          </p>
        </div>
      </div>
    </article>
  )
}

export function HomepagePosterShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const activePoster = HOMEPAGE_POSTER_BRIEFS[activeIndex]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HOMEPAGE_POSTER_BRIEFS.length)
    }, 4800)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <section
      aria-label="Sample movie poster showcase"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'center' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-dark)',
            }}
          >
            Now showing
          </span>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(28px, 4vw, 38px)',
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              color: 'var(--color-text-primary)',
            }}
          >
            Now Showing
          </h2>
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.4,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 700,
            }}
          >
            Five absurd premieres. One impossible lineup.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'minmax(0, 1.5fr) minmax(280px, 0.9fr)' : '1fr',
          gap: '18px',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activePoster.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35 }}
          >
            <HomepagePosterCard
              title={activePoster.title}
              hook={activePoster.hook}
              imagePath={`/poster-showcase/${activePoster.slug}.png`}
              fallbackBackground={activePoster.fallbackPalette.background}
              accent={activePoster.fallbackPalette.accent}
              text={activePoster.fallbackPalette.text}
              active
            />
          </motion.div>
        </AnimatePresence>

        <div
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'column' : 'row',
            gap: '12px',
            overflowX: isDesktop ? undefined : 'auto',
            paddingBottom: isDesktop ? undefined : '4px',
          }}
        >
          {HOMEPAGE_POSTER_BRIEFS.map((poster, index) => (
            <button
              key={poster.slug}
              type="button"
              onClick={() => setActiveIndex(index)}
              style={{
                display: 'grid',
                gridTemplateColumns: '88px minmax(0, 1fr)',
                gap: '14px',
                alignItems: 'center',
                minWidth: isDesktop ? undefined : '312px',
                padding: '12px',
                borderRadius: '22px',
                border: index === activeIndex
                  ? `2px solid ${poster.fallbackPalette.accent}`
                  : '1px solid var(--color-border)',
                background: index === activeIndex
                  ? 'rgba(255, 255, 255, 0.82)'
                  : 'rgba(255, 255, 255, 0.62)',
                boxShadow: index === activeIndex
                  ? '0 18px 36px rgba(16, 24, 32, 0.12)'
                  : '0 10px 24px rgba(16, 24, 32, 0.06)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  aspectRatio: '2 / 3',
                  borderRadius: '16px',
                  background: poster.fallbackPalette.background,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={`/poster-showcase/${poster.slug}.png`}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Coming soon
                </span>
                <strong
                  className="font-display"
                  style={{
                    fontSize: '24px',
                    lineHeight: 0.96,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {poster.title}
                </strong>
                <span
                  style={{
                    fontSize: '12px',
                    lineHeight: 1.35,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 700,
                  }}
                >
                  {poster.hook}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
