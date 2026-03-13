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

export type AudienceReactionType = 'laugh' | 'cheer' | 'gasp' | 'boo' | 'applause' | 'cringe' | 'love' | 'mindblown'

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

export interface SpectatorMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
  isPreset: boolean
}

export interface ReactionTimelineEntry {
  type: AudienceReactionType
  lineIndex: number
  timestamp: number
}

export interface ClipMoment {
  startTime: number
  endTime: number
  lineIndex: number
  reactionCount: number
  peakReactionType: AudienceReactionType
}

export interface AudienceInteractionState {
  reactions: AudienceReaction[]
  reactionCounts: Record<AudienceReactionType, number>
  reactionTimeline: ReactionTimelineEntry[]
  activePlotTwist?: {
    id: string
    options: PlotTwistOption[]
    expiresAt: number
    isActive: boolean
    _voters?: Set<string> // Runtime only — tracks who voted to prevent duplicates
  }
  plotTwistHistory: string[] // Winning twist texts from previous rounds
  spectatorMessages: SpectatorMessage[]
}

// ============================================================
// AI Director's Review
// ============================================================

export interface DirectorsReview {
  rating: number       // 3-5 stars (always generous)
  headline: string     // e.g. "A Masterclass in Burrito Surgery"
  review: string       // 3-4 sentences of absurd film-critic prose
  bestMoment: string   // One specific funny highlight
}

// ============================================================
// FEATURE 2: AI Script Customization Engine
// ============================================================

export type ComedyStyle = 'witty' | 'slapstick' | 'absurdist' | 'dark' | 'sitcom' | 'improv'
export type ScriptLength = 'lightning' | 'quick' | 'standard' | 'epic'
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
  authorId?: string
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
export type SoundEffectType = 'door_slam' | 'laugh_track' | 'dramatic_sting' | 'applause' | 'record_scratch' | 'crickets' | 'explosion' | 'magic_sparkle' | 'plot_twist_trigger' | 'plot_twist_reveal'

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
  sessionId?: string
  uid?: string
  connected?: boolean
  hasSubmittedSelection?: boolean
  hasSubmittedVote?: boolean
  assignedCharacter?: string
  score?: number
  level?: number
  title?: string
}

export interface CardSelection {
  character: string
  setting: string
  circumstance: string
}

export interface AvailableCards {
  characters: string[]
  settings: string[]
  circumstances: string[]
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
  imageUrl?: string
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
  setting?: string
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
  // Credit System: Firebase UID of host for credit deduction
  hostUid?: string
  // Feature 8: Public Games
  isPublic?: boolean
  publicTitle?: string
  autoStart?: boolean
  results?: GameResults
  // AI Director's Review
  directorsReview?: DirectorsReview
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
  // Feature 8: Public Games
  isPublic?: boolean
  publicTitle?: string
}

export interface VoteResult {
  playerId: string
  playerName: string
  votes: number
}

export interface GameResults {
  winner?: VoteResult
  allResults: VoteResult[]
  highlights?: { label: string; value: string; icon: string }[]
}

export interface RoomRecoverySnapshot {
  gameState: GameState
  players: Player[]
  script: Script | null
  currentLineIndex: number
  scriptImageUrl: string | null
  isPaused: boolean
  hostDisconnected: boolean
  assignedCharacter?: string
  myRole?: PlayerRole
  myPlayerId: string
  roomCode: string
  hasSubmittedSelection?: boolean
  selection?: CardSelection
  spectatorMessages?: SpectatorMessage[]
  votingStatus?: { hasVoted: boolean }
  results?: GameResults | null
  directorsReview?: DirectorsReview | null
  roomSettings?: RoomSettings
}

export type BetaFeatureKey =
  | 'publicMatchmaking'
  | 'purchases'
  | 'audience'
  | 'cardPacks'
  | 'replays'
  | 'admin'

export interface BetaFeatureConfig {
  enabled: boolean
  label: string
  description: string
}

export type BetaFeatureMatrix = Record<BetaFeatureKey, BetaFeatureConfig>

// ============================================================
// Admin Dashboard Types
// ============================================================

