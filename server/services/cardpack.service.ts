/**
 * Card Pack Service
 * Manages custom card packs - creation, storage, and retrieval
 */

import { v4 as uuidv4 } from 'uuid'
import type { CardPack, CardPackMetadata, Card, CardPackInput } from '../../lib/types'
import { getDatabase, Collections } from '../db'

// Built-in pack ID (standard content from content.ts)
export const STANDARD_PACK_ID = 'standard'

// Deterministic IDs for example packs (so we can check if they exist)
const EXAMPLE_PACK_IDS = {
  office: 'example-office-comedy',
  scifi: 'example-scifi-adventures'
}

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
  console.log(`Card Pack Service initialized with ${count} packs`)
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

  console.log(`Created new card pack: ${newPack.name} (${packId})`)

  return { success: true, packId }
}

/**
 * Update an existing card pack
 */
export async function updateCardPack(
  packId: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean, error?: string }> {
  const db = getDatabase()
  const pack = await db.get<CardPack>(Collections.CARD_PACKS, packId)

  if (!pack) {
    return { success: false, error: 'Pack not found' }
  }

  if (pack.isBuiltIn) {
    return { success: false, error: 'Cannot modify built-in packs' }
  }

  // Ensure cards have IDs
  if (updates.characters && Array.isArray(updates.characters)) {
    updates.characters = (updates.characters as Array<{id?: string, name: string, description?: string}>).map(c => ({
      ...c,
      id: c.id || uuidv4()
    }))
  }
  if (updates.settings && Array.isArray(updates.settings)) {
    updates.settings = (updates.settings as Array<{id?: string, name: string, description?: string}>).map(s => ({
      ...s,
      id: s.id || uuidv4()
    }))
  }
  if (updates.circumstances && Array.isArray(updates.circumstances)) {
    updates.circumstances = (updates.circumstances as Array<{id?: string, name: string, description?: string}>).map(c => ({
      ...c,
      id: c.id || uuidv4()
    }))
  }

  // Apply updates
  const updatedPack = { ...pack, ...updates, updatedAt: Date.now() }
  await db.set(Collections.CARD_PACKS, packId, updatedPack)

  return { success: true }
}

/**
 * Delete a card pack
 */
export async function deleteCardPack(packId: string): Promise<{ success: boolean, error?: string }> {
  const db = getDatabase()
  const pack = await db.get<CardPack>(Collections.CARD_PACKS, packId)

  if (!pack) {
    return { success: false, error: 'Pack not found' }
  }

  if (pack.isBuiltIn) {
    return { success: false, error: 'Cannot delete built-in packs' }
  }

  await db.delete(Collections.CARD_PACKS, packId)

  console.log(`Deleted card pack: ${packId}`)

  return { success: true }
}

/**
 * Increment download count for a pack
 */
