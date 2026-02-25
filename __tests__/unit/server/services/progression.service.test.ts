/**
 * Progression Service Tests
 * Tests XP calculation, level computation, weekly challenges, and rewards.
 */

import type { PlayerStats, Progression } from '../../../../lib/types'

const mockGet = jest.fn()
const mockSet = jest.fn()
const mockDb = {
  get: mockGet,
  set: mockSet,
  update: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(() => true),
  batchSet: jest.fn(),
  batchDelete: jest.fn(),
  getAll: jest.fn().mockResolvedValue([]),
  count: jest.fn(),
  runTransaction: jest.fn(),
}

jest.mock('../../../../server/db', () => ({
  getDatabase: () => mockDb,
  Collections: {
    USERS: 'users',
    PLAYER_STATS: 'playerStats',
    GAME_HISTORY: 'gameHistory',
    CARD_PACKS: 'cardPacks',
    ROOMS: 'rooms',
    MIGRATIONS: 'migrations',
    PROGRESSION: 'progression',
    STRIPE_EVENTS: 'stripeEvents',
    PAYMENT_TRANSACTIONS: 'paymentTransactions',
    REFERRAL_EVENTS: 'referralEvents',
  }
}))

import {
  getProgression,
  awardXP,
  getLevelInfo,
  computeGameXPEvents,
  isFirstGameToday,
  claimLevelReward,
} from '../../../../server/services/progression.service'

