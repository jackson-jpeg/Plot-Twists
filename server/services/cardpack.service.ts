/**
 * Card Pack Service
 * Manages custom card packs - creation, storage, and retrieval
 */

import { v4 as uuidv4 } from 'uuid'
import type { CardPack, CardPackMetadata, Card, CardPackInput } from '../../lib/types'
import { getDatabase, Collections } from '../db'
import { unlockAchievement } from './playerStats.service'
import { COMMUNITY_PACKS } from '../data/communityPacks'
import { logger } from '../../lib/logger'

// Built-in pack ID (standard content from content.ts)
export const STANDARD_PACK_ID = 'standard'

// Track initialization state
let initialized = false

/**
 * Initialize the card pack service
 */
export async function initializeCardPackService(): Promise<void> {
  if (initialized) return

  const db = getDatabase()

  // Create standard pack reference if it doesn't exist
  const standardPack = await db.get<CardPack>(Collections.CARD_PACKS, STANDARD_PACK_ID)
  if (!standardPack) {
    const newStandardPack: CardPack = {
      id: STANDARD_PACK_ID,
      name: 'Standard Pack',
      description: 'The original Plot Twists card collection with 200+ characters, settings, and circumstances',
      author: 'Plot Twists',
      theme: 'mixed',
      isMature: false, // Has both safe and mature content
      isBuiltIn: true,
      isPublic: true,
      characters: [], // Loaded dynamically from content.ts
      settings: [],
      circumstances: [],
      downloads: 0,
      rating: 5.0,
      ratingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await db.set(Collections.CARD_PACKS, STANDARD_PACK_ID, newStandardPack)
  }

  // Create example packs
  await createExamplePacks()

  initialized = true
  const count = await db.count(Collections.CARD_PACKS)
  logger.info(`Card Pack Service initialized with ${count} packs`)
}

/**
 * Get all available card packs (metadata only)
 */
export async function listCardPacks(includePrivate: boolean = false): Promise<CardPackMetadata[]> {
  const db = getDatabase()

  const whereClauses: import('../db').WhereClause[] = []
  if (!includePrivate) {
    whereClauses.push({ field: 'isPublic', operator: '==', value: true })
  }

  const allPacks = await db.query<CardPack>(Collections.CARD_PACKS, whereClauses, {
    limit: 100 // Safety cap
  })

  const packs: CardPackMetadata[] = allPacks.map(pack => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    author: pack.author,
    theme: pack.theme,
    isMature: pack.isMature,
    isBuiltIn: pack.isBuiltIn,
    gradient: pack.gradient,
    cardCounts: {
      characters: pack.characters.length,
      settings: pack.settings.length,
      circumstances: pack.circumstances.length
    },
    downloads: pack.downloads,
    rating: pack.rating
  }))

  // Sort by built-in first, then by rating
  return packs.sort((a, b) => {
    if (a.isBuiltIn !== b.isBuiltIn) return a.isBuiltIn ? -1 : 1
    return b.rating - a.rating
  })
}

/**
 * Get a specific card pack by ID
 */
export async function getCardPack(packId: string): Promise<CardPack | null> {
  const db = getDatabase()
  return await db.get<CardPack>(Collections.CARD_PACKS, packId)
}

/**
 * Get cards from a pack (or standard content if standard pack)
 */
export async function getPackCards(packId: string, isMature: boolean): Promise<{
  characters: Card[],
  settings: Card[],
  circumstances: Card[]
} | null> {
  const db = getDatabase()
  const pack = await db.get<CardPack>(Collections.CARD_PACKS, packId)
  if (!pack) return null

  // For standard pack, return empty (caller should use content.ts)
  if (pack.isBuiltIn) {
    return null // Signal to use standard content
  }

  // For custom packs, filter by maturity if needed
  return {
    characters: pack.characters,
    settings: pack.settings,
    circumstances: pack.circumstances
  }
}

/**
 * Create a new card pack
 */
