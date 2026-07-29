/**
 * Card Catalog Service — IP layer 2.
 *
 * This is the half of layer 2 that `validation.test.ts` cannot cover. Shape
 * validation proves a payload is three IDs; only this proves those IDs name
 * real cards, and — the part that actually matters — that the strings which
 * come back out are the SERVER'S, not the caller's.
 *
 * Chunk 4 done-criterion: "a player submitting the literal string 'Shrek' is
 * rejected at the server". Both halves are asserted here and in validation.test.
 */

import type { GameState, Player, Room } from '../../../../lib/types'
import { CHARACTERS, SETTINGS, CIRCUMSTANCES } from '../../../../lib/content'

const mockGet = jest.fn()
jest.mock('../../../../server/db', () => ({
  getDatabase: () => ({ get: mockGet }),
  Collections: { CARD_PACKS: 'cardPacks' },
}))

import {
  dealCards,
  getStandardCatalog,
  resolveCardSelection,
  toSelectedCards,
  HAND_SIZE,
} from '../../../../server/services/cardCatalog.service'

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    code: 'ABCD',
    host: { id: 'host-1', nickname: 'Host', isHost: true, socketId: 'sock-1', role: 'HOST', hasSubmittedSelection: false, hasSubmittedVote: false } as Player,
    players: new Map(),
    gameState: 'SELECTION' as GameState,
    isMature: false,
    gameMode: 'ENSEMBLE',
    votes: new Map(),
    selections: new Map(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    currentLineIndex: 0,
    isPaused: false,
    ...overrides,
  } as Room
}

// Real catalog entries, looked up rather than hardcoded, so a Layer 1 catalog
// rewrite cannot silently turn these tests vacuous by removing the ids.
const aCharacter = CHARACTERS.find(c => c.maturity === 'safe')!
const aSetting = SETTINGS.find(s => s.maturity === 'safe')!
const aCircumstance = CIRCUMSTANCES.find(c => c.maturity === 'safe')!

beforeEach(() => {
  jest.clearAllMocks()
})

describe('resolveCardSelection — the boundary', () => {
  it('rejects the literal string "Shrek" as a character id', async () => {
    // The Chunk 4 done-criterion, at the catalog layer. Even if a caller gets
    // past shape validation, a name is not an id and resolves to nothing.
    const room = makeRoom()
    const result = await resolveCardSelection(room, {
      characterId: 'Shrek',
      settingId: aSetting.id,
      circumstanceId: aCircumstance.id,
    })
    expect(result).toBeNull()
  })

  it('rejects an id that is well-formed but not in the catalog', async () => {
    const room = makeRoom()
    expect(await resolveCardSelection(room, {
      characterId: 'char-not-a-real-card',
      settingId: aSetting.id,
      circumstanceId: aCircumstance.id,
    })).toBeNull()
  })

  it('rejects when only one of the three misses', async () => {
    const room = makeRoom()
    expect(await resolveCardSelection(room, {
      characterId: aCharacter.id,
      settingId: aSetting.id,
      circumstanceId: 'circ-nonexistent',
    })).toBeNull()
  })

  it('returns the CATALOG name, never a caller-supplied string', async () => {
    // The invariant. If this ever returns something the caller sent, layer 1 is
    // cosmetic again and a player can put any text in a Claude prompt.
    const room = makeRoom()
    const result = await resolveCardSelection(room, {
      characterId: aCharacter.id,
      settingId: aSetting.id,
      circumstanceId: aCircumstance.id,
    })
    expect(result).toEqual({
      character: aCharacter.name,
      setting: aSetting.name,
      circumstance: aCircumstance.name,
    })
    expect(Object.keys(result!)).toEqual(['character', 'setting', 'circumstance'])
  })

  it('will not resolve a mature card for a non-mature room', async () => {
    const matureCharacter = CHARACTERS.find(c => c.maturity === 'mature')
    if (!matureCharacter) return // catalog may legitimately have none after layer 1
    const room = makeRoom({ isMature: false })
    expect(await resolveCardSelection(room, {
      characterId: matureCharacter.id,
      settingId: aSetting.id,
      circumstanceId: aCircumstance.id,
    })).toBeNull()
  })

  it('resolves against a custom pack when the room has one', async () => {
    mockGet.mockResolvedValue({
      id: 'pack-1',
      isBuiltIn: false,
      characters: [{ id: 'p-char-1', name: 'The Micromanaging Boss' }],
      settings: [{ id: 'p-set-1', name: 'The Break Room' }],
      circumstances: [{ id: 'p-circ-1', name: 'Someone stole lunch' }],
    })
    const room = makeRoom({ cardPackId: 'pack-1' })

    expect(await resolveCardSelection(room, {
      characterId: 'p-char-1', settingId: 'p-set-1', circumstanceId: 'p-circ-1',
    })).toEqual({
      character: 'The Micromanaging Boss',
      setting: 'The Break Room',
      circumstance: 'Someone stole lunch',
    })

    // ...and a standard-catalog id is NOT valid in a custom-pack room.
    expect(await resolveCardSelection(room, {
      characterId: aCharacter.id, settingId: 'p-set-1', circumstanceId: 'p-circ-1',
    })).toBeNull()
  })

  it('fails closed onto the standard catalog when the pack cannot be read', async () => {
    mockGet.mockRejectedValue(new Error('db down'))
    const room = makeRoom({ cardPackId: 'pack-1' })

    // Falls back to standard — it does NOT fall back to accepting anything.
    expect(await resolveCardSelection(room, {
      characterId: 'p-char-1', settingId: 'p-set-1', circumstanceId: 'p-circ-1',
    })).toBeNull()
    expect(await resolveCardSelection(room, {
      characterId: aCharacter.id, settingId: aSetting.id, circumstanceId: aCircumstance.id,
    })).not.toBeNull()
  })
})

