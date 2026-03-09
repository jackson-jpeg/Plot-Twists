// server/handlers/cardpack.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { SocketRateLimiter } from '../middleware/rateLimiter'
import { sanitizeInput as sanitizeUserInput } from '../utils/validation'
import {
  listCardPacks,
  getCardPack,
  createCardPack,
  updateCardPack,
  deleteCardPack,
  rateCardPack,
  incrementDownloads,
  searchCardPacks,
  getFeaturedPacks,
  STANDARD_PACK_ID,
} from '../services/cardpack.service'
import * as roomService from '../services/room.service'
import { logger } from '@/lib/logger'

// Rate limiters (moved from server.ts)
const cardPackLimiter = new SocketRateLimiter(5, 60 * 1000) // 5 pack operations per minute
const cardPackReadLimiter = new SocketRateLimiter(30, 60 * 1000) // 30 pack reads per minute

export function registerCardpackHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // List available card packs
  socket.on('list_card_packs', withErrorHandler(socket, 'list_card_packs', async (callback) => {
    try {
      const packs = await listCardPacks()
      callback({ success: true, packs })
    } catch (error) {
      logger.error('Error listing card packs:', error)
      callback({ success: false, error: 'Failed to list card packs' })
    }
  }))

  // Select a card pack for the room
  socket.on('select_card_pack', withErrorHandler(socket, 'select_card_pack', async (roomCode, packId, callback) => {
    try {
      const room = roomService.getRoomFromCache(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }

      // Only host can select packs
      if (room.host.socketId !== socket.id) {
        callback({ success: false, error: 'Only the host can select card packs' })
        return
      }

      // Verify pack exists
      if (packId !== STANDARD_PACK_ID && !(await getCardPack(packId))) {
        callback({ success: false, error: 'Card pack not found' })
        return
      }

      room.cardPackId = packId
      room.lastActivity = Date.now()
      roomService.updateRoom(room)

      // Increment download count for custom packs
      if (packId !== STANDARD_PACK_ID) {
        await incrementDownloads(packId)
      }

      const pack = packId !== STANDARD_PACK_ID ? await getCardPack(packId) : null
      io.to(roomCode).emit('card_pack_selected', packId, pack?.name || 'Standard Pack')
      callback({ success: true })
    } catch (error) {
      logger.error('Error selecting card pack:', error)
      callback({ success: false, error: 'Failed to select card pack' })
    }
  }))

  // Create a new card pack
  socket.on('create_card_pack', withErrorHandler(socket, 'create_card_pack', async (packData, callback) => {
    // Rate limiting
    if (!cardPackLimiter.check(socket.id)) {
      callback({ success: false, error: 'Too many requests. Please wait a moment.' })
      return
    }

    try {
      // Enforce authorId from authenticated user to prevent spoofing
      packData.authorId = socket.data.uid || undefined
      const result = await createCardPack(packData)
      callback(result)
    } catch (error) {
      logger.error('Error creating card pack:', error)
      callback({ success: false, error: 'Failed to create card pack' })
    }
  }))

  // Rate a card pack
  socket.on('rate_card_pack', withErrorHandler(socket, 'rate_card_pack', async (packId, rating, callback) => {
    // Rate limiting
    if (!cardPackLimiter.check(socket.id)) {
      callback({ success: false, error: 'Too many requests. Please wait a moment.' })
      return
    }

    try {
      const result = await rateCardPack(packId, rating)
      callback(result)
    } catch (error) {
      logger.error('Error rating card pack:', error)
      callback({ success: false, error: 'Failed to rate card pack' })
    }
  }))

  // Update a card pack
  socket.on('update_card_pack', withErrorHandler(socket, 'update_card_pack', async (packId, updates, callback) => {
    // Rate limiting
    if (!cardPackLimiter.check(socket.id)) {
      callback({ success: false, error: 'Too many requests. Please wait a moment.' })
      return
    }

    try {
      const result = await updateCardPack(packId, updates, socket.data.uid)
      callback(result)
    } catch (error) {
      logger.error('Error updating card pack:', error)
      callback({ success: false, error: 'Failed to update card pack' })
    }
  }))

  // Delete a card pack
  socket.on('delete_card_pack', withErrorHandler(socket, 'delete_card_pack', async (packId, callback) => {
    // Rate limiting
    if (!cardPackLimiter.check(socket.id)) {
      callback({ success: false, error: 'Too many requests. Please wait a moment.' })
      return
    }

    try {
      const result = await deleteCardPack(packId, socket.data.uid)
      callback(result)
    } catch (error) {
      logger.error('Error deleting card pack:', error)
      callback({ success: false, error: 'Failed to delete card pack' })
    }
  }))

  // Search card packs
  socket.on('search_card_packs', withErrorHandler(socket, 'search_card_packs', async (query, callback) => {
    if (!cardPackReadLimiter.check(socket.id)) { callback({ success: false, error: 'Too many requests. Please slow down.' }); return }
    const sanitizedQuery = sanitizeUserInput(query, 100)
    if (!sanitizedQuery) { callback({ success: false, error: 'Invalid search query' }); return }
    try {
      const packs = await searchCardPacks(sanitizedQuery)
      callback({ success: true, packs })
    } catch (error) {
      logger.error('Error searching card packs:', error)
      callback({ success: false, error: 'Failed to search card packs' })
    }
  }))

  // Get featured packs
  socket.on('get_featured_packs', withErrorHandler(socket, 'get_featured_packs', async (limit, callback) => {
    if (!cardPackReadLimiter.check(socket.id)) { callback({ success: false, error: 'Too many requests. Please slow down.' }); return }
    try {
      const packs = await getFeaturedPacks(limit)
      callback({ success: true, packs })
    } catch (error) {
      logger.error('Error getting featured packs:', error)
      callback({ success: false, error: 'Failed to get featured packs' })
    }
  }))

  // Get a specific card pack
  socket.on('get_card_pack', withErrorHandler(socket, 'get_card_pack', async (packId, callback) => {
    if (!cardPackReadLimiter.check(socket.id)) { callback({ success: false, error: 'Too many requests. Please slow down.' }); return }
    try {
      const pack = await getCardPack(packId)
      if (pack) {
        callback({ success: true, pack })
      } else {
        callback({ success: false, error: 'Pack not found' })
      }
    } catch (error) {
      logger.error('Error getting card pack:', error)
      callback({ success: false, error: 'Failed to get card pack' })
    }
  }))
}
