/**
 * Room serializer for Firestore persistence
 * Converts between Room (with Maps) and FirestoreRoom (with Records)
 */

import type {
  Room,
  Player,
  CardSelection,
  GameState,
  GameMode,
  Script,
  ScriptWithAudio,
  AudienceInteractionState,
  ScriptCustomization,
  AudioSettings
} from '../../lib/types'

/** Firestore-safe version of Room (Records instead of Maps, no socketId) */
export interface FirestorePlayer extends Omit<Player, 'socketId'> {
  socketId?: never
}

export interface FirestoreRoom {
  code: string
  host: FirestorePlayer
  players: Record<string, FirestorePlayer>
  gameState: GameState
  gameMode: GameMode
  isMature: boolean
  selections: Record<string, CardSelection>
  script?: Script | ScriptWithAudio
  currentLineIndex: number
  isPaused: boolean
  votes: Record<string, string>
  setting?: string
  createdAt: number
  lastActivity: number
  audienceInteraction?: AudienceInteractionState
  scriptCustomization?: ScriptCustomization
  cardPackId?: string
  audioSettings?: AudioSettings
}

/** Strip socketId from a Player for Firestore storage */
function stripSocketId(player: Player): FirestorePlayer {
  const { socketId, ...rest } = player
  return rest as FirestorePlayer
}

/** Convert a Room to a Firestore-safe document */
export function roomToFirestore(room: Room): FirestoreRoom {
  const players: Record<string, FirestorePlayer> = {}
  for (const [id, player] of room.players.entries()) {
    players[id] = stripSocketId(player)
  }

  const selections: Record<string, CardSelection> = {}
  for (const [id, selection] of room.selections.entries()) {
    selections[id] = selection
  }

  const votes: Record<string, string> = {}
  for (const [id, targetId] of room.votes.entries()) {
    votes[id] = targetId
  }

  return {
    code: room.code,
    host: stripSocketId(room.host),
    players,
    gameState: room.gameState,
    gameMode: room.gameMode,
    isMature: room.isMature,
    selections,
    script: room.script,
    currentLineIndex: room.currentLineIndex,
    isPaused: room.isPaused,
    votes,
    setting: room.setting,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity,
    audienceInteraction: room.audienceInteraction,
    scriptCustomization: room.scriptCustomization,
    cardPackId: room.cardPackId,
    audioSettings: room.audioSettings
  }
}

/** Convert a Firestore document back to a Room (with Maps, socketId = '') */
export function firestoreToRoom(doc: FirestoreRoom): Room {
  const players = new Map<string, Player>()
  for (const [id, player] of Object.entries(doc.players)) {
    players.set(id, { ...player, socketId: '' })
  }

  const selections = new Map<string, CardSelection>()
  for (const [id, selection] of Object.entries(doc.selections)) {
    selections.set(id, selection)
  }

  const votes = new Map<string, string>()
  for (const [id, targetId] of Object.entries(doc.votes)) {
    votes.set(id, targetId)
  }

  return {
    code: doc.code,
    host: { ...doc.host, socketId: '' },
    players,
    gameState: doc.gameState,
    gameMode: doc.gameMode,
    isMature: doc.isMature,
    selections,
    script: doc.script,
    currentLineIndex: doc.currentLineIndex,
    isPaused: doc.isPaused,
    votes,
    setting: doc.setting,
    createdAt: doc.createdAt,
    lastActivity: doc.lastActivity,
    audienceInteraction: doc.audienceInteraction,
    scriptCustomization: doc.scriptCustomization,
    cardPackId: doc.cardPackId,
    audioSettings: doc.audioSettings
  }
}
