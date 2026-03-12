'use client'

import { motion } from 'framer-motion'
import { SignInButton } from '@clerk/nextjs'
import { analytics } from '@/lib/analytics'
import { SPRING_GENTLE } from '@/lib/motion'
import { PosterShowcase } from '@/components/PosterShowcase'
import { Button, Card, PageContainer } from '@/components/ui'

const hypeRows = [
  {
    title: 'Make the fantasy obvious',
    description: 'Sample crossover posters show the exact kind of scenes your group can generate before anyone reads a paragraph.',
  },
  {
    title: 'Host in seconds',
    description: 'Spin up a room, throw a QR on screen, and get a cast assembled before the joke has time to cool off.',
  },
  {
    title: 'Perform like a show',
    description: 'The script lands, the teleprompter kicks in, and everyone gets their box-office reveal at the end.',
  },
]

export function LandingPage() {
  return (
    <PageContainer
      size="full"
      style={{
        padding: 'calc(20px + env(safe-area-inset-top, 0px)) 16px calc(40px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
        <PosterShowcase
          eyebrow="Now showing"
          title={<>Mash up worlds. Perform the trailer.</>}
          description="Plot Twists turns impossible crossover ideas into playable comedy scenes. Pick the ingredients, let the AI write the madness, and put your cast on stage."
          primaryAction={(
            <SignInButton mode="redirect">
              <Button
                variant="primary"
                size="lg"
                onClick={() => analytics.landingCtaClicked('clerk')}
              >
                Start the show
              </Button>
            </SignInButton>
          )}
          secondaryAction={(
            <div
              className="flex items-center rounded-[18px] border px-4 py-3"
              style={{
                borderColor: 'rgba(255,255,255,0.16)',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.84)',
              }}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.16em]">
                5 free scripts to start
              </span>
            </div>
          )}
          footer={(
            <div className="flex flex-wrap gap-3 text-sm">
              <span style={{ color: 'white', fontWeight: 700 }}>How it works:</span>
              <span style={{ color: 'rgba(255,255,255,0.72)' }}>Pick cards</span>
              <span style={{ color: 'rgba(255,255,255,0.46)' }}>•</span>
              <span style={{ color: 'rgba(255,255,255,0.72)' }}>AI writes the scene</span>
              <span style={{ color: 'rgba(255,255,255,0.46)' }}>•</span>
              <span style={{ color: 'rgba(255,255,255,0.72)' }}>Perform and vote</span>
            </div>
          )}
        />

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_GENTLE, delay: 0.12 }}
          >
            <Card
              variant="elevated"
              className="h-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(255,244,234,0.88) 100%)',
              }}
            >
              <p
                className="text-[0.74rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: 'var(--color-accent)' }}
              >
                Why it lands
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {hypeRows.map((row) => (
                  <div
                    key={row.title}
                    className="rounded-[20px] border p-4"
                    style={{
                      background: 'rgba(255,255,255,0.72)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <h2 style={{ fontSize: '1.35rem', color: 'var(--color-text-primary)' }}>{row.title}</h2>
                    <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {row.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_GENTLE, delay: 0.18 }}
          >
            <Card
              variant="elevated"
              className="h-full"
              style={{
                background: 'linear-gradient(180deg, #2c0714 0%, #1a0f31 100%)',
                color: 'white',
              }}
            >
              <p
                className="text-[0.74rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: 'rgba(255,255,255,0.68)' }}
              >
                Tonight&apos;s format
              </p>
              <ol className="mt-4 flex list-none flex-col gap-4">
                {[
                  'Choose a character, setting, and twist.',
                  'Watch the poster and title materialize.',
                  'Perform live, then crown the MVP.',
                ].map((step, index) => (
                  <li
                    key={step}
                    className="rounded-[20px] border px-4 py-4"
                    style={{
                      borderColor: 'rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em]" style={{ color: 'rgba(255,255,255,0.54)' }}>
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: 'white' }}>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  )
}
