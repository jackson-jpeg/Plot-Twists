/**
 * Card Pack Service
 * Manages custom card packs - creation, storage, and retrieval
 */

import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import type { CardPack, CardPackMetadata, Card } from '../../lib/types'

// In-memory storage for card packs (persisted to JSON file)
const cardPacks = new Map<string, CardPack>()

// Path to card packs data file
const DATA_DIR = path.join(process.cwd(), 'data')
const PACKS_FILE = path.join(DATA_DIR, 'cardpacks.json')

// Built-in pack ID (standard content from content.ts)
export const STANDARD_PACK_ID = 'standard'

/**
 * Initialize the card pack service
 */
export function initializeCardPackService(): void {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  // Load existing packs from file
  loadPacksFromFile()

  // Create standard pack reference if it doesn't exist
  if (!cardPacks.has(STANDARD_PACK_ID)) {
    const standardPack: CardPack = {
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
    cardPacks.set(STANDARD_PACK_ID, standardPack)
  }

  console.log(`Card Pack Service initialized with ${cardPacks.size} packs`)
}

/**
 * Load packs from JSON file
 */
function loadPacksFromFile(): void {
  try {
    if (fs.existsSync(PACKS_FILE)) {
      const data = fs.readFileSync(PACKS_FILE, 'utf-8')
      const packs: CardPack[] = JSON.parse(data)
      for (const pack of packs) {
        cardPacks.set(pack.id, pack)
      }
      console.log(`Loaded ${packs.length} card packs from file`)
    }
  } catch (error) {
    console.error('Error loading card packs from file:', error)
  }
}

/**
 * Save packs to JSON file
 */
function savePacksToFile(): void {
  try {
    const packs = Array.from(cardPacks.values()).filter(p => !p.isBuiltIn)
    fs.writeFileSync(PACKS_FILE, JSON.stringify(packs, null, 2))
  } catch (error) {
    console.error('Error saving card packs to file:', error)
  }
}

/**
 * Get all available card packs (metadata only)
 */
export function listCardPacks(includePrivate: boolean = false): CardPackMetadata[] {
  const packs: CardPackMetadata[] = []

  for (const pack of cardPacks.values()) {
    if (!pack.isPublic && !includePrivate) continue

    packs.push({
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

  // Sort by built-in first, then by rating
  return packs.sort((a, b) => {
    if (a.isBuiltIn !== b.isBuiltIn) return a.isBuiltIn ? -1 : 1
    return b.rating - a.rating
  })
}

/**
 * Get a specific card pack by ID
 */
export function getCardPack(packId: string): CardPack | null {
  return cardPacks.get(packId) || null
}

/**
 * Get cards from a pack (or standard content if standard pack)
 */
export function getPackCards(packId: string, isMature: boolean): {
  characters: Card[],
  settings: Card[],
  circumstances: Card[]
} | null {
  const pack = cardPacks.get(packId)
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
export function createCardPack(
  packData: Omit<CardPack, 'id' | 'downloads' | 'rating' | 'ratingCount' | 'createdAt' | 'updatedAt'>
): { success: boolean, packId?: string, error?: string } {
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

  cardPacks.set(packId, newPack)
  savePacksToFile()

  console.log(`Created new card pack: ${newPack.name} (${packId})`)

  return { success: true, packId }
}

/**
 * Update an existing card pack
 */
export function updateCardPack(
  packId: string,
  updates: Partial<Omit<CardPack, 'id' | 'isBuiltIn' | 'createdAt'>>
): { success: boolean, error?: string } {
  const pack = cardPacks.get(packId)
  if (!pack) {
    return { success: false, error: 'Pack not found' }
  }

  if (pack.isBuiltIn) {
    return { success: false, error: 'Cannot modify built-in packs' }
  }

  // Apply updates
  Object.assign(pack, updates, { updatedAt: Date.now() })
  savePacksToFile()

  return { success: true }
}

/**
 * Delete a card pack
 */
export function deleteCardPack(packId: string): { success: boolean, error?: string } {
  const pack = cardPacks.get(packId)
  if (!pack) {
    return { success: false, error: 'Pack not found' }
  }

  if (pack.isBuiltIn) {
    return { success: false, error: 'Cannot delete built-in packs' }
  }

  cardPacks.delete(packId)
  savePacksToFile()

  console.log(`Deleted card pack: ${packId}`)

  return { success: true }
}

/**
 * Increment download count for a pack
 */
export function incrementDownloads(packId: string): void {
  const pack = cardPacks.get(packId)
  if (pack && !pack.isBuiltIn) {
    pack.downloads++
    savePacksToFile()
  }
}

/**
 * Rate a card pack
 */
export function rateCardPack(
  packId: string,
  rating: number
): { success: boolean, newRating?: number, error?: string } {
  const pack = cardPacks.get(packId)
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
  pack.ratingCount++
  pack.rating = Math.round((totalRating / pack.ratingCount) * 10) / 10

  savePacksToFile()

  return { success: true, newRating: pack.rating }
}

/**
 * Search card packs by name or theme
 */
export function searchCardPacks(query: string): CardPackMetadata[] {
  const lowerQuery = query.toLowerCase()
  const results: CardPackMetadata[] = []

  for (const pack of cardPacks.values()) {
    if (!pack.isPublic) continue

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
export function getFeaturedPacks(limit: number = 5): CardPackMetadata[] {
  return listCardPacks()
    .filter(p => !p.isBuiltIn)
    .sort((a, b) => (b.downloads * 0.7 + b.rating * 0.3) - (a.downloads * 0.7 + a.rating * 0.3))
    .slice(0, limit)
}

/**
 * Create some example themed packs
 */
export function createExamplePacks(): void {
  // Check if we already have example packs
  if (cardPacks.size > 1) return

  // Office Comedy Pack
  createCardPack({
    name: 'Office Comedy',
    description: 'Characters and scenarios from your favorite workplace sitcoms',
    author: 'Plot Twists',
    theme: 'office',
    isMature: false,
    isPublic: true,
    characters: [
      { id: uuidv4(), name: 'The Overbearing Boss', description: 'Thinks they\'re everyone\'s best friend' },
      { id: uuidv4(), name: 'The IT Guy', description: 'Has seen things in the server logs' },
      { id: uuidv4(), name: 'HR Representative', description: 'Has to deal with everyone\'s nonsense' },
      { id: uuidv4(), name: 'The Intern', description: 'Way too eager to please' },
      { id: uuidv4(), name: 'The Slacker', description: 'Master of looking busy' },
      { id: uuidv4(), name: 'The Office Gossip', description: 'Knows everyone\'s secrets' }
    ],
    settings: [
      { id: uuidv4(), name: 'The Break Room', description: 'Where passive-aggressive notes live' },
      { id: uuidv4(), name: 'Conference Room B', description: 'The one with the broken projector' },
      { id: uuidv4(), name: 'The Parking Lot', description: 'After-hours drama central' },
      { id: uuidv4(), name: 'The Supply Closet', description: 'Someone\'s hiding in here' }
    ],
    circumstances: [
      { id: uuidv4(), name: 'Planning the office party', description: 'Budget: $50' },
      { id: uuidv4(), name: 'Someone stole lunch from the fridge', description: 'Again.' },
      { id: uuidv4(), name: 'The printer is jammed', description: 'Deadline in 10 minutes' },
      { id: uuidv4(), name: 'Mandatory team building exercise', description: 'Trust falls incoming' }
    ]
  })

  // Sci-Fi Pack
  createCardPack({
    name: 'Sci-Fi Adventures',
    description: 'Explore strange new worlds with familiar tropes',
    author: 'Plot Twists',
    theme: 'scifi',
    isMature: false,
    isPublic: true,
    characters: [
      { id: uuidv4(), name: 'The Grizzled Captain', description: 'Has seen too many red shirts die' },
      { id: uuidv4(), name: 'The Anxious Robot', description: 'Calculates the odds of doom constantly' },
      { id: uuidv4(), name: 'The Alien Ambassador', description: 'Confused by human customs' },
      { id: uuidv4(), name: 'The Mad Scientist', description: 'It\'s not a death ray, it\'s a research device' },
      { id: uuidv4(), name: 'The Space Pirate', description: 'Yo ho ho and a bottle of... space rum?' }
    ],
    settings: [
      { id: uuidv4(), name: 'The Bridge', description: 'Everyone stands instead of sitting' },
      { id: uuidv4(), name: 'Alien Cantina', description: 'No droids allowed' },
      { id: uuidv4(), name: 'Space Station Customs', description: 'Please declare all contraband' },
      { id: uuidv4(), name: 'Escape Pod', description: 'Fits two uncomfortably' }
    ],
    circumstances: [
      { id: uuidv4(), name: 'First contact with new species', description: 'They communicate through interpretive dance' },
      { id: uuidv4(), name: 'Ship\'s AI has gone rogue', description: 'It just wants to play chess' },
      { id: uuidv4(), name: 'Translating an ancient alien text', description: 'It might be a recipe' }
    ]
  })

  console.log('Created example card packs')
}

// Initialize on module load
initializeCardPackService()
createExamplePacks()
