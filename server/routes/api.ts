/**
 * General API Routes (game metadata, account deletion)
 */

import type { Express } from 'express'
import { authenticateRequest } from '../middleware/auth'
import { gameMetadataLimiter } from '../middleware/rateLimiter'
import { getGame, getGameByShareCode } from '../services/gameHistory.service'
import { deleteUser } from '../services/user.service'
import { logger } from '../../lib/logger'

export function registerApiRoutes(app: Express): void {
  // Game metadata API (used by Next.js generateMetadata for dynamic OG images)
  app.get('/api/game/:shareCode', gameMetadataLimiter, async (req, res) => {
    try {
      const shareCode = req.params.shareCode as string
      let game = await getGameByShareCode(shareCode)
      if (!game) {
        game = await getGame(shareCode)
      }
      if (!game) {
        res.status(404).json({ error: 'Game not found' })
        return
      }
      res.json({
        title: game.title,
        synopsis: game.synopsis,
        gameMode: game.gameMode,
        players: game.players.map(p => ({
          nickname: p.nickname,
          character: p.character,
          isWinner: p.isWinner
        })),
        winner: game.winner,
        setting: game.setting,
        circumstance: game.circumstance,
        playedAt: game.playedAt,
        comedyStyle: game.comedyStyle
      })
    } catch (error) {
      logger.error('Error fetching game metadata:', error)
      res.status(500).json({ error: 'Failed to load game' })
    }
  })

  // Account deletion
  app.post('/api/account/delete', authenticateRequest, async (req, res) => {
    try {
      const result = await deleteUser(req.user!.uid)
      if (!result.success) {
        res.status(404).json({ error: result.error })
        return
      }
      res.json({ success: true })
    } catch (error) {
      logger.error('[Account] Delete error:', error)
      res.status(500).json({ error: 'Failed to delete account' })
    }
  })
}
