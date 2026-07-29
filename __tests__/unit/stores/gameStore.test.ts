import { useGameStore } from '@/stores/gameStore'
import type { PublicPlayer, RoomSettings } from '@/lib/types'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it('initializes with defaults', () => {
    const state = useGameStore.getState()
    expect(state.gameState).toBe('LOBBY')
    expect(state.players).toEqual([])
    expect(state.roomCode).toBe('')
    expect(state.role).toBeNull()
    expect(state.settings).toBeNull()
    expect(state.countdown).toBeNull()
    expect(state.creditBalance).toBeNull()
  })

  it('sets role and room code', () => {
    const { setRole, setRoomCode } = useGameStore.getState()

    setRole('host')
    setRoomCode('ABCD')

    const state = useGameStore.getState()
    expect(state.role).toBe('host')
    expect(state.roomCode).toBe('ABCD')
  })

  it('updates game state', () => {
    const { setGameState } = useGameStore.getState()

    setGameState('SELECTION')
    expect(useGameStore.getState().gameState).toBe('SELECTION')

    setGameState('PERFORMING')
    expect(useGameStore.getState().gameState).toBe('PERFORMING')
  })

  it('updates players list', () => {
    const { setPlayers } = useGameStore.getState()

    const players: PublicPlayer[] = [
      { publicId: '1', nickname: 'Alice', role: 'HOST', isHost: true },
      { publicId: '2', nickname: 'Bob', role: 'PLAYER', isHost: false },
    ]

    setPlayers(players)
    expect(useGameStore.getState().players).toEqual(players)
    expect(useGameStore.getState().players).toHaveLength(2)
  })

  it('sets settings', () => {
    const { setSettings } = useGameStore.getState()

    const settings: RoomSettings = { isMature: false, gameMode: 'SOLO' }
    setSettings(settings)
    expect(useGameStore.getState().settings).toEqual(settings)
  })

  it('sets countdown', () => {
    const { setCountdown } = useGameStore.getState()

    setCountdown(10)
    expect(useGameStore.getState().countdown).toBe(10)

    setCountdown(null)
    expect(useGameStore.getState().countdown).toBeNull()
  })

  it('sets credit balance', () => {
    const { setCreditBalance } = useGameStore.getState()

    setCreditBalance({ free: 3, banked: 10, total: 13 })
    expect(useGameStore.getState().creditBalance).toEqual({ free: 3, banked: 10, total: 13 })
  })

  it('resets to defaults', () => {
    const state = useGameStore.getState()
    state.setGameState('RESULTS')
    state.setPlayers([{ publicId: '1', nickname: 'Alice', role: 'HOST', isHost: true }])
    state.setRoomCode('WXYZ')
    state.setRole('host')
    state.setSettings({ isMature: true, gameMode: 'ENSEMBLE' })
    state.setCountdown(5)
    state.setCreditBalance({ free: 1, banked: 2, total: 3 })

    state.reset()

    const after = useGameStore.getState()
    expect(after.gameState).toBe('LOBBY')
    expect(after.players).toEqual([])
    expect(after.roomCode).toBe('')
    expect(after.role).toBeNull()
    expect(after.settings).toBeNull()
    expect(after.countdown).toBeNull()
    expect(after.creditBalance).toBeNull()
  })
})