export async function createCardPack(
  packData: CardPackInput
): Promise<{ success: boolean, packId?: string, error?: string }> {
  // Validate pack data
  if (!packData.name || packData.name.trim().length < 3) {
    return { success: false, error: 'Pack name must be at least 3 characters' }
  }

  if (packData.characters.length < 5) {
    return { success: false, error: 'Pack must have at least 5 characters' }
  }

  if (packData.settings.length < 3) {
    return { success: false, error: 'Pack must have at least 3 settings' }
  }

  if (packData.circumstances.length < 3) {
    return { success: false, error: 'Pack must have at least 3 circumstances' }
  }

  const db = getDatabase()

  // Generate ID and create pack
  const packId = uuidv4()
  const now = Date.now()

  const newPack: CardPack = {
    ...packData,
    id: packId,
    name: packData.name.trim().slice(0, 50),
    description: packData.description.slice(0, 200),
    isBuiltIn: false,
    downloads: 0,
    rating: 0,
    ratingCount: 0,
    createdAt: now,
    updatedAt: now,
    // Ensure all cards have IDs
    characters: packData.characters.map(c => ({ ...c, id: c.id || uuidv4() })),
    settings: packData.settings.map(s => ({ ...s, id: s.id || uuidv4() })),
    circumstances: packData.circumstances.map(c => ({ ...c, id: c.id || uuidv4() }))
  }

  await db.set(Collections.CARD_PACKS, packId, newPack)

  logger.info(`Created new card pack: ${newPack.name} (${packId})`)

  // Unlock card_creator achievement for the pack author
  if (packData.author) {
    unlockAchievement(packData.author, 'card_creator').catch(() => {})
  }

  return { success: true, packId }
}

// Allowed fields for card pack updates (prevents field injection)
const ALLOWED_UPDATE_FIELDS = new Set([
  'name', 'description', 'theme', 'isMature', 'isPublic',
  'characters', 'settings', 'circumstances'
])

/**
 * Update an existing card pack
 */
export async function updateCardPack(
  packId: string,
  updates: Record<string, unknown>,
  requesterId?: string | null
): Promise<{ success: boolean, error?: string }> {
  const db = getDatabase()
  const pack = await db.get<CardPack>(Collections.CARD_PACKS, packId)

  if (!pack) {
    return { success: false, error: 'Pack not found' }
  }

  if (pack.isBuiltIn) {
    return { success: false, error: 'Cannot modify built-in packs' }
  }

  // Authorization: only the author can update their pack
  if (!requesterId || pack.authorId !== requesterId) {
    return { success: false, error: 'Only the pack author can update this pack' }
  }

  // Whitelist allowed fields to prevent overwriting id, isBuiltIn, rating, authorId, etc.
  const safeUpdates: Record<string, unknown> = {}
  for (const key of Object.keys(updates)) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      safeUpdates[key] = updates[key]
    }
  }

  // Ensure cards have IDs
  if (safeUpdates.characters && Array.isArray(safeUpdates.characters)) {
    safeUpdates.characters = (safeUpdates.characters as Array<{id?: string, name: string, description?: string}>).map(c => ({
      ...c,
      id: c.id || uuidv4()
    }))
  }
  if (safeUpdates.settings && Array.isArray(safeUpdates.settings)) {
    safeUpdates.settings = (safeUpdates.settings as Array<{id?: string, name: string, description?: string}>).map(s => ({
      ...s,
      id: s.id || uuidv4()
    }))
  }
  if (safeUpdates.circumstances && Array.isArray(safeUpdates.circumstances)) {
    safeUpdates.circumstances = (safeUpdates.circumstances as Array<{id?: string, name: string, description?: string}>).map(c => ({
      ...c,
      id: c.id || uuidv4()
    }))
  }

  // Apply only whitelisted updates
  const updatedPack = { ...pack, ...safeUpdates, updatedAt: Date.now() }
  await db.set(Collections.CARD_PACKS, packId, updatedPack)

  return { success: true }
}

/**
 * Delete a card pack
 */
export async function deleteCardPack(
  packId: string,
  requesterId?: string | null
): Promise<{ success: boolean, error?: string }> {
  const db = getDatabase()
  const pack = await db.get<CardPack>(Collections.CARD_PACKS, packId)

  if (!pack) {
    return { success: false, error: 'Pack not found' }
  }

  if (pack.isBuiltIn) {
    return { success: false, error: 'Cannot delete built-in packs' }
  }

  // Authorization: only the author can delete their pack
  if (!requesterId || pack.authorId !== requesterId) {
    return { success: false, error: 'Only the pack author can delete this pack' }
  }

  await db.delete(Collections.CARD_PACKS, packId)

  logger.info(`Deleted card pack: ${packId}`)

  return { success: true }
}

