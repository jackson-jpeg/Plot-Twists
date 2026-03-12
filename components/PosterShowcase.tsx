'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Badge } from '@/components/ui'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SPRING_GENTLE } from '@/lib/motion'
import { posterShowcaseItems } from '@/lib/posterShowcase'

interface PosterShowcaseProps {
  eyebrow: string
  title: ReactNode
  description: string
  primaryAction: ReactNode
  secondaryAction?: ReactNode
  footer?: ReactNode
  viewerLabel?: string
}

function PosterGlyph({ activeIndex }: { activeIndex: number }) {
  const glyphs = ['?', '!', '&', '★']
  return (
    <div
      aria-hidden="true"
      className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border text-lg font-black"
      style={{
        background: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.16)',
        color: 'rgba(255,255,255,0.94)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
      }}
    >
      {glyphs[activeIndex % glyphs.length]}
    </div>
  )
}

export function PosterShowcase({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  footer,
  viewerLabel,
}: PosterShowcaseProps) {
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const prefersReducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % posterShowcaseItems.length)
    }, 4800)
    return () => window.clearInterval(timer)
  }, [prefersReducedMotion])

  const activePoster = posterShowcaseItems[activeIndex]

  const stackedPosters = useMemo(
    () => posterShowcaseItems.filter((_, index) => index !== activeIndex).slice(0, 3),
    [activeIndex]
  )

  return (
    <section
      className="poster-page-shell relative overflow-hidden rounded-[32px] border px-5 py-6 md:px-8 md:py-8"
      style={{
        background: 'var(--gradient-stage)',
        borderColor: 'var(--color-border-strong)',
        boxShadow: 'var(--shadow-marquee)',
      }}
    >
      <div className="spotlight-orb spotlight-orb-left" />
      <div className="spotlight-orb spotlight-orb-right" />
      <div
        className="absolute inset-x-0 top-0 h-2"
        style={{ background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-2), var(--color-accent-3))' }}
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="ticket-chip">{eyebrow}</span>
            {viewerLabel ? (
              <span
                className="rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em]"
                style={{
                  borderColor: 'rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.74)',
                }}
              >
                {viewerLabel}
              </span>
            ) : null}
          </div>

          <div className="max-w-[34rem]">
            <h1
              className="font-display"
              style={{
                color: 'white',
                fontSize: isDesktop ? 'clamp(4.4rem, 7vw, 6.6rem)' : 'clamp(3.15rem, 18vw, 4.4rem)',
                lineHeight: 0.92,
                letterSpacing: '-0.04em',
                textWrap: 'balance',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.78)',
                fontSize: isDesktop ? '1.12rem' : '1rem',
                lineHeight: 1.6,
                marginTop: '1rem',
                maxWidth: '31rem',
              }}
            >
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {primaryAction}
            {secondaryAction}
          </div>

          {footer ? (
            <div
              className="marquee-panel max-w-[34rem] px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              {footer}
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[420px]">
          <div className="absolute inset-y-8 left-0 hidden w-24 rounded-full bg-white/6 blur-3xl lg:block" aria-hidden="true" />

          <div className="relative mx-auto flex max-w-[450px] items-center justify-center lg:justify-end">
            <div className="relative h-[420px] w-full max-w-[320px]">
              {stackedPosters.map((poster, index) => (
                <motion.button
                  key={poster.id}
                  type="button"
                  onClick={() => setActiveIndex(posterShowcaseItems.findIndex((item) => item.id === poster.id))}
                  className="absolute right-0 top-0 hidden w-[208px] overflow-hidden rounded-[24px] border text-left md:block"
                  style={{
                    transform: `translate(${(index + 1) * 22}px, ${(index + 1) * 24}px) rotate(${(index + 1) * 5}deg)`,
                    background: poster.palette.background,
                    borderColor: 'rgba(255,255,255,0.14)',
                    boxShadow: '0 20px 50px rgba(5, 2, 8, 0.35)',
                    zIndex: 5 - index,
                  }}
                  whileHover={prefersReducedMotion ? undefined : { y: -6, rotate: 0 }}
                  transition={SPRING_GENTLE}
                  aria-label={`Show ${poster.title}`}
                >
                  <div className="px-4 pb-4 pt-5">
                    <p className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Coming up
                    </p>
                    <p className="mt-2 font-display text-[1.5rem] leading-[0.95]" style={{ color: poster.palette.text }}>
                      {poster.title}
                    </p>
                  </div>
                </motion.button>
              ))}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePoster.id}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, rotate: -2, scale: 0.98 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0, scale: 1 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, rotate: 2, scale: 0.98 }}
                  transition={SPRING_GENTLE}
                  className="poster-surface relative h-full overflow-hidden rounded-[28px] border p-5"
                  style={{
                    background: activePoster.palette.background,
                    borderColor: 'rgba(255,255,255,0.18)',
                    boxShadow: `0 28px 70px rgba(4, 4, 10, 0.42), 0 0 0 1px ${activePoster.palette.glow}`,
                  }}
                >
                  <PosterGlyph activeIndex={activeIndex} />

                  <div
                    className="absolute inset-x-4 top-4 h-28 rounded-full blur-3xl"
                    style={{ background: activePoster.palette.glow }}
                    aria-hidden="true"
                  />

                  <div className="relative flex h-full flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {activePoster.badges.map((badge) => (
                          <Badge
                            key={badge}
                            variant="default"
                            size="sm"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              color: 'rgba(255,255,255,0.84)',
                              border: '1px solid rgba(255,255,255,0.12)',
                            }}
                          >
                            {badge}
                          </Badge>
                        ))}
                      </div>

                      <p
                        className="mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.28em]"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                      >
                        Now showing
                      </p>

                      <h2
                        className="mt-2 font-display"
                        style={{
                          color: activePoster.palette.text,
                          fontSize: isDesktop ? '3.4rem' : '2.85rem',
                          lineHeight: 0.9,
                          letterSpacing: '-0.05em',
                          textWrap: 'balance',
                        }}
                      >
                        {activePoster.title}
                      </h2>

                      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: activePoster.palette.accent }}>
                        {activePoster.crossover}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <p
                        className="max-w-[18rem]"
                        style={{
                          color: 'rgba(255,255,255,0.78)',
                          fontSize: '0.98rem',
                          lineHeight: 1.58,
                        }}
                      >
                        {activePoster.logline}
                      </p>

                      <div className="marquee-panel rounded-[22px] px-4 py-4">
                        <p className="text-[0.68rem] uppercase tracking-[0.22em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          Trailer tone
                        </p>
                        <p className="mt-2 font-semibold" style={{ color: 'white' }}>
                          {activePoster.tone}
                        </p>
                        <p className="mt-3 text-sm font-semibold" style={{ color: activePoster.palette.accent }}>
                          {activePoster.ctaLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {posterShowcaseItems.map((poster, index) => {
              const isActive = index === activeIndex
              return (
                <button
                  key={poster.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="min-w-[110px] rounded-[18px] border px-3 py-3 text-left transition-transform"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                    borderColor: isActive ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.12)',
                    color: 'white',
                    transform: isActive ? 'translateY(-3px)' : 'none',
                  }}
                  aria-pressed={isActive}
                >
                  <p className="font-display text-[1rem] leading-none">{poster.title.split(' in ')[0]}</p>
                  <p className="mt-2 text-[0.7rem] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.62)' }}>
                    {poster.title.includes(' in ') ? poster.title.split(' in ')[1] : 'Mashup'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
