// server/handlers/user.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { SocketRateLimiter } from '../middleware/rateLimiter'
import { rateLimitKey } from '../utils/clientIdentity'
import { SITE_URL } from '../../lib/siteUrl'
import {
  getPlayerGames,
  getGame,
  getGameByShareCode,
  shareGame,
  getPublicGames,
  getRecentPublicGames,
} from '../services/gameHistory.service'
import { getPlayerStats, getLeaderboard } from '../services/playerStats.service'
import { getCredits, addBankedCredits } from '../services/credit.service'
import { getReferralInfo, redeemReferralCode } from '../services/referral.service'
import { getProgression, getLevelInfo, claimLevelReward } from '../services/progression.service'
import { logger } from '@/lib/logger'

// Rate limiter (moved from server.ts)
const dataFetchLimiter = new SocketRateLimiter(60, 60 * 1000) // 60 data fetches per minute

export function registerUserHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Get game history for a player
  socket.on('get_game_history', withErrorHandler(socket, 'get_game_history', async (playerId, limit, callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      const games = await getPlayerGames(playerId, limit)
      callback({ success: true, games })
    } catch (error) {
      logger.error('Error fetching game history:', error)
      callback({ success: false, error: 'Failed to load game history' })
    }
  }))

  // Get specific game details (supports both share codes and UUIDs)
  socket.on('get_game_details', withErrorHandler(socket, 'get_game_details', async (gameId, callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      // Try share code lookup first (8-char alphanumeric), then fall back to UUID
      let game = await getGameByShareCode(gameId)
      if (!game) {
        game = await getGame(gameId)
      }
      if (!game) {
        callback({ success: false, error: 'Game not found' })
        return
      }
      callback({ success: true, game })
    } catch (error) {
      logger.error('Error fetching game details:', error)
      callback({ success: false, error: 'Failed to load game' })
    }
  }))

  // Share a game
  socket.on('share_game', withErrorHandler(socket, 'share_game', async (gameId, callback) => {
    try {
      const result = await shareGame(gameId)
      if (result.success && result.shareCode) {
        const baseUrl = SITE_URL
        callback({
          success: true,
          shareUrl: `${baseUrl}/replay/${result.shareCode}`
        })
      } else {
        callback({ success: false, error: result.error })
      }
    } catch (error) {
      logger.error('Error sharing game:', error)
      callback({ success: false, error: 'Failed to share game' })
    }
  }))

  // Get player stats
  socket.on('get_player_stats', withErrorHandler(socket, 'get_player_stats', async (playerId, callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      const stats = await getPlayerStats(playerId)
      callback({ success: true, stats })
    } catch (error) {
      logger.error('Error fetching player stats:', error)
      callback({ success: false, error: 'Failed to load stats' })
    }
  }))

  // Get leaderboard
  socket.on('get_leaderboard', withErrorHandler(socket, 'get_leaderboard', async (category, limit, callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      const entries = await getLeaderboard(category, limit)
      callback({ success: true, entries })
    } catch (error) {
      logger.error('Error fetching leaderboard:', error)
      callback({ success: false, error: 'Failed to load leaderboard' })
    }
  }))

  // Get credit balance
  socket.on('get_credit_balance', withErrorHandler(socket, 'get_credit_balance', async (callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      const uid = socket.data.uid
      if (!uid) {
        callback({ success: false, error: 'Not authenticated' })
        return
      }
      const balance = await getCredits(uid)
      callback({ success: true, balance })
    } catch (error) {
      logger.error('Error fetching credit balance:', error)
      callback({ success: false, error: 'Failed to load credits' })
    }
  }))

  // Get referral info
  socket.on('get_referral_info', withErrorHandler(socket, 'get_referral_info', async (callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      const uid = socket.data.uid
      if (!uid) {
        callback({ success: false, error: 'Not authenticated' })
        return
      }
      const info = await getReferralInfo(uid)
      callback({ success: true, ...info })
    } catch (error) {
      logger.error('Error fetching referral info:', error)
      callback({ success: false, error: 'Failed to load referral info' })
    }
  }))

  // Redeem referral code
  socket.on('redeem_referral', withErrorHandler(socket, 'redeem_referral', async (code, callback) => {
    try {
      const uid = socket.data.uid
      if (!uid) {
        callback({ success: false, error: 'Not authenticated' })
        return
      }
      const result = await redeemReferralCode(uid, code)
      callback(result)
    } catch (error) {
      logger.error('Error redeeming referral:', error)
      callback({ success: false, error: 'Failed to redeem referral code' })
    }
  }))

  // Get progression
  socket.on('get_progression', withErrorHandler(socket, 'get_progression', async (playerId, callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      const progression = await getProgression(playerId)
      const levelInfo = getLevelInfo(progression.totalXP)
      callback({ success: true, progression, levelInfo })
    } catch (error) {
      logger.error('Error fetching progression:', error)
      callback({ success: false, error: 'Failed to load progression' })
    }
  }))

  // Get weekly challenges
  socket.on('get_weekly_challenges', withErrorHandler(socket, 'get_weekly_challenges', async (callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      const uid = socket.data.uid
      if (!uid) {
        callback({ success: false, error: 'Not authenticated' })
        return
      }
      const progression = await getProgression(uid)
      callback({ success: true, challenges: progression.weeklyChallenges })
    } catch (error) {
      logger.error('Error fetching weekly challenges:', error)
      callback({ success: false, error: 'Failed to load challenges' })
    }
  }))

  // Claim level reward
  socket.on('claim_level_reward', withErrorHandler(socket, 'claim_level_reward', async (level, callback) => {
    try {
      const uid = socket.data.uid
      if (!uid) {
        callback({ success: false, error: 'Not authenticated' })
        return
      }
      const reward = await claimLevelReward(uid, level)
      if (!reward) {
        callback({ success: false, error: 'Reward not available' })
        return
      }
      // If reward is credits, add them
      if (reward.type === 'credits' && typeof reward.value === 'number') {
        await addBankedCredits(uid, reward.value, 0)
      }
      callback({ success: true, reward })
    } catch (error) {
      logger.error('Error claiming level reward:', error)
      callback({ success: false, error: 'Failed to claim reward' })
    }
  }))

  // Get public replays (trending or recent)
  socket.on('get_public_replays', withErrorHandler(socket, 'get_public_replays', async (params, callback) => {
    if (!dataFetchLimiter.check(rateLimitKey(socket))) { callback({ success: false, error: 'Too many requests' }); return }
    try {
      const { tab, limit, offset } = params
      const games = tab === 'trending'
        ? await getPublicGames(limit)
        : await getRecentPublicGames(limit, offset)
      callback({ success: true, games })
    } catch (error) {
      logger.error('Error fetching public replays:', error)
      callback({ success: false, error: 'Failed to load replays' })
    }
  }))
}
