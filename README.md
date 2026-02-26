# Plot Twists

An AI-powered improv comedy party game where players pick cards, AI generates a script, and they perform it live.

## Features

- **Real-time Multiplayer**: Host on TV/desktop, players use phones as controllers
- **AI-Generated Scripts**: Powered by Claude Sonnet 4.5 for creative, character-accurate comedy
- **Content Filtering**: Family Friendly or After Dark (18+) modes
- **Multiple Game Modes**: Solo, Head-to-Head, and Ensemble (3-6 players)
- **Synchronized Teleprompter**: Auto-scrolling script on TV, synced line-by-line to phones
- **Smart Timing**: Mood-aware line pacing with punctuation pauses
- **Card Packs**: Community packs + custom pack creation
- **XP & Progression**: Level up, earn achievements, track stats
- **Voting & Results**: MVP voting with animated standings and confetti
- **Interactive Waiting**: Green Room trivia during AI generation
- **Audience Features**: Spectator chat, live reactions, plot twist voting
- **Audio**: Ambient music + sound effects system
- **Replay System**: Shareable game replays via unique codes
- **iOS App**: Native App Store presence via Capacitor (WebView shell)
- **PWA**: Installable on any device, offline-capable static assets

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Custom Node.js server — Express 5 + Socket.IO (single process)
- **AI**: Anthropic Claude (`claude-sonnet-4-5-20250929`) for scripts, Google Gemini for poster images
- **Auth**: Firebase Auth (phone + anonymous)
- **Database**: Firestore (production) / JSON file (dev) — adapter pattern
- **Payments**: Stripe (credit system) + Apple App Store IAP
- **Mobile**: Capacitor for iOS
- **Animations**: Framer Motion with centralized presets (`lib/animations.ts`)
- **Testing**: Jest + ts-jest (13 test suites)
- **Deployment**: Railway (persistent Node.js hosting)

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

```bash
git clone <repo-url>
cd plot-twists
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

- **Host Screen**: Navigate to `/host` on your desktop/TV browser
- **Player Screens**: Players visit `/join` on their phones (or scan the QR code)

### Commands

```bash
npm run dev          # Start dev server (Next.js + Socket.IO via tsx server.ts)
npm run build        # Production build (next build, checks TypeScript)
npm run start        # Start production server (NODE_ENV=production tsx server.ts)
npm run test         # Jest with coverage
npm run test:watch   # Jest in watch mode
npm run test:unit    # Unit tests only (__tests__/unit/)
```

## How to Play

1. **Host Creates Room**: Visit `/host` to automatically create a game room
2. **Players Join**: Scan QR code or enter room code at `/join`
3. **Select Cards**: Each player picks a Character, Setting, and Circumstance
4. **AI Generates Script**: Claude writes a custom comedy script (~10-20 seconds)
5. **Perform**: Players read their lines using phones as teleprompters
6. **Vote**: Everyone votes for the best performance
7. **Results**: MVP is crowned with confetti

## Game Modes

- **Solo**: Single player monologue with AI co-stars
- **Head-to-Head**: Two players compete (with audience voting)
- **Ensemble**: 3-6 players collaborate on a scene

## Architecture

### Game State Machine
```
LOBBY -> SELECTION -> LOADING -> PERFORMING -> VOTING -> RESULTS
```

### Custom Server
`server.ts` (2,364 lines) runs Express + Socket.IO alongside Next.js in a single process. All socket event handlers, game logic, and database operations live server-side.

### Room Management
- Write-through cache: in-memory Map is authoritative, Firestore persistence is async/debounced
- 4-letter room codes (A-Z, 2-9, excluding confusing characters)
- Auto-cleanup of inactive rooms after 1 hour
- Room recovery from Firestore on server restart

### Server Services (20 services)
```
server/services/
  room.service.ts              # Room lifecycle, write-through cache
  scriptGeneration.service.ts  # Claude API streaming generation
  scriptCustomization.service.ts # Comedy style, length, difficulty
  voting.service.ts            # Vote counting, MVP calculation
  audience.service.ts          # Live reactions, plot twists, spectator chat
  user.service.ts              # User profiles, Firebase token verification
  credit.service.ts            # Two-bucket credit system (free weekly + banked)
  playerStats.service.ts       # Stats, achievements, leaderboard
  progression.service.ts       # XP, leveling, titles
  gameHistory.service.ts       # Game saves, replay share codes
  cardpack.service.ts          # Custom card packs CRUD
  teleprompter.service.ts      # Smart line timing (mood, punctuation)
  image.service.ts             # AI-generated movie posters (Gemini)
  audio.service.ts             # Ambient music + sound effects
  payment.service.ts           # Payment transaction logging
  apple.service.ts             # Apple App Store IAP verification
  push.service.ts              # Push notifications
  referral.service.ts          # Referral code system
  matchmaking.service.ts       # Quick play matchmaking
```

### Security & Resilience
- Helmet.js with CSP, HSTS, and security headers
- Per-socket rate limiting (`SocketRateLimiter`) on all event types
- HTTP rate limiting (express-rate-limit) on API routes
- Firebase Auth middleware for authenticated endpoints
- Input sanitization and XSS prevention
- Socket emit timeout wrappers (10s default)
- React Error Boundaries per game phase
- `uncaughtException` / `unhandledRejection` crash protection
- Graceful shutdown with room persistence

### Frontend Architecture
- 47 shared components, 10 custom hooks
- Dynamic imports (`next/dynamic`) for all game phase components
- `useHostSocket` / `useJoinSocket` hooks own all game state
- CSS custom properties for theming (light + dark mode)
- Framer Motion with `useReducedMotion` gating
- Safe area insets for mobile notch/home indicator

## Deployment

### Railway (Current)

The app runs as a single process on Railway. See `DEPLOYMENT.md` for full details.

```bash
# Deploy via CLI
railway up

# Or push to v2 branch for auto-deploy
git push origin v2
```

### Environment Variables

See `.env.example` for the full list. Key variables:

```env
ANTHROPIC_API_KEY=...               # Required — Claude API
GEMINI_API_KEY=...                  # Movie poster generation
NEXT_PUBLIC_WS_URL=...              # WebSocket URL
STRIPE_SECRET_KEY=...               # Payments
FIREBASE_STORAGE_BUCKET=...         # Poster storage
ALLOWED_ORIGINS=...                 # CORS configuration
```

`NEXT_PUBLIC_*` variables must be set at build time (Next.js inlines them).

## Testing

```bash
npm run test         # All tests with coverage
npm run test:unit    # Unit tests only
```

13 test suites covering: rate limiting, input validation, voting, credits, audience reactions, player stats, progression, room service, game history, database adapter, JSON extraction, teleprompter timing, socket helpers.

## iOS App

The iOS app is a Capacitor WebView shell (~286 lines of native Swift).

```bash
npx cap sync ios     # Sync web assets to iOS project
# Open ios/App/App.xcworkspace in Xcode to build/archive
```

StoreKit 2 is bridged for in-app purchases. See `ios/` directory.

## License

ISC

## Credits

- Powered by [Anthropic Claude](https://www.anthropic.com/)
- Inspired by party games we love
