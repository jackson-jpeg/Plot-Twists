import { track } from '@vercel/analytics'

/**
 * Centralized analytics tracking for Plot Twists.
 * Uses Vercel Analytics track() for custom events.
 */
export const analytics = {
  /** Host creates a new game room */
  gameCreated: (mode: string) => {
    track('game_created', { mode })
  },

  /** Player joins a game room */
  gameJoined: (mode: string) => {
    track('game_joined', { mode })
  },

  /** Game completes (results shown) */
  gameCompleted: (mode: string, playerCount: number) => {
    track('game_completed', { mode, playerCount })
  },

  /** User initiates a purchase */
  purchaseInitiated: (packageId: string) => {
    track('purchase_initiated', { packageId })
  },

  /** A replay is shared */
  replayShared: (method: string) => {
    track('replay_shared', { method })
  },

  /** User completes signup */
  signupCompleted: (method: string) => {
    track('signup_completed', { method })
  },

  /** Landing page CTA clicked */
  landingCtaClicked: (action: string) => {
    track('landing_cta_clicked', { action })
  },
}
