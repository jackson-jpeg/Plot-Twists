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

  /** Script generation failed */
  scriptGenerationFailed: (mode: string, error: string) => {
    track('script_generation_failed', { mode, error: error.slice(0, 100) })
  },

  /** Purchase completed successfully */
  purchaseCompleted: (packageId: string, credits: number) => {
    track('purchase_completed', { packageId, credits })
  },

  /** Purchase failed */
  purchaseFailed: (packageId: string, error: string) => {
    track('purchase_failed', { packageId, error: error.slice(0, 100) })
  },

  /** Player failed to join a game */
  joinFailed: (reason: string) => {
    track('join_failed', { reason })
  },

  /** User tried to generate but had insufficient credits */
  creditInsufficient: () => {
    track('credit_insufficient', {})
  },

  /** Invite landing page viewed */
  invitePageViewed: (roomCode: string) => {
    track('invite_page_viewed', { roomCode })
  },

  /** Join clicked from invite page */
  inviteJoinClicked: (roomCode: string) => {
    track('invite_join_clicked', { roomCode })
  },
}
