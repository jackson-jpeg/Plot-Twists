'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents, GameError, GameWarning } from '@/lib/types'
import { logger } from '@/lib/logger'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseGameErrorsParams {
  socket: AppSocket | null
  toast: {
    error: (msg: string, options?: { title?: string; duration?: number }) => unknown
    warning?: (msg: string, options?: { title?: string; duration?: number }) => unknown
    info: (msg: string, options?: { title?: string; duration?: number }) => unknown
  }
}

export function useGameErrors({ socket, toast }: UseGameErrorsParams) {
  const router = useRouter()

  useEffect(() => {
    if (!socket) return

    const handleError = (error: GameError) => {
      logger.error('game.error', { code: error.code, message: error.message, recoverable: error.recoverable })

      toast.error(error.message, {
        duration: error.recoverable ? 8000 : undefined,
      })

      if (error.action?.type === 'REDIRECT') {
        router.push(error.action.path)
      }
    }

    const handleWarning = (warning: GameWarning) => {
      logger.warn('game.warning', { code: warning.code, message: warning.message })
      const warn = toast.warning ?? toast.info
      warn(warning.message, { duration: 5000 })
    }

    // Simple string error messages (room not found, validation failures)
    const handleErrorMessage = (message: string) => {
      logger.warn('game.error_message', { message })
      toast.error(message, { duration: 6000 })
    }

    socket.on('game_error', handleError)
    socket.on('game_error_message', handleErrorMessage)
    socket.on('game_warning', handleWarning)
    return () => {
      socket.off('game_error', handleError)
      socket.off('game_error_message', handleErrorMessage)
      socket.off('game_warning', handleWarning)
    }
  }, [socket, toast, router])
}
