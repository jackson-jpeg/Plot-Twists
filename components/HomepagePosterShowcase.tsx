'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HOMEPAGE_SHOWCASE } from '@/lib/homepageShowcase'
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
  active = false,
}: HomepagePosterCardProps) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '28px',
        border: active
          ? `2px solid ${accent}`
          : '1.5px solid rgba(255,255,255,0.06)',
        background: imageFailed || !imagePath ? fallbackBackground : 'var(--color-void)',
        boxShadow: active
          ? `0 28px 64px rgba(0, 0, 0, 0.54), 0 0 0 1px ${accent}22`
          : '0 18px 44px rgba(0, 0, 0, 0.38)',
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
            ? 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 100%)'
            : 'linear-gradient(180deg, rgba(8,7,11,0.04) 0%, rgba(8,7,11,0.22) 38%, rgba(8,7,11,0.88) 100%)',
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
        {/* Glass pill badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: 'fit-content',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
            color: '#f0ece4',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <span>Now Showing</span>
          {active && (
            <span
              style={{
                color: 'var(--color-stage-gold)',
                borderLeft: '1px solid rgba(255,255,255,0.18)',
                paddingLeft: '8px',
              }}
            >
              Featured
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(240, 236, 228, 0.5)',
            }}
          >
            One night only
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(34px, 5vw, 52px)',
              lineHeight: 0.94,
              letterSpacing: '-0.02em',
              color: '#f0ece4',
              textWrap: 'balance',
              textShadow: '0 10px 32px rgba(0, 0, 0, 0.6)',
              margin: 0,
            }}
          >
            {title}
          </h3>

          <p
            style={{
              maxWidth: '28rem',
              color: 'rgba(240, 236, 228, 0.78)',
              fontSize: '13px',
              lineHeight: 1.45,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: 0,
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
  const activePoster = HOMEPAGE_SHOWCASE[activeIndex]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HOMEPAGE_SHOWCASE.length)
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
      {/* Section heading */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(26px, 3.5vw, 36px)',
            lineHeight: 1,
            letterSpacing: '-0.01em',
            color: 'var(--color-stage-gold)',
            margin: 0,
          }}
        >
          Now Showing
        </h2>
        <p
          style={{
            fontSize: '11px',
            lineHeight: 1.4,
            color: 'rgba(240, 236, 228, 0.38)',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Six absurd premieres. One impossible lineup.
        </p>
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
              imagePath={activePoster.imagePath}
              fallbackBackground={activePoster.palette.background}
              accent={activePoster.palette.accent}
              text={activePoster.palette.text}
              active
            />
          </motion.div>
        </AnimatePresence>

        {/* Sidebar: poster list */}
        <div
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'column' : 'row',
            gap: '10px',
            overflowX: isDesktop ? undefined : 'auto',
            paddingBottom: isDesktop ? undefined : '4px',
          }}
        >
          {HOMEPAGE_SHOWCASE.map((poster, index) => (
            <button
              key={poster.slug}
              type="button"
              onClick={() => setActiveIndex(index)}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px minmax(0, 1fr)',
                gap: '14px',
                alignItems: 'center',
                minWidth: isDesktop ? undefined : '296px',
                padding: '12px',
                borderRadius: '18px',
                border: index === activeIndex
                  ? `1.5px solid ${poster.palette.accent}`
                  : '1px solid rgba(255,255,255,0.06)',
                background: index === activeIndex
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(255,255,255,0.02)',
                boxShadow: index === activeIndex
                  ? `0 12px 28px rgba(0, 0, 0, 0.36), 0 0 0 1px ${poster.palette.accent}18`
                  : 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  aspectRatio: '2 / 3',
                  borderRadius: '12px',
                  background: poster.palette.background,
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                  opacity: index === activeIndex ? 1 : 0.72,
                  transition: 'opacity 0.2s',
                }}
              >
                {poster.imagePath && (
                  <img
                    src={poster.imagePath}
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
                )}
              </div>

              {/* Text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: index === activeIndex
                      ? 'var(--color-stage-gold)'
                      : 'rgba(240, 236, 228, 0.36)',
                    transition: 'color 0.2s',
                  }}
                >
                  {index === activeIndex ? 'Now Showing' : 'Coming Soon'}
                </span>
                <strong
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '22px',
                    lineHeight: 0.96,
                    letterSpacing: '-0.02em',
                    color: index === activeIndex ? '#f0ece4' : 'rgba(240, 236, 228, 0.72)',
                    transition: 'color 0.2s',
                    display: 'block',
                  }}
                >
                  {poster.title}
                </strong>
                <span
                  style={{
                    fontSize: '11px',
                    lineHeight: 1.35,
                    color: 'rgba(240, 236, 228, 0.42)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
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
