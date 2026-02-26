# Plot Twists — Architecture & Documentation

**Last Updated:** 2026-02-26
**Version:** 2.0
**Status:** Production (live at plot-twists.com)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Real-Time Communication](#6-real-time-communication)
7. [AI Integration](#7-ai-integration)
8. [Game Logic & Features](#8-game-logic--features)
9. [Data Persistence](#9-data-persistence)
10. [Auth & Payments](#10-auth--payments)
11. [Mobile (Capacitor)](#11-mobile-capacitor)
12. [Security & Resilience](#12-security--resilience)
13. [Testing](#13-testing)
14. [Deployment](#14-deployment)

---

## 1. Project Overview

**Plot Twists** is an AI-powered, real-time multiplayer improv comedy party game. Players pick character/setting/circumstance cards, Claude AI generates a comedy script, and they perform it live using synchronized teleprompters. Audience votes for MVP.

### Codebase Stats
- ~42,800 lines of TypeScript/CSS
- 198 source files
- 47 shared components, 10 custom hooks
- 20 server services
- 50+ socket events
- 13 test suites

### Game Modes
- **Solo**: Single player with AI co-stars (1 player)
- **Head-to-Head**: Two players competing (2 players)
- **Ensemble**: Collaborative chaos (3-6 players)

### Content Ratings
- **Family Friendly**: Clean, all-ages humor
- **18+ (After Dark)**: SNL-style comedy with adult themes

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 4.1.18 | Utility-first styling |
| Framer Motion | 12.31.0 | Animations |
| Socket.IO Client | 4.8.3 | Real-time WebSocket |
| canvas-confetti | 1.9.4 | Celebration effects |
| qrcode.react | 4.2.0 | QR code generation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22.x | Runtime |
| Express | 5.2.1 | HTTP server |
| Socket.IO | 4.8.3 | WebSocket server |
| tsx | 4.21.0 | TypeScript execution |

### AI & Services
| Technology | Purpose |
|------------|---------|
| @anthropic-ai/sdk | Claude API client (script generation) |
| Claude `sonnet-4-5` | Script generation model |
| Google Gemini | Movie poster image generation |
| Firebase Auth | Phone + anonymous authentication |
| Firestore | Persistent database |
| Stripe | Credit-based payments |
| Zod 4 | Schema validation |

### Mobile
| Technology | Purpose |
|------------|---------|
| Capacitor | iOS WebView shell |
| StoreKit 2 | In-app purchases (bridged to Swift) |

---

## 3. Project Structure

```
server.ts                               # Main entry — Express + Socket.IO + Next.js (2,364 lines)

app/
  page.tsx                              # Landing page
  layout.tsx                            # Root layout
  globals.css                           # Design system (4,518 lines)
  host/
    page.tsx                            # Host orchestrator (519 lines)
    components/
      HostLobby.tsx                     # QR, player list, game settings
      HostSelection.tsx                 # Solo card picker + ensemble waiting
      HostLoading.tsx                   # Script generation progress
      HostPerforming.tsx                # Teleprompter, controls, chaos button
      HostVoting.tsx                    # Voting status grid
      HostResults.tsx                   # Winner, standings, share, actions
  join/
    page.tsx                            # Join orchestrator (353 lines)
    components/
      JoinForm.tsx                      # Room code + nickname form
      JoinLobby.tsx                     # "You're In!" waiting view
      JoinSelection.tsx                 # Card picker (spectator/player/submitted views)
      JoinLoading.tsx                   # Loading progress + green room + timeout escape
      JoinPerforming.tsx                # Mobile teleprompter + spectator chat
      JoinVoting.tsx                    # MVP vote buttons
      JoinResults.tsx                   # Results + script actions + XP
  admin/                                # Admin dashboard (rooms, stats, users)
  explore/                              # Card pack browser
  profile/                              # Player profile + stats
  replay/[code]/                        # Shareable game replays
  play/                                 # Quick play / matchmaking
  sign-in/, sign-up/                    # Auth pages
  purchase/success/, purchase/cancelled/ # Stripe payment flow
  privacy/, terms/                      # Legal pages

hooks/
  useHostSocket.ts                      # Host socket listeners + all host game state
  useJoinSocket.ts                      # Join socket listeners + all join game state
  useAudioPlayer.ts                     # Audio playback
  useConfetti.ts                        # Confetti effects
  useHaptics.ts                         # Haptic feedback (mobile)
  useReducedMotion.ts                   # Reduced motion detection
  useStandaloneMode.ts                  # PWA standalone detection
  useTeleprompterSettings.ts            # Teleprompter display preferences
  useToast.tsx                          # Toast notification system
  useWakeLock.ts                        # Prevent screen sleep

components/ (47 files)
  GameErrorBoundary.tsx                 # Per-phase error boundary
  ReconnectingOverlay.tsx               # Mid-game socket drop overlay
  BottomTabBar.tsx                      # Mobile navigation
  Modal.tsx, Toast.tsx                  # Core UI
  CardPicker.tsx, SmartCardSelector.tsx  # Card selection
  CardPackBrowser.tsx, CardPackCreator.tsx # Card packs
  AudienceReactionBar.tsx               # Live audience reactions
  SpectatorChat.tsx                     # Spectator messaging
  PlotTwistVoting.tsx                   # Audience plot twist voting
  MobileTeleprompter.tsx                # Mobile script view
  MoviePosterFrame.tsx                  # AI poster display with fallback
  XPBar.tsx, XPGainAnimation.tsx        # Progression UI
  LevelUpCelebration.tsx                # Level up confetti
  AchievementToast.tsx                  # Achievement notifications
  PlayerProfile.tsx, GameHistory.tsx     # Profile views
  CreditBadge.tsx, PurchaseCreditsModal.tsx # Payment UI
  OnboardingModal.tsx                   # First-time user guide
  StarRating.tsx                        # Post-game rating
  ... and more

contexts/
  AuthContext.tsx                        # Firebase auth provider
  SocketContext.tsx                      # Socket.IO connection provider
  ThemeContext.tsx                       # Light/dark theme provider

lib/
  types.ts                              # All shared TypeScript types (816 lines)
  animations.ts                         # Centralized MOTION presets + VARIANTS (277 lines)
  content.ts                            # Card content data (1,067 lines)
  api.ts                                # API client helpers
  analytics.ts                          # Event tracking
  firebase.ts                           # Firebase client init
  logger.ts                             # Structured logging
  platform.ts                           # Platform detection (web/iOS/Android)
  schema.ts                             # Zod validation schemas
  scriptUtils.ts                        # Script download/copy utilities
  socketTimeout.ts                      # Socket emit timeout wrapper utility
  stripe.ts                             # Stripe client setup
  teleprompterUtils.ts                  # Mood indicators, visible line calculation

server/
  services/ (20 services)
    room.service.ts                     # Room lifecycle, write-through cache, Firestore persistence
    scriptGeneration.service.ts         # Claude API streaming script generation
    scriptCustomization.service.ts      # Comedy style, length, difficulty options
    voting.service.ts                   # Vote counting, MVP calculation
    audience.service.ts                 # Live reactions, plot twist system, spectator chat
    user.service.ts                     # User profiles, Firebase token verification
    credit.service.ts                   # Two-bucket credit system (free weekly + banked)
    playerStats.service.ts              # Stats, achievements, leaderboard
    progression.service.ts              # XP, leveling, titles
    gameHistory.service.ts              # Game saves, replay share codes
    cardpack.service.ts                 # Custom card packs CRUD
    teleprompter.service.ts             # Smart line timing (mood, punctuation, reading rate)
    image.service.ts                    # AI-generated movie posters (Gemini)
    audio.service.ts                    # Ambient music + sound effects
    payment.service.ts                  # Payment transaction logging
    apple.service.ts                    # Apple App Store IAP verification
    push.service.ts                     # Push notifications
    referral.service.ts                 # Referral code system
    matchmaking.service.ts              # Quick play matchmaking
    prompts/comedyPrompts.ts            # System prompts + mode instructions for Claude
  middleware/
    auth.ts                             # Express auth (Firebase ID tokens)
    socketAuth.ts                       # Socket.IO auth handshake
    security.ts                         # Helmet, CSP, CORS, security headers
    rateLimiter.ts                      # Per-socket + HTTP rate limiting
    socketErrorHandler.ts               # Centralized error handler wrapper
  routes/
    api.ts                              # REST API routes (game metadata, health)
    auth.ts                             # Auth routes
    stripe.ts                           # Stripe webhook + payment routes
    apple.ts                            # Apple IAP routes
    index.ts                            # Route registration
  db/
    adapter.ts                          # Abstract database interface
    firestore.ts                        # Firestore implementation
    json.ts                             # JSON file fallback (dev)
    index.ts                            # Factory — auto-selects adapter from env
  utils/
    constants.ts                        # Game constants, timing, token limits
    validation.ts                       # Input sanitization (XSS prevention)
    roomSerializer.ts                   # Room <-> Firestore conversion
    jsonExtractor.ts                    # Robust JSON extraction from Claude responses
    timing.ts                           # Teleprompter line display time calculation
  data/
    communityPacks.ts                   # Built-in card pack data

ios/
  App/App/                              # Xcode project (Capacitor shell)
  release.xcconfig                      # Release build config

__tests__/unit/                         # 13 test suites
```

---

## 4. Frontend Architecture

### Routing (Next.js App Router)

| Route | Purpose | View Type |
|-------|---------|-----------|
| `/` | Landing page | Desktop/Mobile |
| `/host` | Host orchestrator (TV view) | Desktop/TV |
| `/join` | Player orchestrator (mobile view) | Mobile |
| `/join?code=WXYZ` | Direct join with room code | Mobile |
| `/explore` | Card pack browser | Any |
| `/profile` | Player profile + stats | Any |
| `/replay/[code]` | Shareable game replay | Any |
| `/admin` | Admin dashboard | Desktop |
| `/play` | Quick play / matchmaking | Mobile |
| `/sign-in`, `/sign-up` | Authentication | Any |

### State Management

**Socket Hooks**: `useHostSocket` and `useJoinSocket` own all game state (gameState, players, script, etc.) and handle socket event subscriptions. They use `useRef` to avoid stale closures in socket listeners — the effect depends only on `[socket, isConnected]`.

**Contexts**:
- `SocketContext` — singleton Socket.IO connection with auto-reconnect
- `AuthContext` — Firebase auth state (user, loading, sign-in/out)
- `ThemeContext` — light/dark mode

**Local State**: React `useState` / `useCallback` for UI state in each phase component.

### Component Loading

All game phase components use `next/dynamic` for code splitting:
```ts
const JoinPerforming = dynamic(() => import('./components/JoinPerforming')
  .then(m => ({ default: m.JoinPerforming })), { ssr: false, loading: () => null })
```

Heavy dependencies (QRCodeSVG, CardPicker, ScriptCustomizationPanel, AudioSettingsPanel) are also dynamically imported.

### Styling

- **CSS custom properties** for all colors: `var(--color-accent)`, `var(--color-text-primary)`, etc.
- **Light + dark mode** via `prefers-color-scheme` with CSS variable overrides
- **Tailwind** for layout/spacing; inline `style={{ color: 'var(--color-*)' }}` for theme colors
- **Safe area insets**: `env(safe-area-inset-*)` for iOS notch/home indicator
- **Typography**: Fredoka (display), DM Sans (body), Courier Prime (scripts)

### Animation System

Centralized in `lib/animations.ts`:
- `MOTION.spring`, `MOTION.gentle`, `MOTION.bouncy` — timing presets
- `VARIANTS.pageTransition` — blur + scale + opacity (default phase transition)
- `VARIANTS.curtainRise` — clip-path reveal (performing phase)
- `VARIANTS.spotlight` — brightness reveal (results phase)
- `getVariants(prefersReducedMotion)` — returns no-op variants when reduced motion is preferred

### Error Handling

`GameErrorBoundary` wraps each game phase. On crash, shows a "Scene Interrupted" card with retry button instead of white-screening the entire app. Socket state lives in the parent and survives the remount.

---

## 5. Backend Architecture

### Server Setup (`server.ts`)

Single process running:
1. **Express** — HTTP routes, middleware, static assets
2. **Socket.IO** — WebSocket event handlers (50+ events)
3. **Next.js** — SSR page rendering via `app.getRequestHandler()`

```
server.listen(port) → Express → Socket.IO → Next.js request handler
```

### Socket Transport

- **Production**: WebSocket-first with polling fallback (`['websocket', 'polling']`)
- **Reconnection**: exponential backoff, 10 attempts max
- **CORS**: configured via `ALLOWED_ORIGINS` env var

### Room Management

**Write-Through Cache**:
- In-memory `Map<string, Room>` is the source of truth for active games
- Firestore persistence is async and debounced (5s for high-frequency updates like teleprompter position)
- Failed writes queued for retry every 10s
- On server restart, rooms recovered from Firestore automatically

**Room Lifecycle**:
1. Host creates room → 4-letter code assigned, room stored in memory + Firestore
2. Players join via code → added to room, `players_update` broadcast
3. Game flows through state machine → LOBBY → SELECTION → LOADING → PERFORMING → VOTING → RESULTS
4. Host can start new game (returns to LOBBY) or end session
5. Inactive rooms cleaned up after 1 hour (runs every 5 minutes)

### Credit System

Two-bucket model:
- **Free credits**: Weekly lazy reset, consumed first
- **Banked credits**: Purchased via Stripe or Apple IAP, no expiry
- Deductions use database transactions to prevent double-spend
- Race condition guard: `gameState` set to `LOADING` synchronously before any async credit operations

### Teleprompter Timing

Smart line timing based on:
- Base reading time: `(wordCount / 120 WPM) * 60 * 1000` ms
- **Punctuation pauses**: `.` = 400ms, `!` = 500ms, `?` = 450ms, `...` = 800ms, `,` = 200ms
- **Mood multipliers**: angry = 0.9x, whispering = 1.3x, confused = 1.2x
- **Bounds**: Clamped to 1.5s – 15s per line
- Timestamp-based sync with `expectedDuration` for client-side prediction

---

## 6. Real-Time Communication

### Socket Event Flow

```
HOST                 Socket.IO           SERVER              Claude API
 |-- create_room ──────────────────────> |
 |<──── room_created ─────────────────── |
 |                                        |
PLAYER                                    |
 |── join_room ──────────────────────────>|
 |<── players_update (broadcast) ─────── |
 |                                        |
 |── submit_cards ───────────────────────>|
 |<── players_update (broadcast) ─────── |
 |                                        |
HOST: start_game ────────────────────────>|
 |<── game_state_change('LOADING') ───── |
 |<── green_room_prompt ──────────────── |
 |                                        |──> Claude API (streaming)
 |<── loading_progress ──────────────────|     (~10-20 seconds)
 |<── script_ready ──────────────────────|<──
 |<── game_state_change('PERFORMING') ── |
 |                                        |
 |<── sync_teleprompter(line, time) ──── | (auto-advance per line timing)
 |                                        |
 |<── game_state_change('VOTING') ────── | (script complete)
 |── submit_vote ────────────────────────>|
 |<── game_over(results) ────────────────|
```

### Key Client → Server Events

```ts
create_room(settings, callback)
join_room(roomCode, nickname, callback)     // callback includes playerId
submit_cards(roomCode, selections, callback)
start_game(roomCode)
retry_script_generation(roomCode)           // retry without re-selecting cards
submit_vote(roomCode, targetPlayerId)
advance_script_line(roomCode)
pause_script(roomCode) / resume_script(roomCode)
jump_to_line(roomCode, lineIndex)
player_jump_to_line(roomCode, lineIndex)    // player-initiated navigation
request_new_game(roomCode)
send_spectator_message(roomCode, message)
submit_reaction(roomCode, emoji)
submit_plot_twist(roomCode, twistType)
get_progression(uid, callback)
```

### Key Server → Client Events

```ts
room_created(code)
players_update(players[])
game_state_change(newState)
script_ready(script)
sync_teleprompter({ lineIndex, serverTimestamp, expectedDuration })
game_over(results)
available_cards(cards)
loading_progress(progress)
green_room_prompt(question)
spectator_message(message)
reaction_burst(emoji, count)
xp_event(event)
achievement_unlocked(achievement)
host_disconnected() / host_reconnected()
```

---

## 7. AI Integration

### Script Generation

**Model**: `claude-sonnet-4-5-20250929`
- Streaming responses via `@anthropic-ai/sdk`
- Temperature: 1.0 (maximum creativity)
- Token allocation: 8,192–10,000 tokens
- 2-minute timeout with abort on timeout
- Timer cleanup in `finally` block to prevent leaks

**System Prompt** (~300 lines in `server/services/prompts/comedyPrompts.ts`):
- Comedy style guidelines (improv principles, Rule of Three, YES-AND)
- Mode-specific instructions (Solo/Head-to-Head/Ensemble)
- Character voice matching
- Scene structure: Hook → Explore → Escalate → Peak Chaos → Button
- Customizable: comedy style, script length, difficulty level

**Output**: Validated with Zod schema — title, synopsis, lines array (speaker, text, mood).

**Retry**: `retry_script_generation` event re-uses existing card selections without returning to SELECTION phase.

### Image Generation

**Model**: Google Gemini
- Generates movie poster images for each script
- Stored in Firebase Storage
- `MoviePosterFrame` component with error fallback (gradient + title on image load failure)

---

## 8. Game Logic & Features

### Game State Machine

```
LOBBY → SELECTION → LOADING → PERFORMING → VOTING → RESULTS
  ↑                                                    │
  └────────────────── request_new_game ────────────────┘
```

### Card System

- **Built-in content**: `lib/content.ts` (1,067 lines) — characters, settings, circumstances
- **Community packs**: 20+ built-in themed packs (`server/data/communityPacks.ts`)
- **Custom packs**: Users can create, edit, and share card packs
- **Card selection**: `SmartCardSelector` with categories, search, and shuffle
- **Submit confirmation**: Double-tap to confirm (prevents accidental submission)
- **Progress indicator**: Shows "2/4 players submitted" while waiting

### Audience & Spectator Features

- **Spectator chat**: Real-time messaging during performances
- **Live reactions**: Emoji burst system with rate limiting
- **Plot twist voting**: Audience can vote on mid-performance twists
- **Spectator role**: Auto-assigned when room is full, can still watch and vote

### Progression System

- **XP**: Earned for playing games, winning, achievements
- **Levels**: Level up with titles (e.g., "Scene Stealer", "Drama Queen")
- **Achievements**: Milestone-based unlocks with toast notifications
- **Stats**: Games played, wins, streaks tracked per player
- **Leaderboard**: Ranked by XP across all players

### Audio System

- Ambient background music
- Sound effects for game events
- User-configurable volume via `AudioSettingsPanel`

### Replay System

- Games saved with unique share codes
- `/replay/[code]` page for viewing past performances
- Script + poster + metadata preserved

---

## 9. Data Persistence

### Database Adapter Pattern

```ts
// server/db/adapter.ts — abstract interface
// server/db/firestore.ts — Firestore implementation (production)
// server/db/json.ts — JSON file fallback (development)
// server/db/index.ts — factory, auto-selects from env
```

### What's Persisted

| Data | Storage | Pattern |
|------|---------|---------|
| Room state | Memory + Firestore | Write-through cache, debounced |
| User profiles | Firestore | Direct read/write |
| Player stats | Firestore | Transactional updates |
| Game history | Firestore | Write on game end |
| Card packs | Firestore | CRUD via cardpack.service |
| Credits | Firestore | Transactional (prevents double-spend) |
| Payments | Firestore | Transaction logging |

---

## 10. Auth & Payments

### Authentication

- **Firebase Auth**: Phone number + anonymous sign-in
- **Socket auth**: `socketAuth.ts` middleware verifies Firebase ID tokens on handshake
- **HTTP auth**: `auth.ts` middleware on protected Express routes
- **AuthContext**: React context provides `user`, `loading`, sign-in/out methods

### Payment System

**Stripe** (web):
- Credit purchase flow → Stripe Checkout → webhook confirms → credits added
- Webhook endpoint: `/api/stripe/webhook`

**Apple IAP** (iOS):
- StoreKit 2 bridged via Capacitor plugin
- Server-side receipt verification via `apple.service.ts`
- Credits added after verification

---

## 11. Mobile (Capacitor)

### iOS App

Capacitor WebView shell (~286 lines of native Swift):
- Portrait-only orientation (iPhone), all orientations (iPad)
- `NSUserNotificationsUsageDescription` in Info.plist for push notifications
- `ITSAppUsesNonExemptEncryption: false` (no export compliance needed)
- StoreKit 2 integration for in-app purchases
- `release.xcconfig`: `CAPACITOR_DEBUG = false`

### Mobile UX

- Safe area insets (`env(safe-area-inset-*)`) for notch/home indicator
- 44px minimum tap targets on all interactive elements
- Haptic feedback on card selection and key actions
- Wake lock prevents screen sleep during performances
- Body scroll lock during overlays (countdown, host disconnect)

---

## 12. Security & Resilience

### Server Security
- **Helmet.js**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Input validation**: All user input sanitized (XSS strip, length limits, format checks)
- **Rate limiting**:
  - Per-socket: `SocketRateLimiter` on room creation, joining, script generation, spectator messages, card pack reads
  - Per-IP: `express-rate-limit` on HTTP API routes
- **CORS**: Whitelist via `ALLOWED_ORIGINS`
- **Environment validation**: Required env vars checked on startup

### Resilience
- **Socket emit timeouts**: `lib/socketTimeout.ts` — 10s default, prevents hung UI
- **Error boundaries**: `GameErrorBoundary` per game phase — crash one phase, not the whole app
- **Reconnection overlay**: `ReconnectingOverlay` shown during mid-game socket drops
- **Host disconnect handling**: Players see overlay with "Wait" or "Leave" options
- **Loading timeout**: 90s timeout in LOADING state with escape button
- **Crash protection**: `uncaughtException` and `unhandledRejection` handlers trigger graceful shutdown
- **Room recovery**: Rooms persisted to Firestore, recovered on server restart
- **Retry queue**: Failed Firestore writes retried every 10s

### Client Resilience
- WebSocket-first transport with polling fallback
- Exponential backoff reconnection (up to 10 attempts)
- `useReducedMotion` gating on all decorative animations
- Dynamic imports prevent large bundle blocking initial load

---

## 13. Testing

### Infrastructure
- **Jest** with ts-jest for TypeScript
- **13 test suites** covering critical server logic
- Coverage thresholds: 50% across all metrics

### Test Suites

```
__tests__/unit/server/
  middleware/rateLimiter.test.ts         # Socket rate limiter
  utils/validation.test.ts              # Input sanitization
  utils/timing.test.ts                  # Teleprompter line timing
  utils/jsonExtractor.test.ts           # JSON extraction from AI responses
  services/voting.service.test.ts       # Vote counting, MVP
  services/credit.service.test.ts       # Credit deduction, two-bucket
  services/audience.service.test.ts     # Reactions, spectator features
  services/playerStats.service.test.ts  # Stats tracking
  services/progression.service.test.ts  # XP, leveling
  services/room.service.test.ts         # Room lifecycle
  services/gameHistory.service.test.ts  # Game saves, replays
  db/index.test.ts                      # Database adapter factory
  socket/helpers.test.ts                # Socket helper utilities
```

### Running Tests

```bash
npm run test         # All tests with coverage
npm run test:watch   # Watch mode
npm run test:unit    # Unit tests only
```

---

## 14. Deployment

### Platform: Railway

Single-process deployment (Express + Socket.IO + Next.js).

- **Build**: Nixpacks auto-detects Node.js, runs `npm run build`
- **Start**: `NODE_ENV=production tsx server.ts`
- **Domain**: plot-twists.com (custom domain via Railway)
- **SSL**: Automatic via Let's Encrypt

See `DEPLOYMENT.md` for full deployment guide, environment variables, and troubleshooting.

### Deploy Commands

```bash
railway up            # CLI deploy
git push origin v2    # Auto-deploy via git
```

### Production Startup

```
[INFO] Environment variables validated
[INFO] Firebase Admin initialized
[INFO] Database connected using Firestore adapter
[INFO] [RoomService] Recovered N room(s)
[INFO] Card Pack Service initialized with 21 packs
[INFO] Socket.IO configured for production mode
[INFO] > Ready on http://0.0.0.0:3000
```