export interface AdminRoomPlayer {
  id: string
  nickname: string
  role: string
  isHost: boolean
}

export interface AdminRoomInfo {
  code: string
  hostNickname: string
  playerCount: number
  spectatorCount: number
  gameState: string
  createdAt?: number
  gameMode: string
  scriptTitle?: string
  players: AdminRoomPlayer[]
}

export interface AdminUserInfo {
  uid: string
  displayName: string
  email?: string
  phoneNumber?: string
  linkedAccounts: string[]
  credits: { free: number; banked: number }
  lastSeenAt: number
  gamesPlayed?: number
}

export interface AdminStats {
  activeRooms: number
  connectedSockets: number
  totalUsersInRooms: number
  gamesPlayedToday: number
  recentGameModes: Record<string, number>
  totalRegisteredUsers: number
}

// ── Error Types ─────────────────────────────────────────────

export type ErrorCode =
  | 'SCRIPT_GENERATION_FAILED'
  | 'SCRIPT_GENERATION_TIMEOUT'
  | 'IMAGE_GENERATION_FAILED'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'INVALID_GAME_STATE'
  | 'AUTH_REQUIRED'
  | 'AUTH_EXPIRED'
  | 'RATE_LIMITED'
  | 'CREDIT_INSUFFICIENT'
  | 'DATABASE_ERROR'
  | 'NETWORK_TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'

export type WarningCode =
  | 'IMAGE_GENERATION_SLOW'
  | 'PLAYER_RECONNECTING'
  | 'PLAYER_RECONNECTED'
  | 'DATABASE_WRITE_DELAYED'
  | 'FALLBACK_ACTIVATED'

export type ErrorAction =
  | { type: 'RETRY'; event: string }
  | { type: 'REDIRECT'; path: string }
  | { type: 'RELOAD' }
  | { type: 'DISMISS' }

export interface GameError {
  code: ErrorCode
  message: string
  phase?: GameState
  recoverable: boolean
  action?: ErrorAction
}

export interface GameWarning {
  code: WarningCode
  message: string
  details?: string
}

// ── Socket Response Type ────────────────────────────────────

export type SocketResponse<T = void> =
  | ({ success: true } & (T extends void ? {} : { data: T }))
  | { success: false; error: string; code?: ErrorCode; requestId?: string }

// Socket.io Event Interfaces
export interface ServerToClientEvents {
  room_created: (code: string) => void
  player_joined: (player: Player) => void
  player_left: (playerId: string) => void
  game_state_change: (newState: GameState) => void
  players_update: (players: Player[]) => void
  green_room_prompt: (question: string) => void
  script_ready: (script: Script | ScriptWithAudio) => void
  script_image_update: (imageUrl: string) => void
  sync_teleprompter: (data: TeleprompterSyncData | number) => void // Backward compatible
  game_over: (results: GameResults) => void
  error: (message: string) => void
  host_disconnected: (data: { message: string }) => void
  room_settings_update: (settings: RoomSettings) => void
  available_cards: (cards: { characters: string[], settings: string[], circumstances: string[] }) => void

  // Feature 1: Audience Interaction Events
  audience_reaction_received: (reaction: AudienceReaction) => void
  audience_reaction_counts: (counts: Record<AudienceReactionType, number>) => void
  plot_twist_started: (twist: { id: string, options: PlotTwistOption[], expiresAt: number }) => void
  plot_twist_vote_update: (optionId: string, newCount: number) => void
  plot_twist_result: (winningTwist: string) => void
  plot_twist_injected: (lineIndex: number, newLines: ScriptLine[]) => void
  spectator_message_received: (message: SpectatorMessage) => void

  // Feature 3: Card Pack Events
  card_packs_list: (packs: CardPackMetadata[]) => void
  card_pack_selected: (packId: string, packName: string) => void
  custom_cards_available: (cards: { characters: Card[], settings: Card[], circumstances: Card[] }) => void

  // Feature 4: Audio Events
  play_sound_effect: (effect: SoundEffectType) => void
  play_line_audio: (lineIndex: number, audioUrl: string) => void
  audio_settings_update: (settings: AudioSettings) => void
  ambience_start: (trackUrl: string) => void
  ambience_stop: () => void
  turn_chime: (playerId: string) => void

