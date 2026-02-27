'use client'

import { motion } from 'framer-motion'
import { SignInButton } from '@clerk/nextjs'
import { analytics } from '@/lib/analytics'
import { MOTION } from '@/lib/animations'

const sceneExamples = [
  { scenario: 'Zombie apocalypse at the office', icon: 'zombie' },
  { scenario: 'Cooking show gone horribly wrong', icon: 'chef' },
  { scenario: 'Detectives accusing each other', icon: 'detective' },
]

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
  return (
    <main className="page-container items-center justify-center">
      <div className="container max-w-md">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.gentle}
          className="text-center"
          style={{ paddingTop: '24px' }}
        >
          <TheaterMasks />
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(48px, 12vw, 56px)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              marginTop: '8px',
            }}
          >
            Plot Twists
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '16px',
              color: 'var(--color-text-tertiary)',
              lineHeight: 1.5,
              marginTop: '8px',
            }}
          >
            AI writes the comedy. You bring the chaos.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, ...MOTION.gentle }}
          style={{ marginTop: '32px', padding: '0 4px' }}
        >
          <SignInButton mode="redirect">
            <motion.button
              onClick={() => analytics.landingCtaClicked('clerk')}
              className="w-full"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '17px',
                fontWeight: 600,
                padding: '16px 24px',
                cursor: 'pointer',
              }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.button>
          </SignInButton>
          <p
            className="text-center"
            style={{
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
              marginTop: '10px',
            }}
          >
            5 free scripts — no credit card needed
          </p>
        </motion.div>

        {/* Scene Previews */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
          style={{ marginTop: '36px', padding: '0 4px' }}
        >
          {sceneExamples.map((scene, i) => (
            <motion.div
              key={scene.icon}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, ...MOTION.gentle }}
              className="flex-1"
              style={{
                background: 'var(--color-surface)',
                borderRadius: '10px',
                padding: '14px 10px 12px',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'var(--color-accent-light)',
                  borderRadius: '6px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}
              >
                <SceneIcon type={scene.icon} />
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '16px',
                  textAlign: 'center',
                }}
              >
                {scene.scenario}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: '36px', padding: '0 4px' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            How it works
          </p>
          <div className="flex gap-4">
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
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '18px',
                    background: 'var(--color-text-primary)',
                  }}
                >
                  <span
                    className="font-display"
                    style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-bg)' }}
                  >
                    {step.num}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '12px',
                    color: 'var(--color-text-tertiary)',
                    lineHeight: '16px',
                  }}
                >
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex justify-center gap-2 flex-wrap"
          style={{ marginTop: '32px' }}
        >
          {['Party Game', 'AI-Powered', 'Free to Start'].map((label) => (
            <span
              key={label}
              style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </main>
  )
}
