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

  // ── ASSERTION AUDIT 2026-07-29 — VACUOUS, retained deliberately ──────────────────────
  // `SocketRateLimiter.reset()` has ZERO production callers (verified: no `limiter.reset(`
  // anywhere outside this file). These two tests exercise dead API and contribute coverage
  // for code that never runs in the product.
  //
  // Sharper point: every test in this file keys the limiter on abstract strings ('user1',
  // 'user2'), so the file never touches the thing that is actually broken. In production
  // every call site is `limiter.check(socket.id)` (room.handler.ts:34,106;
  // audience.handler.ts:33,75; cardpack.handler.ts ×7; user.handler.ts:25,37), and socket.id
  // is new on every connection — which is D5. The limit is not reset by reset(); it is reset
  // by reconnecting. This file is green, and the defect lives entirely in the keying it never
  // exercises. The gate is the harness case `rateLimit → reconnecting does NOT reset the
  // room-creation limit` (RED: 50 rooms in ~2s). Not deleted, because the D5 fix (re-key onto
  // IP / user ID) may legitimately need reset().
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
