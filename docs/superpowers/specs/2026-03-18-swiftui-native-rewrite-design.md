# Plot Twists — SwiftUI Native Rewrite Design Spec

**Date:** 2026-03-18
**Status:** Approved (brainstorming complete, spec reviewed)
**Supersedes:** Capacitor WebView approach (decided 2026-02-25)

## Context

Plot Twists is an improv comedy party game where players pick cards, AI generates a script, and they perform it live. The current implementation is a Next.js web app wrapped in a Capacitor WebView shell for iOS.

Apple is increasingly rejecting WebView wrapper apps from the App Store. The current architecture is at risk. Additionally, the game would benefit from native performance, Apple TV support for the host view, and platform features like push notifications, haptics, and SharePlay.

**Decision:** Rebuild the frontend as a pure SwiftUI app targeting iPhone, iPad, and Apple TV. Keep the existing Express + Socket.IO backend unchanged. The web app shifts to a marketing site with a browser-based join fallback.

**Auth note:** Auth was migrated from Firebase Auth to Clerk. The server uses `@clerk/backend` for token verification. Firebase SDK remains in `package.json` for Firestore only. The native app will use Clerk for authentication.

## Guiding Principles

- **Server is the authority.** The native app is a thin view layer. It renders state the server sends and forwards user actions. It never advances game state locally.
- **One codebase, three platforms.** Shared/ contains ~90% of code. Platform targets only contain layout overrides.
- **No half-assing.** Every component is built properly. No temporary hacks, no "we'll fix it later."
- **Backend stays.** Zero server modifications needed for the native client (except adding push notification sending). The server doesn't care what connects — web browser or native app, same socket events.
- **Models match the wire format.** Swift `Codable` structs are mechanically derived from `lib/types.ts`. Field names, enum values, and nesting must match exactly or deserialization will fail silently.

---

## 1. Platform Targets & Project Structure

One Xcode project, three targets:

```
PlotTwists/
├── PlotTwists.xcodeproj
├── Shared/                     ← ~90% of all code
│   ├── Models/                 ← Game state, player, script, card types
│   │   ├── GameModels.swift        ← Core: Room, Player, Script, etc.
│   │   ├── CardModels.swift        ← Card, CardPack, CardSelection
│   │   ├── AudienceModels.swift    ← Reactions, PlotTwist, SpectatorMessage
│   │   ├── ProgressionModels.swift ← XP, Achievements, Leaderboard
│   │   ├── PaymentModels.swift     ← Credits, Transactions
│   │   ├── SocketEvents.swift      ← All event payload types
│   │   └── ErrorModels.swift       ← GameError, GameWarning, ErrorCode
│   ├── Services/
│   │   ├── SocketService.swift     ← WebSocket communication
│   │   ├── AuthService.swift       ← Clerk auth + anonymous sessions
│   │   ├── StoreKitService.swift   ← In-app purchases
│   │   ├── PushService.swift       ← APNs push notifications
│   │   ├── HapticsService.swift    ← Native haptic feedback
│   │   ├── PersistenceService.swift ← Keychain + UserDefaults
│   │   └── DeepLinkService.swift   ← Universal Link handling
│   ├── ViewModels/
│   │   ├── GameViewModel.swift     ← The state machine
│   │   ├── LobbyViewModel.swift
│   │   ├── SelectionViewModel.swift
│   │   ├── PerformingViewModel.swift
│   │   ├── VotingViewModel.swift
│   │   ├── ResultsViewModel.swift
│   │   ├── ExploreViewModel.swift  ← Card pack browsing
│   │   └── ProfileViewModel.swift  ← Stats, achievements, settings
│   ├── Views/
│   │   ├── Components/             ← Shared UI components
│   │   ├── Game/                   ← Phase views (used by all platforms)
│   │   ├── Navigation/             ← Tab bar, routing
│   │   └── Modals/                 ← Sheets, alerts, overlays
│   └── Theme/
│       ├── Colors.swift            ← Color palette constants
│       ├── Typography.swift        ← Font definitions
│       └── Animations.swift        ← Spring presets (replacing Framer Motion)
├── iOS/                        ← iPhone + iPad target (single target, adaptive layout)
│   ├── Views/                  ← Phone/tablet-specific layout overrides
│   ├── iOSApp.swift            ← App entry point
│   └── Info.plist
├── tvOS/                       ← Apple TV target (host view)
│   ├── Views/                  ← TV-optimized host layouts
│   ├── tvOSApp.swift           ← App entry point
│   └── Info.plist
└── PlotTwistsKit/              ← Swift Package (optional, future Mac target)
```

- iPhone and iPad share a target. SwiftUI handles adaptive layout via `@Environment(\.horizontalSizeClass)`.
- Apple TV gets its own target because tvOS has a different input model (focus-based, Siri Remote).
- Minimum deployment: iOS 17, tvOS 17.

---

## 2. Game Architecture — The State Machine

The game progresses through 6 phases, driven entirely by the server:

```
LOBBY → SELECTION → LOADING → PERFORMING → VOTING → RESULTS
```

