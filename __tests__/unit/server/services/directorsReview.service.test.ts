const mockCreate = jest.fn()
const mockAnthropic = jest.fn().mockImplementation(() => ({
  messages: {
    create: mockCreate,
  },
}))

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: mockAnthropic,
}))

describe('Directors Review Service', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('disables director reviews during tests unless explicitly enabled', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'test',
      ANTHROPIC_API_KEY: 'test-key',
    }

    const service = await import('../../../../server/services/directorsReview.service')

    expect(service.shouldGenerateDirectorsReview()).toBe(false)

    const review = await service.generateDirectorsReview({
      title: 'Test Title',
      synopsis: 'Test synopsis',
      cast: [],
      reactionCount: 0,
      plotTwists: [],
    })

    expect(review).toBeNull()
    expect(mockAnthropic).not.toHaveBeenCalled()
  })

  it('allows director reviews when explicitly enabled with an API key', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'test',
      ENABLE_DIRECTORS_REVIEW: 'true',
      ANTHROPIC_API_KEY: 'test-key',
    }

    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '{"rating":4,"headline":"A triumph","review":"A very serious review.","bestMoment":"The curtain call."}',
        },
      ],
    })

    const service = await import('../../../../server/services/directorsReview.service')
    const review = await service.generateDirectorsReview({
      title: 'Test Title',
      synopsis: 'Test synopsis',
      cast: [{ nickname: 'Alex', character: 'Detective', isWinner: true }],
      reactionCount: 12,
      plotTwists: ['The chair was the villain'],
    })

    expect(service.shouldGenerateDirectorsReview()).toBe(true)
    expect(mockAnthropic).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(review).toEqual({
      rating: 4,
      headline: 'A triumph',
      review: 'A very serious review.',
      bestMoment: 'The curtain call.',
    })
  })
})
