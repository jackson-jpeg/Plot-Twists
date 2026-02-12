import helmet from 'helmet'
import type { Express } from 'express'
import { logger } from '../../lib/logger'

/**
 * Configure security middleware using Helmet
 */
export function configureSecurityMiddleware(app: Express): void {
  // Use Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://www.google.com", "https://apis.google.com", ...(process.env.NODE_ENV !== 'production' ? ["'unsafe-eval'"] : [])],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:', 'capacitor://localhost', 'ionic://localhost'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["https://www.google.com", "https://www.gstatic.com", "https://*.firebaseapp.com"],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for Next.js
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    next()
  })
}

/**
 * Validate environment variables on startup
 */
export function validateEnvironment(): void {
  const required = ['ANTHROPIC_API_KEY']
  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables:')
    missing.forEach((key) => logger.error(`   - ${key}`))
    logger.error('Please check your .env file')
    process.exit(1)
  }

  logger.info('Environment variables validated')
}
