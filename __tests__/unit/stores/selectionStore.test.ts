import { useSelectionStore } from '@/stores/selectionStore'
import type { AvailableCards, CardSelection } from '@/lib/types'

describe('selectionStore', () => {
  beforeEach(() => {
    useSelectionStore.getState().reset()
  })

  it('initializes with defaults', () => {
    const state = useSelectionStore.getState()
    expect(state.availableCards).toBeNull()
    expect(state.selection).toEqual({ character: '', setting: '', circumstance: '' })
    expect(state.hasSubmitted).toBe(false)
    expect(state.isSubmitting).toBe(false)
    expect(state.selectedPackId).toBe('')
    expect(state.selectedPackName).toBeNull()
    expect(state.gameSetupMode).toBe('quick')
  })

  it('sets available cards', () => {
    const { setAvailableCards } = useSelectionStore.getState()

    const cards: AvailableCards = {
      characters: ['Detective', 'Chef', 'Astronaut'],
      settings: ['Space Station', 'Kitchen'],
      circumstances: ['Power outage', 'Food fight'],
    }

    setAvailableCards(cards)
    expect(useSelectionStore.getState().availableCards).toEqual(cards)

    setAvailableCards(null)
    expect(useSelectionStore.getState().availableCards).toBeNull()
  })

  it('updates selection', () => {
    const { setSelection } = useSelectionStore.getState()

    const selection: CardSelection = {
      character: 'Detective',
      setting: 'Space Station',
      circumstance: 'Power outage',
    }

    setSelection(selection)
    expect(useSelectionStore.getState().selection).toEqual(selection)
  })

  it('toggles submission states', () => {
    const { setHasSubmitted, setIsSubmitting } = useSelectionStore.getState()

    setIsSubmitting(true)
    expect(useSelectionStore.getState().isSubmitting).toBe(true)

    setIsSubmitting(false)
    setHasSubmitted(true)
    expect(useSelectionStore.getState().isSubmitting).toBe(false)
    expect(useSelectionStore.getState().hasSubmitted).toBe(true)
  })

  it('sets pack selection', () => {
    const { setSelectedPackId, setSelectedPackName } = useSelectionStore.getState()

    setSelectedPackId('pack-123')
    setSelectedPackName('Comedy Classics')

    const state = useSelectionStore.getState()
    expect(state.selectedPackId).toBe('pack-123')
    expect(state.selectedPackName).toBe('Comedy Classics')
  })

  it('sets game setup mode', () => {
    const { setGameSetupMode } = useSelectionStore.getState()

    setGameSetupMode('custom')
    expect(useSelectionStore.getState().gameSetupMode).toBe('custom')

    setGameSetupMode('quick')
    expect(useSelectionStore.getState().gameSetupMode).toBe('quick')
  })

  it('resets to defaults', () => {
    const state = useSelectionStore.getState()
    state.setAvailableCards({
      characters: ['Detective'],
      settings: ['Space Station'],
      circumstances: ['Power outage'],
    })
    state.setSelection({ character: 'Detective', setting: 'Space Station', circumstance: 'Power outage' })
    state.setHasSubmitted(true)
    state.setIsSubmitting(true)
    state.setSelectedPackId('pack-123')
    state.setSelectedPackName('Comedy Classics')
    state.setGameSetupMode('custom')

    state.reset()

    const after = useSelectionStore.getState()
    expect(after.availableCards).toBeNull()
    expect(after.selection).toEqual({ character: '', setting: '', circumstance: '' })
    expect(after.hasSubmitted).toBe(false)
    expect(after.isSubmitting).toBe(false)
    expect(after.selectedPackId).toBe('')
    expect(after.selectedPackName).toBeNull()
    expect(after.gameSetupMode).toBe('quick')
  })
})