describe('Progression Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getLevelInfo', () => {
    it('should return level 1 for 0 XP', () => {
      const info = getLevelInfo(0)
      expect(info.level).toBe(1)
      expect(info.title).toBe('Rookie')
      expect(info.progressPercent).toBe(0)
    })

    it('should return level 2 for 100+ XP', () => {
      const info = getLevelInfo(100)
      expect(info.level).toBe(2)
      expect(info.title).toBe('Rookie')
    })

    it('should return Rising Star for level 5+', () => {
      // Level curve: 100*1^1.5 + 100*2^1.5 + 100*3^1.5 + 100*4^1.5 = 100+283+520+800 = 1703
      const info = getLevelInfo(1800)
      expect(info.level).toBeGreaterThanOrEqual(5)
      expect(info.title).toBe('Rising Star')
    })

    it('should return progress percentage correctly', () => {
      const info = getLevelInfo(50)
      expect(info.level).toBe(1)
      expect(info.progressPercent).toBe(50) // 50/100
    })
  })

  describe('getProgression', () => {
    it('should create new progression for unknown player', async () => {
      mockGet.mockResolvedValue(null) // No existing progression or stats

      const progression = await getProgression('new-player')

      expect(mockSet).toHaveBeenCalled()
      expect(progression.playerId).toBe('new-player')
      expect(progression.totalXP).toBe(0)
      expect(progression.level).toBe(1)
      expect(progression.title).toBe('Rookie')
    })

    it('should return existing progression', async () => {
      const existing: Progression = {
        playerId: 'existing-player',
        totalXP: 500,
        level: 3,
        title: 'Rookie',
        xpHistory: [],
        levelRewardsClaimed: [],
        weeklyChallenges: [
          { id: 'play_3', title: 'Triple Feature', description: 'Play 3', target: 3, progress: 1, xpReward: 150, expiresAt: Date.now() + 86400000, completed: false }
        ],
      }
      mockGet.mockResolvedValue(existing)

      const progression = await getProgression('existing-player')
      expect(progression.totalXP).toBe(500)
      expect(progression.level).toBe(3)
    })

    it('should bootstrap from existing stats', async () => {
      mockGet.mockImplementation(async (collection: string) => {
        if (collection === 'progression') return null
        if (collection === 'playerStats') return {
          playerId: 'stats-player',
          gamesPlayed: 10,
          gamesWon: 5,
          totalVotesReceived: 20,
        } as Partial<PlayerStats>
        return null
      })

      const progression = await getProgression('stats-player')
      // 10 games * 50 + 5 wins * 100 + 20 votes * 10 = 500 + 500 + 200 = 1200
      expect(progression.totalXP).toBe(1200)
    })
  })

  describe('awardXP', () => {
    it('should award XP and update level', async () => {
      const existing: Progression = {
        playerId: 'player1',
        totalXP: 90,
        level: 1,
        title: 'Rookie',
        xpHistory: [],
        levelRewardsClaimed: [],
        weeklyChallenges: [],
      }
      mockGet.mockResolvedValue(existing)

      const result = await awardXP('player1', [
        { source: 'game_completed', description: 'Game completed' },
      ])

      expect(result.xpEvents.length).toBe(1)
      expect(result.xpEvents[0].amount).toBe(50)
      expect(result.totalXP).toBe(140)
      expect(result.newLevel).toBe(2) // Crossed 100 XP
      expect(result.oldLevel).toBe(1)
    })

    it('should record multiple XP events', async () => {
      const existing: Progression = {
        playerId: 'player1',
        totalXP: 0,
        level: 1,
        title: 'Rookie',
        xpHistory: [],
        levelRewardsClaimed: [],
        weeklyChallenges: [],
      }
      mockGet.mockResolvedValue(existing)

      const result = await awardXP('player1', [
        { source: 'game_completed', description: 'Game completed' },
        { source: 'game_won', description: 'Won the game' },
      ])

      expect(result.xpEvents.length).toBe(2)
      expect(result.totalXP).toBe(150) // 50 + 100
    })
  })

  describe('computeGameXPEvents', () => {
    it('should include game_completed for all players', () => {
      const events = computeGameXPEvents(false, 0, 0, 0, false, false, false, [])
      expect(events.some(e => e.source === 'game_completed')).toBe(true)
    })

    it('should include game_won for winners', () => {
      const events = computeGameXPEvents(true, 0, 0, 0, false, false, false, [])
      expect(events.some(e => e.source === 'game_won')).toBe(true)
    })

    it('should include votes_received XP', () => {
      const events = computeGameXPEvents(false, 3, 0, 0, false, false, false, [])
      const voteEvent = events.find(e => e.source === 'votes_received')
      expect(voteEvent).toBeDefined()
      expect(voteEvent!.amount).toBe(30) // 3 * 10
    })

    it('should include win_streak bonus for streaks > 2', () => {
      const events = computeGameXPEvents(false, 0, 0, 4, false, false, false, [])
      const streakEvent = events.find(e => e.source === 'win_streak')
      expect(streakEvent).toBeDefined()
      expect(streakEvent!.amount).toBe(50) // (4-2) * 25
    })

    it('should not include win_streak for streak <= 2', () => {
      const events = computeGameXPEvents(false, 0, 0, 2, false, false, false, [])
      expect(events.some(e => e.source === 'win_streak')).toBe(false)
    })

    it('should include daily_first_game bonus', () => {
      const events = computeGameXPEvents(false, 0, 0, 0, true, false, false, [])
      expect(events.some(e => e.source === 'daily_first_game')).toBe(true)
    })

    it('should include public_game_hosted for host of public game', () => {
      const events = computeGameXPEvents(false, 0, 0, 0, false, true, true, [])
      expect(events.some(e => e.source === 'public_game_hosted')).toBe(true)
    })

    it('should include achievement XP', () => {
      const events = computeGameXPEvents(false, 0, 0, 0, false, false, false, [
        { id: 'first_game', name: 'Debut Performance', description: '', icon: '', rarity: 'common' }
      ])
      const achievementEvent = events.find(e => e.source === 'achievement_unlocked')
      expect(achievementEvent).toBeDefined()
      expect(achievementEvent!.amount).toBe(25) // common = 25
    })
  })

  describe('isFirstGameToday', () => {
    it('should return true when no daily bonus claimed', async () => {
      mockGet.mockResolvedValue({
        playerId: 'player1',
        totalXP: 0,
        level: 1,
        title: 'Rookie',
        xpHistory: [],
        levelRewardsClaimed: [],
        weeklyChallenges: [],
      } as Progression)

      const result = await isFirstGameToday('player1')
      expect(result).toBe(true)
    })

    it('should return false when daily bonus already claimed today', async () => {
      const today = new Date().toISOString().split('T')[0]
      mockGet.mockResolvedValue({
        playerId: 'player1',
        totalXP: 0,
        level: 1,
        title: 'Rookie',
        xpHistory: [],
        levelRewardsClaimed: [],
        weeklyChallenges: [],
        lastDailyBonusDate: today,
      } as Progression)

      const result = await isFirstGameToday('player1')
      expect(result).toBe(false)
    })
  })

  describe('claimLevelReward', () => {
    it('should claim reward when eligible', async () => {
      mockGet.mockResolvedValue({
        playerId: 'player1',
        totalXP: 2000,
        level: 8,
        title: 'Rising Star',
        xpHistory: [],
        levelRewardsClaimed: [],
        weeklyChallenges: [],
      } as Progression)

      const reward = await claimLevelReward('player1', 5)
      expect(reward).not.toBeNull()
      expect(reward!.level).toBe(5)
      expect(reward!.type).toBe('credits')
      expect(reward!.claimed).toBe(true)
    })

    it('should return null when already claimed', async () => {
      mockGet.mockResolvedValue({
        playerId: 'player1',
        totalXP: 2000,
        level: 8,
        title: 'Rising Star',
        xpHistory: [],
        levelRewardsClaimed: [5],
        weeklyChallenges: [],
      } as Progression)

      const reward = await claimLevelReward('player1', 5)
      expect(reward).toBeNull()
    })

    it('should return null when level not reached', async () => {
      mockGet.mockResolvedValue({
        playerId: 'player1',
        totalXP: 100,
        level: 2,
        title: 'Rookie',
        xpHistory: [],
        levelRewardsClaimed: [],
        weeklyChallenges: [],
      } as Progression)

      const reward = await claimLevelReward('player1', 5)
      expect(reward).toBeNull()
    })
  })
})
