import { useVotingStore } from '@/stores/votingStore'
import type { GameResults, XPEvent } from '@/lib/types'

describe('votingStore', () => {
  beforeEach(() => {
    useVotingStore.getState().reset()
  })

  it('initializes with defaults', () => {
    const state = useVotingStore.getState()
    expect(state.gameResults).toBeNull()
    expect(state.xpEvents).toEqual([])
    expect(state.levelUpData).toBeNull()
  })

  it('sets game results', () => {
    const results: GameResults = {
      winner: { playerId: 'p1', playerName: 'Alice', votes: 3 },
      allResults: [
        { playerId: 'p1', playerName: 'Alice', votes: 3 },
        { playerId: 'p2', playerName: 'Bob', votes: 1 },
      ],
      highlights: [{ label: 'Best Line', value: 'Alice', icon: '🎭' }],
    }

    useVotingStore.getState().setResults(results)
    expect(useVotingStore.getState().gameResults).toEqual(results)
  })

  it('sets xp events', () => {
    const events: XPEvent[] = [
      { source: 'game_completed', amount: 50, description: 'Played a game', timestamp: Date.now() },
      { source: 'votes_received', amount: 25, description: 'Received votes', timestamp: Date.now() },
    ]

    useVotingStore.getState().setXpEvents(events)
    expect(useVotingStore.getState().xpEvents).toEqual(events)
  })

  it('sets level up data', () => {
    const data = { level: 5, title: 'Comedy Pro' }

    useVotingStore.getState().setLevelUpData(data)
    expect(useVotingStore.getState().levelUpData).toEqual(data)
  })

  it('sets level up data to null', () => {
    useVotingStore.getState().setLevelUpData({ level: 3, title: 'Jokester' })
    useVotingStore.getState().setLevelUpData(null)
    expect(useVotingStore.getState().levelUpData).toBeNull()
  })

  it('resets to defaults', () => {
    const results: GameResults = {
      allResults: [{ playerId: 'p1', playerName: 'Alice', votes: 2 }],
    }
    useVotingStore.getState().setResults(results)
    useVotingStore.getState().setXpEvents([
      { source: 'game_completed', amount: 50, description: 'Played', timestamp: Date.now() },
    ])
    useVotingStore.getState().setLevelUpData({ level: 10, title: 'Legend' })

    useVotingStore.getState().reset()

    const state = useVotingStore.getState()
    expect(state.gameResults).toBeNull()
    expect(state.xpEvents).toEqual([])
    expect(state.levelUpData).toBeNull()
  })
})
