'use client'

import { motion } from 'framer-motion'
import { SignInButton } from '@clerk/nextjs'
import { analytics } from '@/lib/analytics'
import { SPRING_GENTLE } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Button } from '@/components/ui'
import { HomepagePosterShowcase } from '@/components/HomepagePosterShowcase'

export function LandingPage() {
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-void)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        className="w-full mx-auto"
        style={{ maxWidth: isDesktop ? '1100px' : '448px', width: '100%', padding: isDesktop ? '0 24px' : '0 20px' }}
      >
        {/* ── Hero: Reely + Title ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={SPRING_GENTLE}
          style={{
            position: 'relative',
            textAlign: 'center',
            paddingTop: isDesktop ? '48px' : '32px',
            paddingBottom: isDesktop ? '24px' : '16px',
            overflow: 'visible',
          }}
        >
          {/* Title block with Reely characters around it */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Reely sitting on top of the title — desktop only */}
            {isDesktop && (
              <motion.img
                src="/mascot/reely-sitting.png"
                alt=""
                initial={{ opacity: 0, y: 30, rotate: -5 }}
                animate={{
                  opacity: 1,
                  y: [0, -6, 0],
                  rotate: [-2, 2, -2],
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.3 },
                  y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 },
                  rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 },
                }}
                style={{
                  position: 'absolute',
                  width: '80px',
                  top: '-52px',
                  left: '52%',
                  marginLeft: '-40px',
                  zIndex: 2,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))',
                }}
              />
            )}

            {/* Mobile: Reely hero centered above title */}
            {!isDesktop && (
              <motion.img
                src="/mascot/reely-hero.png"
                alt="Reely mascot"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -8, 0],
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.2 },
                  scale: { duration: 0.5, delay: 0.2 },
                  y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 },
                }}
                style={{
                  width: '120px',
                  margin: '0 auto 12px',
                  display: 'block',
                  filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))',
                }}
              />
            )}

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: isDesktop ? '72px' : '42px',
                fontWeight: 400,
                color: '#f0ece4',
                letterSpacing: '0.03em',
                lineHeight: 1,
                margin: 0,
                textTransform: 'uppercase',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Plot Twists
            </h1>

            {/* Reely peeking from the left — desktop only */}
            {isDesktop && (
              <motion.img
                src="/mascot/reely-peek.png"
                alt=""
                initial={{ opacity: 0, x: -30 }}
                animate={{
                  opacity: 1,
                  x: [0, 5, 0],
                  y: [0, -4, 0],
                  rotate: [0, -3, 0],
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.5 },
                  x: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                  y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                  rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                }}
                style={{
                  position: 'absolute',
                  width: '70px',
                  bottom: '-8px',
                  left: '-55px',
                  zIndex: 3,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))',
                }}
              />
            )}

            {/* Reely waving on the right — desktop only */}
            {isDesktop && (
              <motion.img
                src="/mascot/reely-wave.png"
                alt=""
                initial={{ opacity: 0, x: 30 }}
                animate={{
                  opacity: 1,
                  x: [0, -4, 0],
                  y: [0, -6, 0],
                  rotate: [0, 4, 0],
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.7 },
                  x: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.7 },
                  y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 },
                  rotate: { duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.7 },
                }}
                style={{
                  position: 'absolute',
                  width: '70px',
                  bottom: '-8px',
                  right: '-55px',
                  zIndex: 3,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))',
                }}
              />
            )}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: isDesktop ? '16px' : '14px',
              fontStyle: 'italic',
              color: 'rgba(240,236,228,0.45)',
              marginTop: isDesktop ? '12px' : '8px',
              letterSpacing: '0.08em',
            }}
          >
            The AI improv party game
          </p>

          {/* How it works — inline under tagline */}
          <div
            style={{
              marginTop: isDesktop ? '20px' : '14px',
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
              gap: isDesktop ? '24px' : '4px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {[
              'Pick the crossover',
              'AI writes the scene',
              'Perform it live',
            ].map((step, i) => (
              <p
                key={i}
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: isDesktop ? '14px' : '13px',
                  color: 'rgba(240,236,228,0.35)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isDesktop && i > 0 && (
                  <span style={{ color: 'rgba(201,162,77,0.25)' }}>·</span>
                )}
                {step}
              </p>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: isDesktop ? '28px' : '20px' }}>
            <SignInButton mode="redirect">
              <Button
                variant="primary"
                size="lg"
                fullWidth={!isDesktop}
                onClick={() => analytics.landingCtaClicked('clerk')}
                style={isDesktop ? { padding: '16px 48px' } : undefined}
              >
                Get Tickets
              </Button>
            </SignInButton>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '12px',
                color: 'rgba(240,236,228,0.2)',
                marginTop: '10px',
                letterSpacing: '0.04em',
              }}
            >
              Free · No signup · Any device
            </p>
          </div>
        </motion.div>

        {/* Poster Showcase — below the hero */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={SPRING_GENTLE}
          style={{ marginTop: isDesktop ? '16px' : '8px' }}
        >
          <HomepagePosterShowcase />
        </motion.div>

        {/* Bottom spacer */}
        <div style={{ height: isDesktop ? '40px' : '32px' }} />
      </div>
    </div>
  )
}
