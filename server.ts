import 'dotenv/config'
import { createServer } from 'http'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import express from 'express'
import cors from 'cors'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from './lib/types'
import { configureSecurityMiddleware, validateEnvironment } from './server/middleware/security'
import { initializeCardPackService } from './server/services/cardpack.service'
import { initializeDatabase } from './server/db'
import { createSocketAuthMiddleware } from './server/middleware/socketAuth'
import * as roomService from './server/services/room.service'
import { registerAllHandlers } from './server/handlers'
import { registerRoutes } from './server/routes'
import { logger } from './lib/logger'

// Validate environment on startup
validateEnvironment()

const dev = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

function getAllowedOrigins(): string[] {
  if (dev) return ['http://localhost:3000', 'http://localhost:3001']
  const origins = [
    'https://plot-twists.com',
    'https://www.plot-twists.com',
    'https://web-production-c7981.up.railway.app',
    'capacitor://localhost',
    'ionic://localhost'
  ]
  const envOrigins = process.env.ALLOWED_ORIGINS
  if (envOrigins) {
    envOrigins.split(',').forEach(o => { if (o.trim()) origins.push(o.trim()) })
  }
  return origins
}

const VERCEL_PREVIEW_REGEX = /^https:\/\/plot-twists(-[a-z0-9-]+)*\.vercel\.app$/

function isAllowedOrigin(origin: string): boolean {
  if (getAllowedOrigins().includes(origin)) return true
  if (!dev && VERCEL_PREVIEW_REGEX.test(origin)) return true
  return false
}

app.prepare().then(async () => {
  // Initialize database and services
  await initializeDatabase()
  await roomService.loadRoomsFromFirestore()
  roomService.startRoomCleanup()
  await initializeCardPackService()

  const expressApp = express()

  // Express-level CORS middleware (ensures ALL responses have CORS headers, not just Socket.IO)
  expressApp.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (isAllowedOrigin(origin)) return callback(null, true)
      logger.warn(`Express CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  // Configure security middleware
  configureSecurityMiddleware(expressApp)

  const server = createServer(expressApp)

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (isAllowedOrigin(origin)) return callback(null, true)
        logger.warn(`Socket.IO CORS blocked origin: ${origin}`)
        callback(new Error('Not allowed by CORS'))
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    allowUpgrades: true
  })

  logger.info(`Socket.IO configured for ${dev ? 'development' : 'production'} mode`)
  logger.info(`Transports: polling + websocket`)

  // Apply Firebase auth middleware to socket connections
  io.use(createSocketAuthMiddleware())

  // Log Engine.IO connection details for debugging native client issues
  io.engine.on('connection', (rawSocket: unknown) => {
    const s = rawSocket as { transport?: { name?: string }; protocol?: number }
    logger.debug(`[Engine.IO] New connection — transport: ${s.transport?.name ?? 'unknown'}, protocol: ${s.protocol ?? 'unknown'}`)
  })

  // Register all socket handlers (9 handler modules + disconnect)
  registerAllHandlers(io)

  // Register all HTTP routes (Stripe, Auth, Apple, API)
  await registerRoutes(expressApp, io, port)

  // Next.js page handler — must be last (catch-all)
  expressApp.all('/{*path}', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, () => {
    logger.info(`> Ready on http://${hostname}:${port}`)
  })


  // ── Graceful Shutdown ──────────────────────────────────────
  let shuttingDown = false

  async function gracefulShutdown(signal: string) {
    if (shuttingDown) return
    shuttingDown = true
    logger.info(`[Shutdown] Received ${signal}, shutting down gracefully...`)

    // Notify all connected clients — use 'server_restarting' instead of 'error'
    // to avoid triggering the circuit breaker on native clients during deployments
    io.emit('server_restarting', 'Server is restarting. You will be reconnected shortly.')

    // Stop accepting new connections
    server.close(() => {
      logger.info('[Shutdown] HTTP server closed')
    })

    // Persist any dirty room state
    try {
      const rooms = roomService.getActiveRooms()
      for (const room of rooms) {
        await roomService.persistRoom(room)
      }
      logger.info(`[Shutdown] Persisted ${rooms.length} room(s) to database`)
    } catch (err) {
      logger.error('[Shutdown] Error persisting rooms:', err)
    }

    // Stop room cleanup timers
    roomService.stopRoomCleanup()

    // Close Socket.IO (disconnects all sockets)
    io.close(() => {
      logger.info('[Shutdown] Socket.IO server closed')
    })

    // Allow a drain period for in-flight requests
    const drainTimeout = setTimeout(() => {
      logger.warn('[Shutdown] Drain timeout reached, forcing exit')
      process.exit(0)
    }, 10000)
    drainTimeout.unref()
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // Global crash protection — log and survive unhandled rejections, exit on uncaught exceptions
  process.on('unhandledRejection', (reason) => {
    logger.error('[UnhandledRejection]', reason)
  })
  process.on('uncaughtException', (error) => {
    logger.error('[UncaughtException]', error)
    gracefulShutdown('uncaughtException').finally(() => process.exit(1))
  })
})
