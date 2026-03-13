import type { RoomRecoverySnapshot } from '@/lib/types'
import { useAudienceStore } from '@/stores/audienceStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useGameStore } from '@/stores/gameStore'
import { useScriptStore } from '@/stores/scriptStore'
import { useSelectionStore } from '@/stores/selectionStore'
import { useVotingStore } from '@/stores/votingStore'

export function applyRoomRecoverySnapshot(snapshot: RoomRecoverySnapshot): void {
  const gameStore = useGameStore.getState()
  const scriptStore = useScriptStore.getState()
  const selectionStore = useSelectionStore.getState()
  const audienceStore = useAudienceStore.getState()
  const votingStore = useVotingStore.getState()
  const connectionStore = useConnectionStore.getState()

  gameStore.setGameState(snapshot.gameState)
  gameStore.setPlayers(snapshot.players)
  gameStore.setRoomCode(snapshot.roomCode)
  gameStore.setMyPlayerId(snapshot.myPlayerId)
  gameStore.setMyRole(snapshot.myRole ?? 'PLAYER')
  gameStore.setMyCharacter(snapshot.assignedCharacter ?? '')
  gameStore.setRoomIsMature(snapshot.roomSettings?.isMature ?? gameStore.roomIsMature)

  if (snapshot.roomSettings) {
    gameStore.setSettings(snapshot.roomSettings)
  }

  scriptStore.setScript(snapshot.script)
  scriptStore.setImageUrl(snapshot.scriptImageUrl)
  scriptStore.setCurrentLineIndex(snapshot.currentLineIndex)
  scriptStore.setIsPlaying(
    snapshot.gameState === 'PERFORMING' &&
    !snapshot.hostDisconnected &&
    !snapshot.isPaused
  )

  selectionStore.setHasSubmitted(Boolean(snapshot.hasSubmittedSelection))
  selectionStore.setSelection(snapshot.selection ?? { character: '', setting: '', circumstance: '' })

  audienceStore.setSpectatorMessages(snapshot.spectatorMessages ?? [])

  votingStore.setResults(snapshot.results ?? null)
  votingStore.setDirectorsReview(snapshot.directorsReview ?? null)

  connectionStore.setHostDisconnected(snapshot.hostDisconnected)
  connectionStore.setError(null)
}
