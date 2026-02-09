/**
 * Credit Service
 * Handles credit checking, deduction, and addition using the DB adapter pattern.
 * Implements a two-bucket system: free weekly credits (lazy reset) + banked paid credits.
 */

import type { UserProfile, CreditBalance } from '../../lib/types'
import { getDefaultCredits, needsWeeklyReset, getAvailableCredits, formatCreditBalance, getFreeRemaining } from '../../lib/credits'
import { getDatabase, Collections } from '../db'

/**
 * Ensure a user has the credits field (backward compat for existing users).
 * Mutates the user in DB if credits are missing.
 */
export async function ensureCreditsExist(uid: string): Promise<UserProfile> {
  const db = getDatabase()
  const user = await db.get<UserProfile>(Collections.USERS, uid)

  if (!user) {
    throw new Error(`User not found: ${uid}`)
  }

  if (!user.credits) {
    user.credits = getDefaultCredits()
    user.lifetimeSpend = user.lifetimeSpend ?? 0
    await db.update(Collections.USERS, uid, {
      credits: user.credits,
      lifetimeSpend: user.lifetimeSpend
    })
  }

  return user
}

/**
 * Apply lazy weekly reset if needed.
 * Returns true if a reset was performed.
 */
function applyLazyReset(credits: CreditBalance): boolean {
  if (needsWeeklyReset(credits)) {
    credits.free.used = 0
    credits.free.lastResetDate = new Date().toISOString()
    return true
  }
  return false
}

/**
 * Check and deduct one credit from the user.
 * Free credits are consumed first, then banked.
 * Uses a database transaction to prevent double-spend under concurrency.
 */
export async function checkAndDeductCredit(userId: string): Promise<{
  success: boolean
  source?: 'free' | 'banked'
  remaining?: number
}> {
  const db = getDatabase()
  // Ensure credits field exists before entering the transaction
  await ensureCreditsExist(userId)

  return db.runTransaction(async (txn) => {
    const user = await txn.get<UserProfile>(Collections.USERS, userId)
    if (!user || !user.credits) {
      return { success: false }
    }

    const credits = user.credits

    // Apply lazy reset
    applyLazyReset(credits)

    // Try free credits first
    const freeRemaining = getFreeRemaining(credits)
    if (freeRemaining > 0) {
      credits.free.used += 1
      await txn.update(Collections.USERS, userId, { credits })
      return {
        success: true,
        source: 'free' as const,
        remaining: getAvailableCredits(credits)
      }
    }

    // Try banked credits
    if (credits.banked > 0) {
      credits.banked -= 1
      await txn.update(Collections.USERS, userId, { credits })
      return {
        success: true,
        source: 'banked' as const,
        remaining: getAvailableCredits(credits)
      }
    }

    // No credits available
    return { success: false }
  })
}

/**
 * Get a user's credit balance (applies lazy reset if needed).
 */
export async function getCredits(userId: string): Promise<{ free: number; banked: number; total: number }> {
  const db = getDatabase()
  const user = await ensureCreditsExist(userId)
  const credits = user.credits

  const didReset = applyLazyReset(credits)
  if (didReset) {
    await db.update(Collections.USERS, userId, { credits })
  }

  return formatCreditBalance(credits)
}

/**
 * Add banked credits to a user (after Stripe purchase).
 * Uses a database transaction to prevent lost updates under concurrency.
 */
export async function addBankedCredits(userId: string, amount: number, spendCents: number): Promise<void> {
  const db = getDatabase()
  // Ensure credits field exists before entering the transaction
  await ensureCreditsExist(userId)

  await db.runTransaction(async (txn) => {
    const user = await txn.get<UserProfile>(Collections.USERS, userId)
    if (!user || !user.credits) {
      throw new Error(`User not found or missing credits: ${userId}`)
    }

    user.credits.banked += amount
    const newLifetimeSpend = (user.lifetimeSpend ?? 0) + spendCents

    await txn.update(Collections.USERS, userId, {
      credits: user.credits,
      lifetimeSpend: newLifetimeSpend
    })
  })

  console.log(`Added ${amount} banked credits to user ${userId} ($${(spendCents / 100).toFixed(2)})`)
}

/**
 * Initialize credits for a new or upgrading user.
 */
export async function initializeCredits(userId: string): Promise<void> {
  const db = getDatabase()
  const user = await db.get<UserProfile>(Collections.USERS, userId)

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  // Only initialize if not already set
  if (!user.credits) {
    await db.update(Collections.USERS, userId, {
      credits: getDefaultCredits(),
      lifetimeSpend: 0
    })
    console.log(`Initialized credits for user ${userId}`)
  }
}