Three game modes affect the flow: `SOLO` (one player), `HEAD_TO_HEAD` (two players), `ENSEMBLE` (3-8 players). Mode affects card selection UI, script generation, and voting.

### GameViewModel

The single source of truth on the client:

```
GameViewModel (ObservableObject)
├── @Published gamePhase: GameState         ← .lobby, .selection, .loading, .performing, .voting, .results
├── @Published room: Room?                  ← Room code, settings, mode, round
├── @Published players: [Player]            ← Roster with roles, scores, connection status
├── @Published script: Script?              ← Generated script (lines with speaker, mood)
├── @Published currentLineIndex: Int        ← Server-synced teleprompter position
├── @Published isPaused: Bool               ← Performance paused state
├── @Published results: GameResults?        ← Winner, vote tallies, highlights
├── @Published directorsReview: DirectorsReview? ← AI review of the performance
├── @Published connectionState: ConnectionState
├── @Published audienceState: AudienceInteractionState?
├── @Published creditBalance: CreditBalance?
├── @Published generationProgress: GenerationProgress?
│
├── role: PlayerRole                        ← .host, .player, .spectator
├── myPlayerId: String                      ← From join acknowledgement
├── roomCode: String
├── gameMode: GameMode
│
├── SocketService (injected)
├── AuthService (injected)
├── HapticsService (injected)
└── PersistenceService (injected)
```

**Flow:**
1. Server emits `game_state_change` → GameViewModel updates `gamePhase`
2. SwiftUI views observe `gamePhase` and swap the active view
3. User actions (pick card, advance line, vote) → GameViewModel calls SocketService → server processes → broadcasts update → all clients update

**Reconnection:** Socket drops → app sends `rejoin_room` with cached session ID → server responds with `RoomRecoverySnapshot` → GameViewModel hydrates all state from snapshot → user is right back where they were. Session ID and room code are persisted in Keychain so reconnection survives app kill.

---

## 3. Networking Layer — SocketService

### Socket.IO Client Strategy

The server speaks Socket.IO v4 protocol. Two viable approaches:

**Option A: `socket.io-client-swift`** — The official Socket.IO Swift client. Handles protocol framing, acks, reconnection. Risk: maintenance has been slow, compatibility with Socket.IO v4 needs verification.

**Option B: `SocketRocket` or `URLSessionWebSocketTask` + minimal EIO parser** — Connect to the server's raw WebSocket transport directly (`/socket.io/?EIO=4&transport=websocket`). Implement the Engine.IO packet parsing (simple text protocol) ourselves. More work upfront, zero dependency risk.

**Decision: Start with Option A, validate in a spike.** If `socket.io-client-swift` fails to handle acks or v4 properly, fall back to Option B. The spike should test: connection, event emission, acknowledgement callbacks, auto-reconnection, and binary payload support.

### SocketService Design

```
SocketService (ObservableObject)
├── @Published connectionState: ConnectionState
│
├── connect(url: String, token: String)
├── disconnect()
│
├── emit(_ event: String, _ data: [String: Any])
├── emitWithAck(_ event: String, _ data: [String: Any]) async throws -> SocketResponse
│   └── Used for: create_room, join_room, submit_cards, leave_room, etc.
│   └── Returns typed SocketResponse with success/error
│
├── on(_ event: String, handler: @escaping ([Any]) -> Void) -> UUID
│   └── Returns listener ID for cleanup
├── off(_ listenerId: UUID)
│
├── Convenience: typed event streams
│   ├── gameStateChanges: AsyncStream<GameState>
│   ├── playersUpdates: AsyncStream<[Player]>
│   ├── teleprompterSync: AsyncStream<TeleprompterSyncData>
│   ├── scriptReady: AsyncStream<Script>
│   ├── scriptProgress: AsyncStream<GenerationProgress>
│   ├── gameResults: AsyncStream<GameResults>
│   ├── directorsReview: AsyncStream<DirectorsReview>
│   ├── creditBalance: AsyncStream<CreditBalance>
│   ├── gameError: AsyncStream<GameError>
│   ├── gameWarning: AsyncStream<GameWarning>
│   └── ... (all ServerToClientEvents)
│
├── Auto-reconnection
│   ├── Exponential backoff: 1s, 2s, 4s, 8s... up to 30s
│   ├── On reconnect → emit "rejoin_room" with cached session
│   └── Surface reconnection state to UI
│
└── Offline queue
    ├── Actions taken while disconnected are queued
    └── Flushed in order on reconnect
```

### Acknowledgement Callbacks

Many client-to-server events use Socket.IO acknowledgement callbacks. Example:

```typescript
// Server expects:
create_room(settings, callback) → callback({ success: true, code: "ABCD" })
join_room(code, nickname, callback) → callback({ success: true, playerId: "...", players: [...] })
submit_cards(code, selections, callback) → callback({ success: true })
```

The `emitWithAck` method wraps this pattern: emit the event, await the server's ack callback, decode the response into `SocketResponse<T>`. On timeout (10s), throw a connection error.

### Complete Event Mapping

**Server → Client Events (ServerToClientEvents, 40+ events):**

