// server/handlers/audio.handler.ts
import type { AppServer, AppSocket, HandlerContext } from './types'
import { withErrorHandler } from '../middleware/socketErrorHandler'
import { validateAudioSettings } from '../services/audio.service'
import { validateRoom } from '../socket/helpers'
import * as roomService from '../services/room.service'

export function registerAudioHandlers(io: AppServer, socket: AppSocket, ctx: HandlerContext) {
  // Update audio settings
  socket.on('update_audio_settings', withErrorHandler(socket, 'update_audio_settings', (roomCode, settings) => {
    const room = validateRoom(roomCode, socket)
    if (!room) return

    // Only host can change audio settings
    if (room.host.socketId !== socket.id) return

    room.audioSettings = validateAudioSettings({
      ...room.audioSettings,
      ...settings
    })
    room.lastActivity = Date.now()

    io.to(roomCode).emit('audio_settings_update', room.audioSettings)
  }))

  // Trigger sound effect (host only)
  socket.on('trigger_sound_effect', withErrorHandler(socket, 'trigger_sound_effect', (roomCode, effect) => {
    const room = validateRoom(roomCode, socket)
    if (!room) return

    // Only host can trigger sound effects
    if (room.host.socketId !== socket.id) return

    if (!room.audioSettings?.soundEffectsEnabled) return

    room.lastActivity = Date.now()
    io.to(roomCode).emit('play_sound_effect', effect)
  }))

  // Request line audio (for TTS)
  socket.on('request_line_audio', withErrorHandler(socket, 'request_line_audio', (roomCode, lineIndex, callback) => {
    const room = roomService.getRoomFromCache(roomCode)
    if (!room || !room.script) {
      callback({ success: false, error: 'Room or script not found' })
      return
    }

    if (!room.audioSettings?.voiceEnabled) {
      callback({ success: false, error: 'Voice is not enabled' })
      return
    }

    // For now, return a placeholder - actual TTS would require external API
    // Browser TTS will be handled client-side
    const line = room.script.lines[lineIndex]
    if (!line) {
      callback({ success: false, error: 'Line not found' })
      return
    }

    // Return success - client will use browser TTS
    callback({ success: true, audioUrl: undefined })
  }))
}
