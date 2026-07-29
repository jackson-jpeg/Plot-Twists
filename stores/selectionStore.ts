import { create } from 'zustand'
import type { AvailableCards, CardSelectionInput, SelectedCards } from '@/lib/types'

export interface SelectionStoreState {
  availableCards: AvailableCards | null
  /**
   * Holds whole `CardOption`s, not names. The id is what `submit_cards` sends
   * (IP layer 2); the name is display only. One source of truth on purpose —
   * parallel name/id fields drift.
   */
  selection: SelectedCards
  hasSubmitted: boolean
  isSubmitting: boolean
  selectedPackId: string
  selectedPackName: string | null
  gameSetupMode: 'quick' | 'custom'
}

export interface SelectionStoreActions {
  setAvailableCards: (cards: AvailableCards | null) => void
  setSelection: (selection: SelectedCards) => void
  setHasSubmitted: (hasSubmitted: boolean) => void
  setIsSubmitting: (isSubmitting: boolean) => void
  setSelectedPackId: (packId: string) => void
  setSelectedPackName: (name: string | null) => void
  setGameSetupMode: (mode: 'quick' | 'custom') => void
  reset: () => void
}

const initialState: SelectionStoreState = {
  availableCards: null,
  selection: { character: null, setting: null, circumstance: null },
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

/**
 * The wire payload for `submit_cards`. Returns null unless all three slots are
 * filled, so callers cannot half-submit. IDs only — see `CardSelectionInput`.
 */
export function toSelectionInput(selection: SelectedCards): CardSelectionInput | null {
  const { character, setting, circumstance } = selection
  if (!character || !setting || !circumstance) return null
  return {
    characterId: character.id,
    settingId: setting.id,
    circumstanceId: circumstance.id,
  }
}