| Event | Payload | Handler |
|-------|---------|---------|
| `game_state_change` | `GameState` | GameViewModel |
| `players_update` | `[Player]` | GameViewModel |
| `script_ready` | `Script` | GameViewModel |
| `script_image_update` | `String` (URL) | GameViewModel |
| `sync_teleprompter` | `TeleprompterSyncData \| Int` | PerformingViewModel |
| `game_over` | `GameResults` | GameViewModel |
| `room_settings_update` | `RoomSettings` | LobbyViewModel |
| `available_cards` | `AvailableCards` | SelectionViewModel |
| `custom_cards_available` | custom cards | SelectionViewModel |
| `script_generation_progress` | `{ phase, percent, title? }` | LoadingViewModel |
| `directors_review` | `DirectorsReview` | ResultsViewModel |
| `new_game_started` | `NewGameOptions` | GameViewModel |
| `credit_balance` | `{ free, banked, total }` | GameViewModel |
| `insufficient_credits` | `{ needed, available }` | GameViewModel |
| `audience_reaction_received` | `AudienceReaction` | AudienceViewModel |
| `audience_reaction_counts` | `Record<Type, Int>` | AudienceViewModel |
| `plot_twist_started` | twist data | AudienceViewModel |
| `plot_twist_vote_update` | `(optionId, newCount)` | AudienceViewModel |
| `plot_twist_result` | `String` | AudienceViewModel |
| `plot_twist_injected` | `(lineIndex, newLines)` | PerformingViewModel |
| `spectator_message_received` | `SpectatorMessage` | AudienceViewModel |
| `play_sound_effect` | `SoundEffectType` | AudioService |
| `audio_settings_update` | `AudioSettings` | AudioService |
| `ambience_start` / `ambience_stop` | track URL | AudioService |
| `turn_chime` | `String` (playerId) | AudioService |
| `achievement_unlocked` | `Achievement` | ProfileViewModel |
| `xp_gained` | XP event data | ProfileViewModel |
| `level_up` | level data | ProfileViewModel |
| `public_rooms_update` | `[PublicRoomListing]` | QuickPlayViewModel |
| `auto_start_countdown` | `Int` (seconds) | LobbyViewModel |
| `game_error` | `GameError` | GameViewModel (shows alert) |
| `game_warning` | `GameWarning` | GameViewModel (shows banner) |
| `player_reconnected` | `{ name, socketId }` | GameViewModel (shows toast) |
| `player_disconnected` | `{ name }` | GameViewModel (shows toast) |
| `performance_paused` | `{ reason }` | PerformingViewModel |
| `performance_resumed` | void | PerformingViewModel |
| `host_disconnected` | `{ message }` | GameViewModel |
| `kicked` | `{ reason }` | GameViewModel (exit game) |
| `latency_ping` / `latency_pong_response` | timing | SocketService |

**Client → Server Events (ClientToServerEvents, 40+ events):**

All callback-based events use `emitWithAck`. Fire-and-forget events use `emit`.

| Event | Callback? | ViewModel |
|-------|-----------|-----------|
| `create_room` | Yes → `{ success, code? }` | LobbyViewModel |
| `join_room` | Yes → `{ success, playerId?, players?, settings?, role? }` | JoinViewModel |
| `leave_room` | Yes | GameViewModel |
| `submit_cards` | Yes | SelectionViewModel |
| `start_game` | No | LobbyViewModel |
| `advance_script_line` | No | PerformingViewModel |
| `pause_script` / `resume_script` | No | PerformingViewModel |
| `jump_to_line` | No | PerformingViewModel |
| `end_performance` | No | PerformingViewModel |
| `submit_vote` | No | VotingViewModel |
| `request_sequel` / `request_new_game` | No | ResultsViewModel |
| `update_room_settings` | No | LobbyViewModel |
| `get_room_preview` | Yes → preview data | JoinViewModel |
| `retry_script_generation` | No | LoadingViewModel |
| `send_audience_reaction` | No | AudienceViewModel |
| `start_plot_twist` | No | AudienceViewModel |
| `vote_plot_twist` | No | AudienceViewModel |
| `send_spectator_message` | No | AudienceViewModel |
| `list_card_packs` | Yes → `[CardPackMetadata]` | ExploreViewModel |
| `select_card_pack` | Yes | LobbyViewModel |
| `get_card_pack` | Yes → `CardPack` | ExploreViewModel |
| `search_card_packs` | Yes → `[CardPackMetadata]` | ExploreViewModel |
| `get_featured_packs` | Yes → `[CardPackMetadata]` | ExploreViewModel |
| `create_card_pack` / `update_card_pack` / `delete_card_pack` | Yes | CardPackEditorVM |
| `rate_card_pack` | Yes | ExploreViewModel |
| `get_credit_balance` | Yes → balance | GameViewModel |
| `get_player_stats` | Yes → `PlayerStats` | ProfileViewModel |
| `get_leaderboard` | Yes → `[LeaderboardEntry]` | ProfileViewModel |
| `get_game_history` | Yes → `[SavedGame]` | ProfileViewModel |
| `get_game_details` | Yes → `SavedGame` | ReplayViewModel |
| `share_game` | Yes → share URL | ResultsViewModel |
| `get_progression` | Yes → `Progression` | ProfileViewModel |
| `get_weekly_challenges` | Yes → `[WeeklyChallenge]` | ProfileViewModel |
| `claim_level_reward` | Yes → `LevelReward` | ProfileViewModel |
| `list_public_rooms` | Yes → `[PublicRoomListing]` | QuickPlayViewModel |
| `subscribe_public_rooms` / `unsubscribe_public_rooms` | No | QuickPlayViewModel |
| `quick_play` | Yes → `{ code? }` | QuickPlayViewModel |
| `rejoin_room` | Yes → `RoomRecoverySnapshot` | GameViewModel |
| `request_resync` | Yes → state snapshot | GameViewModel |
| `get_referral_info` | Yes → referral data | ProfileViewModel |
| `redeem_referral` | Yes | ProfileViewModel |
| `host_kick_player` | Yes | LobbyViewModel |

