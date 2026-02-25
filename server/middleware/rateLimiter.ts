import rateLimit from 'express-rate-limit'

/**
 * Rate limiter for API endpoints
 * Prevents abuse and protects Claude API from excessive calls
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Stricter rate limiter for room creation
 * Prevents spam room creation
 */
export const roomCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 room creations per 5 minutes
  message: 'Too many rooms created from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
})

/**
 * Rate limiter for script generation (Claude API calls)
 * Protects against cost overruns
 */
export const scriptGenerationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 script generations per 10 minutes
  message: 'Too many script generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for SMS send-code endpoint
 * Prevents Twilio bill abuse (5 req/min per IP)
 */
export const sendCodeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many verification attempts. Please wait a minute before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for SMS verify-code endpoint
 * Prevents brute-force code guessing (10 req/min per IP)
 */
export const verifyCodeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many verification attempts. Please wait a minute before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Socket.io rate limiter
 * In-memory tracking of socket events per connection
 */
export class SocketRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }>

  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {
    this.attempts = new Map()

    // Cleanup old entries every minute (unref so it doesn't prevent process exit)
    const cleanup = setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.attempts.entries()) {
        if (now > value.resetTime) {
          this.attempts.delete(key)
        }
      }
    }, 60000)
    cleanup.unref()
  }

  /**
   * Check if request is allowed
   * @returns true if allowed, false if rate limited
   */
  check(identifier: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    if (record.count >= this.maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  /**
   * Reset attempts for an identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}
