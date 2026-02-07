/**
 * Credit Service Tests
 * Tests the two-bucket credit system: free weekly + banked paid credits.
 */

import { checkAndDeductCredit, getCredits, addBankedCredits, ensureCreditsExist } from '../../../../server/services/credit.service'
import { FREE_WEEKLY_LIMIT, ONE_WEEK_MS } from '../../../../lib/credits'
import type { UserProfile, CreditBalance } from '../../../../lib/types'

// Mock the database module
const mockDb = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(() => true),
  batchSet: jest.fn(),
  batchDelete: jest.fn(),
  getAll: jest.fn(),
  count: jest.fn(),
}

jest.mock('../../../../server/db', () => ({
  getDatabase: () => mockDb,
  Collections: {
    USERS: 'users',
    PLAYER_STATS: 'playerStats',
    GAME_HISTORY: 'gameHistory',
    CARD_PACKS: 'cardPacks',
    ROOMS: 'rooms',
    MIGRATIONS: 'migrations'
  }
}))

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    credits: {
      free: { used: 0, limit: FREE_WEEKLY_LIMIT, lastResetDate: new Date().toISOString() },
      banked: 0
    },
    lifetimeSpend: 0,
    ...overrides
  } as UserProfile
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('checkAndDeductCredit', () => {
  it('should deduct from free credits first', async () => {
    const user = makeUser()
    mockDb.get.mockResolvedValue(user)
    mockDb.update.mockResolvedValue(undefined)

    const result = await checkAndDeductCredit('user-1')

    expect(result.success).toBe(true)
    expect(result.source).toBe('free')
    expect(result.remaining).toBeDefined()
    expect(mockDb.update).toHaveBeenCalledWith('users', 'user-1', expect.objectContaining({
      credits: expect.objectContaining({
        free: expect.objectContaining({ used: 1 })
      })
    }))
  })

  it('should deduct from banked credits when free are exhausted', async () => {
    const user = makeUser({
      credits: {
        free: { used: FREE_WEEKLY_LIMIT, limit: FREE_WEEKLY_LIMIT, lastResetDate: new Date().toISOString() },
        banked: 10
      }
    })
    mockDb.get.mockResolvedValue(user)
    mockDb.update.mockResolvedValue(undefined)

    const result = await checkAndDeductCredit('user-1')

    expect(result.success).toBe(true)
    expect(result.source).toBe('banked')
    expect(mockDb.update).toHaveBeenCalledWith('users', 'user-1', expect.objectContaining({
      credits: expect.objectContaining({ banked: 9 })
    }))
  })

  it('should fail when both buckets are empty', async () => {
    const user = makeUser({
      credits: {
        free: { used: FREE_WEEKLY_LIMIT, limit: FREE_WEEKLY_LIMIT, lastResetDate: new Date().toISOString() },
        banked: 0
      }
    })
    mockDb.get.mockResolvedValue(user)

    const result = await checkAndDeductCredit('user-1')

    expect(result.success).toBe(false)
    expect(result.source).toBeUndefined()
    expect(result.remaining).toBeUndefined()
  })

  it('should apply lazy weekly reset before deducting', async () => {
    const weekAgo = new Date(Date.now() - ONE_WEEK_MS - 1000).toISOString()
    const user = makeUser({
      credits: {
        free: { used: FREE_WEEKLY_LIMIT, limit: FREE_WEEKLY_LIMIT, lastResetDate: weekAgo },
        banked: 0
      }
    })
    mockDb.get.mockResolvedValue(user)
    mockDb.update.mockResolvedValue(undefined)

    const result = await checkAndDeductCredit('user-1')

    // After reset, free credits should be available again
    expect(result.success).toBe(true)
    expect(result.source).toBe('free')
  })
})

describe('getCredits', () => {
  it('should return formatted balance', async () => {
    const user = makeUser({
      credits: {
        free: { used: 2, limit: FREE_WEEKLY_LIMIT, lastResetDate: new Date().toISOString() },
        banked: 10
      }
    })
    mockDb.get.mockResolvedValue(user)

    const balance = await getCredits('user-1')

    expect(balance.free).toBe(FREE_WEEKLY_LIMIT - 2)
    expect(balance.banked).toBe(10)
    expect(balance.total).toBe(FREE_WEEKLY_LIMIT - 2 + 10)
  })

  it('should apply lazy reset and persist', async () => {
    const weekAgo = new Date(Date.now() - ONE_WEEK_MS - 1000).toISOString()
    const user = makeUser({
      credits: {
        free: { used: 5, limit: FREE_WEEKLY_LIMIT, lastResetDate: weekAgo },
        banked: 0
      }
    })
    mockDb.get.mockResolvedValue(user)
    mockDb.update.mockResolvedValue(undefined)

    const balance = await getCredits('user-1')

    expect(balance.free).toBe(FREE_WEEKLY_LIMIT) // Reset: used = 0
    expect(mockDb.update).toHaveBeenCalled() // Should persist the reset
  })
})

describe('addBankedCredits', () => {
  it('should add credits to banked bucket', async () => {
    const user = makeUser({ credits: { free: { used: 0, limit: 5, lastResetDate: new Date().toISOString() }, banked: 5 } })
    mockDb.get.mockResolvedValue(user)
    mockDb.update.mockResolvedValue(undefined)

    await addBankedCredits('user-1', 20, 1000)

    expect(mockDb.update).toHaveBeenCalledWith('users', 'user-1', expect.objectContaining({
      credits: expect.objectContaining({ banked: 25 }),
      lifetimeSpend: 1000
    }))
  })

  it('should accumulate lifetime spend', async () => {
    const user = makeUser({ lifetimeSpend: 500, credits: { free: { used: 0, limit: 5, lastResetDate: new Date().toISOString() }, banked: 0 } })
    mockDb.get.mockResolvedValue(user)
    mockDb.update.mockResolvedValue(undefined)

    await addBankedCredits('user-1', 10, 1000)

    expect(mockDb.update).toHaveBeenCalledWith('users', 'user-1', expect.objectContaining({
      lifetimeSpend: 1500
    }))
  })
})

describe('ensureCreditsExist', () => {
  it('should throw for non-existent user', async () => {
    mockDb.get.mockResolvedValue(null)

    await expect(ensureCreditsExist('unknown')).rejects.toThrow('User not found')
  })

  it('should initialize credits for user without them', async () => {
    const user = { uid: 'user-1', email: 'test@test.com' } as UserProfile
    mockDb.get.mockResolvedValue(user)
    mockDb.update.mockResolvedValue(undefined)

    const result = await ensureCreditsExist('user-1')

    expect(result.credits).toBeDefined()
    expect(result.credits.free.used).toBe(0)
    expect(result.credits.free.limit).toBe(FREE_WEEKLY_LIMIT)
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('should not re-initialize existing credits', async () => {
    const user = makeUser()
    mockDb.get.mockResolvedValue(user)

    await ensureCreditsExist('user-1')

    // Should not call update since credits already exist
    expect(mockDb.update).not.toHaveBeenCalled()
  })
})
