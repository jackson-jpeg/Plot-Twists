import type { CreditBalance } from './types'

export const FREE_WEEKLY_LIMIT = 5
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export const CREDIT_PACKAGES = [
  { id: 'starter', price: 500,   scripts: 20,   label: 'Starter Bank' },
  { id: 'party',   price: 1000,  scripts: 50,   label: 'Party Pack' },
  { id: 'pro',     price: 5000,  scripts: 300,  label: 'Producer' },
  { id: 'studio',  price: 10000, scripts: 1000, label: 'Studio Head' }
] as const

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id']

export function getAvailableCredits(credits: CreditBalance): number {
  const freeRemaining = Math.max(0, credits.free.limit - credits.free.used)
  return freeRemaining + credits.banked
}

export function getFreeRemaining(credits: CreditBalance): number {
  return Math.max(0, credits.free.limit - credits.free.used)
}

export function getDefaultCredits(): CreditBalance {
  return {
    free: { used: 0, limit: FREE_WEEKLY_LIMIT, lastResetDate: new Date().toISOString() },
    banked: 0
  }
}

export function needsWeeklyReset(credits: CreditBalance): boolean {
  const lastReset = new Date(credits.free.lastResetDate).getTime()
  return Date.now() - lastReset >= ONE_WEEK_MS
}

export function formatCreditBalance(credits: CreditBalance): { free: number; banked: number; total: number } {
  const free = getFreeRemaining(credits)
  return { free, banked: credits.banked, total: free + credits.banked }
}
