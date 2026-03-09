import type { AppServer, AppSocket, HandlerContext } from './types'
import { logger } from '@/lib/logger'

// Handler module imports — uncomment as modules are created:
// import { registerRoomHandlers } from './room.handler'
// import { registerSelectionHandlers } from './selection.handler'
// import { registerGameHandlers } from './game.handler'
// import { registerVotingHandlers } from './voting.handler'
// import { registerAudienceHandlers } from './audience.handler'
// import { registerCardpackHandlers } from './cardpack.handler'
// import { registerAudioHandlers } from './audio.handler'
// import { registerUserHandlers } from './user.handler'
// import { registerAdminHandlers } from './admin.handler'

export function registerAllHandlers(io: AppServer) {
  io.on('connection', (socket: AppSocket) => {
    const ctx: HandlerContext = {
      userId: socket.data.userId ?? socket.data.uid ?? null,
      socketId: socket.id,
      isAdmin: socket.data.isAdmin ?? false,
      io,
    }

    logger.info('socket.connected', {
      socketId: socket.id,
      userId: ctx.userId,
    })

    // Register handler modules here as they are created:
    // registerRoomHandlers(io, socket, ctx)
    // registerSelectionHandlers(io, socket, ctx)
    // registerGameHandlers(io, socket, ctx)
    // registerVotingHandlers(io, socket, ctx)
    // registerAudienceHandlers(io, socket, ctx)
    // registerCardpackHandlers(io, socket, ctx)
    // registerAudioHandlers(io, socket, ctx)
    // registerUserHandlers(io, socket, ctx)
    // registerAdminHandlers(io, socket, ctx)

    socket.on('disconnect', (reason) => {
      logger.info('socket.disconnected', { socketId: socket.id, userId: ctx.userId, reason })
    })
  })
}
