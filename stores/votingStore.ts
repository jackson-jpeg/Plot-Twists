import { create } from 'zustand'
import type { DirectorsReview, GameResults, XPEvent } from '@/lib/types'

export interface VotingStoreState {
  gameResults: GameResults | null
  directorsReview: DirectorsReview | null
  xpEvents: XPEvent[]
  levelUpData: { level: number; title: string } | null
}

export interface VotingStoreActions {
  setResults: (results: GameResults | null) => void
  setDirectorsReview: (review: DirectorsReview | null) => void
  setXpEvents: (events: XPEvent[]) => void
  setLevelUpData: (data: { level: number; title: string } | null) => void
  reset: () => void
}

const initialState: VotingStoreState = {
  gameResults: null,
  directorsReview: null,
  xpEvents: [],
  levelUpData: null,
}

export const useVotingStore = create<VotingStoreState & VotingStoreActions>()((set) => ({
  ...initialState,

  setResults: (gameResults) => set({ gameResults }),
  setDirectorsReview: (directorsReview) => set({ directorsReview }),
  setXpEvents: (xpEvents) => set({ xpEvents }),
  setLevelUpData: (levelUpData) => set({ levelUpData }),
  reset: () => set(initialState),
}))
