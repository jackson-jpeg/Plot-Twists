import { SocketRateLimiter } from '../../../../server/middleware/rateLimiter'

describe('SocketRateLimiter', () => {
  describe('check', () => {
    it('should allow requests under the limit', () => {
      const limiter = new SocketRateLimiter(5, 1000)

      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(true)
    })

    it('should block requests over the limit', () => {
      const limiter = new SocketRateLimiter(3, 1000)

      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(false) // 4th request should be blocked
      expect(limiter.check('user1')).toBe(false) // 5th request should be blocked
    })

    it('should track different users separately', () => {
      const limiter = new SocketRateLimiter(2, 1000)

      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(false) // user1 blocked

      expect(limiter.check('user2')).toBe(true) // user2 still allowed
      expect(limiter.check('user2')).toBe(true)
      expect(limiter.check('user2')).toBe(false) // user2 now blocked
    })

    it('should reset after window expires', (done) => {
      const limiter = new SocketRateLimiter(2, 100) // 100ms window

      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(false) // Blocked

      setTimeout(() => {
        expect(limiter.check('user1')).toBe(true) // Should be allowed again after window
        done()
      }, 150)
    }, 10000)
  })

  describe('reset', () => {
    it('should reset attempts for a specific user', () => {
      const limiter = new SocketRateLimiter(2, 1000)

      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(false) // Blocked

      limiter.reset('user1')

      expect(limiter.check('user1')).toBe(true) // Should be allowed again
    })

    it('should not affect other users', () => {
      const limiter = new SocketRateLimiter(2, 1000)

      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user1')).toBe(true)
      expect(limiter.check('user2')).toBe(true)
      expect(limiter.check('user2')).toBe(true)

      limiter.reset('user1')

      expect(limiter.check('user1')).toBe(true) // user1 reset
      expect(limiter.check('user2')).toBe(false) // user2 still blocked
    })
  })
})
