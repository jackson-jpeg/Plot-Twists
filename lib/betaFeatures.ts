import type { BetaFeatureKey, BetaFeatureMatrix } from '@/lib/types'

function envEnabled(serverKey: string, clientKey: string, fallback = true): boolean {
  const raw = typeof window === 'undefined'
    ? process.env[serverKey]
    : process.env[clientKey]

  if (raw == null || raw === '') return fallback
  return raw === 'true'
}

export const betaFeatures: BetaFeatureMatrix = {
  publicMatchmaking: {
    enabled: envEnabled('BETA_ENABLE_PUBLIC_MATCHMAKING', 'NEXT_PUBLIC_BETA_ENABLE_PUBLIC_MATCHMAKING'),
    label: 'Public Matchmaking',
    description: 'Public room discovery, quick play, and auto-started public sessions.',
  },
  purchases: {
    enabled: envEnabled('BETA_ENABLE_PURCHASES', 'NEXT_PUBLIC_BETA_ENABLE_PURCHASES'),
    label: 'Purchases',
    description: 'Stripe and StoreKit purchasing flows for script credits.',
  },
  audience: {
    enabled: envEnabled('BETA_ENABLE_AUDIENCE', 'NEXT_PUBLIC_BETA_ENABLE_AUDIENCE'),
    label: 'Audience',
    description: 'Audience reactions, plot twists, and spectator chat.',
  },
  cardPacks: {
    enabled: envEnabled('BETA_ENABLE_CARD_PACKS', 'NEXT_PUBLIC_BETA_ENABLE_CARD_PACKS'),
    label: 'Card Packs',
    description: 'Card pack browsing, selection, and creation.',
  },
  replays: {
    enabled: envEnabled('BETA_ENABLE_REPLAYS', 'NEXT_PUBLIC_BETA_ENABLE_REPLAYS'),
    label: 'Replays',
    description: 'Replay browsing and share flows.',
  },
  admin: {
    enabled: envEnabled('BETA_ENABLE_ADMIN', 'NEXT_PUBLIC_BETA_ENABLE_ADMIN'),
    label: 'Admin',
    description: 'Admin dashboards and operational tooling.',
  },
}

export function isBetaFeatureEnabled(feature: BetaFeatureKey): boolean {
  return betaFeatures[feature].enabled
}
