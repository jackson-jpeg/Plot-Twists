/**
 * User Service
 * Handles user creation, lookup, and account management.
 * Auth is handled by Clerk — this service manages game data (credits, stats)
 * keyed by Clerk userId.
 */

import type { UserProfile, UserMigrationData, UserPreferences } from '../../lib/types'
import { getDatabase, Collections } from '../db'
import { getDefaultCredits } from '../../lib/credits'
import { logger } from '../../lib/logger'

// ============================================================
// Core Functions
// ============================================================

/**
 * Get a user by ID
 */
export async function getUser(uid: string): Promise<UserProfile | null> {
  const db = getDatabase()
  return await db.get<UserProfile>(Collections.USERS, uid)
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const db = getDatabase()
  const results = await db.query<UserProfile>(Collections.USERS, [
    { field: 'email', operator: '==', value: email }
  ], { limit: 1 })
  return results[0] || null
}

/**
 * Create or update a user profile
 */
export async function upsertUser(
  uid: string,
  data: {
    displayName?: string
    email?: string
    phoneNumber?: string
    isAnonymous?: boolean
  }
): Promise<UserProfile> {
  const db = getDatabase()
  const existing = await db.get<UserProfile>(Collections.USERS, uid)
  const now = Date.now()

  if (existing) {
    // Update existing user (omit undefined fields to avoid Firestore errors)
    const updated: UserProfile = {
      ...existing,
      displayName: data.displayName || existing.displayName,
      email: data.email || existing.email,
      lastSeenAt: now
    }
    if (data.phoneNumber !== undefined) updated.phoneNumber = data.phoneNumber
    else if (existing.phoneNumber !== undefined) updated.phoneNumber = existing.phoneNumber
    await db.set(Collections.USERS, uid, updated)
    return updated
  }

  // Create new user (omit undefined fields to avoid Firestore errors)
  const newUser: UserProfile = {
    uid,
    displayName: data.displayName || 'Anonymous',
    linkedAccounts: [],
    createdAt: now,
    lastSeenAt: now,
    credits: getDefaultCredits(),
    lifetimeSpend: 0
  }
  if (data.email !== undefined) newUser.email = data.email
  if (data.phoneNumber !== undefined) newUser.phoneNumber = data.phoneNumber

  // Determine linked accounts
  if (data.email) {
    newUser.linkedAccounts.push('email')
  }
  if (data.phoneNumber) {
    newUser.linkedAccounts.push('phone')
  }

  await db.set(Collections.USERS, uid, newUser)

  logger.info(`Created new user: ${uid} (${newUser.displayName})`)
  return newUser
}

/**
 * Ensure a user has the credits field (backward compat for existing users).
 */
export async function ensureCreditsExist(uid: string): Promise<void> {
  const db = getDatabase()
  const user = await db.get<UserProfile>(Collections.USERS, uid)
  if (user && !user.credits) {
    await db.update(Collections.USERS, uid, {
      credits: getDefaultCredits(),
      lifetimeSpend: 0
    })
  }
}

/**
 * Link an account to an existing user
 */
export async function linkAccount(
  uid: string,
  accountType: 'google' | 'email' | 'phone',
  data: { email?: string; phoneNumber?: string }
): Promise<{ success: boolean; error?: string }> {
  const db = getDatabase()
  const user = await db.get<UserProfile>(Collections.USERS, uid)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  if (user.linkedAccounts.includes(accountType)) {
    return { success: false, error: `Account type ${accountType} already linked` }
  }

  const updatedLinkedAccounts = [...user.linkedAccounts, accountType]
  const updates: Partial<UserProfile> = {
    linkedAccounts: updatedLinkedAccounts,
    lastSeenAt: Date.now()
  }

  if (data.email) {
    updates.email = data.email
  }
  if (data.phoneNumber) {
    updates.phoneNumber = data.phoneNumber
  }

  await db.update(Collections.USERS, uid, updates)

  logger.info(`Linked ${accountType} account to user ${uid}`)
  return { success: true }
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  uid: string,
  preferences: Partial<UserPreferences>
): Promise<{ success: boolean; error?: string }> {
  const db = getDatabase()
  const user = await db.get<UserProfile>(Collections.USERS, uid)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  await db.update(Collections.USERS, uid, {
    preferences: {
      ...user.preferences,
      ...preferences
    },
    lastSeenAt: Date.now()
  })

  return { success: true }
}

/**
 * Migrate data from anonymous user to authenticated user
 */