### Auth Flow

1. App launches → AuthService gets Clerk JWT (or creates anonymous session)
2. SocketService connects with JWT in handshake auth header
3. Server's existing `socketAuth.ts` middleware validates the token (unchanged)
4. On token refresh → SocketService reconnects with new token

### CORS Note

The server's CORS config returns `true` for `!origin` (line 48-49 of server.ts), which allows native app connections that send no Origin header. If CORS ever tightens, the server should add a custom header check (e.g., `X-PlotTwists-Client: ios`) as an explicit allowance for native clients.

---

## 4. View Architecture — Phase-Based Screens

### Root Game View

```
GameView (observes GameViewModel)
├── switch gamePhase:
│   ├── .LOBBY       → LobbyView
│   ├── .SELECTION   → SelectionView
│   ├── .LOADING     → LoadingView
│   ├── .PERFORMING  → PerformingView
│   ├── .VOTING      → VotingView
│   └── .RESULTS     → ResultsView
│
├── Each view checks viewModel.role for variant:
│   ├── .HOST     → "Run the show" UI (controls, teleprompter, QR code)
│   ├── .PLAYER   → "Participate" UI (pick cards, see lines, vote)
│   └── .SPECTATOR → "Watch" UI (reactions, plot twists, chat)
│
├── GameMode affects:
│   ├── .SOLO         → No card selection from other players, solo teleprompter
│   ├── .HEAD_TO_HEAD → Two-player duel selection, split teleprompter
│   └── .ENSEMBLE     → Multi-player selection, full cast teleprompter
```

### Platform Adaptation

Same views, different layouts:

**LobbyView:**
- iPhone: Compact vertical — room code, player list, "Start" button
- iPad: Two-column — player list left, settings + QR right
- Apple TV: Full-screen QR code center, player list along bottom, room code huge

**PerformingView (the teleprompter — the most important screen):**
- iPhone: Single line focus, swipe to advance, player sees only their lines highlighted
- iPad: Script view with current line highlighted, more context visible
- Apple TV: Full teleprompter with large text, mood indicators, auto-scroll, character names color-coded

### Navigation Structure

```
AppRootView
├── Not authenticated → WelcomeView (sign in / anonymous play)
├── Authenticated → TabView
│   ├── HomeTab        → Start/Join game, recent games, quick play
│   ├── ExploreTab     → Card pack browser, search, featured
│   ├── ProfileTab     → Stats, achievements, progression, settings
│   └── (iPad only) HostTab → Quick-start host mode
│
├── Sheet presentations:
│   ├── JoinGameSheet  → Enter room code or scan QR
│   ├── CardPackDetail → Pack preview, purchase
│   ├── SettingsSheet  → Account, credits, preferences, teleprompter settings
│   └── StoreSheet     → Credit purchase (StoreKit)
│
└── Full-screen covers:
    └── GameView        → The 6-phase game (takes over the whole screen)
```

### Apple TV Input & Auth

- tvOS uses focus-based navigation (Siri Remote d-pad)
- Card selection: focus moves between cards, click to select
- Teleprompter: auto-advances (server-driven), remote click for manual override
- No typing — room codes displayed for phone scanning, not manual entry
- **TV auth:** The host pairs from their iPhone. The TV app displays a pairing code. The iPhone app scans/enters the code and transfers the auth session to the TV via a local network handshake or Clerk device flow. This avoids typing credentials on a TV.

### Design Language

- Dark backgrounds (`#0a0a0a`), warm gold accents (`#EAAA3A`), teal highlights (`#4DADAC`)
- `Instrument Serif` for display type (bundled as custom font — verify license for app binary)
- SF Pro (system font) for UI text — better than Space Mono on native
- Native blur materials (`.ultraThinMaterial`) replace CSS backdrop-filter
- Spring animations via SwiftUI `.spring()` modifiers replace Framer Motion
- Cinema/theater aesthetic carries over from the web design

### Accessibility

- All interactive elements have accessibility labels
- VoiceOver support for game navigation, card selection, teleprompter reading
- Dynamic Type support — text scales with system font size preference
- Reduce Motion support — spring animations fall back to cross-fades
- High Contrast mode — increase border/text contrast when system setting is on
- Teleprompter line announcement — VoiceOver reads current line when it advances