  // Feature 6: Player Stats Events
  achievement_unlocked: (achievement: Achievement) => void

  // Admin Events
  kicked: (data: { reason: string }) => void

  // Credit System Events
  credit_balance: (balance: { free: number, banked: number, total: number }) => void
  insufficient_credits: (data: { needed: number, available: number }) => void

  // AI Script Generation Progress
  script_generation_progress: (data: { phase: string; percent: number; title?: string }) => void

  // Teleprompter Sync & Play Again Events
  new_game_started: (options: NewGameOptions) => void
  latency_ping: (serverTimestamp: number) => void
  latency_pong_response: (data: { latency: number }) => void

  // Feature 7: Progression Events
  xp_gained: (data: { events: XPEvent[], totalXP: number, level: number, title: string }) => void
  level_up: (data: { newLevel: number, title: string, reward?: LevelReward }) => void

  // Feature 8: Public Games Events
  public_rooms_update: (rooms: PublicRoomListing[]) => void
  auto_start_countdown: (seconds: number) => void

  // AI Director's Review
  directors_review: (review: DirectorsReview) => void

  // Structured Error & Warning Events
  game_error: (error: GameError) => void
  game_warning: (warning: GameWarning) => void
  player_reconnected: (data: { name: string; socketId: string }) => void
  player_disconnected: (data: { name: string }) => void
  performance_paused: (data: { reason: string }) => void
  performance_resumed: () => void
}

export interface ClientToServerEvents {
  create_room: (settings: RoomSettings, callback: (response: { success: boolean, code?: string, error?: string }) => void) => void
  join_room: (roomCode: string, nickname: string, callback: (response: { success: boolean, error?: string, playerId?: string, players?: Player[], settings?: RoomSettings, role?: PlayerRole }) => void) => void
  leave_room: (roomCode: string, callback: (response: { success: boolean, error?: string }) => void) => void
  submit_cards: (roomCode: string, selections: CardSelection, callback: (response: { success: boolean, error?: string }) => void) => void
  start_game: (roomCode: string) => void
  retry_script_generation: (roomCode: string) => void
  submit_vote: (roomCode: string, targetPlayerId: string) => void
  advance_script_line: (roomCode: string) => void
  pause_script: (roomCode: string) => void
  resume_script: (roomCode: string) => void
  jump_to_line: (roomCode: string, lineIndex: number) => void
  end_performance: (roomCode: string) => void
  request_sequel: (roomCode: string) => void
  request_new_game: (roomCode: string, options?: NewGameOptions) => void
  update_room_settings: (roomCode: string, settings: Partial<RoomSettings>) => void
  get_room_preview: (roomCode: string, callback: (response: { success: boolean, preview?: { gameMode: GameMode, playerCount: number, maxPlayers: number, isMature: boolean, gameState: string, hostName: string, players: { nickname: string }[] }, error?: string }) => void) => void
  disconnect: () => void
  // Player navigation (synced with all clients)
  player_jump_to_line: (roomCode: string, lineIndex: number) => void
  // Latency measurement
  latency_pong: (serverTimestamp: number, clientTimestamp: number) => void

  // Feature 1: Audience Interaction Events
  send_audience_reaction: (roomCode: string, reactionType: AudienceReactionType) => void
  start_plot_twist: (roomCode: string) => void
  vote_plot_twist: (roomCode: string, optionId: string) => void
  send_spectator_message: (roomCode: string, text: string, isPreset: boolean) => void

