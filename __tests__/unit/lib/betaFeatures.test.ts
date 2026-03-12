describe('beta feature defaults', () => {
  it('enables all beta features by default when no env override is set', async () => {
    jest.isolateModules(() => {
      delete process.env.NEXT_PUBLIC_BETA_ENABLE_PUBLIC_MATCHMAKING
      delete process.env.NEXT_PUBLIC_BETA_ENABLE_PURCHASES
      delete process.env.NEXT_PUBLIC_BETA_ENABLE_AUDIENCE

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { betaFeatures } = require('../../../lib/betaFeatures')
      expect(betaFeatures.publicMatchmaking.enabled).toBe(true)
      expect(betaFeatures.purchases.enabled).toBe(true)
      expect(betaFeatures.audience.enabled).toBe(true)
    })
  })
})