/**
 * Increment download count for a pack
 */
export async function incrementDownloads(packId: string): Promise<void> {
  const db = getDatabase()
  const pack = await db.get<CardPack>(Collections.CARD_PACKS, packId)

  if (pack && !pack.isBuiltIn) {
    const newDownloads = pack.downloads + 1
    await db.update(Collections.CARD_PACKS, packId, { downloads: newDownloads })

    // Unlock trendsetter achievement when pack crosses 10 downloads
    if (newDownloads >= 10 && pack.authorId) {
      unlockAchievement(pack.authorId, 'trendsetter').catch(() => {})
    }
  }
}

/**
 * Rate a card pack
 */
export async function rateCardPack(
  packId: string,
  rating: number
): Promise<{ success: boolean, newRating?: number, error?: string }> {
  const db = getDatabase()
  const pack = await db.get<CardPack>(Collections.CARD_PACKS, packId)

  if (!pack) {
    return { success: false, error: 'Pack not found' }
  }

  if (pack.isBuiltIn) {
    return { success: false, error: 'Cannot rate built-in packs' }
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5' }
  }

  // Calculate new average rating
  const totalRating = pack.rating * pack.ratingCount + rating
  const newRatingCount = pack.ratingCount + 1
  const newRating = Math.round((totalRating / newRatingCount) * 10) / 10

  await db.update(Collections.CARD_PACKS, packId, {
    rating: newRating,
    ratingCount: newRatingCount
  })

  return { success: true, newRating }
}

/**
 * Search card packs by name or theme
 * Note: Full-text search requires client-side filtering since Firestore doesn't support LIKE queries.
 * We limit the query to public packs with a safety cap.
 */
export async function searchCardPacks(query: string): Promise<CardPackMetadata[]> {
  const db = getDatabase()

  const allPacks = await db.query<CardPack>(Collections.CARD_PACKS, [
    { field: 'isPublic', operator: '==', value: true }
  ], { limit: 100 })

  const lowerQuery = query.toLowerCase()
  const results: CardPackMetadata[] = []

  for (const pack of allPacks) {
    const matchesName = pack.name.toLowerCase().includes(lowerQuery)
    const matchesTheme = pack.theme.toLowerCase().includes(lowerQuery)
    const matchesAuthor = pack.author.toLowerCase().includes(lowerQuery)

    if (matchesName || matchesTheme || matchesAuthor) {
      results.push({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        author: pack.author,
        theme: pack.theme,
        isMature: pack.isMature,
        isBuiltIn: pack.isBuiltIn,
        gradient: pack.gradient,
        cardCounts: {
          characters: pack.characters.length,
          settings: pack.settings.length,
          circumstances: pack.circumstances.length
        },
        downloads: pack.downloads,
        rating: pack.rating
      })
    }
  }

  return results.sort((a, b) => b.rating - a.rating)
}

/**
 * Get featured/popular packs
 */
export async function getFeaturedPacks(limit: number = 5): Promise<CardPackMetadata[]> {
  const packs = await listCardPacks()
  return packs
    .filter(p => !p.isBuiltIn)
    .sort((a, b) => (b.downloads * 0.7 + b.rating * 0.3) - (a.downloads * 0.7 + a.rating * 0.3))
    .slice(0, limit)
}

/**
 * Create community packs that ship with the app.
 * Only creates packs that don't already exist (idempotent).
 */
export async function createExamplePacks(): Promise<void> {
  const db = getDatabase()
  let created = 0

  for (const packData of COMMUNITY_PACKS) {
    const existing = await db.get<CardPack>(Collections.CARD_PACKS, packData.id)
    if (existing) continue

    const pack: CardPack = {
      ...packData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.set(Collections.CARD_PACKS, packData.id, pack)
    created++
  }

  if (created > 0) {
    logger.info(`Created ${created} community pack(s)`)
  } else {
    logger.info(`All ${COMMUNITY_PACKS.length} community packs already exist`)
  }
}