  // Feature 3: Card Pack Events
  list_card_packs: (callback: (response: { success: boolean, packs?: CardPackMetadata[], error?: string }) => void) => void
  select_card_pack: (roomCode: string, packId: string, callback: (response: { success: boolean, error?: string }) => void) => void
  create_card_pack: (pack: CardPackInput, callback: (response: { success: boolean, packId?: string, error?: string }) => void) => void
  update_card_pack: (packId: string, updates: Partial<CardPackInput>, callback: (response: { success: boolean, error?: string }) => void) => void
  delete_card_pack: (packId: string, callback: (response: { success: boolean, error?: string }) => void) => void
  rate_card_pack: (packId: string, rating: number, callback: (response: { success: boolean, newRating?: number, error?: string }) => void) => void
  search_card_packs: (query: string, callback: (response: { success: boolean, packs?: CardPackMetadata[], error?: string }) => void) => void
  get_featured_packs: (limit: number, callback: (response: { success: boolean, packs?: CardPackMetadata[], error?: string }) => void) => void
  get_card_pack: (packId: string, callback: (response: { success: boolean, pack?: CardPack, error?: string }) => void) => void

  // Feature 4: Audio Events
  update_audio_settings: (roomCode: string, settings: Partial<AudioSettings>) => void
  request_line_audio: (roomCode: string, lineIndex: number, callback: (response: { success: boolean, audioUrl?: string, error?: string }) => void) => void
  trigger_sound_effect: (roomCode: string, effect: SoundEffectType) => void

  // Feature 5: Game History Events
  get_game_history: (playerId: string, limit: number, callback: (response: { success: boolean, games?: SavedGame[], error?: string }) => void) => void
  get_game_details: (gameId: string, callback: (response: { success: boolean, game?: SavedGame, error?: string }) => void) => void
  share_game: (gameId: string, callback: (response: { success: boolean, shareUrl?: string, error?: string }) => void) => void
  get_public_replays: (params: { tab: 'recent' | 'trending'; limit: number; offset: number }, callback: (response: { success: boolean, games?: SavedGame[], error?: string }) => void) => void

  // Feature 6: Player Stats Events
  get_player_stats: (playerId: string, callback: (response: { success: boolean, stats?: PlayerStats, error?: string }) => void) => void
  get_leaderboard: (category: LeaderboardCategory, limit: number, callback: (response: { success: boolean, entries?: LeaderboardEntry[], error?: string }) => void) => void

  // Admin Events
  check_admin: (callback: (response: { isAdmin: boolean }) => void) => void
  admin_get_rooms: (callback: (response: { success: boolean; rooms: AdminRoomInfo[] }) => void) => void
  admin_get_users: (query: { limit?: number; offset?: number; search?: string }, callback: (response: { success: boolean; users: AdminUserInfo[]; total: number }) => void) => void
  admin_get_stats: (callback: (response: { success: boolean; stats: AdminStats }) => void) => void
  admin_kick_player: (roomCode: string, playerId: string, callback: (response: { success: boolean; error?: string }) => void) => void
  admin_close_room: (roomCode: string, callback: (response: { success: boolean; error?: string }) => void) => void
  admin_add_credits: (uid: string, amount: number, callback: (response: { success: boolean; newBalance?: number; error?: string }) => void) => void

  // Credit System Events
  get_credit_balance: (callback: (response: { success: boolean, balance?: { free: number, banked: number, total: number }, error?: string }) => void) => void

  // Referral System Events
  get_referral_info: (callback: (response: { success: boolean, referralCode?: string, referralCreditsEarned?: number, referralCount?: number, error?: string }) => void) => void
  redeem_referral: (code: string, callback: (response: { success: boolean, error?: string }) => void) => void

  // Resync after reconnection
  request_resync: (roomCode: string, playerId: string, callback: (response: { success: boolean, gameState?: string, players?: Player[], script?: Script, currentLineIndex?: number, hasSubmittedSelection?: boolean, assignedCharacter?: string, selection?: CardSelection, error?: string }) => void) => void

  // Rejoin room after full disconnect/reconnect
  rejoin_room: (roomCode: string, playerSessionId: string, callback: (res: {
    success: boolean
    error?: string
    snapshot?: RoomRecoverySnapshot
  }) => void) => void

  // Feature 7: Progression Events
  get_progression: (playerId: string, callback: (response: { success: boolean, progression?: Progression, levelInfo?: LevelInfo, error?: string }) => void) => void
  get_weekly_challenges: (callback: (response: { success: boolean, challenges?: WeeklyChallenge[], error?: string }) => void) => void
  claim_level_reward: (level: number, callback: (response: { success: boolean, reward?: LevelReward, error?: string }) => void) => void

