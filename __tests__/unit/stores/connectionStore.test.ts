import { useConnectionStore } from '@/stores/connectionStore'

describe('connectionStore', () => {
  beforeEach(() => {
    useConnectionStore.getState().reset()
  })

  it('initializes with defaults', () => {
    const state = useConnectionStore.getState()
    expect(state.isConnected).toBe(false)
    expect(state.connectionState).toBe('disconnected')
    expect(state.reconnectAttempt).toBe(0)
    expect(state.latency).toBeNull()
    expect(state.hostDisconnected).toBe(false)
    expect(state.error).toBeNull()
  })

  it('sets isConnected', () => {
    useConnectionStore.getState().setIsConnected(true)
    expect(useConnectionStore.getState().isConnected).toBe(true)
  })

  it('sets connectionState', () => {
    const { setConnectionState } = useConnectionStore.getState()

    setConnectionState('connecting')
    expect(useConnectionStore.getState().connectionState).toBe('connecting')

    setConnectionState('connected')
    expect(useConnectionStore.getState().connectionState).toBe('connected')

    setConnectionState('reconnecting')
    expect(useConnectionStore.getState().connectionState).toBe('reconnecting')

    setConnectionState('disconnected')
    expect(useConnectionStore.getState().connectionState).toBe('disconnected')
  })

  it('sets reconnectAttempt', () => {
    useConnectionStore.getState().setReconnectAttempt(3)
    expect(useConnectionStore.getState().reconnectAttempt).toBe(3)
  })

  it('sets latency', () => {
    const { setLatency } = useConnectionStore.getState()

    setLatency(42)
    expect(useConnectionStore.getState().latency).toBe(42)

    setLatency(null)
    expect(useConnectionStore.getState().latency).toBeNull()
  })

  it('sets hostDisconnected', () => {
    useConnectionStore.getState().setHostDisconnected(true)
    expect(useConnectionStore.getState().hostDisconnected).toBe(true)
  })

  it('sets error', () => {
    const { setError } = useConnectionStore.getState()

    setError('Connection lost')
    expect(useConnectionStore.getState().error).toBe('Connection lost')

    setError(null)
    expect(useConnectionStore.getState().error).toBeNull()
  })

  it('resets to defaults', () => {
    const state = useConnectionStore.getState()
    state.setIsConnected(true)
    state.setConnectionState('connected')
    state.setReconnectAttempt(5)
    state.setLatency(100)
    state.setHostDisconnected(true)
    state.setError('Something broke')

    state.reset()

    const after = useConnectionStore.getState()
    expect(after.isConnected).toBe(false)
    expect(after.connectionState).toBe('disconnected')
    expect(after.reconnectAttempt).toBe(0)
    expect(after.latency).toBeNull()
    expect(after.hostDisconnected).toBe(false)
    expect(after.error).toBeNull()
  })
})
