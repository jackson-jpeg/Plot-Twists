/**
 * Admin API Routes
 * Protected endpoints for app monitoring, user management, and credit granting.
 * All routes require authentication + admin status check.
 */

import type { Express, Request, Response, NextFunction } from 'express'
import { authenticateRequest } from '../middleware/auth'
import { isAdminUser } from '../../lib/admin'
import { getUser, getUserByEmail } from '../services/user.service'
import { getCredits, addBankedCredits } from '../services/credit.service'
import { getDatabase, Collections } from '../db'
import * as roomService from '../services/room.service'
import { logger } from '../../lib/logger'

/**
 * Admin authorization middleware — checks that the authenticated user is an admin.
 * Must be used AFTER authenticateRequest.
 */
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const uid = req.user?.uid
  if (!uid) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const user = await getUser(uid)
  if (!user || !isAdminUser(user)) {
    logger.warn(`[Admin] Unauthorized admin access attempt by ${uid}`)
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  next()
}

export function registerAdminRoutes(app: Express): void {
  // All admin routes require auth + admin check
  const adminAuth = [authenticateRequest, requireAdmin]

  // ============================================================
  // GET /api/admin/stats — App-wide statistics
  // ============================================================
  app.get('/api/admin/stats', ...adminAuth, async (_req: Request, res: Response) => {
    try {
      const db = getDatabase()

      // Total users
      const allUsers = await db.query(Collections.USERS, [], { limit: 10000 })
      const totalUsers = allUsers.length

      // Active rooms (in-memory)
      const activeRooms = roomService.getActiveRoomCount?.() ?? 0

      // Total games played (from game history)
      const allGames = await db.query(Collections.GAME_HISTORY, [], { limit: 10000 })
      const totalGamesPlayed = allGames.length

      // Revenue: sum lifetimeSpend across all users
      const totalRevenueCents = (allUsers as any[]).reduce((sum, u) => sum + (u.lifetimeSpend ?? 0), 0)
      const totalRevenue = (totalRevenueCents / 100).toFixed(2)

      // Purchases today: count users whose lifetimeSpend changed today
      // (Simplified — counts users with any spend; a proper version would track transactions)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const purchasesToday = (allUsers as any[]).filter(u =>
        (u.lifetimeSpend ?? 0) > 0 && u.updatedAt && new Date(u.updatedAt) >= today
      ).length

      res.json({
        totalUsers,
        activeRooms,
        totalGamesPlayed,
        totalRevenue,
        purchasesToday,
      })
    } catch (error) {
      logger.error('[Admin] Stats error:', error)
      res.status(500).json({ error: 'Failed to load stats' })
    }
  })

  // ============================================================
  // GET /api/admin/users/search?q=<query> — Search users
  // ============================================================
  app.get('/api/admin/users/search', ...adminAuth, async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string || '').trim()
      if (!query) {
        res.status(400).json({ error: 'Missing search query' })
        return
      }

      const db = getDatabase()
      let results: any[] = []

      // Search by email
      if (query.includes('@')) {
        const byEmail = await db.query(Collections.USERS, [
          { field: 'email', operator: '==', value: query.toLowerCase() }
        ], { limit: 10 })
        results = byEmail
      }
      // Search by phone (try with and without +1)
      else if (/^\+?\d{10,}$/.test(query.replace(/\D/g, ''))) {
        const normalized = query.replace(/\D/g, '')
        const withPlus = `+${normalized.startsWith('1') ? normalized : '1' + normalized}`
        const byPhone = await db.query(Collections.USERS, [
          { field: 'phoneNumber', operator: '==', value: withPlus }
        ], { limit: 10 })
        results = byPhone

        if (results.length === 0) {
          const byPhoneRaw = await db.query(Collections.USERS, [
            { field: 'phoneNumber', operator: '==', value: normalized }
          ], { limit: 10 })
          results = byPhoneRaw
        }
      }
      // Search by user ID (exact match)
      else if (query.startsWith('user_')) {
        const user = await getUser(query)
        if (user) results = [user]
      }
      // Search by display name (partial, case-insensitive — fetch all and filter)
      else {
        const allUsers = await db.query(Collections.USERS, [], { limit: 5000 })
        results = (allUsers as any[]).filter(u =>
          u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 20)
      }

      // Format results
      const formatted = await Promise.all(results.map(async (user: any) => {
        const credits = user.credits
          ? (user.credits.banked ?? 0) + Math.max(0, (user.credits.free?.limit ?? 0) - (user.credits.free?.used ?? 0))
          : 0

        return {
          id: user.id || user.uid,
          displayName: user.displayName || user.email || 'Anonymous',
          email: user.email || null,
          creditBalance: credits,
          gamesPlayed: user.gamesPlayed ?? 0,
          level: user.level ?? 1,
          totalPurchased: Math.round((user.lifetimeSpend ?? 0) / 100),
        }
      }))

      res.json(formatted)
    } catch (error) {
      logger.error('[Admin] Search error:', error)
      res.status(500).json({ error: 'Search failed' })
    }
  })

  // ============================================================
  // POST /api/admin/credits/grant — Grant credits to a user
  // ============================================================
  app.post('/api/admin/credits/grant', ...adminAuth, async (req: Request, res: Response) => {
    try {
      const { userId, amount } = req.body
      if (!userId || !amount || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ error: 'Missing userId or valid amount' })
        return
      }

      if (amount > 10000) {
        res.status(400).json({ error: 'Maximum grant is 10,000 credits' })
        return
      }

      // Verify target user exists
      const targetUser = await getUser(userId)
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      // Grant credits (as banked, $0 spend since it's a gift)
      await addBankedCredits(userId, amount, 0)

      logger.info(`[Admin] ${req.user!.uid} granted ${amount} credits to ${userId}`)

      // Return updated balance
      const balance = await getCredits(userId)

      res.json({
        success: true,
        userId,
        amount,
        newBalance: balance,
      })
    } catch (error) {
      logger.error('[Admin] Grant credits error:', error)
      res.status(500).json({ error: 'Failed to grant credits' })
    }
  })
}