export async function incrementDownloads(packId: string): Promise<void> {
  const db = getDatabase()
  const pack = await db.get<CardPack>(Collections.CARD_PACKS, packId)

  if (pack && !pack.isBuiltIn) {
    await db.update(Collections.CARD_PACKS, packId, { downloads: pack.downloads + 1 })
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
 * Create some example themed packs
 */
export async function createExamplePacks(): Promise<void> {
  const db = getDatabase()

  // Check if example packs already exist by their deterministic IDs
  const officePack = await db.get<CardPack>(Collections.CARD_PACKS, EXAMPLE_PACK_IDS.office)
  const scifiPack = await db.get<CardPack>(Collections.CARD_PACKS, EXAMPLE_PACK_IDS.scifi)

  if (officePack && scifiPack) {
    console.log('Example packs already exist, skipping creation')
    return
  }

  // Office Comedy Pack
  if (!officePack) {
    const newOfficePack: CardPack = {
      id: EXAMPLE_PACK_IDS.office,
      name: 'Office Comedy',
      description: 'Characters and scenarios from your favorite workplace sitcoms',
      author: 'Plot Twists',
      theme: 'office',
      isMature: false,
      isBuiltIn: false,
      isPublic: true,
      characters: [
        { id: 'office-char-1', name: 'The Overbearing Boss', description: 'Thinks they\'re everyone\'s best friend' },
        { id: 'office-char-2', name: 'The IT Guy', description: 'Has seen things in the server logs' },
        { id: 'office-char-3', name: 'HR Representative', description: 'Has to deal with everyone\'s nonsense' },
        { id: 'office-char-4', name: 'The Intern', description: 'Way too eager to please' },
        { id: 'office-char-5', name: 'The Slacker', description: 'Master of looking busy' },
        { id: 'office-char-6', name: 'The Office Gossip', description: 'Knows everyone\'s secrets' }
      ],
      settings: [
        { id: 'office-set-1', name: 'The Break Room', description: 'Where passive-aggressive notes live' },
        { id: 'office-set-2', name: 'Conference Room B', description: 'The one with the broken projector' },
        { id: 'office-set-3', name: 'The Parking Lot', description: 'After-hours drama central' },
        { id: 'office-set-4', name: 'The Supply Closet', description: 'Someone\'s hiding in here' }
      ],
      circumstances: [
        { id: 'office-circ-1', name: 'Planning the office party', description: 'Budget: $50' },
        { id: 'office-circ-2', name: 'Someone stole lunch from the fridge', description: 'Again.' },
        { id: 'office-circ-3', name: 'The printer is jammed', description: 'Deadline in 10 minutes' },
        { id: 'office-circ-4', name: 'Mandatory team building exercise', description: 'Trust falls incoming' }
      ],
      downloads: 0,
      rating: 4.5,
      ratingCount: 10,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await db.set(Collections.CARD_PACKS, EXAMPLE_PACK_IDS.office, newOfficePack)
    console.log('Created Office Comedy example pack')
  }

  // Sci-Fi Pack
  if (!scifiPack) {
    const newScifiPack: CardPack = {
      id: EXAMPLE_PACK_IDS.scifi,
      name: 'Sci-Fi Adventures',
      description: 'Explore strange new worlds with familiar tropes',
      author: 'Plot Twists',
      theme: 'scifi',
      isMature: false,
      isBuiltIn: false,
      isPublic: true,
      characters: [
        { id: 'scifi-char-1', name: 'The Grizzled Captain', description: 'Has seen too many red shirts die' },
        { id: 'scifi-char-2', name: 'The Anxious Robot', description: 'Calculates the odds of doom constantly' },
        { id: 'scifi-char-3', name: 'The Alien Ambassador', description: 'Confused by human customs' },
        { id: 'scifi-char-4', name: 'The Mad Scientist', description: 'It\'s not a death ray, it\'s a research device' },
        { id: 'scifi-char-5', name: 'The Space Pirate', description: 'Yo ho ho and a bottle of... space rum?' }
      ],
      settings: [
        { id: 'scifi-set-1', name: 'The Bridge', description: 'Everyone stands instead of sitting' },
        { id: 'scifi-set-2', name: 'Alien Cantina', description: 'No droids allowed' },
        { id: 'scifi-set-3', name: 'Space Station Customs', description: 'Please declare all contraband' },
        { id: 'scifi-set-4', name: 'Escape Pod', description: 'Fits two uncomfortably' }
      ],
      circumstances: [
        { id: 'scifi-circ-1', name: 'First contact with new species', description: 'They communicate through interpretive dance' },
        { id: 'scifi-circ-2', name: 'Ship\'s AI has gone rogue', description: 'It just wants to play chess' },
        { id: 'scifi-circ-3', name: 'Translating an ancient alien text', description: 'It might be a recipe' }
      ],
      downloads: 0,
      rating: 4.3,
      ratingCount: 8,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await db.set(Collections.CARD_PACKS, EXAMPLE_PACK_IDS.scifi, newScifiPack)
    console.log('Created Sci-Fi Adventures example pack')
  }
}
