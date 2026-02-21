# Plot Twists

Improv comedy game where players pick cards, AI generates a script, and they perform it live.

## Tech Stack

- **Frontend**: Next.js 16 (App Router, `'use client'`), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Custom Node.js server (`server.ts`) — Express + Socket.IO alongside Next.js
- **AI**: Anthropic Claude (`claude-sonnet-4-5-20250929`) for script generation, Google Gemini for image generation
- **Auth**: Firebase Auth (phone, anonymous)
- **DB**: Firestore (production) / JSON file (dev) — adapter pattern in `server/db/`
- **Payments**: Stripe (credit system) + Apple App Store in-app purchases
- **Mobile**: Capacitor for iOS/Android
- **Animations**: Framer Motion with centralized presets in `lib/animations.ts`
- **Testing**: Jest + ts-jest

## Commands

```bash
npm run dev          # Start dev server (Next.js + Socket.IO via tsx server.ts)
npm run build        # Production build (next build, checks TypeScript)
npm run start        # Start production server (NODE_ENV=production tsx server.ts)
npm run test         # Jest with coverage
npm run test:watch   # Jest in watch mode
npm run test:unit    # Unit tests only (__tests__/unit/)
```

## Environment Variables

See `.env.example` for the full list. Key variables:

- `ANTHROPIC_API_KEY` — Required for script generation
- `GEMINI_API_KEY` — For image generation (movie posters)
- `NEXT_PUBLIC_WS_URL` — WebSocket URL
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Payments
- `FIREBASE_STORAGE_BUCKET` — For poster storage
- `ALLOWED_ORIGINS` — CORS configuration

## Project Structure

```
server.ts                               # Main entry point — Express + Socket.IO + Next.js (custom server)

app/
  page.tsx                              # Landing page
  layout.tsx                            # Root layout
  error.tsx                             # Error boundary
  global-error.tsx                      # Global error boundary
  robots.ts, sitemap.ts                 # SEO
  icon.tsx, apple-icon.tsx              # Generated icons
  opengraph-image.tsx                   # OG image
  host/
    page.tsx                            # Host orchestrator
    components/
      HostLobby.tsx                     # QR, player list, game settings
      HostSelection.tsx                 # Solo card picker + ensemble waiting
      HostLoading.tsx                   # Script generation progress
      HostPerforming.tsx                # Teleprompter, controls, chaos
      HostVoting.tsx                    # Voting status grid
      HostResults.tsx                   # Winner, standings, share, actions
  join/
    page.tsx                            # Join orchestrator (Suspense-wrapped)
    components/
      JoinForm.tsx                      # Room code + nickname form
      JoinLobby.tsx                     # "You're In!" waiting view
      JoinSelection.tsx                 # Card picker (spectator/player/submitted views)
      JoinLoading.tsx                   # Loading progress + green room
      JoinPerforming.tsx                # Mobile teleprompter + spectator chat
      JoinVoting.tsx                    # MVP vote buttons
      JoinResults.tsx                   # Results + script actions
  admin/                                # Admin dashboard (rooms, stats, users)
  explore/                              # Card pack browser
  profile/                              # Player profile + stats
  replay/[code]/                        # Shareable game replays
  purchase/success/, purchase/cancelled/ # Stripe payment flow
  privacy/, terms/                      # Legal pages

hooks/
  useHostSocket.ts                      # Host socket listeners + all host game state
  useJoinSocket.ts                      # Join socket listeners + all join game state
  useAudioPlayer.ts                     # Audio playback
  useConfetti.ts                        # Confetti effects
  useHaptics.ts                         # Haptic feedback (mobile)
  useStandaloneMode.ts                  # PWA standalone detection
  useTeleprompterSettings.ts            # Teleprompter display preferences
  useToast.tsx                          # Toast notification system
  useWakeLock.ts                        # Prevent screen sleep

components/                             # Shared UI (48 components — modals, auth, cards, etc.)

contexts/
  AuthContext.tsx                        # Firebase auth provider
  SocketContext.tsx                      # Socket.IO connection provider
  ThemeContext.tsx                       # Theme provider

lib/
  types.ts                              # All shared TypeScript types (including socket events)
  animations.ts                         # Centralized MOTION presets + VARIANTS
  api.ts                                # API client helpers
  analytics.ts                          # Event tracking
  authErrors.ts                         # Auth error mapping
  authHeaders.ts                        # Auth header utilities
  content.ts                            # Static content data
  content-types.ts                      # Content type definitions
  credits.ts                            # Client-side credit helpers
  firebase.ts                           # Firebase client init
  logger.ts                             # Structured logging (replaces console.log)
  platform.ts                           # Platform detection (web/iOS/Android)
  purchases.ts                          # Purchase flow utilities
  schema.ts                             # Zod validation schemas
  scriptUtils.ts                        # Script download/copy utilities
  stripe.ts                             # Stripe client setup
  teleprompterUtils.ts                  # Mood indicators, visible line calculation

server/
  services/
    room.service.ts                     # Room lifecycle, write-through cache, Firestore persistence
    scriptGeneration.service.ts         # Claude API streaming script generation
    scriptCustomization.service.ts      # Comedy style, length, difficulty options
    voting.service.ts                   # Vote counting, MVP calculation
    audience.service.ts                 # Live reactions, plot twist system, spectator chat
    user.service.ts                     # User profiles, Firebase token verification
    credit.service.ts                   # Two-bucket credit system (free weekly + banked)
    playerStats.service.ts              # Stats, achievements, leaderboard
    gameHistory.service.ts              # Game saves, replay share codes
    cardpack.service.ts                 # Custom card packs CRUD
    teleprompter.service.ts             # Smart line timing (mood, punctuation, reading rate)
    image.service.ts                    # AI-generated title cards
    audio.service.ts                    # Ambient music + sound effects
    payment.service.ts                  # Payment transaction logging
    referral.service.ts                 # Referral code system
    apple.service.ts                    # Apple App Store integration
    prompts/comedyPrompts.ts            # System prompts + mode instructions for Claude
  middleware/
    auth.ts                             # Express auth (Firebase ID tokens)
    socketAuth.ts                       # Socket.IO auth handshake
    security.ts                         # Helmet, CSP, CORS, security headers
    rateLimiter.ts                      # Per-socket rate limiting (rooms, scripts, reactions)
    socketErrorHandler.ts               # Centralized error handler wrapper
  db/
    adapter.ts                          # Abstract database interface
    firestore.ts                        # Firestore implementation
    json.ts                             # JSON file fallback (dev)
    index.ts                            # Factory — auto-selects adapter from env
  utils/
    constants.ts                        # Game constants, timing, token limits
    validation.ts                       # Input sanitization (XSS prevention)
    roomSerializer.ts                   # Runtime Room <-> Firestore conversion
    jsonExtractor.ts                    # Robust JSON extraction from Claude responses
    timing.ts                           # Teleprompter line display time calculation
  data/
    communityPacks.ts                   # Built-in card pack data

__tests__/unit/                         # Unit tests (middleware, services, utils)
```