---

## 5. Data Models

All models are `Codable` for JSON serialization over the socket. **These are derived directly from `lib/types.ts` in the current codebase.** Field names and enum values must match the server's JSON exactly.

### Game State Enums

```swift
// Raw values match server strings exactly
enum GameState: String, Codable {
    case LOBBY, SELECTION, LOADING, PERFORMING, VOTING, RESULTS
}

enum GameMode: String, Codable {
    case SOLO, HEAD_TO_HEAD, ENSEMBLE
}

enum PlayerRole: String, Codable {
    case HOST, PLAYER, SPECTATOR
}

enum ConnectionState {
    case connecting, connected, reconnecting, disconnected
}
```

### Core Models

```swift
struct Player: Codable, Identifiable {
    let id: String
    var nickname: String
    var role: PlayerRole
    var isHost: Bool
    var socketId: String
    var sessionId: String?
    var uid: String?
    var connected: Bool?
    var hasSubmittedSelection: Bool?
    var hasSubmittedVote: Bool?
    var assignedCharacter: String?
    var score: Int?
    var level: Int?
    var title: String?
}

struct CardSelection: Codable {
    var character: String       // card name, not ID
    var setting: String
    var circumstance: String    // NOT "wildcard"
}

struct AvailableCards: Codable {
    var characters: [String]
    var settings: [String]
    var circumstances: [String]
}

struct Room: Codable {
    var code: String
    var host: Player
    var gameState: GameState
    var gameMode: GameMode
    var isMature: Bool
    var currentLineIndex: Int
    var isPaused: Bool
    var setting: String?
    var createdAt: Double
    var lastActivity: Double
    var scriptCustomization: ScriptCustomization?
    var cardPackId: String?
    var audioSettings: AudioSettings?
    var audienceInteraction: AudienceInteractionState?
    var hostUid: String?
    var isPublic: Bool?
    var publicTitle: String?
    var autoStart: Bool?
    var results: GameResults?
    var directorsReview: DirectorsReview?
}

struct RoomSettings: Codable {
    var isMature: Bool
    var gameMode: GameMode
    var scriptCustomization: ScriptCustomization?
    var cardPackId: String?
    var audioSettings: AudioSettings?
    var audienceInteractionEnabled: Bool?
    var isPublic: Bool?
    var publicTitle: String?
}
```

### Script & Teleprompter

```swift
struct ScriptLine: Codable {
    let speaker: String         // NOT "character"
    let text: String
    let mood: ScriptMood
}

enum ScriptMood: String, Codable {
    case angry, happy, confused, whispering, neutral
}

struct Script: Codable {
    let title: String
    let synopsis: String
    let lines: [ScriptLine]
    var imageUrl: String?
}

struct TeleprompterSyncData: Codable {
    let lineIndex: Int
    let serverTimestamp: Double
    var expectedDuration: Double?
}

enum TeleprompterVisibilityMode: String, Codable {
    case focused, balanced, full, custom
}

struct TeleprompterSettings: Codable {
    var visibilityMode: TeleprompterVisibilityMode
    // Note: pastLinesVisible/upcomingLinesVisible can be Int or "all"
    // Needs custom Codable implementation
    var autoScroll: Bool
}
```

### Script Customization

```swift
enum ComedyStyle: String, Codable {
    case witty, slapstick, absurdist, dark, sitcom, improv
}

enum ScriptLength: String, Codable {
    case lightning, quick, standard, epic
}

enum ScriptDifficulty: String, Codable {
    case beginner, intermediate, advanced
}

enum PhysicalComedyLevel: String, Codable {
    case none, minimal, heavy
}

struct ScriptCustomization: Codable {
    var comedyStyle: ComedyStyle
    var scriptLength: ScriptLength
    var difficulty: ScriptDifficulty
    var physicalComedy: PhysicalComedyLevel
    var enableCallbacks: Bool
    var customInstructions: String?
}
```

### Voting & Results

```swift
struct VoteResult: Codable {
    let playerId: String
    let playerName: String
    let votes: Int
}

struct GameResults: Codable {
    var winner: VoteResult?
    var allResults: [VoteResult]
    var highlights: [GameHighlight]?
}

struct GameHighlight: Codable {
    let label: String
    let value: String
    let icon: String
}

struct DirectorsReview: Codable {
    let rating: Int             // 3-5 stars
    let headline: String
    let review: String
    let bestMoment: String
}
```

### Audience Features

```swift
enum AudienceReactionType: String, Codable {
    case laugh, cheer, gasp, boo, applause, cringe, love, mindblown
}

struct AudienceReaction: Codable, Identifiable {
    let id: String
    let type: AudienceReactionType
    let senderId: String
    let senderName: String
    let timestamp: Double
}

struct PlotTwistOption: Codable, Identifiable {
    let id: String
    let text: String
    var votes: Int
}

struct SpectatorMessage: Codable, Identifiable {
    let id: String
    let senderId: String
    let senderName: String
    let text: String
    let timestamp: Double
    let isPreset: Bool
}

struct AudienceInteractionState: Codable {
    var reactions: [AudienceReaction]
    var reactionCounts: [String: Int]   // AudienceReactionType raw value → count
    var reactionTimeline: [ReactionTimelineEntry]
    var activePlotTwist: ActivePlotTwist?
    var plotTwistHistory: [String]
    var spectatorMessages: [SpectatorMessage]
}

struct ActivePlotTwist: Codable {
    let id: String
    let options: [PlotTwistOption]
    let expiresAt: Double
    var isActive: Bool
}
```

