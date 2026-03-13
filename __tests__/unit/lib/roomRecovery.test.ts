import { applyRoomRecoverySnapshot } from '@/lib/roomRecovery'
import { useConnectionStore } from '@/stores/connectionStore'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useVotingStore } from '@/stores/votingStore'
import type { RoomRecoverySnapshot } from '@/lib/types'

describe('applyRoomRecoverySnapshot', () => {
  beforeEach(() => {
    useConnectionStore.getState().reset()
    useGameStore.getState().reset()
    useScriptStore.getState().reset()
    useSelectionStore.getState().reset()
    useVotingStore.getState().reset()
  })

  it('restores results, director review, pause state, and assigned character', () => {
    const snapshot: RoomRecoverySnapshot = {
      gameState: 'PERFORMING',
      players: [],
      script: {
        title: 'Recovered Script',
        synopsis: 'Recovered synopsis',
        lines: [],
      },
      currentLineIndex: 7,
      scriptImageUrl: 'https://example.com/poster.png',
      isPaused: true,
      hostDisconnected: true,
      myPlayerId: 'player-1',
      roomCode: 'ABCD',
      assignedCharacter: 'Detective',
      myRole: 'PLAYER',
      hasSubmittedSelection: true,
      selection: { character: 'Detective', setting: 'Train', circumstance: 'Storm' },
      spectatorMessages: [],
      votingStatus: { hasVoted: false },
      results: {
        winner: { playerId: 'player-1', playerName: 'Alice', votes: 3 },
        allResults: [{ playerId: 'player-1', playerName: 'Alice', votes: 3 }],
      },
      directorsReview: {
        rating: 4,
        headline: 'A triumph',
        review: 'Very serious about very silly business.',
        bestMoment: 'The final monologue.',
      },
      roomSettings: {
        isMature: false,
        gameMode: 'ENSEMBLE',
      },
    }

    applyRoomRecoverySnapshot(snapshot)

    expect(useGameStore.getState().myCharacter).toBe('Detective')
    expect(useScriptStore.getState().isPlaying).toBe(false)
    expect(useConnectionStore.getState().hostDisconnected).toBe(true)
    expect(useVotingStore.getState().gameResults).toEqual(snapshot.results)
    expect(useVotingStore.getState().directorsReview).toEqual(snapshot.directorsReview)
  })

  it('clears stale results when the recovered room is not in results state', () => {
    useVotingStore.getState().setResults({
      winner: { playerId: 'old', playerName: 'Old Winner', votes: 2 },
      allResults: [{ playerId: 'old', playerName: 'Old Winner', votes: 2 }],
    })
    useVotingStore.getState().setDirectorsReview({
      rating: 5,
      headline: 'Old Review',
      review: 'Old review text.',
      bestMoment: 'Old moment.',
    })

    applyRoomRecoverySnapshot({
      gameState: 'LOBBY',
      players: [],
      script: null,
      currentLineIndex: 0,
      scriptImageUrl: null,
      isPaused: false,
      hostDisconnected: false,
      myPlayerId: 'player-1',
      roomCode: 'ABCD',
      roomSettings: {
        isMature: false,
        gameMode: 'ENSEMBLE',
      },
    })

    expect(useVotingStore.getState().gameResults).toBeNull()
    expect(useVotingStore.getState().directorsReview).toBeNull()
  })
})