## Architecture Patterns

### Game State Machine
`LOBBY -> SELECTION -> LOADING -> PERFORMING -> VOTING -> RESULTS`

Both host and join pages follow this state machine. The orchestrators (`host/page.tsx`, `join/page.tsx`) delegate socket event handling to custom hooks (`useHostSocket`, `useJoinSocket`) and render phase-specific components based on `gameState`.

### Custom Server
`server.ts` runs Express + Socket.IO alongside Next.js in a single process. All socket event handlers, game logic, and database operations live server-side. Next.js handles page rendering via `app.getRequestHandler()`.

### Socket Hooks
`useHostSocket` and `useJoinSocket` own all game state (gameState, players, script, etc.) and handle socket event subscriptions. They use `useRef` to avoid stale closures in socket listeners — the effect depends only on `[socket, isConnected]`.

### Write-Through Cache (Rooms)
In-memory Map is authoritative for room state. Firestore persistence is async and debounced (5s for high-frequency updates like teleprompter position). Failed writes are queued for retry every 10s. On server restart, rooms are recovered from Firestore.

### Credit System
Two-bucket model: free credits (weekly lazy reset) + banked credits (purchased, no expiry). Deductions use database transactions to prevent double-spend. Free credits consumed first.

### Styling
- CSS custom properties for colors: `var(--color-accent)`, `var(--color-text-primary)`, etc.
- Tailwind for layout/spacing; inline `style={{ color: 'var(--color-*)' }}` for theme colors
- Animation presets: `MOTION.spring`, `MOTION.gentle`, `MOTION.bouncy` from `lib/animations.ts`
- Page transitions: `VARIANTS.pageTransition` (blur + scale + opacity)

### Component Conventions
- Named exports, TypeScript interfaces for all props
- `'use client'` directive on all interactive components
- Dynamic imports (`next/dynamic`) for heavy client-only components (SmartCardSelector, AudienceReactionBar, PlotTwistVoting)
- Path alias: `@/*` maps to project root