  // Feature 8: Public Games Events
  list_public_rooms: (filters: { gameMode?: GameMode, isMature?: boolean } | undefined, callback: (response: { success: boolean, rooms?: PublicRoomListing[], error?: string }) => void) => void
  subscribe_public_rooms: () => void
  unsubscribe_public_rooms: () => void
  quick_play: (request: { gameMode: GameMode, isMature?: boolean }, callback: (response: { success: boolean, code?: string, error?: string }) => void) => void
  cancel_quick_play: () => void
  host_kick_player: (roomCode: string, playerId: string, callback: (response: { success: boolean, error?: string }) => void) => void
}

// ============================================================
// FEATURE 5: Game History & Replay System
// ============================================================

export interface SavedGamePlayer {
  id: string
  nickname: string
  character: string
  isHost: boolean
  votesReceived: number
  isWinner: boolean
}

export interface SavedGame {
  id: string
  title: string // Script title
  synopsis: string
  playedAt: number
  duration: number // in seconds
  roomCode: string
  gameMode: GameMode
  playerIds?: string[] // Top-level array for Firestore querying
  players: SavedGamePlayer[]
  script: Script
  setting: string
  circumstance: string
  winner?: {
    playerId: string
    playerName: string
    character: string
  }
  audienceReactionCount: number
  plotTwistsUsed: string[]
  reactionTimeline?: ReactionTimelineEntry[]
  clipMoments?: ClipMoment[]
  cardPackUsed: string
  comedyStyle: ComedyStyle
  isPublic: boolean
  shareCode?: string
  views: number
  likes: number
  directorsReview?: DirectorsReview
}

export interface GameHistoryFilters {
  playerId?: string
  gameMode?: GameMode
  startDate?: number
  endDate?: number
  won?: boolean
}

// ============================================================
// FEATURE 6: Player Stats & Achievements
// ============================================================

export type AchievementId =
  | 'first_game'
  | 'comedy_king'
  | 'crowd_pleaser'
  | 'plot_twist_survivor'
  | 'versatile_actor'
  | 'winning_streak_3'
  | 'winning_streak_5'
  | 'games_10'
  | 'games_50'
  | 'games_100'
  | 'reactions_100'
  | 'reactions_500'
  | 'perfect_game'
  | 'ensemble_master'
  | 'solo_star'
  | 'card_creator'
  | 'trendsetter'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: number
  progress?: number
  target?: number
}

export interface PlayerStats {
  playerId: string
  nickname: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  totalVotesReceived: number
  totalReactionsReceived: number
  favoriteCharacter?: string
  characterCounts: Record<string, number>
  gameModeStats: {
    solo: { played: number, won: number }
    headToHead: { played: number, won: number }
    ensemble: { played: number, won: number }
  }
  currentWinStreak: number
  bestWinStreak: number
  achievements: Achievement[]
  recentGames: string[] // Game IDs
  joinedAt: number
  lastPlayedAt: number
  // Progression
  totalXP?: number
  level?: number
  title?: string
}

export type LeaderboardCategory = 'wins' | 'games' | 'winRate' | 'reactions' | 'streak'

export interface LeaderboardEntry {
  rank: number
  playerId: string
  nickname: string
  value: number
  achievement?: AchievementId // Featured achievement to display
}

// ============================================================
// Teleprompter Sync & Latency Types
// ============================================================

export interface TeleprompterSyncData {
  lineIndex: number
  serverTimestamp: number
  expectedDuration?: number
}

export interface NewGameOptions {
  keepSelections?: boolean
}

// ============================================================
// Credit System
// ============================================================

export interface CreditBalance {
  free: {
    used: number         // resets to 0 on lazy reset
    limit: number        // default 5
    lastResetDate: string // ISO timestamp
  }
  banked: number          // paid credits, never expire
}

// ============================================================
// User Profile (for persistent user data)
// ============================================================

