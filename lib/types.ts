export type GameState =
  | 'LOBBY'
  | 'SELECTION'
  | 'LOADING'
  | 'PERFORMING'
  | 'VOTING'
  | 'RESULTS'

export type GameMode = 'SOLO' | 'HEAD_TO_HEAD' | 'ENSEMBLE'

export type PlayerRole = 'HOST' | 'PLAYER' | 'SPECTATOR'

// ============================================================
// FEATURE 1: Audience Interaction System
// ============================================================

export type AudienceReactionType = 'laugh' | 'cheer' | 'gasp' | 'boo' | 'applause'

export interface AudienceReaction {
  id: string
  type: AudienceReactionType
  senderId: string
  senderName: string
  timestamp: number
}

export interface PlotTwistOption {
  id: string
  text: string
  votes: number
}

export interface PlotTwistVote {
  optionId: string
  voterId: string
  timestamp: number
}

export interface AudienceInteractionState {
  reactions: AudienceReaction[]
  reactionCounts: Record<AudienceReactionType, number>
  activePlotTwist?: {
    id: string
    options: PlotTwistOption[]
    expiresAt: number
    isActive: boolean
  }
  plotTwistHistory: string[] // Winning twist texts from previous rounds
}

// ============================================================
// FEATURE 2: AI Script Customization Engine
// ============================================================

export type ComedyStyle = 'witty' | 'slapstick' | 'absurdist' | 'dark' | 'sitcom' | 'improv'
export type ScriptLength = 'quick' | 'standard' | 'epic'
export type ScriptDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type PhysicalComedyLevel = 'none' | 'minimal' | 'heavy'

export interface ScriptCustomization {
  comedyStyle: ComedyStyle
  scriptLength: ScriptLength
  difficulty: ScriptDifficulty
  physicalComedy: PhysicalComedyLevel
  enableCallbacks: boolean // Reference jokes from previous rounds
  customInstructions?: string // Optional host notes for AI
}

export const DEFAULT_SCRIPT_CUSTOMIZATION: ScriptCustomization = {
  comedyStyle: 'witty',
  scriptLength: 'standard',
  difficulty: 'intermediate',
  physicalComedy: 'minimal',
  enableCallbacks: true
}

// ============================================================
// FEATURE 3: Custom Card Pack Creator
// ============================================================

export interface Card {
  id: string
  name: string
  description?: string
  tags?: string[]
  imageUrl?: string
}

// For creating cards (id is optional since it's generated server-side)
export interface CardInput {
  id?: string
  name: string
  description?: string
  tags?: string[]
  imageUrl?: string
}

// Type for creating card packs (uses CardInput instead of Card)
export interface CardPackInput {
  name: string
  description: string
  author: string
  theme: string
  isMature: boolean
  isBuiltIn: boolean
  isPublic: boolean
  characters: CardInput[]
  settings: CardInput[]
  circumstances: CardInput[]
}

export interface CardPack {
  id: string
  name: string
  description: string
  author: string
  authorId?: string
  theme: string
  isMature: boolean
  isBuiltIn: boolean
  isPublic: boolean
  characters: Card[]
  settings: Card[]
  circumstances: Card[]
  downloads: number
  rating: number
  ratingCount: number
  createdAt: number
  updatedAt: number
}

export interface CardPackMetadata {
  id: string
  name: string
  description: string
  author: string
  theme: string
  isMature: boolean
  isBuiltIn: boolean
  cardCounts: {
    characters: number
    settings: number
    circumstances: number
  }
  downloads: number
  rating: number
}

// ============================================================
// FEATURE 4: Voice & Audio Integration
// ============================================================

export type VoiceProvider = 'browser' | 'elevenlabs' | 'openai'
export type SoundEffectType = 'door_slam' | 'laugh_track' | 'dramatic_sting' | 'applause' | 'record_scratch' | 'crickets' | 'explosion' | 'magic_sparkle'

export interface VoiceSettings {
  enabled: boolean
  provider: VoiceProvider
  speed: number // 0.5 - 2.0
  pitch: number // 0.5 - 2.0
  volume: number // 0 - 1
  voiceId?: string // Provider-specific voice ID
}

export interface AudioSettings {
  voiceEnabled: boolean
  voiceSettings: VoiceSettings
  soundEffectsEnabled: boolean
  soundEffectsVolume: number // 0 - 1
  ambienceEnabled: boolean
  ambienceVolume: number // 0 - 1
  turnChimeEnabled: boolean
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  voiceEnabled: false,
  voiceSettings: {
    enabled: false,
    provider: 'browser',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8
  },
  soundEffectsEnabled: true,
  soundEffectsVolume: 0.5,
  ambienceEnabled: false,
  ambienceVolume: 0.3,
  turnChimeEnabled: true
}

