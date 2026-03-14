'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignInButton } from '@clerk/nextjs'
import { analytics } from '@/lib/analytics'
import { SPRING_GENTLE, SPRING_BOUNCY } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Button, Card, PageContainer, SectionHeader } from '@/components/ui'
import { HomepagePosterShowcase } from '@/components/HomepagePosterShowcase'

const tickerScenes = [
  'A pirate captain... at a job interview... who can only speak in questions',
  'A dramatic soap opera doctor... at a fast food drive-thru... with a secret identity',
  'A overly enthusiastic gym teacher... on a first date... who narrates everything',
  'A Shakespearean villain... at IKEA... who keeps breaking character',
  'A nervous astronaut... at a talent show... who communicates through interpretive dance',
  'A conspiracy theorist grandma... at a cooking competition... who rhymes every sentence',
]

function SceneTicker() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % tickerScenes.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ height: '60px', position: 'relative', overflow: 'hidden', marginTop: '16px' }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            color: 'var(--color-accent)',
            lineHeight: 1.4,
            textAlign: 'center',
            padding: '0 8px',
          }}
        >
          &ldquo;{tickerScenes[index]}&rdquo;
        </motion.p>
      </AnimatePresence>
    </div>
  )
}


function TheaterMasks() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="16" cy="24" r="13" stroke="var(--color-text-primary)" strokeWidth="2" />
      <circle cx="12" cy="22" r="1.5" fill="var(--color-text-primary)" />
      <circle cx="20" cy="22" r="1.5" fill="var(--color-text-primary)" />
      <path d="M11 28q5 4 10 0" stroke="var(--color-text-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="24" r="13" stroke="var(--color-text-primary)" strokeWidth="2" />
      <circle cx="28" cy="22" r="1.5" fill="var(--color-text-primary)" />
      <circle cx="36" cy="22" r="1.5" fill="var(--color-text-primary)" />
      <path d="M27 28q5-4 10 0" stroke="var(--color-text-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function LandingPage() {
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  return (
    <PageContainer size="wide" centered style={{ padding: isDesktop ? undefined : '24px 20px' }}>
      <div className="w-full mx-auto" style={{ maxWidth: isDesktop ? '1100px' : '448px' }}>
        <div style={{ paddingTop: isDesktop ? '0' : '24px' }}>
          <div style={{ maxWidth: isDesktop ? '720px' : undefined, margin: isDesktop ? '0 auto' : undefined }}>
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_GENTLE}
              style={{ textAlign: 'center' }}
            >
              {/* Animated Theater Masks */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING_BOUNCY}
                style={{ display: 'inline-block' }}
              >
                <TheaterMasks />
              </motion.div>
              <h1
                className="font-display"
                style={{
                  fontSize: isDesktop ? '72px' : 'clamp(46px, 12vw, 56px)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  marginTop: '8px',
                }}
              >
                {isDesktop ? <>Movie-night chaos{'\n'}for people who perform</> : 'Plot Twists'}
              </h1>

              {/* Handwritten tagline */}
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: isDesktop ? '20px' : '17px',
                  color: 'var(--color-accent)',
                  fontWeight: 500,
                  marginTop: '6px',
                }}
              >
                where everyone&rsquo;s a star
              </p>

              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: isDesktop ? '19px' : '16px',
                  color: 'var(--color-text-tertiary)',
                  lineHeight: 1.5,
                  marginTop: isDesktop ? '16px' : '8px',
                  maxWidth: '580px',
                  marginInline: 'auto',
                }}
              >
                {isDesktop
                  ? 'Pick the crossover. Let AI write the scene. Then perform it like your living room just became opening night.'
                  : 'Pick the crossover. Get the script. Perform it live.'}
              </p>

              {/* Scene Ticker — mobile only */}
              {!isDesktop && <SceneTicker />}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, ...SPRING_GENTLE }}
              style={{ marginTop: '32px', padding: isDesktop ? '0' : '0 4px' }}
            >
              <div style={{ display: 'flex', gap: '12px', flexDirection: isDesktop ? 'row' : 'column' }}>
                <SignInButton mode="redirect">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth={!isDesktop}
                    onClick={() => analytics.landingCtaClicked('clerk')}
                    style={isDesktop ? { padding: '16px 36px' } : undefined}
                  >
                    Get Started
                  </Button>
                </SignInButton>
              </div>
              {isDesktop && (
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-tertiary)',
                    marginTop: '10px',
                    textAlign: 'center',
                  }}
                >
                  5 free scripts — no credit card needed
                </p>
              )}
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, ...SPRING_GENTLE }}
          style={{ marginTop: isDesktop ? '40px' : '28px' }}
        >
          <HomepagePosterShowcase />
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: isDesktop ? '48px' : '36px', padding: '0 4px', maxWidth: isDesktop ? '960px' : undefined, marginInline: isDesktop ? 'auto' : undefined }}
        >
          <div style={{ marginBottom: '24px' }}>
            <SectionHeader title="How it works" align="center" />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr',
              gap: isDesktop ? '20px' : '16px',
            }}
          >
            {/* Step 1: Pick your cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, ...SPRING_GENTLE }}
            >
              <Card variant="elevated" padding="none" style={{ overflow: 'hidden' }}>
                {/* Visual: fanned cards */}
                <div
                  style={{
                    minHeight: '160px',
                    background: 'var(--color-surface)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Card 1 — character */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '90px',
                      height: '120px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #7b2d8e, #e94560)',
                      transform: 'rotate(-8deg) translateX(-36px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '8px',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>
                      A pirate captain
                    </span>
                  </div>
                  {/* Card 2 — setting */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '90px',
                      height: '120px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #264653, #2a9d8f)',
                      transform: 'rotate(0deg)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '8px',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>
                      At a job interview
                    </span>
                  </div>
                  {/* Card 3 — wild card */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '90px',
                      height: '120px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #e76f51, #f4a261)',
                      transform: 'rotate(8deg) translateX(36px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '8px',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>
                      Who only speaks in questions
                    </span>
                  </div>
                </div>
                <div style={{ padding: '16px 20px 20px' }}>
                  <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    1. Pick your cards
                  </p>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
                    Choose a character, setting, and wild card from the deck.
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Step 2: AI writes the script */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.63, ...SPRING_GENTLE }}
            >
              <Card variant="elevated" padding="none" style={{ overflow: 'hidden' }}>
                {/* Visual: mini screenplay */}
                <div
                  style={{
                    minHeight: '160px',
                    background: 'var(--color-surface)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--color-bg)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      border: '1px solid var(--color-border)',
                      width: '100%',
                    }}
                  >
                    <p className="font-mono" style={{ fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>
                      CAPTAIN HOOK
                    </p>
                    <p className="font-mono" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginBottom: '4px' }}>
                      (nervously adjusting tie)
                    </p>
                    <p className="font-mono" style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
                      So, tell me about your five-year plan.
                    </p>
                    <p className="font-mono" style={{ fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>
                      INTERVIEWER
                    </p>
                    <p className="font-mono" style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      Sir, you literally have a hook for a hand.
                    </p>
                  </div>
                </div>
                <div style={{ padding: '16px 20px 20px' }}>
                  <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    2. AI writes the script
                  </p>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
                    Claude crafts a hilarious scene from everyone&rsquo;s choices.
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Step 3: Perform & vote */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.71, ...SPRING_GENTLE }}
            >
              <Card variant="elevated" padding="none" style={{ overflow: 'hidden' }}>
                {/* Visual: crown + MVP + vote button */}
                <div
                  style={{
                    minHeight: '160px',
                    background: 'var(--color-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  {/* Crown SVG */}
                  <svg width="48" height="36" viewBox="0 0 48 36" fill="none" aria-hidden="true">
                    <path
                      d="M4 28L8 10L18 20L24 6L30 20L40 10L44 28H4Z"
                      fill="url(#crownGrad)"
                      stroke="rgba(255,200,60,0.6)"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle cx="8" cy="10" r="3" fill="#f4a261" />
                    <circle cx="24" cy="6" r="3" fill="#e76f51" />
                    <circle cx="40" cy="10" r="3" fill="#f4a261" />
                    <defs>
                      <linearGradient id="crownGrad" x1="4" y1="6" x2="44" y2="28" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f9c74f" />
                        <stop offset="1" stopColor="#f4a261" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span
                    className="font-display"
                    style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
                  >
                    MVP
                  </span>
                  {/* Stylized vote button */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    {['⭐', '⭐⭐', '⭐⭐⭐'].map((stars, i) => (
                      <div
                        key={i}
                        style={{
                          background: i === 2 ? 'var(--color-accent)' : 'var(--color-surface-raised, var(--color-border))',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          opacity: i === 2 ? 1 : 0.5,
                          border: i === 2 ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
                        {stars}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '16px 20px 20px' }}>
                  <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    3. Perform &amp; vote
                  </p>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
                    Act it out live, then vote for the MVP of the scene.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  )
}
