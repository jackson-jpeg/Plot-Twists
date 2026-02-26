/**
 * Route Registration
 * Registers all HTTP route modules on the Express app
 */

import type { Express } from 'express'
import type { Server as SocketIOServer } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '../../lib/types'
import express from 'express'
import { registerStripeRoutes } from './stripe'
import { registerAppleRoutes } from './apple'
import { registerApiRoutes } from './api'

type SocketIOServer_ = SocketIOServer<ClientToServerEvents, ServerToClientEvents>

export async function registerRoutes(
  app: Express,
  io: SocketIOServer_,
  port: number
): Promise<void> {
  // Apple App Site Association — must be served with correct content-type for universal links
  app.get('/.well-known/apple-app-site-association', (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.json({
      applinks: {
        apps: [],
        details: [
          {
            appID: '2MU4PC84GZ.com.plottwists.app',
            paths: ['/join', '/join?code=*', '/replay/*', '/explore', '/play'],
          },
        ],
      },
      webcredentials: {
        apps: ['2MU4PC84GZ.com.plottwists.app'],
      },
    })
  })

  // Stripe routes must be registered first (webhook needs raw body before express.json)
  await registerStripeRoutes(app, io, port)

  // Auth routes removed — Clerk handles all auth client-side

  // Apple IAP routes (need express.json)
  app.use('/api/apple', express.json())
  registerAppleRoutes(app)

  // General API routes (game metadata, account deletion)
  app.use('/api/account', express.json())
  registerApiRoutes(app)
}
