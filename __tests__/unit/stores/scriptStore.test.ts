import { useScriptStore } from '@/stores/scriptStore'
import type { Script } from '@/lib/types'

const mockScript: Script = {
  title: 'The Great Escape',
  synopsis: 'A daring adventure unfolds',
  lines: [
    { speaker: 'Alice', text: 'We need to leave now!', mood: 'angry' },
    { speaker: 'Bob', text: 'But where will we go?', mood: 'confused' },
    { speaker: 'Alice', text: 'Anywhere but here.', mood: 'whispering' },
  ],
}

beforeEach(() => {
  useScriptStore.getState().reset()
})

describe('scriptStore', () => {
  describe('initial state', () => {
    it('initializes with defaults', () => {
      const state = useScriptStore.getState()
      expect(state.script).toBeNull()
      expect(state.currentLineIndex).toBe(0)
      expect(state.isPlaying).toBe(false)
      expect(state.imageUrl).toBeNull()
      expect(state.isGeneratingImage).toBe(false)
      expect(state.generationProgress).toBe(0)
      expect(state.generationPhase).toBe('')
      expect(state.titlePreview).toBeNull()
      expect(state.generationTimedOut).toBe(false)
    })
  })

  describe('setScript', () => {
    it('sets the script and resets currentLineIndex to 0', () => {
      const { setCurrentLineIndex, setScript } = useScriptStore.getState()

      // Advance line index first
      setCurrentLineIndex(5)
      expect(useScriptStore.getState().currentLineIndex).toBe(5)

      // Setting script should reset line index
      setScript(mockScript)
      const state = useScriptStore.getState()
      expect(state.script).toBe(mockScript)
      expect(state.currentLineIndex).toBe(0)
    })

    it('clears script when set to null', () => {
      const { setScript } = useScriptStore.getState()
      setScript(mockScript)
      setScript(null)
      expect(useScriptStore.getState().script).toBeNull()
    })
  })

  describe('teleprompter controls', () => {
    it('advances line index', () => {
      const { setCurrentLineIndex } = useScriptStore.getState()
      setCurrentLineIndex(1)
      expect(useScriptStore.getState().currentLineIndex).toBe(1)
      setCurrentLineIndex(2)
      expect(useScriptStore.getState().currentLineIndex).toBe(2)
    })

    it('goes back to previous line', () => {
      const { setCurrentLineIndex } = useScriptStore.getState()
      setCurrentLineIndex(3)
      setCurrentLineIndex(2)
      expect(useScriptStore.getState().currentLineIndex).toBe(2)
    })

    it('toggles play/pause', () => {
      const { setIsPlaying } = useScriptStore.getState()
      expect(useScriptStore.getState().isPlaying).toBe(false)

      setIsPlaying(true)
      expect(useScriptStore.getState().isPlaying).toBe(true)

      setIsPlaying(false)
      expect(useScriptStore.getState().isPlaying).toBe(false)
    })
  })

  describe('generation progress', () => {
    it('tracks generation progress and phase', () => {
      const { setGenerationProgress, setGenerationPhase } = useScriptStore.getState()

      setGenerationProgress(25)
      setGenerationPhase('Crafting dialogue...')
      expect(useScriptStore.getState().generationProgress).toBe(25)
      expect(useScriptStore.getState().generationPhase).toBe('Crafting dialogue...')

      setGenerationProgress(75)
      setGenerationPhase('Adding stage directions...')
      expect(useScriptStore.getState().generationProgress).toBe(75)
      expect(useScriptStore.getState().generationPhase).toBe('Adding stage directions...')
    })

    it('tracks title preview', () => {
      const { setTitlePreview } = useScriptStore.getState()
      setTitlePreview('The Great Escape')
      expect(useScriptStore.getState().titlePreview).toBe('The Great Escape')
    })

    it('tracks generation timeout', () => {
      const { setGenerationTimedOut } = useScriptStore.getState()
      setGenerationTimedOut(true)
      expect(useScriptStore.getState().generationTimedOut).toBe(true)
    })

    it('tracks image generation state', () => {
      const { setIsGeneratingImage, setImageUrl } = useScriptStore.getState()

      setIsGeneratingImage(true)
      expect(useScriptStore.getState().isGeneratingImage).toBe(true)

      setImageUrl('https://example.com/poster.png')
      setIsGeneratingImage(false)
      expect(useScriptStore.getState().imageUrl).toBe('https://example.com/poster.png')
      expect(useScriptStore.getState().isGeneratingImage).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets all state to defaults', () => {
      const actions = useScriptStore.getState()

      // Set everything to non-default values
      actions.setScript(mockScript)
      actions.setCurrentLineIndex(5)
      actions.setIsPlaying(true)
      actions.setImageUrl('https://example.com/img.png')
      actions.setIsGeneratingImage(true)
      actions.setGenerationProgress(80)
      actions.setGenerationPhase('Almost done...')
      actions.setTitlePreview('Preview Title')
      actions.setGenerationTimedOut(true)

      // Reset
      useScriptStore.getState().reset()

      const state = useScriptStore.getState()
      expect(state.script).toBeNull()
      expect(state.currentLineIndex).toBe(0)
      expect(state.isPlaying).toBe(false)
      expect(state.imageUrl).toBeNull()
      expect(state.isGeneratingImage).toBe(false)
      expect(state.generationProgress).toBe(0)
      expect(state.generationPhase).toBe('')
      expect(state.titlePreview).toBeNull()
      expect(state.generationTimedOut).toBe(false)
    })
  })
})
