# Plot Twists

Improv comedy game where players pick cards, AI generates a script, and they perform it live.

## Tech Stack

- **Frontend**: Next.js 16 (App Router, `'use client'`), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Custom Express + Socket.IO server (`server.ts`), runs alongside Next.js
- **AI**: Anthropic Claude for script generation, Google Gemini (Imagen 4) for movie poster images
- **Auth**: Firebase Auth (phone, anonymous), Firebase Admin for server-side verification
- **DB**: Firestore (production) / JSON file (dev) — adapter pattern in `server/db/`
- **Payments**: Stripe (credit system)
- **SMS**: Twilio (phone auth)
- **Animations**: Framer Motion with centralized presets in `lib/animations.ts`
- **Mobile**: Capacitor for iOS native app (loads production URL in webview)
- **Validation**: Zod schemas (`lib/schema.ts`)
- **Deployment**: Railway (primary), Vercel config available, Nixpacks builder
- **Node**: 22.x required (`engines` in package.json)

## Commands

```bash
npm run dev          # Start dev server (Next.js + Socket.IO via tsx)
npm run build        # Production build (Next.js)
npm run start        # Start production server (NODE_ENV=production)
npm run lint         # ESLint
npm run test         # Jest with coverage
npm run test:watch   # Jest in watch mode
npm run test:unit    # Unit tests only (__tests__/unit)
```

## Project Structure

```
server.ts                             # Entry point: Express + Socket.IO + Next.js custom server

app/
  page.tsx                            # Landing page
  layout.tsx                          # Root layout
  globals.css                         # Global styles / Tailwind imports
  error.tsx                           # Error boundary
  global-error.tsx                    # Root error boundary
  robots.ts                           # SEO robots.txt
  sitemap.ts                          # SEO sitemap
  host/
    page.tsx                          # Host orchestrator
    components/
      HostLobby.tsx                   # QR, player list, game settings
      HostSelection.tsx               # Solo card picker + ensemble waiting
      HostLoading.tsx                 # Script generation progress
      HostPerforming.tsx              # Teleprompter, controls, chaos
      HostVoting.tsx                  # Voting status grid
      HostResults.tsx                 # Winner, standings, share, actions
  join/
    page.tsx                          # Join orchestrator (Suspense-wrapped)
    components/
      JoinForm.tsx                    # Room code + nickname form
      JoinLobby.tsx                   # "You're In!" waiting view
      JoinSelection.tsx               # Card picker (spectator/player/submitted views)
      JoinLoading.tsx                 # Loading progress + green room
      JoinPerforming.tsx              # Mobile teleprompter + spectator chat
      JoinVoting.tsx                  # MVP vote buttons
      JoinResults.tsx                 # Results + script actions
  admin/                              # Admin dashboard (rooms, stats, users)
  explore/                            # Card pack browser
  profile/                            # Player profile + stats
  purchase/                           # Stripe purchase flow (success/cancelled)
  replay/[code]/                      # Shareable game replays
  privacy/                            # Privacy policy
  terms/                              # Terms of service

hooks/
  useHostSocket.ts                    # Host socket listeners + all host game state
  useJoinSocket.ts                    # Join socket listeners + all join game state
  useAudioPlayer.ts                   # Sound effects playback
  useConfetti.ts                      # Confetti effects
  useHaptics.ts                       # Native haptic feedback (Capacitor)
  useStandaloneMode.ts                # PWA standalone detection
  useTeleprompterSettings.ts          # Teleprompter display preferences
  useToast.tsx                        # Toast notification system
  useWakeLock.ts                      # Prevent screen sleep

components/                           # Shared UI (40+ components)

contexts/
  AuthContext.tsx                      # Firebase auth provider
  SocketContext.tsx                    # Socket.IO connection provider
  ThemeContext.tsx                     # Theme / dark mode provider

lib/
  types.ts                            # All shared TypeScript types (game state, socket events, etc.)
  schema.ts                           # Zod validation schemas
  animations.ts                       # Centralized MOTION presets + VARIANTS
  api.ts                              # Client-side API helpers
  firebase.ts                         # Firebase client initialization
  stripe.ts                           # Stripe client helpers
  credits.ts                          # Credit system utilities
  purchases.ts                        # Purchase flow utilities
  platform.ts                         # Platform detection (web/iOS/standalone)
  content.ts                          # Content filtering + green room questions
  content-types.ts                    # Content type definitions
  scriptUtils.ts                      # Script download/copy utilities
  teleprompterUtils.ts                # Mood indicators, visible line calculation
  authErrors.ts                       # Auth error message mapping
  authHeaders.ts                      # Auth header utilities
  admin.ts                            # Admin API helpers
  analytics.ts                        # Event tracking
  logger.ts                           # Structured logging (replaces console.log)

server/
  services/
    scriptGeneration.service.ts       # AI script generation (Anthropic Claude)
    scriptCustomization.service.ts    # Script customization options
    teleprompter.service.ts           # Teleprompter sync engine
    voting.service.ts                 # Vote tallying + results
    room.service.ts                   # Room CRUD (write-through Firestore cache)
    credit.service.ts                 # Credit balance management
    payment.service.ts                # Stripe payment processing
    image.service.ts                  # Movie poster generation (Gemini Imagen 4)
    audience.service.ts               # Audience reactions + plot twists
    audio.service.ts                  # Sound effect management
    cardpack.service.ts               # Card pack CRUD
    gameHistory.service.ts            # Game history persistence
    playerStats.service.ts            # Player statistics tracking
    referral.service.ts               # Referral system
    user.service.ts                   # User profile management + account deletion
    apple.service.ts                  # Apple App Store server verification
    prompts/
      comedyPrompts.ts               # System prompts for script generation
  middleware/
    auth.ts                           # HTTP auth middleware
    rateLimiter.ts                    # Socket rate limiting
    security.ts                       # Security headers, env validation
    socketAuth.ts                     # Firebase token verification for sockets
    socketErrorHandler.ts             # Socket error handling wrapper
  db/
    adapter.ts                        # DB adapter interface
    firestore.ts                      # Firestore implementation
    json.ts                           # JSON file implementation (dev)
    index.ts                          # Adapter selection based on environment
  utils/
    constants.ts                      # Server constants
    jsonExtractor.ts                  # JSON extraction from AI responses
    roomSerializer.ts                 # Room state serialization
    timing.ts                         # Line display time calculation
    validation.ts                     # Input sanitization + validation
  data/
    communityPacks.ts                 # Community card pack definitions

data/
  cardpacks.json                      # Card pack data

__tests__/
  unit/server/
    services/                         # Service unit tests
    middleware/                        # Middleware unit tests
    utils/                            # Utility unit tests

scripts/
  generate-icons.mjs                  # Icon generation script

ios/                                  # Capacitor iOS native project
```