export interface UserProfile {
  uid: string
  displayName: string
  email?: string
  phoneNumber?: string
  linkedAccounts: ('google' | 'email' | 'phone')[]
  migratedFromAnonymousId?: string
  createdAt: number
  lastSeenAt: number
  preferences?: UserPreferences
  credits: CreditBalance
  lifetimeSpend: number   // total $ spent (cents)
  stripeCustomerId?: string
  referralCode?: string        // Unique 6-char invite code
  referredBy?: string          // UID of referrer
  referralCreditsEarned?: number // Total bonus credits earned from referrals
}

// ============================================================
// Payment Transactions
// ============================================================

export type PaymentTransactionType = 'purchase' | 'refund' | 'expired' | 'failed'
export type PaymentTransactionStatus = 'completed' | 'expired' | 'failed'

export interface PaymentTransaction {
  id: string
  userId: string
  type: PaymentTransactionType
  stripeEventId: string
  packageId: string
  packageLabel: string
  creditsAdded: number     // negative for refunds
  amountCents: number      // negative for refunds
  createdAt: string        // ISO timestamp
  status: PaymentTransactionStatus
}

// ============================================================
// Teleprompter Settings
// ============================================================

export type TeleprompterVisibilityMode = 'focused' | 'balanced' | 'full' | 'custom'

export interface TeleprompterSettings {
  visibilityMode: TeleprompterVisibilityMode
  pastLinesVisible: number | 'all'    // 0-5 or 'all'
  upcomingLinesVisible: number | 'all' // 1-10 or 'all'
  autoScroll: boolean
}

export const DEFAULT_TELEPROMPTER_SETTINGS: TeleprompterSettings = {
  visibilityMode: 'balanced',
  pastLinesVisible: 2,
  upcomingLinesVisible: 3,
  autoScroll: true
}

export const TELEPROMPTER_PRESETS: Record<Exclude<TeleprompterVisibilityMode, 'custom'>, Pick<TeleprompterSettings, 'pastLinesVisible' | 'upcomingLinesVisible'>> = {
  focused: { pastLinesVisible: 1, upcomingLinesVisible: 1 },
  balanced: { pastLinesVisible: 2, upcomingLinesVisible: 3 },
  full: { pastLinesVisible: 'all', upcomingLinesVisible: 'all' }
}

export interface UserPreferences {
  defaultNickname?: string
  preferredGameMode?: GameMode
  soundEffectsEnabled?: boolean
  notificationsEnabled?: boolean
  teleprompter?: TeleprompterSettings
}

export interface UserMigrationData {
  oldPlayerId: string
  newUserId: string
  migratedAt: number
  statsTransferred: boolean
  historyTransferred: boolean
}

// ============================================================
// FEATURE 7: Progression System (XP, Levels, Rewards)
// ============================================================

export type XPSource =
  | 'game_completed'
  | 'game_won'
  | 'votes_received'
  | 'reactions_received'
  | 'achievement_unlocked'
  | 'win_streak'
  | 'daily_first_game'
  | 'weekly_challenge'
  | 'public_game_hosted'

export interface XPEvent {
  source: XPSource
  amount: number
  description: string
  timestamp: number
}

export interface LevelInfo {
  level: number
  currentXP: number
  xpForNextLevel: number
  progressPercent: number
  title: string
}

export interface LevelReward {
  level: number
  type: 'credits' | 'title' | 'badge'
  value: string | number
  description: string
  claimed: boolean
}

export interface WeeklyChallenge {
  id: string
  title: string
  description: string
  target: number
  progress: number
  xpReward: number
  expiresAt: number
  completed: boolean
}

export interface Progression {
  playerId: string
  totalXP: number
  level: number
  title: string
  xpHistory: XPEvent[]
  levelRewardsClaimed: number[]
  weeklyChallenges: WeeklyChallenge[]
  lastDailyBonusDate?: string
  weeklyChallengeSeed?: string
}

// ============================================================
// FEATURE 8: Public Games / Quick Play
// ============================================================

export interface PublicRoomListing {
  code: string
  hostNickname: string
  gameMode: GameMode
  playerCount: number
  maxPlayers: number
  isMature: boolean
  publicTitle?: string
  cardPackName?: string
  createdAt: number
}
