'use client'

import { motion } from 'framer-motion'
import type { WeeklyChallenge } from '@/lib/types'

interface WeeklyChallengesProps {
  challenges: WeeklyChallenge[]
}

export function WeeklyChallenges({ challenges }: WeeklyChallengesProps) {
  if (challenges.length === 0) return null

  const timeLeft = challenges[0]?.expiresAt
    ? Math.max(0, challenges[0].expiresAt - Date.now())
    : 0
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] font-display">
          Weekly Challenges
        </h3>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {daysLeft}d left
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {challenges.map((challenge, i) => {
          const progress = Math.min(challenge.progress / challenge.target, 1)
          return (
            <motion.div
              key={challenge.id}
              className={`rounded-lg p-3 border ${challenge.completed ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)]'}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {challenge.completed && '✓ '}{challenge.title}
                </span>
                <span className="text-xs font-bold text-[var(--color-accent)]">
                  +{challenge.xpReward} XP
                </span>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-2">
                {challenge.description}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: challenge.completed ? 'var(--color-success)' : 'var(--color-accent)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
                  />
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)] min-w-[32px] text-right">
                  {challenge.progress}/{challenge.target}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
