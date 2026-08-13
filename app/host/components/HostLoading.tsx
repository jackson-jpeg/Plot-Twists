'use client'

import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SPRING_GENTLE, ENTER_Y, EASE_CAMERA, DUR } from '@/lib/motion'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { RetryIcon, WarningIcon } from '@/components/GameIcons'
import { Button } from '@/components/ui'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { useAudienceStore } from '@/stores/audienceStore'

/**
 * The loading screen is the one-sheet being typeset (NORTH-STAR: the poster
 * is the sacred object; the wait should feel like a title sequence, not a
 * spinner). Progress renders as the poster completing: title streams into the
 * center, and the production credits materialize line by line in the billing
 * block. Single accent on this surface: stage red — the typewriter ribbon.
 */

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`

function getStepStatus(progress: number): [string, string, string] {
  if (progress >= 80) return ['done', 'done', 'active']
  if (progress >= 30) return ['done', 'active', 'pending']
  return ['active', 'pending', 'pending']
}

// Billing-block credit lines: what fills in as the production comes together.
const steps = [
  { label: 'Casting', done: 'locked' },
  { label: 'Staging', done: 'built' },
  { label: 'Screenplay', done: 'typing' },
]

export interface HostLoadingProps {
  onRetry: () => void
  onBackToLobby: () => void
}

export function HostLoading({ onRetry, onBackToLobby }: HostLoadingProps) {
  const prefersReducedMotion = useReducedMotion()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  const settings = useGameStore((s) => s.settings)
  const loadingProgress = useScriptStore((s) => s.generationProgress)
  const scriptTitlePreview = useScriptStore((s) => s.titlePreview)
  const scriptGenerationTimedOut = useScriptStore((s) => s.generationTimedOut)
  const greenRoomQuestion = useAudienceStore((s) => s.greenRoomQuestion)

  const stepStatuses = getStepStatus(loadingProgress)

  const cursor = (size: string) => (
    <motion.span
      animate={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: [1, 1, 0, 0] }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : { duration: 1, repeat: Infinity, times: [0, 0.49, 0.5, 1], ease: 'linear' }
      }
      style={{ color: 'var(--color-stage-red)', fontSize: size, marginLeft: 2 }}
    >
      |
    </motion.span>
  )

  return (
    <motion.div
      key="loading"
      {...ENTER_Y}
      exit={{ opacity: 0, y: -10 }}
      transition={SPRING_GENTLE}
      className="min-h-screen w-full flex flex-col items-center justify-center px-5 py-10"
      style={{
        background: 'var(--color-void)',
        color: 'var(--color-theater-text)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <h1 className="sr-only">Writing your scene</h1>
      <div
        className="w-full flex flex-col items-center"
        style={{ maxWidth: isDesktop ? '400px' : '300px' }}
      >
        {/* ---- The one-sheet, being typeset ---- */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.985 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: DUR.slower, delay: 0.1, ease: EASE_CAMERA }}
          style={{
            width: '100%',
            background: 'linear-gradient(180deg, var(--color-cream) 0%, var(--color-paper) 100%)',
            borderRadius: '8px',
            boxShadow:
              '0 24px 60px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#1a1812',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: GRAIN,
              backgroundSize: '240px 240px',
              opacity: 0.08,
              mixBlendMode: 'multiply',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(0,0,0,0.1) 100%)',
            }}
          />

          {/* Title — streams in as it is written */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '44px 9% 30px',
              minHeight: '150px',
            }}
          >
            <AnimatePresence>
              {scriptTitlePreview ? (
                <motion.p
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, filter: 'blur(20px)', scale: 0.97 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, filter: 'blur(0px)', scale: 1 }
                  }
                  transition={{ duration: DUR.sceneLong, ease: EASE_CAMERA }}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: isDesktop ? '32px' : '27px',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    letterSpacing: '-0.01em',
                    margin: 0,
                    textWrap: 'balance',
                  }}
                >
                  {scriptTitlePreview}
                  {cursor(isDesktop ? '32px' : '27px')}
                </motion.p>
              ) : (
                <p
                  aria-label="Writing the title"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: isDesktop ? '30px' : '26px',
                    color: 'rgba(26,24,18,0.22)',
                    margin: 0,
                  }}
                >
                  Untitled
                  {cursor(isDesktop ? '30px' : '26px')}
                </p>
              )}
            </AnimatePresence>
          </div>

          {/* Typed progress list — the real steps, no costume */}
          <div style={{ position: 'relative', padding: '0 10% 26px' }}>
            <div
              aria-hidden
              style={{
                width: '28px',
                height: '3px',
                background: 'var(--color-stage-red)',
                margin: '0 auto 12px',
              }}
            />
            <div
              style={{
                fontFamily: 'var(--font-code)',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.16em',
                lineHeight: 2.2,
                textTransform: 'uppercase',
              }}
            >
              {steps.map((step, i) => {
                const status = stepStatuses[i]
                return (
                  <div
                    key={step.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#1a1812',
                      opacity: status === 'pending' ? 0.22 : status === 'active' ? 0.85 : 0.6,
                      transition: 'opacity 400ms',
                    }}
                  >
                    <span>{step.label}</span>
                    <span aria-live={status === 'active' ? 'polite' : undefined}>
                      {status === 'done' ? (
                        step.done
                      ) : status === 'active' ? (
                        <motion.span
                          animate={prefersReducedMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          · · ·
                        </motion.span>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ---- Below the sheet ---- */}
        <div className="w-full" style={{ marginTop: '28px' }}>
          {/* Progress — the ribbon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className="relative overflow-hidden rounded-full"
              style={{ height: '3px', background: 'rgba(255,255,255,0.1)' }}
              role="progressbar"
              aria-valuenow={Math.min(loadingProgress, 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Script generation progress"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--color-stage-red)' }}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                transition={{ duration: DUR.scene, ease: EASE_CAMERA }}
              />
            </div>
            <p
              className="text-center"
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '15px',
                color: 'rgba(255,255,255,0.6)',
                margin: '14px 0 0',
              }}
            >
              {settings?.gameMode === 'SOLO'
                ? 'The studio is casting your co-stars.'
                : 'The studio is typing.'}
            </p>
          </motion.div>

          {/* Green Room / Timeout */}
          <AnimatePresence mode="wait">
            {greenRoomQuestion && !scriptGenerationTimedOut && (
              <motion.div
                className="p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={SPRING_GENTLE}
                style={{
                  marginTop: '24px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-code)',
                    color: 'rgba(255,255,255,0.55)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    fontSize: '9px',
                    fontWeight: 700,
                    margin: '0 0 8px',
                  }}
                >
                  Green room
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: '16px',
                    lineHeight: 1.4,
                    color: 'rgba(255,255,255,0.85)',
                    margin: 0,
                  }}
                >
                  &ldquo;{greenRoomQuestion}&rdquo;
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    marginTop: '8px',
                    marginBottom: 0,
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  Argue about it while the script is typed.
                </p>
              </motion.div>
            )}
            {scriptGenerationTimedOut && (
              <motion.div
                className="p-4"
                style={{
                  marginTop: '24px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-lg)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={SPRING_GENTLE}
              >
                <div className="flex items-center gap-2 mb-2">
                  <WarningIcon size={16} color="var(--color-danger)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-danger)' }}>
                    Taking longer than expected
                  </span>
                </div>
                <p className="mb-3" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                  The writer is stuck. You can wait, retry, or head back to the lobby.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<RetryIcon size={14} color="currentColor" />}
                    onClick={onRetry}
                    style={{
                      // Danger context: red, not the store-orange primary (one
                      // accent per surface). Stage red, not --color-danger:
                      // white on #EF4444 is 3.76:1 and fails AA at this size.
                      background: 'var(--color-stage-red)',
                      color: '#fff',
                    }}
                  >
                    Retry
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M10 3L5 8L10 13"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                    onClick={onBackToLobby}
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      // Ghost variant resolves light-mode text-secondary here
                      // (3.96:1 on void) — force a theater-legible color.
                      color: 'rgba(255,255,255,0.75)',
                    }}
                  >
                    Back to Lobby
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
