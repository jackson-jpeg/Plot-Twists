import {
  createRoomSchema,
  joinRoomSchema,
  submitCardsSchema,
  submitVoteSchema,
  createCardPackSchema,
} from '@/lib/schema'

describe('createRoomSchema', () => {
  it('accepts valid input', () => {
    const result = createRoomSchema.parse({
      isPublic: true,
      allowSpectators: false,
      comedyStyle: 'slapstick',
      scriptLength: 'short',
      difficulty: 'hard',
      matureContent: true,
    })
    expect(result.isPublic).toBe(true)
    expect(result.allowSpectators).toBe(false)
    expect(result.scriptLength).toBe('short')
    expect(result.difficulty).toBe('hard')
  })

  it('applies defaults for missing fields', () => {
    const result = createRoomSchema.parse({})
    expect(result.isPublic).toBe(false)
    expect(result.allowSpectators).toBe(true)
    expect(result.scriptLength).toBe('medium')
    expect(result.difficulty).toBe('medium')
    expect(result.matureContent).toBe(false)
  })
})

describe('joinRoomSchema', () => {
  it('accepts valid input', () => {
    const result = joinRoomSchema.parse({ roomCode: 'abc', nickname: 'Alice' })
    expect(result.roomCode).toBe('ABC')
    expect(result.nickname).toBe('Alice')
  })

  it('uppercases room code', () => {
    const result = joinRoomSchema.parse({ roomCode: 'xyz', nickname: 'Bob' })
    expect(result.roomCode).toBe('XYZ')
  })

  it('trims nickname', () => {
    const result = joinRoomSchema.parse({ roomCode: 'ABC', nickname: '  Charlie  ' })
    expect(result.nickname).toBe('Charlie')
  })

  it('rejects empty nickname', () => {
    expect(() =>
      joinRoomSchema.parse({ roomCode: 'ABC', nickname: '' })
    ).toThrow('Nickname is required')
  })

  it('rejects nickname longer than 50 characters', () => {
    expect(() =>
      joinRoomSchema.parse({ roomCode: 'ABC', nickname: 'A'.repeat(51) })
    ).toThrow('Nickname too long')
  })
})

describe('submitCardsSchema', () => {
  it('accepts valid input with all fields', () => {
    const result = submitCardsSchema.parse({
      character: 'Pirate',
      setting: 'Space station',
      circumstance: 'During a wedding',
    })
    expect(result.character).toBe('Pirate')
    expect(result.setting).toBe('Space station')
    expect(result.circumstance).toBe('During a wedding')
  })

  it('accepts valid input with only character', () => {
    const result = submitCardsSchema.parse({ character: 'Ninja' })
    expect(result.character).toBe('Ninja')
    expect(result.setting).toBeUndefined()
    expect(result.circumstance).toBeUndefined()
  })
})

describe('submitVoteSchema', () => {
  it('accepts valid input', () => {
    const result = submitVoteSchema.parse({ targetPlayerId: 'player-123' })
    expect(result.targetPlayerId).toBe('player-123')
  })

  it('rejects empty targetPlayerId', () => {
    expect(() =>
      submitVoteSchema.parse({ targetPlayerId: '' })
    ).toThrow('Must select a player')
  })
})

describe('createCardPackSchema', () => {
  const validPack = {
    name: 'Sci-Fi Pack',
    description: 'A space-themed pack',
    theme: 'sci-fi',
    characters: [
      { name: 'Alien', description: 'From Mars' },
      { name: 'Robot' },
      { name: 'Captain' },
    ],
    settings: [{ name: 'Space Station' }],
    circumstances: [{ name: 'During a meteor shower' }],
  }

  it('accepts valid input', () => {
    const result = createCardPackSchema.parse(validPack)
    expect(result.name).toBe('Sci-Fi Pack')
    expect(result.characters).toHaveLength(3)
    expect(result.isMature).toBe(false)
  })

  it('rejects fewer than 3 characters', () => {
    expect(() =>
      createCardPackSchema.parse({
        ...validPack,
        characters: [{ name: 'Alien' }, { name: 'Robot' }],
      })
    ).toThrow('Need at least 3 characters')
  })

  it('defaults isMature to false', () => {
    const result = createCardPackSchema.parse(validPack)
    expect(result.isMature).toBe(false)
  })
})
