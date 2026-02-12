'use client'

import { useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents, SoundEffectType, AudioSettings } from '@/lib/types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseAudioPlayerOptions {
  socket: AppSocket | null
  isConnected: boolean
}

/**
 * Subscribes to server audio events (sound effects, ambience, settings updates)
 * and plays audio through HTMLAudioElement. Gracefully handles missing files.
 */
export function useAudioPlayer({ socket, isConnected }: UseAudioPlayerOptions) {
  const ambienceRef = useRef<HTMLAudioElement | null>(null)
  const settingsRef = useRef<AudioSettings | null>(null)

  useEffect(() => {
    if (!socket || !isConnected) return

    function playSafe(src: string, volume: number) {
      try {
        const audio = new Audio(src)
        audio.volume = Math.max(0, Math.min(1, volume))
        audio.play().catch(() => {
          // Browser may block autoplay or file may be missing — ignore
        })
      } catch {
        // Audio constructor can throw in non-browser environments
      }
    }

    socket.on('play_sound_effect', (effect: SoundEffectType) => {
      const volume = settingsRef.current?.soundEffectsVolume ?? 0.5
      if (settingsRef.current && !settingsRef.current.soundEffectsEnabled) return
      playSafe(`/sounds/${effect}.mp3`, volume)
    })

    socket.on('ambience_start', (trackUrl: string) => {
      // Stop any existing ambience
      if (ambienceRef.current) {
        ambienceRef.current.pause()
        ambienceRef.current = null
      }
      try {
        const audio = new Audio(trackUrl)
        audio.loop = true
        audio.volume = settingsRef.current?.ambienceVolume ?? 0.3
        audio.play().catch(() => {})
        ambienceRef.current = audio
      } catch {
        // ignore
      }
    })

    socket.on('ambience_stop', () => {
      if (ambienceRef.current) {
        ambienceRef.current.pause()
        ambienceRef.current = null
      }
    })

    socket.on('audio_settings_update', (newSettings: AudioSettings) => {
      settingsRef.current = newSettings
      // Update ambience volume live
      if (ambienceRef.current) {
        ambienceRef.current.volume = Math.max(0, Math.min(1, newSettings.ambienceVolume))
        if (!newSettings.ambienceEnabled) {
          ambienceRef.current.pause()
          ambienceRef.current = null
        }
      }
    })

    return () => {
      socket.off('play_sound_effect')
      socket.off('ambience_start')
      socket.off('ambience_stop')
      socket.off('audio_settings_update')
      // Clean up audio on unmount
      if (ambienceRef.current) {
        ambienceRef.current.pause()
        ambienceRef.current = null
      }
    }
  }, [socket, isConnected])
}
