import { create } from 'zustand'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface ConnectionStoreState {
  isConnected: boolean
  connectionState: ConnectionState
  reconnectAttempt: number
  latency: number | null
  hostDisconnected: boolean
  error: string | null
}

export interface ConnectionStoreActions {
  setIsConnected: (isConnected: boolean) => void
  setConnectionState: (connectionState: ConnectionState) => void
  setReconnectAttempt: (reconnectAttempt: number) => void
  setLatency: (latency: number | null) => void
  setHostDisconnected: (hostDisconnected: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: ConnectionStoreState = {
  isConnected: false,
  connectionState: 'disconnected',
  reconnectAttempt: 0,
  latency: null,
  hostDisconnected: false,
  error: null,
}

export const useConnectionStore = create<ConnectionStoreState & ConnectionStoreActions>()((set) => ({
  ...initialState,

  setIsConnected: (isConnected) => set({ isConnected }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  setLatency: (latency) => set({ latency }),
  setHostDisconnected: (hostDisconnected) => set({ hostDisconnected }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
