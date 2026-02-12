/**
 * Referral Service
 * Handles referral code generation, redemption, and bonus credit distribution.
 * Each user gets a unique 6-char code. When a friend redeems it and plays their
 * first game, both the referrer and referee get bonus credits.
 */

import type { UserProfile } from '../../lib/types'
import { getDatabase, Collections } from '../db'
import { addBankedCredits, ensureCreditsExist } from './credit.service'
import { logger } from '../../lib/logger'

const REFERRAL_BONUS_REFERRER = 3  // Credits for the person who referred
const REFERRAL_BONUS_REFEREE = 2   // Credits for the new user

interface ReferralEvent {
  id: string
  referrerUid: string
  refereeUid: string
  code: string
  creditsAwarded: number
  type: 'referrer_bonus' | 'referee_bonus'
  createdAt: string
}

/**
 * Generate a unique 6-character alphanumeric referral code.
 * Uses uppercase letters + digits, excluding ambiguous chars (0/O, 1/I/L).
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Get or create a referral code for a user.
 */
export async function getReferralCode(uid: string): Promise<string> {
  const db = getDatabase()
  const user = await db.get<UserProfile>(Collections.USERS, uid)

  if (!user) throw new Error(`User not found: ${uid}`)

  if (user.referralCode) return user.referralCode

  // Generate a unique code (retry on collision)
  let code: string
  let attempts = 0
  do {
    code = generateCode()
    const existing = await db.query<UserProfile>(
      Collections.USERS,
      [{ field: 'referralCode', operator: '==', value: code }],
      { limit: 1 }
    )
    if (existing.length === 0) break
    attempts++
  } while (attempts < 10)

  if (attempts >= 10) throw new Error('Failed to generate unique referral code')

  await db.update(Collections.USERS, uid, { referralCode: code })
  logger.info(`Generated referral code ${code} for user ${uid}`)

  return code
}

/**
 * Get referral stats for a user.
 */
export async function getReferralInfo(uid: string): Promise<{
  referralCode: string
  referralCreditsEarned: number
  referralCount: number
}> {
  const code = await getReferralCode(uid)
  const db = getDatabase()

  const user = await db.get<UserProfile>(Collections.USERS, uid)
  const referralCount = await db.count(
    Collections.USERS,
    [{ field: 'referredBy', operator: '==', value: uid }]
  )

  return {
    referralCode: code,
    referralCreditsEarned: user?.referralCreditsEarned ?? 0,
    referralCount,
  }
}

/**
 * Redeem a referral code. Called when a new user enters a friend's code.
 * Awards bonus credits to both parties.
 */
export async function redeemReferralCode(
  refereeUid: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDatabase()

  // Validate the referee
  const referee = await ensureCreditsExist(refereeUid)
  if (referee.referredBy) {
    return { success: false, error: 'You have already used a referral code' }
  }

  // Find the referrer by code
  const referrers = await db.query<UserProfile>(
    Collections.USERS,
    [{ field: 'referralCode', operator: '==', value: code.toUpperCase() }],
    { limit: 1 }
  )

  if (referrers.length === 0) {
    return { success: false, error: 'Invalid referral code' }
  }

  const referrer = referrers[0]

  if (referrer.uid === refereeUid) {
    return { success: false, error: 'You cannot use your own referral code' }
  }

  // Mark referee as referred
  await db.update(Collections.USERS, refereeUid, {
    referredBy: referrer.uid,
  })

  // Award bonus credits to both
  await addBankedCredits(refereeUid, REFERRAL_BONUS_REFEREE, 0)
  await addBankedCredits(referrer.uid, REFERRAL_BONUS_REFERRER, 0)

  // Update referrer's earned total
  const newEarned = (referrer.referralCreditsEarned ?? 0) + REFERRAL_BONUS_REFERRER
  await db.update(Collections.USERS, referrer.uid, {
    referralCreditsEarned: newEarned,
  })

  // Log referral events
  const now = new Date().toISOString()
  await db.set(Collections.REFERRAL_EVENTS, `ref_${Date.now()}_referee`, {
    id: `ref_${Date.now()}_referee`,
    referrerUid: referrer.uid,
    refereeUid,
    code,
    creditsAwarded: REFERRAL_BONUS_REFEREE,
    type: 'referee_bonus',
    createdAt: now,
  } as ReferralEvent)

  await db.set(Collections.REFERRAL_EVENTS, `ref_${Date.now()}_referrer`, {
    id: `ref_${Date.now()}_referrer`,
    referrerUid: referrer.uid,
    refereeUid,
    code,
    creditsAwarded: REFERRAL_BONUS_REFERRER,
    type: 'referrer_bonus',
    createdAt: now,
  } as ReferralEvent)

  logger.info(
    `Referral redeemed: ${refereeUid} used code ${code} from ${referrer.uid}. ` +
    `Referee +${REFERRAL_BONUS_REFEREE}, Referrer +${REFERRAL_BONUS_REFERRER}`
  )

  return { success: true }
}