### Cards & Packs

```swift
struct Card: Codable, Identifiable {
    let id: String
    let name: String            // NOT "text"
    var description: String?
    var tags: [String]?
    var imageUrl: String?
}

struct CardPack: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let author: String
    var authorId: String?
    let theme: String
    let isMature: Bool
    let isBuiltIn: Bool
    let isPublic: Bool
    var gradient: [String]?     // [startColor, endColor]
    let characters: [Card]
    let settings: [Card]
    let circumstances: [Card]
    var downloads: Int
    var rating: Double
    var ratingCount: Int
    var createdAt: Double
    var updatedAt: Double
}

struct CardPackMetadata: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let author: String
    let theme: String
    let isMature: Bool
    let isBuiltIn: Bool
    var gradient: [String]?
    let cardCounts: CardCounts
    var downloads: Int
    var rating: Double
}

struct CardCounts: Codable {
    let characters: Int
    let settings: Int
    let circumstances: Int
}
```

### Credits & Payments

```swift
struct CreditBalance: Codable {
    let free: FreeCreditBucket
    let banked: Int
}

struct FreeCreditBucket: Codable {
    let used: Int
    let limit: Int
    let lastResetDate: String   // ISO timestamp
}

// Server sends simplified balance in socket events:
struct SimpleCreditBalance: Codable {
    let free: Int
    let banked: Int
    let total: Int
}
```

### Progression System

```swift
struct PlayerStats: Codable {
    let playerId: String
    let nickname: String
    let gamesPlayed: Int
    let gamesWon: Int
    let winRate: Double
    let totalVotesReceived: Int
    let totalReactionsReceived: Int
    var favoriteCharacter: String?
    let characterCounts: [String: Int]
    let gameModeStats: GameModeStats
    let currentWinStreak: Int
    let bestWinStreak: Int
    let achievements: [Achievement]
    let recentGames: [String]
    let joinedAt: Double
    let lastPlayedAt: Double
    var totalXP: Int?
    var level: Int?
    var title: String?
}

struct GameModeStats: Codable {
    let solo: ModeRecord
    let headToHead: ModeRecord
    let ensemble: ModeRecord
}

struct ModeRecord: Codable {
    let played: Int
    let won: Int
}

struct Achievement: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let rarity: AchievementRarity
    var unlockedAt: Double?
    var progress: Int?
    var target: Int?
}

enum AchievementRarity: String, Codable {
    case common, rare, epic, legendary
}

struct Progression: Codable {
    let playerId: String
    let totalXP: Int
    let level: Int
    let title: String
    let xpHistory: [XPEvent]
    let levelRewardsClaimed: [Int]
    let weeklyChallenges: [WeeklyChallenge]
    var lastDailyBonusDate: String?
}

struct XPEvent: Codable {
    let source: String          // XPSource raw value
    let amount: Int
    let description: String
    let timestamp: Double
}

struct WeeklyChallenge: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let target: Int
    var progress: Int
    let xpReward: Int
    let expiresAt: Double
    var completed: Bool
}

struct LevelReward: Codable {
    let level: Int
    let type: String            // "credits", "title", "badge"
    let value: String           // JSON-encoded (String or Int)
    let description: String
    var claimed: Bool
}

struct LeaderboardEntry: Codable {
    let rank: Int
    let playerId: String
    let nickname: String
    let value: Double
    var achievement: String?
}
```

### Error Types

```swift
enum ErrorCode: String, Codable {
    case SCRIPT_GENERATION_FAILED, SCRIPT_GENERATION_TIMEOUT
    case IMAGE_GENERATION_FAILED
    case ROOM_NOT_FOUND, ROOM_FULL, INVALID_GAME_STATE
    case AUTH_REQUIRED, AUTH_EXPIRED
    case RATE_LIMITED, CREDIT_INSUFFICIENT
    case DATABASE_ERROR, NETWORK_TIMEOUT
    case VALIDATION_ERROR, UNKNOWN
}

enum WarningCode: String, Codable {
    case IMAGE_GENERATION_SLOW, PLAYER_RECONNECTING, PLAYER_RECONNECTED
    case DATABASE_WRITE_DELAYED, FALLBACK_ACTIVATED
}

struct GameError: Codable {
    let code: ErrorCode
    let message: String
    var phase: GameState?
    let recoverable: Bool
    var action: ErrorAction?
}

struct GameWarning: Codable {
    let code: WarningCode
    let message: String
    var details: String?
}

// ErrorAction needs custom Codable for tagged union
enum ErrorAction: Codable {
    case retry(event: String)
    case redirect(path: String)
    case reload
    case dismiss
}
```

