import { create } from 'zustand'
import type { DirectorsReview, PublicGameResults, XPEvent } from '@/lib/types'

export interface VotingStoreState {
  gameResults: PublicGameResults | null
  directorsReview: DirectorsReview | null
  xpEvents: XPEvent[]
  levelUpData: { level: number; title: string } | null
  /**
   * Absolute server timestamp at which voting closes, or null outside VOTING.
   * Absolute rather than "seconds remaining" so a reconnecting client joins the room's
   * countdown instead of starting its own. Chunk 2 item 4.
   */
  votingDeadline: number | null
}

export interface VotingStoreActions {
  setResults: (results: PublicGameResults | null) => void
  setDirectorsReview: (review: DirectorsReview | null) => void
  setXpEvents: (events: XPEvent[]) => void
  setLevelUpData: (data: { level: number; title: string } | null) => void
  setVotingDeadline: (deadline: number | null) => void
  reset: () => void
}

const initialState: VotingStoreState = {
  gameResults: null,
  directorsReview: null,
  xpEvents: [],
  levelUpData: null,
  votingDeadline: null,
}

export const useVotingStore = create<VotingStoreState & VotingStoreActions>()((set) => ({
  ...initialState,

  setResults: (gameResults) => set({ gameResults }),
  setDirectorsReview: (directorsReview) => set({ directorsReview }),
  setXpEvents: (xpEvents) => set({ xpEvents }),
  setLevelUpData: (levelUpData) => set({ levelUpData }),
  setVotingDeadline: (votingDeadline) => set({ votingDeadline }),
  reset: () => set(initialState),
}))