## Architecture Patterns

### Game State Machine
`LOBBY -> SELECTION -> LOADING -> PERFORMING -> VOTING -> RESULTS`

Both host and join pages follow this state machine. The orchestrators (`host/page.tsx`, `join/page.tsx`) delegate socket event handling to custom hooks (`useHostSocket`, `useJoinSocket`) and render phase-specific components based on `gameState`.

### Game Modes
- **SOLO**: Single player, host picks cards
- **HEAD_TO_HEAD**: Two players compete
- **ENSEMBLE**: Multiple players collaborate

### Socket Hooks
`useHostSocket` and `useJoinSocket` own all game state (gameState, players, script, etc.) and handle socket event subscriptions. They use `useRef` to avoid stale closures in socket listeners — the effect depends only on `[socket, isConnected]`.

### Server Entry Point
`server.ts` is the single entry point. It creates an Express app, attaches Socket.IO, and integrates Next.js request handling. All socket events are registered here. Run via `tsx` (not compiled).

### Database Adapter Pattern
`server/db/index.ts` selects between Firestore and JSON file storage based on environment. Both implement the same adapter interface (`server/db/adapter.ts`). JSON adapter stores data in a local file for development.

### Styling
- CSS custom properties for colors: `var(--color-accent)`, `var(--color-text-primary)`, etc.
- Tailwind for layout/spacing; inline `style={{ color: 'var(--color-*)' }}` for theme colors
- Animation presets: `MOTION.spring`, `MOTION.gentle`, `MOTION.bouncy` from `lib/animations.ts`
- Page transitions: `VARIANTS.pageTransition` (blur + scale + opacity)

### Component Conventions
- Named exports, TypeScript interfaces for all props
- `'use client'` directive on all interactive components
- Dynamic imports (`next/dynamic`) for heavy client-only components (SmartCardSelector, AudienceReactionBar, PlotTwistVoting)
- Path aliases: `@/*` maps to project root

## Testing

Jest with ts-jest. Tests live in `__tests__/unit/`. Coverage thresholds: 20% minimum (branches, functions, lines, statements).

```bash
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode
npm run test:unit     # Unit tests only
```

## Environment Variables

### Required
- `ANTHROPIC_API_KEY` — Claude API key for script generation

### Firebase
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY` — Server-side Firebase Admin (JSON)

### Optional
- `GEMINI_API_KEY` — Google Gemini for poster image generation (falls back to placeholder)
- `STRIPE_SECRET_KEY` — Stripe payments
- `NEXT_PUBLIC_APP_URL` — App URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_WS_URL` — WebSocket URL (default: same as app)
- `NEXT_PUBLIC_ENABLE_ANALYTICS` — Enable Vercel analytics (`true`/`false`)
- `NEXT_PUBLIC_ENABLE_ERROR_TRACKING` — Enable error tracking (`true`/`false`)
- `DOCKER` — Set to enable standalone Next.js output for Docker deployment