### Reconnection Snapshot

```swift
struct RoomRecoverySnapshot: Codable {
    let gameState: GameState
    let players: [Player]
    let script: Script?
    let currentLineIndex: Int
    let scriptImageUrl: String?
    let isPaused: Bool
    let hostDisconnected: Bool
    var assignedCharacter: String?
    var myRole: PlayerRole?
    let myPlayerId: String
    let roomCode: String
    var hasSubmittedSelection: Bool?
    var selection: CardSelection?
    var spectatorMessages: [SpectatorMessage]?
    var votingStatus: VotingStatus?
    var results: GameResults?
    var directorsReview: DirectorsReview?
    var roomSettings: RoomSettings?
}

struct VotingStatus: Codable {
    let hasVoted: Bool
}
```

### Socket Response

```swift
// Generic response wrapper for ack callbacks
struct SocketResponse: Codable {
    let success: Bool
    var error: String?
    var code: ErrorCode?
}
```

### Public Games

```swift
struct PublicRoomListing: Codable {
    let code: String
    let hostNickname: String
    let gameMode: GameMode
    let playerCount: Int
    let maxPlayers: Int
    let isMature: Bool
    var publicTitle: String?
    var cardPackName: String?
    let createdAt: Double
}

struct NewGameOptions: Codable {
    var keepSelections: Bool?
}
```

---

## 6. Services

### AuthService

```
AuthService (ObservableObject)
├── @Published currentUser: User?
├── @Published isAuthenticated: Bool
│
├── signInWithApple() async throws
│   └── Native ASAuthorizationController (Sign in with Apple)
│   └── Exchange Apple credential for Clerk session via Clerk Frontend API
│   └── Store session token in Keychain
│
├── signInWithGoogle() async throws
│   └── ASWebAuthenticationSession → Clerk OAuth flow
│   └── Callback URL handling → extract session
│
├── signInAnonymously()
│   └── Generates playerSessionId (UUID) stored in Keychain
│   └── No Clerk account — server accepts raw session IDs for guest play
│
├── getToken() async → String
│   └── Returns Clerk session JWT for authenticated users
│   └── Returns playerSessionId for anonymous users
│
├── refreshToken() async throws
│   └── Clerk session refresh
│
└── signOut()
```

**Important: `clerk-sdk-swift` does not exist as an official package.** Auth integration uses:
- Sign in with Apple: Native `AuthenticationServices` framework → exchange Apple ID token with Clerk's Backend API (`POST /v1/sign_ins` with `strategy: "oauth_apple"`)
- Google Sign-In: `ASWebAuthenticationSession` to Clerk's OAuth endpoint
- Session management: Store Clerk session token in Keychain, refresh via Clerk Frontend API

### StoreKitService

```
StoreKitService (ObservableObject)
├── @Published products: [Product]
├── @Published credits: CreditBalance?
│
├── loadProducts()
│   └── Product.products(for: productIdentifiers)
│
├── purchase(_ product: Product) async throws → Transaction
│   └── Native StoreKit 2 purchase sheet
│   └── On success: POST /api/apple/verify-transaction with signed JWS
│   └── Server credits the account, responds with new balance
│
├── restorePurchases() async
│   └── Transaction.currentEntitlements
│
└── listenForTransactions()
    └── Transaction.updates — background listener
    └── Handles interrupted purchases, family sharing, refunds
```

Product IDs (unchanged from current):
- `com.plottwists.credits.starter` → 20 credits
- `com.plottwists.credits.party` → 50 credits
- `com.plottwists.credits.pro` → 300 credits
- `com.plottwists.credits.studio` → 1000 credits

### HapticsService

```
HapticsService
├── impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle)
├── notification(_ type: UINotificationFeedbackGenerator.FeedbackType)
├── selection()
│
├── Triggers:
│   ├── Card picked → .medium impact
│   ├── Script generated → .success notification
│   ├── Plot twist triggered → .heavy impact
│   ├── Vote submitted → .light impact
│   ├── Timer warning → .warning notification
│   └── Card browsing scroll → selection()
│
└── tvOS: No-op (no haptic hardware)
```

### PushNotificationService

```
PushNotificationService
├── requestPermission() async → Bool
├── registerDeviceToken(_ token: Data) → POST /api/push/register
│
├── Notification triggers (server-sent via APNs):
│   ├── "Game starting!" — host starts a game you've joined
│   ├── "Your turn to pick" — selection phase began
│   ├── "Script is ready!" — loading complete
│   └── "You won MVP!" — results
│
└── Requires:
    ├── APNs key in Apple Developer portal
    └── Server: new endpoint + APNs sending via `apns2` npm package
```

This is the **one new backend capability** needed.

### PersistenceService

```
PersistenceService
├── Keychain:
│   ├── clerkSessionToken: String?
│   ├── playerSessionId: String
│   ├── currentRoomCode: String?    (for reconnection after app kill)
│
├── UserDefaults / @AppStorage:
│   ├── defaultNickname: String?
│   ├── preferredGameMode: GameMode?
│   ├── soundEffectsEnabled: Bool
│   ├── teleprompterSettings: TeleprompterSettings
│   ├── hasSeenOnboarding: Bool
│   └── lastKnownCreditBalance: CreditBalance?
│
└── No CoreData/SQLite needed — all game data is server-side
```

