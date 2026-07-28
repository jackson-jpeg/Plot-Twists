/**
 * Harness game server.
 *
 * Boots the REAL socket handlers (server/handlers/index.ts) on a bare
 * socket.io server — no Next.js, no Firestore. Everything the game loop
 * touches is the production code path; only the HTTP shell and the
 * Anthropic endpoint are substituted.
 *
 * Usage: HARNESS_PORT=4599 npx tsx scripts/harness/server.ts
 */

import 'dotenv/config'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '../../lib/types'
import { initializeDatabase } from '../../server/db'
import { createSocketAuthMiddleware } from '../../server/middleware/socketAuth'
import * as roomService from '../../server/services/room.service'
import { registerAllHandlers } from '../../server/handlers'

export async function startHarnessServer(port: number) {
  await initializeDatabase()
  roomService.startRoomCleanup()

  const http = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('harness')
  })

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(http, {
    cors: { origin: true, credentials: true },
    // keep timeouts tight so disconnect scenarios resolve inside the test run
    pingInterval: 2000,
    pingTimeout: 3000,
  })

  io.use(createSocketAuthMiddleware())
  registerAllHandlers(io as never)

  await new Promise<void>(r => http.listen(port, '127.0.0.1', r))
  return {
    io,
    port,
    close: async () => {
      io.close()
      await new Promise<void>(r => http.close(() => r()))
    },
  }
}

if (process.argv[1]?.includes('harness/server')) {
  const port = Number(process.env.HARNESS_PORT || 4599)
  startHarnessServer(port).then(() => {
    console.log(`[harness] game server on http://127.0.0.1:${port}`)
  })
}
