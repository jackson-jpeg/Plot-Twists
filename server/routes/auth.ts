/**
 * Phone Auth Routes (Twilio Verify)
 */

import type { Express } from 'express'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { logger } from '../../lib/logger'

// Rate limit SMS endpoints to prevent abuse (5 requests per 15 minutes per IP)
const smsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many SMS requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export function registerAuthRoutes(app: Express): void {
  app.use('/api/auth', express.json())

  app.post('/api/auth/send-code', smsRateLimiter, async (req, res) => {
    const { phoneNumber } = req.body
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      res.status(400).json({ error: 'Missing phone number' })
      return
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !serviceSid) {
      logger.error('[Auth] Twilio env vars not configured')
      res.status(500).json({ error: 'SMS service not configured' })
      return
    }

    try {
      const twilio = await import('twilio')
      const client = twilio.default(accountSid, authToken)
      await client.verify.v2.services(serviceSid).verifications.create({
        to: phoneNumber,
        channel: 'sms',
      })
      res.json({ success: true })
    } catch (error) {
      logger.error('[Auth] Twilio send code error:', error)
      res.status(500).json({ error: 'Failed to send verification code' })
    }
  })

  app.post('/api/auth/verify-code', async (req, res) => {
    const { phoneNumber, code, mode, idToken } = req.body
    if (!phoneNumber || !code) {
      res.status(400).json({ error: 'Missing phone number or code' })
      return
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !serviceSid) {
      res.status(500).json({ error: 'SMS service not configured' })
      return
    }

    try {
      const twilio = await import('twilio')
      const client = twilio.default(accountSid, authToken)
      const check = await client.verify.v2.services(serviceSid).verificationChecks.create({
        to: phoneNumber,
        code,
      })

      if (check.status !== 'approved') {
        res.status(400).json({ error: 'Invalid code' })
        return
      }

      const admin = await import('firebase-admin')
      if (admin.apps.length === 0) {
        res.status(500).json({ error: 'Firebase Admin not initialized' })
        return
      }

      // Link mode: attach phone to existing user
      if (mode === 'link' && idToken) {
        try {
          const decoded = await admin.auth().verifyIdToken(idToken)
          await admin.auth().updateUser(decoded.uid, { phoneNumber })
          const customToken = await admin.auth().createCustomToken(decoded.uid)
          res.json({ success: true, customToken })
          return
        } catch (linkError) {
          logger.error('[Auth] Link phone error:', linkError)
          res.status(400).json({ error: 'Failed to link phone number' })
          return
        }
      }

      // Sign-in mode: find or create Firebase user by phone
      let uid: string
      try {
        const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber)
        uid = userRecord.uid
      } catch {
        const newUser = await admin.auth().createUser({ phoneNumber })
        uid = newUser.uid
      }

      const customToken = await admin.auth().createCustomToken(uid)
      res.json({ success: true, customToken })
    } catch (error) {
      logger.error('[Auth] Verify code error:', error)
      res.status(500).json({ error: 'Verification failed' })
    }
  })
}