### DeepLinkService

```
DeepLinkService
├── handleURL(_ url: URL) → DeepLinkAction?
│   ├── plot-twists.com/join/ABCD    → .joinGame(code: "ABCD")
│   ├── plot-twists.com/join/invite/ABCD → .joinGame(code: "ABCD")
│   ├── plot-twists.com/replay/XYZ   → .viewReplay(code: "XYZ")
│   ├── plot-twists.com/explore      → .openExplore
│   └── plot-twists.com/profile      → .openProfile
│
├── Requires:
│   ├── Apple App Site Association (AASA) file at plot-twists.com/.well-known/apple-app-site-association
│   ├── Associated Domains entitlement: applinks:plot-twists.com
│   └── SwiftUI .onOpenURL modifier in AppRootView
```

---

## 7. Web App — Shifted Role

The current Next.js web app shifts to:

1. **Marketing site** — Landing page explains the game, links to App Store
2. **Join via browser** — `plot-twists.com/join/ABCD` renders a lightweight web player view for people without the app (Android users, quick joiners). Socket.IO works in the browser.
3. **Replay viewer** — `plot-twists.com/replay/[code]` for shareable past scripts
4. **Card pack browser** — `plot-twists.com/explore` for web browsing
5. **AASA file** — `/.well-known/apple-app-site-association` for Universal Links

**Removes from web:**
- Host flow (native only)
- Capacitor config, `ios/`, `android/` directories, StoreKit JS bridge
- Platform detection code (`lib/platform.ts`)
- Complex performing/voting UI (simplified for web join)

**Server stays exactly as-is.** Express + Socket.IO on Railway. Serves web pages AND handles native socket connections simultaneously.

---

## 8. Dependencies

### Swift Packages

| Package | Purpose | Risk |
|---------|---------|------|
| `socket.io-client-swift` | Socket.IO client | Medium — needs spike validation |
| `SDWebImageSwiftUI` | Async image loading | Low — mature library |
| `KeychainAccess` | Keychain wrapper | Low — mature library |

**No Clerk Swift SDK** — auth uses native Apple frameworks + Clerk REST API.

### Server Additions (Minimal)

| Package | Purpose |
|---------|---------|
| `apns2` | Send push notifications via APNs |

### Removed from Web

| Package | Reason |
|---------|--------|
| `@capacitor/*` (all) | No more WebView wrapper |

---

## 9. What's NOT in Scope

Explicitly deferred:

- **Android app** — No Kotlin rewrite. Android users use web join fallback.
- **SharePlay** — Natural fit but adds complexity. Ship first, add later.
- **Widgets** — Home screen widgets for stats/recent games. Nice-to-have.
- **Mac Catalyst** — SwiftUI supports it but not priority.
- **Offline mode** — Game is inherently multiplayer/online.
- **watchOS** — No meaningful use case.
- **Card pack creation in native** — Use web for now, add to native later.
- **Admin dashboard in native** — Keep web-only.

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `socket.io-client-swift` doesn't work with Socket.IO v4 acks | Medium | High | **Spike first.** Fallback: raw WebSocket + EIO parser (~500 lines) |
| Clerk has no Swift SDK | Known | Medium | Use native Sign in with Apple + Clerk REST API. Well-documented pattern. |
| Apple TV focus navigation awkward for cards | Low | Medium | Design TV card UX carefully. Horizontal scroll with focus ring. |
| Custom font (Instrument Serif) licensing | Low | Low | Verify license. Fallback: SF Pro Serif or New York. |
| CORS blocks native connections | Very Low | High | Server already allows `!origin`. Add explicit native client header. |
| Data model drift (server changes types) | Medium | High | Generate Swift models from TypeScript types. CI check for drift. |

---

## 11. Implementation Order (High Level)

This is a rough sequencing, not the implementation plan (that comes next via the writing-plans skill):

1. **Spike: Socket.IO Swift client** — Validate connection, events, acks against the live server
2. **Xcode project setup** — Targets, shared code structure, SPM dependencies
3. **Models** — All Swift `Codable` types from `lib/types.ts`
4. **SocketService** — Connection, auth, event streams, ack handling
5. **AuthService** — Sign in with Apple, anonymous sessions, Keychain
6. **GameViewModel** — State machine, event subscription, reconnection
7. **Lobby phase** — Create room, QR code, player list, settings
8. **Selection phase** — Card picking, submission
9. **Loading phase** — Generation progress, green room
10. **Performing phase** — Teleprompter (the hardest screen)
11. **Voting phase** — MVP voting
12. **Results phase** — Winner, director's review, share, play again
13. **Navigation shell** — Tabs, explore, profile
14. **StoreKit** — Credit purchases
15. **Push notifications** — Server APNs + client registration
16. **Apple TV target** — TV-optimized layouts for host view
17. **Deep links** — AASA file, URL handling
18. **Polish** — Animations, haptics, accessibility, error states
