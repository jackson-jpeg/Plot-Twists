/**
 * General API Routes (game metadata, account deletion)
 */

import type { Express } from 'express'
import { authenticateRequest } from '../middleware/auth'
import { gameMetadataLimiter } from '../middleware/rateLimiter'
import { getGame, getGameByShareCode } from '../services/gameHistory.service'
import { deleteUser } from '../services/user.service'
import * as roomService from '../services/room.service'
import { isValidRoomCode } from '../utils/validation'
import { MAX_PLAYERS } from '../utils/constants'
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

  // Room preview (used by SSR invite landing page)
  app.get('/api/room-preview/:code', (req, res) => {
    const code = req.params.code?.toUpperCase()
    if (!code || !isValidRoomCode(code)) { res.status(400).json({ error: 'Invalid room code' }); return }

    const room = roomService.getRoomFromCache(code)
    if (!room) { res.status(404).json({ error: 'Room not found' }); return }

    const activePlayers = [...room.players.values()].filter(p =>
      room.gameMode === 'SOLO' ? p.isHost : (p.role === 'PLAYER' && !p.isHost)
    )
    res.json({
      gameMode: room.gameMode,
      playerCount: activePlayers.length,
      maxPlayers: MAX_PLAYERS[room.gameMode],
      hostName: room.host.nickname,
      isMature: room.isMature,
      gameState: room.gameState,
      players: activePlayers.slice(0, 6).map(p => ({ nickname: p.nickname })),
    })
  })

  // Game player data (used by character card image generation)
  app.get('/api/game-player/:gameId/:playerId', gameMetadataLimiter, async (req, res) => {
    const gameId = req.params.gameId as string
    const playerId = req.params.playerId as string

    try {
      const game = await getGame(gameId)
      if (!game) { res.status(404).json({ error: 'Game not found' }); return }

      const player = game.players.find(p => p.id === playerId)
      if (!player) { res.status(404).json({ error: 'Player not found' }); return }

      // Find the player's best line by matching character name to script speaker
      const characterLines = game.script?.lines?.filter(l => l.speaker === player.character) || []
      const bestLine = characterLines[0]?.text || ''

      res.json({
        playerName: player.nickname,
        character: player.character,
        bestLine,
        votesReceived: player.votesReceived,
        isWinner: player.isWinner,
        title: game.title,
        gameMode: game.gameMode,
        setting: game.setting,
      })
    } catch (error) {
      logger.error('Error fetching game player data:', error)
      res.status(500).json({ error: 'Internal server error' })
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
