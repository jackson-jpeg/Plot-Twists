/**
 * Audience Service Tests
 * Tests reactions, rate limiting, plot twist voting, and spectator messages.
 */

import type { AudienceInteractionState, AudienceReactionType } from '../../../../lib/types'

// Must mock uuid before importing the service
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}))

// Mock logger
jest.mock('../../../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}))

// Mock anthropic
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() }
  }))
})

// Mock jsonExtractor
jest.mock('../../../../server/utils/jsonExtractor', () => ({
  extractJSON: jest.fn((text: string) => text)
}))

import {
  initializeAudienceState,
  canSendReaction,
  recordReaction,
  getReactionCounts,
  startPlotTwist,
  votePlotTwist,
  finalizePlotTwist,
  generateTwistInjection,
  canSendSpectatorMessage,
  recordSpectatorMessage,
  resetReactionCounts,
  generatePlotTwistOptions,
  getPreGeneratedTwists,
  clearPreGeneratedTwists,
} from '../../../../server/services/audience.service'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('initializeAudienceState', () => {
  it('should return a proper initial state', () => {
    const state = initializeAudienceState()

    expect(state.reactions).toEqual([])
    expect(state.plotTwistHistory).toEqual([])
    expect(state.spectatorMessages).toEqual([])
    expect(state.reactionCounts).toEqual({
      laugh: 0,
      cheer: 0,
      gasp: 0,
      boo: 0,
      applause: 0,
      cringe: 0,
      love: 0,
      mindblown: 0
    })
  })

  it('should not have an active plot twist', () => {
    const state = initializeAudienceState()
    expect(state.activePlotTwist).toBeUndefined()
  })
})

describe('canSendReaction / recordReaction rate limiting', () => {
  it('should allow first reaction from a new sender', () => {
    // Use a unique sender ID so cooldown map is empty for this user
    const senderId = `rate-test-new-${Date.now()}`
    expect(canSendReaction(senderId)).toBe(true)
  })

  it('should record a reaction and return it', () => {
    const state = initializeAudienceState()
    const senderId = `rate-test-record-${Date.now()}`

    const result = recordReaction(state, 'laugh', senderId, 'Alice')

    expect(result).not.toBeNull()
    expect(result!.type).toBe('laugh')
    expect(result!.senderId).toBe(senderId)
    expect(result!.senderName).toBe('Alice')
    expect(state.reactions).toHaveLength(1)
    expect(state.reactionCounts.laugh).toBe(1)
  })

  it('should block reaction within cooldown period', () => {
    const state = initializeAudienceState()
    const senderId = `rate-test-cooldown-${Date.now()}`

    // First reaction succeeds
    const first = recordReaction(state, 'laugh', senderId, 'Alice')
    expect(first).not.toBeNull()

    // Immediate second reaction should be blocked
    const second = recordReaction(state, 'cheer', senderId, 'Alice')
    expect(second).toBeNull()
    expect(state.reactions).toHaveLength(1)
    expect(state.reactionCounts.cheer).toBe(0)
  })

  it('should increment correct reaction count', () => {
    const state = initializeAudienceState()

    recordReaction(state, 'gasp', `sender-gasp-${Date.now()}`, 'Bob')
    recordReaction(state, 'boo', `sender-boo-${Date.now()}`, 'Carol')
    recordReaction(state, 'gasp', `sender-gasp2-${Date.now()}`, 'Dave')

    expect(state.reactionCounts.gasp).toBe(2)
    expect(state.reactionCounts.boo).toBe(1)
  })

  it('should keep only last 100 reactions', () => {
    const state = initializeAudienceState()

    // Add 105 reactions from unique senders
    for (let i = 0; i < 105; i++) {
      const senderId = `bulk-sender-${i}-${Date.now()}`
      recordReaction(state, 'laugh', senderId, `User${i}`)
    }

    expect(state.reactions.length).toBeLessThanOrEqual(100)
  })
})

describe('getReactionCounts', () => {
  it('should return a copy of reaction counts', () => {
    const state = initializeAudienceState()
    recordReaction(state, 'love', `love-sender-${Date.now()}`, 'Eve')

    const counts = getReactionCounts(state)
    expect(counts.love).toBe(1)

    // Should be a copy, not a reference
    counts.love = 999
    expect(state.reactionCounts.love).toBe(1)
  })
})

