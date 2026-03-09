import { create } from 'zustand'
import type { AvailableCards, CardSelection } from '@/lib/types'

export interface SelectionStoreState {
  availableCards: AvailableCards | null
  selection: CardSelection
  hasSubmitted: boolean
  isSubmitting: boolean
  selectedPackId: string
  selectedPackName: string | null
  gameSetupMode: 'quick' | 'custom'
}

export interface SelectionStoreActions {
  setAvailableCards: (cards: AvailableCards | null) => void
  setSelection: (selection: CardSelection) => void
  setHasSubmitted: (hasSubmitted: boolean) => void
  setIsSubmitting: (isSubmitting: boolean) => void
  setSelectedPackId: (packId: string) => void
  setSelectedPackName: (name: string | null) => void
  setGameSetupMode: (mode: 'quick' | 'custom') => void
  reset: () => void
}

const initialState: SelectionStoreState = {
  availableCards: null,
  selection: { character: '', setting: '', circumstance: '' },
  hasSubmitted: false,
  isSubmitting: false,
  selectedPackId: '',
  selectedPackName: null,
  gameSetupMode: 'quick',
}

export const useSelectionStore = create<SelectionStoreState & SelectionStoreActions>()((set) => ({
  ...initialState,

  setAvailableCards: (availableCards) => set({ availableCards }),
  setSelection: (selection) => set({ selection }),
  setHasSubmitted: (hasSubmitted) => set({ hasSubmitted }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSelectedPackId: (selectedPackId) => set({ selectedPackId }),
  setSelectedPackName: (selectedPackName) => set({ selectedPackName }),
  setGameSetupMode: (gameSetupMode) => set({ gameSetupMode }),
  reset: () => set(initialState),
}))
