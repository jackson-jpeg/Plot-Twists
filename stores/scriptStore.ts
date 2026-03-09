import { create } from 'zustand'
import type { Script } from '@/lib/types'

export interface ScriptState {
  // Script data
  script: Script | null
  currentLineIndex: number
  isPlaying: boolean

  // Image generation
  imageUrl: string | null
  isGeneratingImage: boolean

  // Script generation progress
  generationProgress: number
  generationPhase: string
  titlePreview: string | null
  generationTimedOut: boolean
}

export interface ScriptActions {
  setScript: (script: Script | null) => void
  setCurrentLineIndex: (index: number) => void
  setIsPlaying: (playing: boolean) => void
  setImageUrl: (url: string | null) => void
  setIsGeneratingImage: (generating: boolean) => void
  setGenerationProgress: (progress: number) => void
  setGenerationPhase: (phase: string) => void
  setTitlePreview: (title: string | null) => void
  setGenerationTimedOut: (timedOut: boolean) => void
  reset: () => void
}

const initialState: ScriptState = {
  script: null,
  currentLineIndex: 0,
  isPlaying: false,
  imageUrl: null,
  isGeneratingImage: false,
  generationProgress: 0,
  generationPhase: '',
  titlePreview: null,
  generationTimedOut: false,
}

export const useScriptStore = create<ScriptState & ScriptActions>()((set) => ({
  ...initialState,

  setScript: (script) => set({ script, currentLineIndex: 0 }),
  setCurrentLineIndex: (index) => set({ currentLineIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setImageUrl: (url) => set({ imageUrl: url }),
  setIsGeneratingImage: (generating) => set({ isGeneratingImage: generating }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setGenerationPhase: (phase) => set({ generationPhase: phase }),
  setTitlePreview: (title) => set({ titlePreview: title }),
  setGenerationTimedOut: (timedOut) => set({ generationTimedOut: timedOut }),
  reset: () => set(initialState),
}))