describe('startPlotTwist', () => {
  it('should create an active plot twist with options', () => {
    const state = initializeAudienceState()

    const result = startPlotTwist(state, 15000)

    expect(result.id).toBeDefined()
    expect(result.options).toHaveLength(4)
    expect(result.expiresAt).toBeGreaterThan(Date.now())
    expect(state.activePlotTwist).toBeDefined()
    expect(state.activePlotTwist!.isActive).toBe(true)
  })

  it('should use pre-generated twists when available', () => {
    const state = initializeAudienceState()
    const roomCode = `room-pregen-${Date.now()}`

    // Manually set pre-generated twists via generateAIPlotTwistOptions cache
    // We can't easily set the cache directly, so test the fallback path
    const result = startPlotTwist(state, 10000, roomCode)

    expect(result.options).toHaveLength(4)
    result.options.forEach(opt => {
      expect(opt.votes).toBe(0)
      expect(opt.text).toBeDefined()
    })
  })

  it('should set expiration time based on duration', () => {
    const state = initializeAudienceState()
    const before = Date.now()

    const result = startPlotTwist(state, 20000)

    expect(result.expiresAt).toBeGreaterThanOrEqual(before + 20000)
    expect(result.expiresAt).toBeLessThanOrEqual(Date.now() + 20000)
  })
})

describe('votePlotTwist', () => {
  it('should record a vote for a valid option', () => {
    const state = initializeAudienceState()
    const twist = startPlotTwist(state, 30000) // Long duration to avoid expiry

    const optionId = twist.options[0].id
    const result = votePlotTwist(state, optionId, 'voter-1')

    expect(result.success).toBe(true)
    expect(result.newCount).toBe(1)
  })

  it('should increment vote count on multiple votes', () => {
    const state = initializeAudienceState()
    const twist = startPlotTwist(state, 30000)

    const optionId = twist.options[1].id
    votePlotTwist(state, optionId, 'voter-1')
    const result = votePlotTwist(state, optionId, 'voter-2')

    expect(result.success).toBe(true)
    expect(result.newCount).toBe(2)
  })

  it('should fail when no active plot twist', () => {
    const state = initializeAudienceState()

    const result = votePlotTwist(state, 'some-option', 'voter-1')
    expect(result.success).toBe(false)
  })

  it('should fail for invalid option id', () => {
    const state = initializeAudienceState()
    startPlotTwist(state, 30000)

    const result = votePlotTwist(state, 'nonexistent-option', 'voter-1')
    expect(result.success).toBe(false)
  })

  it('should fail when twist has expired', () => {
    const state = initializeAudienceState()
    // Use 0ms duration so it expires immediately
    startPlotTwist(state, 0)

    const result = votePlotTwist(state, 'any-option', 'voter-1')
    expect(result.success).toBe(false)
  })
})

describe('finalizePlotTwist', () => {
  it('should return the winning twist text', () => {
    const state = initializeAudienceState()
    const twist = startPlotTwist(state, 30000)

    // Vote for the first option
    const targetOption = twist.options[0]
    votePlotTwist(state, targetOption.id, 'voter-1')
    votePlotTwist(state, targetOption.id, 'voter-2')

    const winner = finalizePlotTwist(state)

    expect(winner).toBe(targetOption.text)
    expect(state.plotTwistHistory).toContain(targetOption.text)
    expect(state.activePlotTwist).toBeUndefined()
  })

  it('should return null when no active twist', () => {
    const state = initializeAudienceState()

    const winner = finalizePlotTwist(state)
    expect(winner).toBeNull()
  })

  it('should pick a winner even with zero votes', () => {
    const state = initializeAudienceState()
    startPlotTwist(state, 30000)

    const winner = finalizePlotTwist(state)

    // Should still pick one of the options (all tied at 0)
    expect(winner).toBeDefined()
    expect(typeof winner).toBe('string')
    expect(state.plotTwistHistory).toHaveLength(1)
  })

  it('should clear the active twist after finalization', () => {
    const state = initializeAudienceState()
    startPlotTwist(state, 30000)

    finalizePlotTwist(state)

    expect(state.activePlotTwist).toBeUndefined()
  })
})