export async function migrateAnonymousUser(
  oldAnonymousId: string,
  newAuthenticatedId: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDatabase()

  const existingMigration = await db.get<UserMigrationData>(Collections.MIGRATIONS, oldAnonymousId)
  if (existingMigration) {
    return { success: false, error: 'User data already migrated' }
  }

  const now = Date.now()

  const migrationData: UserMigrationData = {
    oldPlayerId: oldAnonymousId,
    newUserId: newAuthenticatedId,
    migratedAt: now,
    statsTransferred: false,
    historyTransferred: false
  }

  try {
    const { getPlayerStats } = await import('./playerStats.service')

    const oldStats = await getPlayerStats(oldAnonymousId)

    if (oldStats && oldStats.gamesPlayed > 0) {
      const newStats = await getPlayerStats(newAuthenticatedId)

      newStats.gamesPlayed += oldStats.gamesPlayed
      newStats.gamesWon += oldStats.gamesWon
      newStats.totalVotesReceived += oldStats.totalVotesReceived
      newStats.totalReactionsReceived += oldStats.totalReactionsReceived

      for (const [character, count] of Object.entries(oldStats.characterCounts)) {
        newStats.characterCounts[character] = (newStats.characterCounts[character] || 0) + count
      }

      for (const mode of ['solo', 'headToHead', 'ensemble'] as const) {
        newStats.gameModeStats[mode].played += oldStats.gameModeStats[mode].played
        newStats.gameModeStats[mode].won += oldStats.gameModeStats[mode].won
      }

      if (oldStats.bestWinStreak > newStats.bestWinStreak) {
        newStats.bestWinStreak = oldStats.bestWinStreak
      }

      const existingAchievementIds = new Set(newStats.achievements.map(a => a.id))
      for (const achievement of oldStats.achievements) {
        if (!existingAchievementIds.has(achievement.id)) {
          newStats.achievements.push(achievement)
        }
      }

      newStats.winRate = newStats.gamesPlayed > 0
        ? (newStats.gamesWon / newStats.gamesPlayed) * 100
        : 0

      if (oldStats.joinedAt < newStats.joinedAt) {
        newStats.joinedAt = oldStats.joinedAt
      }

      await db.set(Collections.PLAYER_STATS, newAuthenticatedId, newStats)

      migrationData.statsTransferred = true
      logger.info(`Migrated stats from ${oldAnonymousId} to ${newAuthenticatedId}`)
    }

    const allGames = await db.getAll<{ id: string; players: Array<{ id: string }> }>(Collections.GAME_HISTORY)
    const gamesToUpdate = allGames.filter(game =>
      game.players.some(p => p.id === oldAnonymousId)
    )

    if (gamesToUpdate.length > 0) {
      for (const game of gamesToUpdate) {
        const updatedPlayers = game.players.map(p =>
          p.id === oldAnonymousId ? { ...p, id: newAuthenticatedId } : p
        )
        await db.update(Collections.GAME_HISTORY, game.id, { players: updatedPlayers })
      }
      migrationData.historyTransferred = true
      logger.info(`Migrated ${gamesToUpdate.length} games from ${oldAnonymousId} to ${newAuthenticatedId}`)
    }

    const user = await db.get<UserProfile>(Collections.USERS, newAuthenticatedId)
    if (user) {
      await db.update(Collections.USERS, newAuthenticatedId, {
        migratedFromAnonymousId: oldAnonymousId,
        lastSeenAt: now
      })
    }

    await db.set(Collections.MIGRATIONS, oldAnonymousId, migrationData)

    return { success: true }
  } catch (error) {
    logger.error('Migration error:', error)
    return { success: false, error: 'Migration failed' }
  }
}

/**
 * Check if an anonymous ID has been migrated
 */
export async function getMigrationStatus(oldAnonymousId: string): Promise<UserMigrationData | null> {
  const db = getDatabase()
  return await db.get<UserMigrationData>(Collections.MIGRATIONS, oldAnonymousId)
}

/**
 * Get all users (for admin purposes)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const db = getDatabase()
  return await db.getAll<UserProfile>(Collections.USERS)
}

/**
 * Get user count
 */
export async function getUserCount(): Promise<number> {
  const db = getDatabase()
  return await db.count(Collections.USERS)
}

/**
 * Delete a user and all associated data (cascade delete).
 * Removes: user profile, player stats, game history, Stripe customer.
 */
export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  const db = getDatabase()
  const user = await db.get<UserProfile>(Collections.USERS, uid)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  // 1. Delete player stats
  try {
    await db.delete(Collections.PLAYER_STATS, uid)
  } catch (e) {
    logger.warn('[deleteUser] Failed to delete player stats:', e)
  }

  // 2. Delete game history records where this user was host
  try {
    const games = await db.query(Collections.GAME_HISTORY, [
      { field: 'hostId', operator: '==', value: uid }
    ])
    for (const game of games) {
      if (game && typeof game === 'object' && 'id' in game) {
        await db.delete(Collections.GAME_HISTORY, (game as { id: string }).id)
      }
    }
  } catch (e) {
    logger.warn('[deleteUser] Failed to delete game history:', e)
  }

  // 3. Delete payment transactions
  try {
    const transactions = await db.query(Collections.PAYMENT_TRANSACTIONS, [
      { field: 'userId', operator: '==', value: uid }
    ])
    for (const txn of transactions) {
      if (txn && typeof txn === 'object' && 'id' in txn) {
        await db.delete(Collections.PAYMENT_TRANSACTIONS, (txn as { id: string }).id)
      }
    }
  } catch (e) {
    logger.warn('[deleteUser] Failed to delete payment transactions:', e)
  }

  // 4. Delete Stripe customer if exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((user as any).stripeCustomerId) {
    try {
      const Stripe = (await import('stripe')).default
      const key = process.env.STRIPE_SECRET_KEY
      if (key) {
        const stripe = new Stripe(key)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await stripe.customers.del((user as any).stripeCustomerId)
      }
    } catch (e) {
      logger.warn('[deleteUser] Failed to delete Stripe customer:', e)
    }
  }

  // 5. Delete user profile (last, so partial failures don't orphan the account)
  await db.delete(Collections.USERS, uid)

  logger.info(`[deleteUser] Successfully deleted user ${uid} and associated data`)
  return { success: true }
}

// Chunk 2 item 5c cleanup. `verifyIdToken` was deleted here, not renamed.
//
// `verifyIdToken` is Firebase's name; the body called Clerk. Its docstring claimed it was
// "used by HTTP middleware for authenticated API routes" and it had ZERO callers — it was a
// second, divergent copy of the verification in server/middleware/socketAuth.ts. Renaming it
// would have preserved a duplicate token verifier for someone to reach for later; two places
// that decide who a user is, is one too many.
