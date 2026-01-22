export type GameState =
  | 'LOBBY'
  | 'SELECTION'
  | 'LOADING'
  | 'PERFORMING'
  | 'VOTING'
  | 'RESULTS'

export type GameMode = 'SOLO' | 'HEAD_TO_HEAD' | 'ENSEMBLE'

export type PlayerRole = 'HOST' | 'PLAYER' | 'SPECTATOR'

export interface Player {
  id: string
  nickname: string
  role: PlayerRole
  isHost: boolean
  socketId: string
  hasSubmittedSelection?: boolean
  hasSubmittedVote?: boolean
  assignedCharacter?: string
  score?: number
}

export interface CardSelection {
  character: string
  setting: string
  circumstance: string
}

export interface ScriptLine {
  speaker: string
  text: string
  mood: 'angry' | 'happy' | 'confused' | 'whispering' | 'neutral'
}

export interface Script {
  title: string
  synopsis: string
  lines: ScriptLine[]
}

export interface Room {
  code: string
  host: Player
  players: Map<string, Player>
  gameState: GameState
  gameMode: GameMode
  isMature: boolean
  selections: Map<string, CardSelection>
  script?: Script
  currentLineIndex: number
  votes: Map<string, string> // playerId -> targetPlayerId
  createdAt: number
  lastActivity: number
}

export interface RoomSettings {
  isMature: boolean
  gameMode: GameMode
}

export interface VoteResult {
  playerId: string
  playerName: string
  votes: number
}

export interface GameResults {
  winner?: VoteResult
  allResults: VoteResult[]
}

// Socket.io Event Interfaces
export interface ServerToClientEvents {
  room_created: (code: string) => void
  player_joined: (player: Player) => void
  player_left: (playerId: string) => void
  game_state_change: (newState: GameState) => void
  players_update: (players: Player[]) => void
  green_room_prompt: (question: string) => void
  script_ready: (script: Script) => void
  sync_teleprompter: (lineIndex: number) => void
  game_over: (results: GameResults) => void
  error: (message: string) => void
  room_settings_update: (settings: RoomSettings) => void
  available_cards: (cards: { characters: string[], settings: string[], circumstances: string[] }) => void
}

export interface ClientToServerEvents {
  create_room: (settings: RoomSettings, callback: (response: { success: boolean, code?: string, error?: string }) => void) => void
  join_room: (roomCode: string, nickname: string, callback: (response: { success: boolean, error?: string, players?: Player[], settings?: RoomSettings, role?: PlayerRole }) => void) => void
  submit_cards: (roomCode: string, selections: CardSelection, callback: (response: { success: boolean, error?: string }) => void) => void
  start_game: (roomCode: string) => void
  submit_vote: (roomCode: string, targetPlayerId: string) => void
  advance_script_line: (roomCode: string) => void
  request_new_game: (roomCode: string) => void
  update_room_settings: (roomCode: string, settings: Partial<RoomSettings>) => void
  disconnect: () => void
}