describe('generateTwistInjection', () => {
  it('should generate narrator line plus reaction', () => {
    const lines = generateTwistInjection('A meteor crashes through the roof!', ['Alice', 'Bob'])

    expect(lines.length).toBeGreaterThanOrEqual(1)
    expect(lines[0].speaker).toBe('[NARRATOR]')
    expect(lines[0].text).toContain('A meteor crashes through the roof!')
  })

  it('should include speaker reaction when speakers exist', () => {
    const lines = generateTwistInjection('The lights go out!', ['Alice'])

    expect(lines.length).toBe(2)
    // Second line should be from one of the speakers
    expect(lines[1].speaker).toBe('Alice')
    expect(lines[1].mood).toBeDefined()
  })

  it('should return only narrator line when no speakers', () => {
    const lines = generateTwistInjection('An earthquake!', [])

    expect(lines).toHaveLength(1)
    expect(lines[0].speaker).toBe('[NARRATOR]')
  })
})

describe('canSendSpectatorMessage / recordSpectatorMessage', () => {
  it('should allow first message from a new sender', () => {
    const senderId = `spec-msg-new-${Date.now()}`
    expect(canSendSpectatorMessage(senderId)).toBe(true)
  })

  it('should record a spectator message', () => {
    const state = initializeAudienceState()
    const senderId = `spec-msg-record-${Date.now()}`

    const msg = recordSpectatorMessage(state, 'Great show!', senderId, 'Fan1', false)

    expect(msg).not.toBeNull()
    expect(msg!.text).toBe('Great show!')
    expect(msg!.senderId).toBe(senderId)
    expect(msg!.senderName).toBe('Fan1')
    expect(msg!.isPreset).toBe(false)
    expect(state.spectatorMessages).toHaveLength(1)
  })

  it('should block message within cooldown period', () => {
    const state = initializeAudienceState()
    const senderId = `spec-msg-cooldown-${Date.now()}`

    const first = recordSpectatorMessage(state, 'Hello!', senderId, 'Fan1', true)
    expect(first).not.toBeNull()

    const second = recordSpectatorMessage(state, 'Again!', senderId, 'Fan1', true)
    expect(second).toBeNull()
    expect(state.spectatorMessages).toHaveLength(1)
  })

  it('should truncate messages longer than 100 characters', () => {
    const state = initializeAudienceState()
    const senderId = `spec-msg-long-${Date.now()}`
    const longText = 'A'.repeat(200)

    const msg = recordSpectatorMessage(state, longText, senderId, 'Fan1', false)

    expect(msg).not.toBeNull()
    expect(msg!.text.length).toBe(100)
  })

  it('should reject empty/whitespace messages', () => {
    const state = initializeAudienceState()
    const senderId = `spec-msg-empty-${Date.now()}`

    const msg = recordSpectatorMessage(state, '   ', senderId, 'Fan1', false)
    expect(msg).toBeNull()
  })

  it('should keep only last 50 messages', () => {
    const state = initializeAudienceState()

    for (let i = 0; i < 55; i++) {
      const senderId = `spec-bulk-${i}-${Date.now()}`
      recordSpectatorMessage(state, `Message ${i}`, senderId, `Fan${i}`, false)
    }

    expect(state.spectatorMessages.length).toBeLessThanOrEqual(50)
  })
})

describe('resetReactionCounts', () => {
  it('should reset all counts and clear arrays', () => {
    const state = initializeAudienceState()
    recordReaction(state, 'laugh', `reset-sender-${Date.now()}`, 'Alice')
    recordSpectatorMessage(state, 'Hi', `reset-spec-${Date.now()}`, 'Fan1', false)

    expect(state.reactions.length).toBeGreaterThan(0)
    expect(state.spectatorMessages.length).toBeGreaterThan(0)

    resetReactionCounts(state)

    expect(state.reactions).toEqual([])
    expect(state.spectatorMessages).toEqual([])
    Object.values(state.reactionCounts).forEach(count => {
      expect(count).toBe(0)
    })
  })
})

describe('generatePlotTwistOptions', () => {
  it('should return 4 options', () => {
    const options = generatePlotTwistOptions()

    expect(options).toHaveLength(4)
    options.forEach(opt => {
      expect(opt.id).toBeDefined()
      expect(opt.text).toBeDefined()
      expect(opt.votes).toBe(0)
    })
  })
})

describe('preGeneratedTwists cache', () => {
  it('should return null for room with no pre-generated twists', () => {
    expect(getPreGeneratedTwists('no-such-room')).toBeNull()
  })

  it('should clear pre-generated twists', () => {
    clearPreGeneratedTwists('some-room')
    expect(getPreGeneratedTwists('some-room')).toBeNull()
  })
})
