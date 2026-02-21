/**
 * Audience Service Tests
 * Tests reaction recording, cooldowns, spectator messages, and plot twist voting.
 */

import {
  initializeAudienceState,
  recordReaction,
  canSendReaction,
  startPlotTwist,
  votePlotTwist,
  finalizePlotTwist,
  canSendSpectatorMessage,
  recordSpectatorMessage,
  resetReactionCounts,
  cleanupCooldowns,
  cleanupRoomTwists,
} from '../../../../server/services/audience.service'

jest.mock('../../../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}))

describe('initializeAudienceState', () => {
  it('should create a valid audience state object', () => {
    const state = initializeAudienceState()
    expect(state.reactionCounts).toEqual({
      laugh: 0, cheer: 0, gasp: 0, boo: 0, applause: 0, cringe: 0, love: 0, mindblown: 0,
    })
    expect(state.reactions).toEqual([])
    expect(state.spectatorMessages).toEqual([])
    expect(state.plotTwistHistory).toEqual([])
    expect(state.activePlotTwist).toBeUndefined()
  })
})

describe('recordReaction', () => {
  it('should record a valid reaction and increment count', () => {
    const state = initializeAudienceState()
    const reaction = recordReaction(state, 'laugh', 'user-unique-1', 'Alice')

    expect(reaction).not.toBeNull()
    expect(reaction?.type).toBe('laugh')
    expect(state.reactionCounts.laugh).toBe(1)
    expect(state.reactions).toHaveLength(1)
  })

  it('should reject invalid reaction types', () => {
    const state = initializeAudienceState()
    const reaction = recordReaction(state, 'invalid' as never, 'user-unique-2', 'Alice')
    expect(reaction).toBeNull()
  })

  it('should limit reactions list to 100', () => {
    const state = initializeAudienceState()
    for (let i = 0; i < 110; i++) {
      recordReaction(state, 'laugh', `user-limit-${i}`, `User${i}`)
    }
    expect(state.reactions.length).toBeLessThanOrEqual(100)
  })
})

describe('canSendReaction', () => {
  it('should allow first reaction from a new user', () => {
    expect(canSendReaction('brand-new-user-xyz')).toBe(true)
  })
})

describe('resetReactionCounts', () => {
  it('should reset all counts to zero', () => {
    const state = initializeAudienceState()
    state.reactionCounts.laugh = 10
    state.reactionCounts.gasp = 5

    resetReactionCounts(state)

    expect(state.reactionCounts.laugh).toBe(0)
    expect(state.reactionCounts.gasp).toBe(0)
    expect(state.reactions).toEqual([])
    expect(state.spectatorMessages).toEqual([])
  })
})

describe('spectator messages', () => {
  it('should allow sending a spectator message', () => {
    const state = initializeAudienceState()
    const msg = recordSpectatorMessage(state, 'Hello everyone!', 'msg-user-1', 'Alice', false)

    expect(msg).not.toBeNull()
    expect(msg?.text).toBe('Hello everyone!')
    expect(msg?.senderName).toBe('Alice')
    expect(state.spectatorMessages).toHaveLength(1)
  })

  it('should limit stored messages to prevent memory bloat', () => {
    const state = initializeAudienceState()
    for (let i = 0; i < 120; i++) {
      recordSpectatorMessage(state, `msg ${i}`, `msg-user-${i}`, `User${i}`, true)
    }
    expect(state.spectatorMessages.length).toBeLessThanOrEqual(100)
  })
})

describe('plot twist', () => {
  it('should start a plot twist with options', () => {
    const state = initializeAudienceState()
    const twist = startPlotTwist(state, 15000)

    expect(twist).toBeDefined()
    expect(twist.options.length).toBeGreaterThanOrEqual(2)
    expect(state.activePlotTwist).toBeDefined()
    expect(state.activePlotTwist?.isActive).toBe(true)
  })

  it('should allow voting on plot twist options', () => {
    const state = initializeAudienceState()
    const twist = startPlotTwist(state, 15000)
    const optionId = twist.options[0].id

    const result = votePlotTwist(state, optionId, 'voter1')
    expect(result.success).toBe(true)
    expect(result.newCount).toBe(1)
  })

  it('should allow multiple votes from different voters', () => {
    const state = initializeAudienceState()
    const twist = startPlotTwist(state, 15000)
    const optionId = twist.options[0].id

    votePlotTwist(state, optionId, 'voter1')
    const result = votePlotTwist(state, optionId, 'voter2')
    expect(result.success).toBe(true)
    expect(result.newCount).toBe(2)
  })

  it('should finalize and return winning twist text', () => {
    const state = initializeAudienceState()
    const twist = startPlotTwist(state, 15000)
    const option = twist.options[0]

    votePlotTwist(state, option.id, 'voter1')
    votePlotTwist(state, option.id, 'voter2')

    const winnerText = finalizePlotTwist(state)
    expect(winnerText).toBeDefined()
    expect(typeof winnerText).toBe('string')
    expect(state.activePlotTwist).toBeUndefined()
    expect(state.plotTwistHistory).toHaveLength(1)
  })

  it('should return null if no active twist', () => {
    const state = initializeAudienceState()
    expect(finalizePlotTwist(state)).toBeNull()
  })
})

describe('cleanupCooldowns', () => {
  it('should not throw when called', () => {
    expect(() => cleanupCooldowns()).not.toThrow()
  })
})

describe('cleanupRoomTwists', () => {
  it('should not throw for unknown room', () => {
    expect(() => cleanupRoomTwists('NONEXISTENT')).not.toThrow()
  })
})
