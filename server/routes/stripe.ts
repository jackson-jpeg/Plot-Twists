/**
 * Stripe Routes
 * Webhook, checkout sessions, portal, transactions, session status
 */

import type { Express } from 'express'
import type { Server as SocketIOServer } from 'socket.io'
import express from 'express'
import type { ClientToServerEvents, ServerToClientEvents } from '../../lib/types'
import { authenticateRequest } from '../middleware/auth'
import { addBankedCredits, getCredits, deductBankedCredits, ensureCreditsExist } from '../services/credit.service'
import { recordTransaction, getUserTransactions } from '../services/payment.service'
import { upsertUser, getUser } from '../services/user.service'
import { getDatabase, Collections } from '../db'
import { CREDIT_PACKAGES } from '../../lib/credits'
import { logger } from '../../lib/logger'

type SocketIOServer_ = SocketIOServer<ClientToServerEvents, ServerToClientEvents>

export async function registerStripeRoutes(
  app: Express,
  io: SocketIOServer_,
  port: number
): Promise<void> {
  // Lazy-initialized Stripe client
  const Stripe = (await import('stripe')).default
  let stripeClient: InstanceType<typeof Stripe> | null = null
  function getStripe(): InstanceType<typeof Stripe> | null {
    if (stripeClient) return stripeClient
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) return null
    stripeClient = new Stripe(key)
    return stripeClient
  }

  // Log Stripe configuration status on startup
  if (process.env.STRIPE_SECRET_KEY) {
    logger.info('[Stripe] Secret key configured')
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      logger.info('[Stripe] Webhook secret configured')
    } else {
      logger.warn('[Stripe] STRIPE_WEBHOOK_SECRET not set — webhooks will fail')
    }
  } else {
    logger.warn('[Stripe] STRIPE_SECRET_KEY not set — payments disabled')
  }

  // Idempotency via DB
  const db = getDatabase()
  async function isStripeEventProcessed(eventId: string): Promise<boolean> {
    const existing = await db.get(Collections.STRIPE_EVENTS, eventId)
    return existing !== null
  }
  async function markStripeEventProcessed(eventId: string, eventType: string, userId?: string): Promise<void> {
    await db.set(Collections.STRIPE_EVENTS, eventId, {
      eventId,
      eventType,
      userId: userId || null,
      processedAt: new Date().toISOString()
    })
  }

  /** Emit credit_balance to a connected user by UID */
  function emitCreditBalance(userId: string, balance: { free: number; banked: number; total: number }): void {
    for (const [, s] of io.sockets.sockets) {
      if (s.data.uid === userId) {
        s.emit('credit_balance', balance)
        break
      }
    }
  }

  // Webhook needs raw body — must be registered before express.json()
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      logger.error('[Stripe] STRIPE_WEBHOOK_SECRET not configured')
      res.status(500).json({ error: 'Webhook not configured' })
      return
    }

    try {
      const stripe = getStripe()
      if (!stripe) {
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)

      if (await isStripeEventProcessed(event.id)) {
        logger.info(`[Stripe] Skipping duplicate event ${event.id}`)
        res.json({ received: true })
        return
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: Record<string, string>; amount_total?: number | null; customer_details?: { email?: string; name?: string } }
        const userId = session.metadata?.userId
        const scripts = parseInt(session.metadata?.scripts || '0', 10)
        const packageId = session.metadata?.packageId || ''
        const amountTotal = session.amount_total || 0

        if (userId && scripts > 0) {
          // Ensure user document exists before crediting — prevents lost purchases
          // if the user doc was somehow deleted or not yet created
          const existingUser = await getUser(userId)
          if (!existingUser) {
            logger.warn(`[Stripe] User ${userId} not found in DB, creating from checkout data`)
            await upsertUser(userId, {
              email: session.customer_details?.email,
              displayName: session.customer_details?.name,
            })
          } else {
            await ensureCreditsExist(userId)
          }

          await markStripeEventProcessed(event.id, event.type, userId)
          await addBankedCredits(userId, scripts, amountTotal)

          const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
          await recordTransaction({
            userId,
            type: 'purchase',
            stripeEventId: event.id,
            packageId,
            packageLabel: pkg?.label || packageId,
            creditsAdded: scripts,
            amountCents: amountTotal,
            status: 'completed'
          })

          const balance = await getCredits(userId)
          emitCreditBalance(userId, balance)
          logger.info(`[Stripe] Fulfilled ${scripts} credits for user ${userId}`)
        }
      } else if (event.type === 'charge.refunded') {
        const charge = event.data.object as { metadata?: Record<string, string>; amount_refunded?: number; amount?: number }
        const userId = charge.metadata?.userId
        const originalScripts = parseInt(charge.metadata?.scripts || '0', 10)
        const amountRefunded = charge.amount_refunded || 0
        const originalAmount = charge.amount || 1

        if (userId && originalScripts > 0 && amountRefunded > 0) {
          // Ensure user exists before deducting
          const refundUser = await getUser(userId)
          if (!refundUser) {
            logger.warn(`[Stripe] Refund for unknown user ${userId}, skipping deduction`)
            await markStripeEventProcessed(event.id, event.type, userId)
            res.json({ received: true })
            return
          }

          await markStripeEventProcessed(event.id, event.type, userId)
          const creditsToDeduct = Math.min(
            Math.round((amountRefunded / originalAmount) * originalScripts),
            originalScripts
          )
          await deductBankedCredits(userId, creditsToDeduct)

          await recordTransaction({
            userId,
            type: 'refund',
            stripeEventId: event.id,
            packageId: charge.metadata?.packageId || '',
            packageLabel: 'Refund',
            creditsAdded: -creditsToDeduct,
            amountCents: -amountRefunded,
            status: 'completed'
          })

          const balance = await getCredits(userId)
          emitCreditBalance(userId, balance)
          logger.info(`[Stripe] Refund: deducted ${creditsToDeduct} credits from user ${userId}`)
        }
      } else if (event.type === 'checkout.session.expired') {
        const session = event.data.object as { metadata?: Record<string, string> }
        const userId = session.metadata?.userId
        await markStripeEventProcessed(event.id, event.type, userId)

        if (userId) {
          await recordTransaction({
            userId,
            type: 'expired',
            stripeEventId: event.id,
            packageId: session.metadata?.packageId || '',
            packageLabel: session.metadata?.packageId || 'Unknown',
            creditsAdded: 0,
            amountCents: 0,
            status: 'expired'
          })

          for (const [, s] of io.sockets.sockets) {
            if (s.data.uid === userId) {
              s.emit('error', 'Your checkout session expired. No charges were made.')
              break
            }
          }
        }
      } else if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object as { metadata?: Record<string, string> }
        const userId = intent.metadata?.userId
        await markStripeEventProcessed(event.id, event.type, userId)

        if (userId) {
          await recordTransaction({
            userId,
            type: 'failed',
            stripeEventId: event.id,
            packageId: intent.metadata?.packageId || '',
            packageLabel: intent.metadata?.packageId || 'Unknown',
            creditsAdded: 0,
            amountCents: 0,
            status: 'failed'
          })

          for (const [, s] of io.sockets.sockets) {
            if (s.data.uid === userId) {
              s.emit('error', 'Payment failed. Please try again or use a different payment method.')
              break
            }
          }
        }
      }

      res.json({ received: true })
    } catch (error) {
      logger.error('[Stripe] Webhook error:', error)
      res.status(400).json({ error: 'Webhook signature verification failed' })
    }
  })

  // JSON body parser for other Stripe routes
  app.use('/api/stripe', express.json())

  // Helper: get or create Stripe customer
  async function getOrCreateStripeCustomer(stripe: InstanceType<typeof Stripe>, userId: string): Promise<string> {
    const user = await db.get<import('../../lib/types').UserProfile>(Collections.USERS, userId)
    if (user?.stripeCustomerId) return user.stripeCustomerId

    const customer = await stripe.customers.create({
      metadata: { userId },
      email: user?.email || undefined,
      name: user?.displayName || undefined
    })

    await db.update(Collections.USERS, userId, { stripeCustomerId: customer.id })
    return customer.id
  }

  app.post('/api/stripe/create-checkout-session', authenticateRequest, async (req, res) => {
    logger.info('[Stripe] Checkout session request received')
    const { packageId } = req.body
    const userId = req.user!.uid

    if (!packageId) {
      res.status(400).json({ error: 'Missing packageId' })
      return
    }

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      res.status(400).json({ error: 'Invalid package' })
      return
    }

    try {
      const stripe = getStripe()
      if (!stripe) {
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }

      // Ensure user document with credits exists before checkout —
      // the webhook will need this user doc to credit scripts
      await ensureCreditsExist(userId)

      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || `http://localhost:${port}`
      const customerId = await getOrCreateStripeCustomer(stripe, userId)

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        ui_mode: 'embedded',
        customer: customerId,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.label}`,
              description: `${pkg.scripts} script credits — use anytime, never expire`,
              images: ['https://plot-twists.com/icon.svg']
            },
            unit_amount: pkg.price
          },
          quantity: 1
        }],
        metadata: {
          userId,
          packageId: pkg.id,
          scripts: String(pkg.scripts)
        },
        payment_intent_data: {
          metadata: {
            userId,
            packageId: pkg.id,
            scripts: String(pkg.scripts)
          }
        },
        return_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`
      })

      res.json({ clientSecret: session.client_secret })
    } catch (error) {
      logger.error('[Stripe] Create checkout session error:', error)
      res.status(500).json({ error: 'Failed to create checkout session' })
    }
  })

  app.get('/api/stripe/transactions', authenticateRequest, async (req, res) => {
    try {
      const transactions = await getUserTransactions(req.user!.uid)
      res.json({ transactions })
    } catch (error) {
      logger.error('[Stripe] Get transactions error:', error)
      res.status(500).json({ error: 'Failed to get transactions' })
    }
  })

  app.post('/api/stripe/portal-session', authenticateRequest, async (req, res) => {
    try {
      const stripe = getStripe()
      if (!stripe) {
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }

      const user = await db.get<import('../../lib/types').UserProfile>(Collections.USERS, req.user!.uid)
      if (!user?.stripeCustomerId) {
        res.status(400).json({ error: 'No Stripe customer found. Make a purchase first.' })
        return
      }

      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || `http://localhost:${port}`
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${origin}/profile`
      })

      res.json({ url: portalSession.url })
    } catch (error) {
      logger.error('[Stripe] Portal session error:', error)
      res.status(500).json({ error: 'Failed to create portal session' })
    }
  })

  app.get('/api/stripe/session-status', async (req, res) => {
    const sessionId = req.query.session_id as string
    if (!sessionId) {
      res.status(400).json({ error: 'Missing session_id' })
      return
    }

    try {
      const stripe = getStripe()
      if (!stripe) {
        res.status(500).json({ error: 'Stripe not configured' })
        return
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId)
      res.json({
        status: session.status,
        paymentStatus: session.payment_status,
        packageId: session.metadata?.packageId,
        scripts: session.metadata?.scripts,
        amountTotal: session.amount_total
      })
    } catch (error) {
      logger.error('[Stripe] Session status error:', error)
      res.status(500).json({ error: 'Failed to get session status' })
    }
  })
}
