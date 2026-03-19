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
            {/* Reely sitting on top of the "O" — desktop only */}
            {isDesktop && (
              <motion.img
                src="/mascot/reely-sitting.png"
                alt=""
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING_GENTLE, delay: 0.3 }}
                style={{
                  position: 'absolute',
                  width: '90px',
                  top: '-62px',
                  left: '52%',
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Mobile: Reely hero centered above title */}
            {!isDesktop && (
              <motion.img
                src="/mascot/reely-hero.png"
                alt="Reely mascot"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...SPRING_GENTLE, delay: 0.2 }}
                style={{
                  width: '120px',
                  margin: '0 auto 12px',
                  display: 'block',
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING_GENTLE, delay: 0.5 }}
                style={{
                  position: 'absolute',
                  width: '80px',
                  bottom: '-10px',
                  left: '-60px',
                  zIndex: 3,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Reely walking on the right — desktop only */}
            {isDesktop && (
              <motion.img
                src="/mascot/reely-wave.png"
                alt=""
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING_GENTLE, delay: 0.7 }}
                style={{
                  position: 'absolute',
                  width: '75px',
                  bottom: '-18px',
                  right: '-55px',
                  zIndex: 3,
                  pointerEvents: 'none',
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
