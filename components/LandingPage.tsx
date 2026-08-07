'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SignInButton } from '@clerk/nextjs'
import { analytics } from '@/lib/analytics'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { LiveScriptDemo } from '@/components/LiveScriptDemo'
import { ALL_MODES_PLAYER_RANGE_LABEL } from '@/lib/playerCounts'
import { EASE_CAMERA, DUR } from '@/lib/motion'

/**
 * The landing page is a studio pitch, not a marquee (design/NORTH-STAR.md,
 * homepage direction). One star: a single rotating one-sheet. One accent:
 * stage gold. Body copy is sentence case — uppercase tracking is reserved for
 * the billing kicker and the credits line.
 */

export function LandingPage() {
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'
  const reducedMotion = useReducedMotion()

  // The near-white strip bug: body is --color-bg and any dark route with
  // bottom padding on <main> shows it through. Scoped fix with cleanup.
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#08070b'
    return () => {
      document.body.style.background = prev
    }
  }, [])

  const fadeUp = (delay: number) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: { duration: DUR.slower, delay, ease: EASE_CAMERA },
  })

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-void)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isDesktop ? '48px 32px 96px' : '40px 24px 72px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 440px' : '1fr',
          alignItems: 'center',
          gap: isDesktop ? '72px' : '48px',
        }}
      >
        {/* ---- The pitch ---- */}
        <div style={{ textAlign: isDesktop ? 'left' : 'center' }}>
          <motion.p
            {...fadeUp(0)}
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-stage-gold)',
              margin: 0,
            }}
          >
            Written live, performed by you
          </motion.p>

          <motion.h1
            {...fadeUp(0.08)}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: isDesktop ? 'clamp(44px, 4.6vw, 60px)' : 'clamp(36px, 10vw, 44px)',
              fontWeight: 400,
              lineHeight: 1.04,
              letterSpacing: '-0.015em',
              color: '#f0ece4',
              margin: '18px 0 0',
            }}
          >
            Tonight&rsquo;s feature doesn&rsquo;t exist yet.
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: isDesktop ? '17px' : '15px',
              lineHeight: 1.6,
              color: 'rgba(240,236,228,0.62)',
              margin: isDesktop ? '20px 0 0' : '20px auto 0',
              maxWidth: '46ch',
            }}
          >
            Pick an impossible cast. An AI writes the scene while you watch.
            You and your friends perform it before it cools.
          </motion.p>

          <motion.div
            {...fadeUp(0.24)}
            style={{
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: 'center',
              gap: isDesktop ? '24px' : '16px',
              marginTop: '32px',
              justifyContent: isDesktop ? 'flex-start' : 'center',
            }}
          >
            <SignInButton mode="redirect">
              <button
                onClick={() => analytics.landingCtaClicked('clerk')}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  fontWeight: 650,
                  color: '#120f08',
                  background: 'var(--color-stage-gold)',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
                  padding: '15px 34px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 28px rgba(201,162,77,0.28)',
                  transition: 'transform 150ms var(--easing-out), box-shadow 150ms var(--easing-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 12px 34px rgba(201,162,77,0.36)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,162,77,0.28)'
                }}
              >
                Host tonight&rsquo;s show
              </button>
            </SignInButton>

            <Link
              href="/join"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'rgba(240,236,228,0.55)',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(240,236,228,0.22)',
                paddingBottom: '2px',
              }}
            >
              Have a room code? Join the cast
            </Link>
          </motion.div>

          <motion.p
            {...fadeUp(0.32)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'rgba(240,236,228,0.58)',
              margin: '18px 0 0',
            }}
          >
            Free · players never sign up · any phone is a script
          </motion.p>

          <motion.p
            {...fadeUp(0.4)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'rgba(240,236,228,0.55)',
              margin: '28px 0 0',
              maxWidth: isDesktop ? '46ch' : '100%',
            }}
          >
            No rehearsal, no talent required, {ALL_MODES_PLAYER_RANGE_LABEL}{' '}
            performers. Somebody wins an award.
          </motion.p>
        </div>

        {/* ---- The demo IS the hero: a scene writing itself ---- */}
        <motion.div
          {...fadeUp(0.2)}
          style={{
            width: '100%',
            maxWidth: isDesktop ? '440px' : '520px',
            margin: '0 auto',
          }}
        >
          <LiveScriptDemo />
        </motion.div>
      </div>
    </div>
  )
}
