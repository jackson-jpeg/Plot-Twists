import { create } from 'zustand'
import type { GameResults, XPEvent } from '@/lib/types'

export interface VotingStoreState {
  gameResults: GameResults | null
  xpEvents: XPEvent[]
  levelUpData: { level: number; title: string } | null
}

export interface VotingStoreActions {
  setResults: (results: GameResults) => void
  setXpEvents: (events: XPEvent[]) => void
  setLevelUpData: (data: { level: number; title: string } | null) => void
  reset: () => void
}

const initialState: VotingStoreState = {
  gameResults: null,
  xpEvents: [],
  levelUpData: null,
}

export const useVotingStore = create<VotingStoreState & VotingStoreActions>()((set) => ({
  ...initialState,

  setResults: (gameResults) => set({ gameResults }),
  setXpEvents: (xpEvents) => set({ xpEvents }),
  setLevelUpData: (levelUpData) => set({ levelUpData }),
  reset: () => set(initialState),
}))
