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
        {/* Marquee Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_GENTLE}
          style={{
            textAlign: 'center',
            paddingTop: isDesktop ? '32px' : '24px',
            paddingBottom: isDesktop ? '20px' : '16px',
            position: 'relative',
          }}
        >
          {/* Chase light strip */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-20px',
              right: '-20px',
              height: '6px',
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent 0px, transparent 14px, rgba(201,162,77,0.15) 14px, rgba(201,162,77,0.15) 18px)',
              backgroundSize: '200px 6px',
              animation: 'marqueeChase 3s linear infinite',
            }}
          />

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: isDesktop ? '36px' : '32px',
              fontWeight: 400,
              color: '#f0ece4',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            PlotSlop
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: isDesktop ? '15px' : '13px',
              fontStyle: 'italic',
              color: 'rgba(240,236,228,0.45)',
              marginTop: '6px',
              letterSpacing: '0.08em',
            }}
          >
            Now Showing
          </p>
        </motion.div>

        {/* Poster Showcase — the hero */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, ...SPRING_GENTLE }}
        >
          <HomepagePosterShowcase />
        </motion.div>

        {/* How it works — minimal 3-line version */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, ...SPRING_GENTLE }}
          style={{
            marginTop: isDesktop ? '28px' : '20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            gap: isDesktop ? '32px' : '8px',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 8px',
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
                color: 'rgba(240,236,228,0.4)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isDesktop && i > 0 && (
                <span style={{ color: 'rgba(201,162,77,0.3)' }}>·</span>
              )}
              {step}
            </p>
          ))}
        </motion.div>

        {/* CTA — ticket booth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, ...SPRING_GENTLE }}
          style={{
            marginTop: isDesktop ? '32px' : '24px',
            marginBottom: isDesktop ? '40px' : '32px',
            background: 'var(--color-ink)',
            borderTop: '2px dashed rgba(255,255,255,0.03)',
            padding: isDesktop ? '28px 32px' : '24px 20px',
            borderRadius: '0 0 12px 12px',
            textAlign: 'center',
          }}
        >
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
              color: 'rgba(240,236,228,0.25)',
              marginTop: '12px',
              letterSpacing: '0.04em',
            }}
          >
            Free · No signup · Any device
          </p>
        </motion.div>
      </div>

      {/* Chase light keyframes */}
      <style>{`
        @keyframes marqueeChase {
          from { background-position: 0 0; }
          to   { background-position: 200px 0; }
        }
      `}</style>
    </div>
  )
}
