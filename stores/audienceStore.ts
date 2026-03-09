import { create } from 'zustand'
import type { SpectatorMessage } from '@/lib/types'

export interface AudienceStoreState {
  spectatorMessages: SpectatorMessage[]
  greenRoomQuestion: string | null
  chaosCooldown: boolean
}

export interface AudienceStoreActions {
  setSpectatorMessages: (messages: SpectatorMessage[]) => void
  addMessage: (message: SpectatorMessage) => void
  setGreenRoomQuestion: (question: string | null) => void
  setChaosCooldown: (cooldown: boolean) => void
  reset: () => void
}

const initialState: AudienceStoreState = {
  spectatorMessages: [],
  greenRoomQuestion: null,
  chaosCooldown: false,
}

export const useAudienceStore = create<AudienceStoreState & AudienceStoreActions>()((set) => ({
  ...initialState,

  setSpectatorMessages: (spectatorMessages) => set({ spectatorMessages }),
  addMessage: (message) => set((state) => ({ spectatorMessages: [...state.spectatorMessages, message] })),
  setGreenRoomQuestion: (greenRoomQuestion) => set({ greenRoomQuestion }),
  setChaosCooldown: (chaosCooldown) => set({ chaosCooldown }),
  reset: () => set(initialState),
}))