export interface ScriptLineWithAudio extends ScriptLine {
  audioUrl?: string
  soundEffect?: SoundEffectType
  stageDirection?: string
}

export interface ScriptWithAudio extends Omit<Script, 'lines'> {
  lines: ScriptLineWithAudio[]
  ambienceTrack?: string
}

// ============================================================
// Core Types (Updated)
// ============================================================

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
  script?: Script | ScriptWithAudio
  currentLineIndex: number
  isPaused: boolean
  votes: Map<string, string> // playerId -> targetPlayerId
  createdAt: number
  lastActivity: number
  // Feature 1: Audience Interaction
  audienceInteraction?: AudienceInteractionState
  // Feature 2: Script Customization
  scriptCustomization?: ScriptCustomization
  // Feature 3: Card Pack
  cardPackId?: string
  // Feature 4: Audio Settings
  audioSettings?: AudioSettings
}

export interface RoomSettings {
  isMature: boolean
  gameMode: GameMode
  // Feature 2: Script Customization
  scriptCustomization?: ScriptCustomization
  // Feature 3: Card Pack
  cardPackId?: string
  // Feature 4: Audio Settings
  audioSettings?: AudioSettings
  // Feature 1: Audience Interaction
  audienceInteractionEnabled?: boolean
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
  script_ready: (script: Script | ScriptWithAudio) => void
  sync_teleprompter: (lineIndex: number) => void
  game_over: (results: GameResults) => void
  error: (message: string) => void
  room_settings_update: (settings: RoomSettings) => void
  available_cards: (cards: { characters: string[], settings: string[], circumstances: string[] }) => void

  // Feature 1: Audience Interaction Events
  audience_reaction_received: (reaction: AudienceReaction) => void
  audience_reaction_counts: (counts: Record<AudienceReactionType, number>) => void
  plot_twist_started: (twist: { id: string, options: PlotTwistOption[], expiresAt: number }) => void
  plot_twist_vote_update: (optionId: string, newCount: number) => void
  plot_twist_result: (winningTwist: string) => void
  plot_twist_injected: (lineIndex: number, newLines: ScriptLine[]) => void

  // Feature 3: Card Pack Events
  card_packs_list: (packs: CardPackMetadata[]) => void
  card_pack_selected: (packId: string) => void
  custom_cards_available: (cards: { characters: Card[], settings: Card[], circumstances: Card[] }) => void

  // Feature 4: Audio Events
  play_sound_effect: (effect: SoundEffectType) => void
  play_line_audio: (lineIndex: number, audioUrl: string) => void
  audio_settings_update: (settings: AudioSettings) => void
  ambience_start: (trackUrl: string) => void
  ambience_stop: () => void
  turn_chime: (playerId: string) => void
}

export interface ClientToServerEvents {
  create_room: (settings: RoomSettings, callback: (response: { success: boolean, code?: string, error?: string }) => void) => void
  join_room: (roomCode: string, nickname: string, callback: (response: { success: boolean, error?: string, players?: Player[], settings?: RoomSettings, role?: PlayerRole }) => void) => void
  submit_cards: (roomCode: string, selections: CardSelection, callback: (response: { success: boolean, error?: string }) => void) => void
  start_game: (roomCode: string) => void
  submit_vote: (roomCode: string, targetPlayerId: string) => void
  advance_script_line: (roomCode: string) => void
  pause_script: (roomCode: string) => void
  resume_script: (roomCode: string) => void
  jump_to_line: (roomCode: string, lineIndex: number) => void
  request_sequel: (roomCode: string) => void
  request_new_game: (roomCode: string) => void
  update_room_settings: (roomCode: string, settings: Partial<RoomSettings>) => void
  disconnect: () => void

  // Feature 1: Audience Interaction Events
  send_audience_reaction: (roomCode: string, reactionType: AudienceReactionType) => void
  start_plot_twist: (roomCode: string) => void
  vote_plot_twist: (roomCode: string, optionId: string) => void

  // Feature 3: Card Pack Events
  list_card_packs: (callback: (response: { success: boolean, packs?: CardPackMetadata[], error?: string }) => void) => void
  select_card_pack: (roomCode: string, packId: string, callback: (response: { success: boolean, error?: string }) => void) => void
  create_card_pack: (pack: CardPackInput, callback: (response: { success: boolean, packId?: string, error?: string }) => void) => void
  rate_card_pack: (packId: string, rating: number, callback: (response: { success: boolean, error?: string }) => void) => void

  // Feature 4: Audio Events
  update_audio_settings: (roomCode: string, settings: Partial<AudioSettings>) => void
  request_line_audio: (roomCode: string, lineIndex: number, callback: (response: { success: boolean, audioUrl?: string, error?: string }) => void) => void
  trigger_sound_effect: (roomCode: string, effect: SoundEffectType) => void
}
