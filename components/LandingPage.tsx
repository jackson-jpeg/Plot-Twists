'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignInButton } from '@clerk/nextjs'
import { analytics } from '@/lib/analytics'
import { MOTION, VARIANTS } from '@/lib/animations'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Button, Card, Badge, PageContainer, SectionHeader } from '@/components/ui'

const sceneExamples = [
  { scenario: 'Zombie apocalypse at the office', icon: 'zombie' },
  { scenario: 'Cooking show gone horribly wrong', icon: 'chef' },
  { scenario: 'Detectives accusing each other', icon: 'detective' },
]

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
            fontFamily: 'var(--font-handwritten)',
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

function SceneIcon({ type }: { type: string }) {
  const size = 28
  switch (type) {
    case 'zombie':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="12" r="1.5" fill="currentColor" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" />
          <path d="M9 18h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 18v2M16 18v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'chef':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          <ellipse cx="14" cy="8" rx="6" ry="5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="12" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 16h6M11 19h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'detective':
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
          <circle cx="12" cy="15" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16.5 19.5L22 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="15" r="2" fill="currentColor" opacity="0.2" />
        </svg>
      )
    default:
      return null
  }
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
        {/* Hero + Scene Previews (side-by-side on desktop) */}
        <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : undefined, gap: isDesktop ? '64px' : '0px', paddingTop: isDesktop ? '0' : '24px' }}>
          <div style={{ flex: isDesktop ? 1 : undefined, maxWidth: isDesktop ? '520px' : undefined }}>
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={MOTION.gentle}
              style={{ textAlign: isDesktop ? 'left' : 'center' }}
            >
              {/* Animated Theater Masks */}
              <motion.div
                variants={VARIANTS.drumRoll}
                initial="initial"
                animate="animate"
                style={{ display: 'inline-block' }}
              >
                <TheaterMasks />
              </motion.div>
              <h1
                className="font-display"
                style={{
                  fontSize: isDesktop ? '64px' : 'clamp(48px, 12vw, 56px)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  marginTop: '8px',
                }}
              >
                {isDesktop ? <>The improv game{'\n'}that writes itself</> : 'Plot Twists'}
              </h1>

              {/* Handwritten tagline */}
              <p
                style={{
                  fontFamily: 'var(--font-handwritten)',
                  fontSize: isDesktop ? '20px' : '17px',
                  color: 'var(--color-accent)',
                  marginTop: '6px',
                  transform: 'rotate(-2deg)',
                  display: 'inline-block',
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
                  maxWidth: isDesktop ? '420px' : undefined,
                }}
              >
                {isDesktop
                  ? 'Pick your cards. AI writes the script. You steal the show. The party game where everyone\'s a comedian.'
                  : 'The improv comedy game that writes itself — pick cards, get a script, steal the show.'}
              </p>

              {/* Scene Ticker — mobile only */}
              {!isDesktop && <SceneTicker />}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, ...MOTION.gentle }}
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
                    textAlign: 'left',
                  }}
                >
                  5 free scripts — no credit card needed
                </p>
              )}
            </motion.div>
          </div>

          {/* Scene Previews — desktop only */}
          {isDesktop && <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3"
            style={{
              flexDirection: 'column',
              flex: 1,
              maxWidth: '440px',
            }}
          >
            {sceneExamples.map((scene, i) => (
              <motion.div
                key={scene.icon}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, ...MOTION.gentle }}
                className="flex-1"
              >
                <Card
                  variant="elevated"
                  padding="none"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'var(--color-accent-light)',
                      borderRadius: '12px',
                      color: 'var(--color-text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <SceneIcon type={scene.icon} />
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '15px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.4',
                      textAlign: 'left',
                      fontWeight: 500,
                    }}
                  >
                    {scene.scenario}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: '36px', padding: '0 4px', maxWidth: isDesktop ? '720px' : undefined, margin: isDesktop ? '48px auto 0' : undefined }}
        >
          <div style={{ marginBottom: '20px' }}>
            <SectionHeader title="How it works" align="center" />
          </div>
          {isDesktop ? (
            <div className="flex gap-4" style={{ position: 'relative', alignItems: 'flex-start' }}>
              {[
                { num: '1', title: 'Pick cards', desc: 'Character + setting + twist' },
                { num: '2', title: 'AI writes', desc: 'Custom script in seconds' },
                { num: '3', title: 'Perform', desc: 'Act it out, crown MVP' },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.08, ...MOTION.gentle }}
                  className="flex-1 text-center"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'relative' }}
                >
                  {/* Connecting line to next step */}
                  {i < 2 && (
                    <svg
                      style={{
                        position: 'absolute',
                        top: '18px',
                        left: 'calc(50% + 24px)',
                        width: 'calc(100% - 48px)',
                        height: '2px',
                        overflow: 'visible',
                        pointerEvents: 'none',
                      }}
                      aria-hidden="true"
                    >
                      <line
                        x1="0"
                        y1="1"
                        x2="100%"
                        y2="1"
                        stroke="var(--color-border)"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                      />
                    </svg>
                  )}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '18px',
                      background: 'var(--color-text-primary)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <span
                      className="font-display"
                      style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-bg)' }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {step.title}
                  </p>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--color-text-tertiary)', lineHeight: '16px' }}>
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5" style={{ padding: '0 4px' }}>
              {[
                { num: '1', bg: 'var(--color-highlight-blue, #EEF0F8)', color: 'var(--color-accent-2, #5B6AA0)', title: 'Pick your cards', desc: 'Choose a character, setting, and wild card from the deck.' },
                { num: '2', bg: 'var(--color-success-bg, #E8F5E9)', color: 'var(--color-success, #4CAF50)', title: 'AI writes the script', desc: 'Claude crafts a hilarious scene from everyone\u2019s choices.' },
                { num: '3', bg: 'var(--color-success-bg, #F0F5E5)', color: 'var(--color-success, #7CB342)', title: 'Perform and vote', desc: 'Act it out live, then vote for the MVP of the scene.' },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.08, ...MOTION.gentle }}
                >
                  <Card variant="elevated" padding="md" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '20px',
                        background: step.bg,
                      }}
                    >
                      <span
                        className="font-display"
                        style={{ fontSize: '16px', fontWeight: 700, color: step.color }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                        {step.title}
                      </p>
                      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '14px', color: 'var(--color-text-tertiary)', lineHeight: '20px' }}>
                        {step.desc}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Social Proof — now shows on both mobile and desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex justify-center gap-2 flex-wrap"
          style={{ marginTop: '32px' }}
        >
          {['Party Game', 'AI-Powered', 'Free to Start'].map((label) => (
            <Badge key={label} variant="default" size="md" style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
              {label}
            </Badge>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  )
}