describe('dealCards', () => {
  it('deals a bounded hand outside SOLO', async () => {
    const cards = await dealCards(makeRoom({ gameMode: 'ENSEMBLE' }))
    expect(cards.characters).toHaveLength(HAND_SIZE)
    expect(cards.settings).toHaveLength(HAND_SIZE)
    expect(cards.circumstances).toHaveLength(HAND_SIZE)
  })

  it('deals the whole catalog in SOLO', async () => {
    const cards = await dealCards(makeRoom({ gameMode: 'SOLO' }))
    expect(cards.characters).toHaveLength(getStandardCatalog(false).characters.length)
  })

  it('deals {id, name} pairs and nothing else', async () => {
    // The client submits the id. If dealing ever stopped carrying ids, the whole
    // submit path would break — this pins the wire shape.
    const cards = await dealCards(makeRoom())
    for (const card of cards.characters) {
      expect(Object.keys(card).sort()).toEqual(['id', 'name'])
      expect(typeof card.id).toBe('string')
      expect(card.id.length).toBeGreaterThan(0)
    }
  })

  it('never deals mature cards to a non-mature room', async () => {
    const matureIds = new Set(CHARACTERS.filter(c => c.maturity === 'mature').map(c => c.id))
    const cards = await dealCards(makeRoom({ isMature: false, gameMode: 'SOLO' }))
    expect(cards.characters.some(c => matureIds.has(c.id))).toBe(false)
  })
})

describe('toSelectedCards — recap after reconnect', () => {
  it('reverses stored names back into pickable options', async () => {
    const room = makeRoom()
    const restored = await toSelectedCards(room, {
      character: aCharacter.name,
      setting: aSetting.name,
      circumstance: aCircumstance.name,
    })
    expect(restored.character).toEqual({ id: aCharacter.id, name: aCharacter.name })
  })

  it('yields an unusable empty id when a name no longer resolves', async () => {
    // Fails closed: an empty id cannot pass validateCardSelectionInput if it is
    // ever fed back in on a resubmit.
    const room = makeRoom()
    const restored = await toSelectedCards(room, {
      character: 'A Character That Was Deleted',
      setting: aSetting.name,
      circumstance: aCircumstance.name,
    })
    expect(restored.character).toEqual({ id: '', name: 'A Character That Was Deleted' })
  })
})
