/**
 * User Service
 * Handles user creation, lookup, and anonymous-to-authenticated migration
 */

import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import type { UserProfile, UserMigrationData, UserPreferences } from '../../lib/types'

// In-memory store with file persistence
const users: Map<string, UserProfile> = new Map()
const migrations: Map<string, UserMigrationData> = new Map() // oldId -> migration data

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

// ============================================================
// Persistence
// ============================================================

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadUsersFromFile(): void {
  ensureDataDir()

  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))

      if (data.users && Array.isArray(data.users)) {
        data.users.forEach((user: UserProfile) => {
          users.set(user.uid, user)
        })
      }

      if (data.migrations && Array.isArray(data.migrations)) {
        data.migrations.forEach((migration: UserMigrationData) => {
          migrations.set(migration.oldPlayerId, migration)
        })
      }

      console.log(`Loaded ${users.size} users from file`)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }
}

function saveUsersToFile(): void {
  ensureDataDir()

  try {
    const data = {
      users: Array.from(users.values()),
      migrations: Array.from(migrations.values()),
      savedAt: Date.now()
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Failed to save users:', error)
  }
}

// Load on startup
loadUsersFromFile()

// ============================================================
// Core Functions
// ============================================================

/**
 * Get a user by ID
 */
export function getUser(uid: string): UserProfile | null {
  return users.get(uid) || null
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): UserProfile | null {
  for (const user of users.values()) {
    if (user.email === email) {
      return user
    }
  }
  return null
}

/**
 * Create or update a user profile
 */
export function upsertUser(
  uid: string,
  data: {
    displayName?: string
    email?: string
    phoneNumber?: string
    isAnonymous?: boolean
  }
): UserProfile {
  const existing = users.get(uid)
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
    users.set(uid, updated)
    saveUsersToFile()
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
    lastSeenAt: now
  }

  // Determine linked accounts
  if (data.email) {
    newUser.linkedAccounts.push('email')
  }
  if (data.phoneNumber) {
    newUser.linkedAccounts.push('phone')
  }

  users.set(uid, newUser)
  saveUsersToFile()

  console.log(`Created new user: ${uid} (${newUser.displayName})`)
  return newUser
}

/**
 * Link an account to an existing user
 */
export function linkAccount(
  uid: string,
  accountType: 'google' | 'email' | 'phone',
  data: { email?: string; phoneNumber?: string }
): { success: boolean; error?: string } {
  const user = users.get(uid)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  if (user.linkedAccounts.includes(accountType)) {
    return { success: false, error: `Account type ${accountType} already linked` }
  }

  user.linkedAccounts.push(accountType)

  if (data.email) {
    user.email = data.email
  }
  if (data.phoneNumber) {
    user.phoneNumber = data.phoneNumber
  }

  user.lastSeenAt = Date.now()
  saveUsersToFile()

  console.log(`Linked ${accountType} account to user ${uid}`)
  return { success: true }
}

/**
 * Update user preferences
 */
export function updatePreferences(
  uid: string,
  preferences: Partial<UserPreferences>
): { success: boolean; error?: string } {
  const user = users.get(uid)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  user.preferences = {
    ...user.preferences,
    ...preferences
  }
  user.lastSeenAt = Date.now()
  saveUsersToFile()

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
  // Check if already migrated
  if (migrations.has(oldAnonymousId)) {
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
    const oldStats = getPlayerStats(oldAnonymousId)

    if (oldStats && oldStats.gamesPlayed > 0) {
      // Get or create new user stats
      const newStats = getPlayerStats(newAuthenticatedId)

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

      migrationData.statsTransferred = true
      console.log(`Migrated stats from ${oldAnonymousId} to ${newAuthenticatedId}`)
    }

    // Update user profile with migration info
    const user = users.get(newAuthenticatedId)
    if (user) {
      user.migratedFromAnonymousId = oldAnonymousId
      user.lastSeenAt = now
    }

    // Save migration record
    migrations.set(oldAnonymousId, migrationData)
    saveUsersToFile()

    return { success: true }
  } catch (error) {
    console.error('Migration error:', error)
    return { success: false, error: 'Migration failed' }
  }
}

/**
 * Check if an anonymous ID has been migrated
 */
export function getMigrationStatus(oldAnonymousId: string): UserMigrationData | null {
  return migrations.get(oldAnonymousId) || null
}

/**
 * Get all users (for admin purposes)
 */
export function getAllUsers(): UserProfile[] {
  return Array.from(users.values())
}

/**
 * Get user count
 */
export function getUserCount(): number {
  return users.size
}

/**
 * Delete a user
 */
export function deleteUser(uid: string): { success: boolean; error?: string } {
  if (!users.has(uid)) {
    return { success: false, error: 'User not found' }
  }

  users.delete(uid)
  saveUsersToFile()

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
