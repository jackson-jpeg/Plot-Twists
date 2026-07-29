/**
 * Card catalog — IP layer 2.
 *
 * The single place where a client-supplied card reference becomes text the
 * server is willing to put in a model prompt.
 *
 * The invariant, stated once so it can be checked:
 *
 *   Every string in a `CardSelection` is a value the server read out of its own
 *   catalog. No byte of `submit_cards` input is ever interpolated into a prompt,
 *   stored in gameHistory, or rendered on the results screen.
 *
 * This is what makes the Chunk 4 catalog rewrite (layer 1) mean anything. A
 * player typing "Shrek" cannot get "Shrek" into a prompt, because free text has
 * no path in — the wire format is `CardSelectionInput`, which is IDs.
 *
 * See AUDIT.md → "IP layer 2".
 */

import { CHARACTERS, SETTINGS, CIRCUMSTANCES } from '@/lib/content'
import type { ContentItem } from '@/lib/content-types'
import type {
  AvailableCards,
  Card,
  CardOption,
  CardPack,
  CardSelection,
  CardSelectionInput,
  Room,
} from '@/lib/types'
import { getDatabase, Collections } from '../db'
import { STANDARD_PACK_ID } from './cardpack.service'
import { logger } from '@/lib/logger'

/** How many cards each player is dealt per category outside SOLO. */
export const HAND_SIZE = 8

type Kind = 'characters' | 'settings' | 'circumstances'

interface CatalogSlice {
  characters: CardOption[]
  settings: CardOption[]
  circumstances: CardOption[]
}

// ---------------------------------------------------------------------------
// Standard catalog
// ---------------------------------------------------------------------------

function toOptions(items: ContentItem[], isMature: boolean): CardOption[] {
  return items
    .filter((item) => isMature || item.maturity === 'safe')
    .map((item) => ({ id: item.id, name: item.name }))
}

function standardCatalog(isMature: boolean): CatalogSlice {
  return {
    characters: toOptions(CHARACTERS, isMature),
    settings: toOptions(SETTINGS, isMature),
    circumstances: toOptions(CIRCUMSTANCES, isMature),
  }
}

// ---------------------------------------------------------------------------
// Custom packs
// ---------------------------------------------------------------------------

function packToOptions(cards: Card[]): CardOption[] {
  return cards
    .filter((card) => typeof card?.id === 'string' && card.id.length > 0)
    .map((card) => ({ id: card.id, name: card.name }))
}

/**
 * The full set of cards legal for this room, by ID.
 *
 * NOTE the pack path is reachable but currently unexercised in play: every
 * `available_cards` emit site deals from the standard catalog regardless of
 * `room.cardPackId`. Recorded in AUDIT.md rather than fixed here — dealing the
 * selected pack is a behaviour change, not an IP fix.
 */
export async function getRoomCatalog(room: Room): Promise<CatalogSlice> {
  const packId = room.cardPackId
  if (!packId || packId === STANDARD_PACK_ID) {
    return standardCatalog(room.isMature)
  }

  try {
    const pack = await getDatabase().get<CardPack>(Collections.CARD_PACKS, packId)
    if (!pack || pack.isBuiltIn) return standardCatalog(room.isMature)

    return {
      characters: packToOptions(pack.characters),
      settings: packToOptions(pack.settings),
      circumstances: packToOptions(pack.circumstances),
    }
  } catch (error) {
    // Fail closed onto the standard catalog rather than onto "accept anything".
    logger.warn(`Card catalog: pack ${packId} unreadable, falling back to standard`, error)
    return standardCatalog(room.isMature)
  }
}

// ---------------------------------------------------------------------------
// Dealing
// ---------------------------------------------------------------------------

function sample(options: CardOption[], size: number): CardOption[] {
  const pool = [...options]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, size)
}

/**
 * Cards to send to the room.
 *
 * SOLO gets the whole catalog (browse + search). Everything else gets a random
 * hand, which is a pacing decision, not a security boundary — see
 * `resolveCardSelection`.
 */
export async function dealCards(room: Room): Promise<AvailableCards> {
  const catalog = await getRoomCatalog(room)
  if (room.gameMode === 'SOLO') return catalog

  return {
    characters: sample(catalog.characters, HAND_SIZE),
    settings: sample(catalog.settings, HAND_SIZE),
    circumstances: sample(catalog.circumstances, HAND_SIZE),
  }
}

// ---------------------------------------------------------------------------
// Resolution — the boundary
// ---------------------------------------------------------------------------

function findById(options: CardOption[], id: unknown): CardOption | null {
  if (typeof id !== 'string' || id.length === 0 || id.length > 128) return null
  return options.find((option) => option.id === id) ?? null
}

/**
 * Resolve a client's `CardSelectionInput` into a `CardSelection`.
 *
 * Returns null unless all three IDs resolve. The returned strings are the
 * catalog's, not the caller's — that is the whole point, and it is why this
 * returns a fresh object rather than spreading anything from `input`.
 *
 * Resolution is against the room's full catalog, not the hand the player was
 * dealt. Submitting an undealt-but-real card is a fairness bug, not an IP one;
 * it needs per-player hand state on the room and is recorded separately.
 */
export async function resolveCardSelection(
  room: Room,
  input: CardSelectionInput
): Promise<CardSelection | null> {
  const catalog = await getRoomCatalog(room)

  const character = findById(catalog.characters, input.characterId)
  const setting = findById(catalog.settings, input.settingId)
  const circumstance = findById(catalog.circumstances, input.circumstanceId)

  if (!character || !setting || !circumstance) return null

  return {
    character: character.name,
    setting: setting.name,
    circumstance: circumstance.name,
  }
}

/**
 * Reverse a stored `CardSelection` back into pickable options, for the
 * "Your Scene" recap after a mid-round reconnect.
 *
 * This looks up by NAME, which is safe here and only here: the input is a name
 * the server itself wrote into `room.selections` after resolving an ID. It is
 * not client input. Never call this on anything that came off the wire.
 *
 * A name that no longer resolves (pack edited mid-game) yields an empty id,
 * which fails ID validation if it is ever submitted — fails closed.
 */
export async function toSelectedCards(
  room: Room,
  selection: CardSelection
): Promise<{ character: CardOption | null; setting: CardOption | null; circumstance: CardOption | null }> {
  const catalog = await getRoomCatalog(room)
  const byName = (options: CardOption[], name: string): CardOption =>
    options.find((option) => option.name === name) ?? { id: '', name }

  return {
    character: byName(catalog.characters, selection.character),
    setting: byName(catalog.settings, selection.setting),
    circumstance: byName(catalog.circumstances, selection.circumstance),
  }
}

/** Exported for tests that need a deterministic non-room catalog. */
export function getStandardCatalog(isMature: boolean): CatalogSlice {
  return standardCatalog(isMature)
}

export type { Kind }
