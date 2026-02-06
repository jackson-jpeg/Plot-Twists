/**
 * User Service
 * Handles user creation, lookup, and anonymous-to-authenticated migration
 */

import type { UserProfile, UserMigrationData, UserPreferences } from '../../lib/types'
import { getDatabase, Collections } from '../db'
import { getDefaultCredits } from '../../lib/credits'

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
    // Update existing user
    const updated: UserProfile = {
      ...existing,
      displayName: data.displayName || existing.displayName,
      email: data.email || existing.email,
      phoneNumber: data.phoneNumber || existing.phoneNumber,
      lastSeenAt: now
    }
    await db.set(Collections.USERS, uid, updated)
    return updated
  }

  // Create new user
  const newUser: UserProfile = {
    uid,
    displayName: data.displayName || 'Anonymous',
    email: data.email,
    phoneNumber: data.phoneNumber,
    linkedAccounts: [],
    createdAt: now,
    lastSeenAt: now,
    credits: getDefaultCredits(),
    lifetimeSpend: 0
  }

  // Determine linked accounts
  if (data.email) {
    newUser.linkedAccounts.push('email')
  }
  if (data.phoneNumber) {
    newUser.linkedAccounts.push('phone')
  }

  await db.set(Collections.USERS, uid, newUser)

  console.log(`Created new user: ${uid} (${newUser.displayName})`)
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

  console.log(`Linked ${accountType} account to user ${uid}`)
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
 * This should be called when a user links their account
 */
export async function migrateAnonymousUser(
  oldAnonymousId: string,
  newAuthenticatedId: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDatabase()

  // Check if already migrated
  const existingMigration = await db.get<UserMigrationData>(Collections.MIGRATIONS, oldAnonymousId)
  if (existingMigration) {
    return { success: false, error: 'User data already migrated' }
  }

  const now = Date.now()

  // Create migration record
  const migrationData: UserMigrationData = {
    oldPlayerId: oldAnonymousId,
    newUserId: newAuthenticatedId,
    migratedAt: now,
    statsTransferred: false,
    historyTransferred: false
  }

  try {
    // Import player stats service dynamically to avoid circular deps
    const { getPlayerStats } = await import('./playerStats.service')

    // Get old player stats if they exist
    const oldStats = await getPlayerStats(oldAnonymousId)

    if (oldStats && oldStats.gamesPlayed > 0) {
      // Get or create new user stats
      const newStats = await getPlayerStats(newAuthenticatedId)

      // Merge stats (add old stats to new)
      newStats.gamesPlayed += oldStats.gamesPlayed
      newStats.gamesWon += oldStats.gamesWon
      newStats.totalVotesReceived += oldStats.totalVotesReceived
      newStats.totalReactionsReceived += oldStats.totalReactionsReceived

      // Merge character counts
      for (const [character, count] of Object.entries(oldStats.characterCounts)) {
        newStats.characterCounts[character] = (newStats.characterCounts[character] || 0) + count
      }

      // Merge game mode stats
      for (const mode of ['solo', 'headToHead', 'ensemble'] as const) {
        newStats.gameModeStats[mode].played += oldStats.gameModeStats[mode].played
        newStats.gameModeStats[mode].won += oldStats.gameModeStats[mode].won
      }

      // Keep the better streak
      if (oldStats.bestWinStreak > newStats.bestWinStreak) {
        newStats.bestWinStreak = oldStats.bestWinStreak
      }

      // Merge achievements (don't duplicate)
      const existingAchievementIds = new Set(newStats.achievements.map(a => a.id))
      for (const achievement of oldStats.achievements) {
        if (!existingAchievementIds.has(achievement.id)) {
          newStats.achievements.push(achievement)
        }
      }

      // Recalculate win rate
      newStats.winRate = newStats.gamesPlayed > 0
        ? (newStats.gamesWon / newStats.gamesPlayed) * 100
        : 0

      // Use earlier join date
      if (oldStats.joinedAt < newStats.joinedAt) {
        newStats.joinedAt = oldStats.joinedAt
      }

      // Save the merged stats to database
      await db.set(Collections.PLAYER_STATS, newAuthenticatedId, newStats)

      migrationData.statsTransferred = true
      console.log(`Migrated stats from ${oldAnonymousId} to ${newAuthenticatedId}`)
    }

    // Migrate game history - update player IDs in saved games
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
      console.log(`Migrated ${gamesToUpdate.length} games from ${oldAnonymousId} to ${newAuthenticatedId}`)
    }

    // Update user profile with migration info
    const user = await db.get<UserProfile>(Collections.USERS, newAuthenticatedId)
    if (user) {
      await db.update(Collections.USERS, newAuthenticatedId, {
        migratedFromAnonymousId: oldAnonymousId,
        lastSeenAt: now
      })
    }

    // Save migration record
    await db.set(Collections.MIGRATIONS, oldAnonymousId, migrationData)

    return { success: true }
  } catch (error) {
    console.error('Migration error:', error)
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
 * Delete a user
 */
export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  const db = getDatabase()
  const user = await db.get<UserProfile>(Collections.USERS, uid)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  await db.delete(Collections.USERS, uid)

  return { success: true }
}

/**
 * Verify a Firebase ID token (placeholder - implement with firebase-admin)
 */
export async function verifyIdToken(idToken: string): Promise<{ uid: string } | null> {
  try {
    // This would use firebase-admin to verify the token
    // Dynamic import to avoid issues if firebase-admin is not installed
    const adminModule = await import('firebase-admin').catch(() => null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = adminModule

    if (!admin || admin.apps.length === 0) {
      return null
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken)
    return { uid: decodedToken.uid }
  } catch {
    return null
  }
}
