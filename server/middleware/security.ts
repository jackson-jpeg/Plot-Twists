import helmet from 'helmet'
import type { Express } from 'express'

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
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
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
    console.error('❌ Missing required environment variables:')
    missing.forEach((key) => console.error(`   - ${key}`))
    console.error('\nPlease check your .env file')
    process.exit(1)
  }

  console.log('✓ Environment variables validated')
}
