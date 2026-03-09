import { create } from 'zustand'
import type { GameState, Player, RoomSettings } from '@/lib/types'

export interface GameStoreState {
  gameState: GameState
  players: Player[]
  roomCode: string
  role: 'host' | 'player' | 'spectator' | null
  settings: RoomSettings | null
  countdown: number | null
  creditBalance: { free: number; banked: number; total: number } | null
}

export interface GameStoreActions {
  setGameState: (state: GameState) => void
  setPlayers: (players: Player[]) => void
  setRoomCode: (code: string) => void
  setRole: (role: GameStoreState['role']) => void
  setSettings: (settings: RoomSettings | null) => void
  setCountdown: (countdown: number | null) => void
  setCreditBalance: (balance: GameStoreState['creditBalance']) => void
  reset: () => void
}

const initialState: GameStoreState = {
  gameState: 'LOBBY',
  players: [],
  roomCode: '',
  role: null,
  settings: null,
  countdown: null,
  creditBalance: null,
}

export const useGameStore = create<GameStoreState & GameStoreActions>()((set) => ({
  ...initialState,

  setGameState: (gameState) => set({ gameState }),
  setPlayers: (players) => set({ players }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setRole: (role) => set({ role }),
  setSettings: (settings) => set({ settings }),
  setCountdown: (countdown) => set({ countdown }),
  setCreditBalance: (creditBalance) => set({ creditBalance }),
  reset: () => set(initialState),
}))
