# Plot Twists - Application Architecture & Documentation

**Last Updated:** 2026-01-23
**Version:** 1.0
**Status:** Active Development

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
9. [Data Structures](#9-data-structures)
10. [User Flows](#10-user-flows)
11. [Deployment](#11-deployment)
12. [Recommended Improvements](#12-recommended-improvements)
13. [Critical Files Reference](#13-critical-files-reference)

---

## 1. Project Overview

**Plot Twists** is an AI-powered, real-time multiplayer improv comedy party game that generates hilarious scripts using Claude AI. Players pick random character/setting/circumstance cards, Claude generates a comedy script, and they perform it for an audience who votes on the MVP performance.

### Key Innovation
Uses WebSocket (Socket.io) for real-time synchronized teleprompter delivery across host TV screens and player mobile screens.

### Game Modes
- **Solo Mode**: Single player with AI co-stars (1 player)
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
| Next.js | 16.1.2 | React framework with App Router |
| React | 19.2.3 | UI library |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 4.1.18 | Utility-first styling |
| Framer Motion | 12.26.2 | Animations |
| Socket.io Client | 4.8.3 | Real-time WebSocket |
| canvas-confetti | 1.9.4 | Celebration effects |
| qrcode.react | 4.2.0 | QR code generation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.9.0+ | Runtime |
| Express | 5.2.1 | HTTP server |
| Socket.io | 4.8.3 | WebSocket server |
| TypeScript | 5.9.3 | Type safety |
| tsx | 4.21.0 | TypeScript execution |

### AI/ML
| Technology | Version | Purpose |
|------------|---------|---------|
| @anthropic-ai/sdk | 0.71.2 | Claude API client |
| Claude Model | sonnet-4-5 | Script generation |
| Zod | 4.3.5 | Schema validation |

---

## 3. Project Structure

```
/home/user/Plot-Twists/
├── server.ts                          # Main backend (1,275 lines)
├── next.config.js                     # Next.js config
├── package.json                       # Dependencies
├── design-tokens.json                 # Design system
├── .env.example                       # Environment template
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout with SocketProvider
│   ├── page.tsx                      # Home/landing page
│   ├── globals.css                   # Design system (2,183 lines)
│   ├── host/
│   │   └── page.tsx                 # Host screen (TV view)
│   └── join/
│       └── page.tsx                 # Player screen (mobile view)
│
├── components/                       # Reusable UI components
│   ├── CardCarousel.tsx             # Card selection interface
│   ├── Modal.tsx                    # Modal wrapper
│   ├── Toast.tsx                    # Notification system
│   └── OnboardingModal.tsx          # Game rules
│
├── contexts/                         # React Context
│   └── SocketContext.tsx            # Socket.io singleton
│
├── hooks/                            # Custom React hooks
│   ├── useConfetti.ts               # Celebration animations
│   ├── useToast.ts                  # Toast management
│   └── useWakeLock.ts               # Screen wake lock
│
├── lib/                              # Business logic
│   ├── types.ts                     # TypeScript interfaces (106 lines)
│   ├── schema.ts                    # Zod validation
│   ├── content.ts                   # Game content (20,991 lines)
│   └── scriptUtils.ts               # Script utilities
│
└── public/                           # Static assets
```

---

## 4. Frontend Architecture

### Routing (Next.js App Router)

| Route | Purpose | View Type |
|-------|---------|-----------|
| `/` | Landing page with game info | Desktop/Mobile |
| `/host` | Host screen with teleprompter | TV/Desktop |
| `/join` | Player join & card selection | Mobile |

### Key Components

#### CardCarousel.tsx
Interactive card selection with swipe gestures
- Animated slide transitions
- Random shuffle functionality
- Used for Character/Setting/Circumstance selection

#### Modal.tsx
Reusable modal container with:
- Framer Motion animations
- Backdrop blur
- Scrollable content

#### Toast.tsx
Notification system with:
- 4 types: Success, Error, Warning, Info
- Auto-dismiss (5 seconds)
- Stacked positioning

#### OnboardingModal.tsx
Game rules and mode explanations

### State Management

**Global State**: SocketContext.tsx
- Singleton Socket.io connection
- Automatic reconnection with exponential backoff
- CORS configuration for Railway/Vercel

**Local State**: React hooks
- `useState` for UI state
- `useRef` for non-reactive values
- `useCallback` for memoized functions

### Custom Hooks

```typescript
useSocket()        // Access Socket.io connection
useConfetti()      // Trigger celebration animations
useToast()         // Show notifications
useWakeLock()      // Prevent screen sleep
```

### Styling System

**Design Tokens** (CSS custom properties):
- Color palette (primary, secondary, accent)
- Typography scale
- Spacing system
- Border radius

**Typography**:
- Display: Fredoka (rounded, playful)
- UI: DM Sans (modern, clean)
- Script: Courier Prime (monospace)
- Handwritten: Permanent Marker

**Responsive Design**:
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Works on TV (1080p+), desktop, tablet, mobile

---

## 5. Backend Architecture

### Server Setup

**File**: `server.ts` (1,275 lines)

```typescript
// HTTP Server
const server = createServer(expressApp)

// Socket.io Server
const io = new SocketIOServer(server, {
  cors: { /* origin validation */ },
  transports: ['polling'] // Production (Railway)
})

// Listen on port 3000
server.listen(port, hostname)
```

### Room Management

**In-Memory Storage**:
```typescript
const rooms = new Map<string, Room>()
```

**Room Structure**:
```typescript
interface Room {
  code: string                    // 4-letter room code
  host: Player                    // Host player
  players: Map<string, Player>    // All players
  gameState: GameState            // LOBBY|SELECTION|LOADING|PERFORMING|VOTING|RESULTS
  gameMode: GameMode              // SOLO|HEAD_TO_HEAD|ENSEMBLE
  isMature: boolean               // Content rating
  selections: Map<string, CardSelection>
  script?: Script                 // Generated script
  currentLineIndex: number        // Teleprompter position
  isPaused: boolean
  votes: Map<string, string>
  createdAt: number
  lastActivity: number
}
```

**Auto-Cleanup**: Inactive rooms deleted after 1 hour (runs every 5 minutes)

### API Endpoints (Socket.io Events)

#### Server → Client Events

```typescript
room_created(code: string)
player_joined(player: Player)
player_left(playerId: string)
game_state_change(newState: GameState)
players_update(players: Player[])
green_room_prompt(question: string)
script_ready(script: Script)
sync_teleprompter(lineIndex: number)
game_over(results: GameResults)
error(message: string)
room_settings_update(settings: RoomSettings)
available_cards(cards: {...})
```

#### Client → Server Events

```typescript
create_room(settings, callback)
join_room(roomCode, nickname, callback)
submit_cards(roomCode, selections, callback)
start_game(roomCode)
submit_vote(roomCode, targetPlayerId)
advance_script_line(roomCode)
pause_script(roomCode)
resume_script(roomCode)
jump_to_line(roomCode, lineIndex)
request_sequel(roomCode)
request_new_game(roomCode)
update_room_settings(roomCode, settings)
disconnect()
```

### Key Backend Functions

#### generateScript() (lines 62-557)
Calls Claude API to generate comedy scripts
- Constructs 300+ line system prompt
- Handles Solo/Head-to-Head/Ensemble modes
- Validates output with Zod
- Returns structured script JSON

#### startTeleprompterSync() (lines 1191-1238)
Automatic line advancement based on reading speed
- Calculates: `(wordCount / 120 WPM) * 60 * 1000` ms
- Maintains timeout references per room
- Handles pause/resume

#### calculateResults() (lines 1241-1264)
Vote counting and winner selection
- Counts votes per player
- Sorts by vote count
- Returns results ranking

---

## 6. Real-Time Communication

### WebSocket Flow Diagram

```
HOST                 WebSocket            SERVER              Claude API
 |                   (Socket.io)            |
 |-- create_room -----------------------> |
 |                                         |-- Generate room
 |<--------- room_created ---------------- |
 |
 | (Display QR code)
 |

PLAYER               WebSocket            SERVER
 |                   (Socket.io)            |
 |-- join_room --------------------------> |
 |                                         |-- Validate room
 |<----- player_joined (broadcast) ------- |
 |<------ players_update (broadcast) ----- |
 |
 |-- submit_cards ------------------------ |
 |                                         |-- Store selections
 |<------ players_update (broadcast) ----- |
 |                                         |
 |<-- game_state_change('LOADING') ------- |
 |<------ green_room_prompt -------------- |
 |                                         |-- generateScript() -------> |
 |                                         |                              |
 |                                         |      (10-20 seconds)        |
 |                                         | <--------------------------- |
 |<--------- script_ready ---------------- |
 |<-- game_state_change('PERFORMING') ---- |
 |                                         |
 |<----- sync_teleprompter(0) ----------- |
 |<----- sync_teleprompter(1) ----------- | (auto-advance)
 |<----- sync_teleprompter(2) ----------- | (based on reading time)
 |                  ...                   |
 |<-- game_state_change('VOTING') ------- | (script complete)
 |                                         |
 |-- submit_vote ------------------------> |
 |                                         |-- Count votes
 |<-------- game_over (results) ---------- |
 |                                         |
 | (Confetti celebration)
```

### Connection Configuration

**Production** (Railway):
```typescript
transports: ['polling']  // WebSocket issues on Railway
cors: { origin: ['*.railway.app', '*.vercel.app'] }
reconnectionDelay: 1000
reconnectionDelayMax: 5000
reconnectionAttempts: 10
```

**Development**:
```typescript
transports: ['polling', 'websocket']
cors: { origin: 'http://localhost:3000' }
```

---

## 7. AI Integration

### Claude API Configuration

**Model**: `claude-sonnet-4-5-20250929`
- Response time: 8-10 seconds
- Token allocation: 8,192-10,000 tokens
- Temperature: 1.0 (maximum creativity)

### System Prompt Structure

**Comedy Guidelines** (~300 lines):
- 18+ vs Family Friendly instructions
- Character voice matching
- Scene structure (Hook → Explore → Escalate → Peak Chaos → Button)
- Improv principles (YES-AND, Rule of Three)

**Game Mode Specific**:
- **Solo**: AI creates 2-3 co-star characters
- **Head-to-Head**: Opposing goals, competitive banter
- **Ensemble**: Straight man + chaos agents

**Sequel Mode**:
- Same characters/setting/circumstance
- References previous script for callbacks
- Escalates stakes from Episode 1

### Output Format

```json
{
  "title": "Punny title",
  "synopsis": "[CHARACTER] must [DO THING] while [OBSTACLE]",
  "lines": [
    {
      "speaker": "Character Name",
      "text": "Dialogue text",
      "mood": "angry|happy|confused|whispering|neutral"
    }
  ]
}
```

### Validation

**Zod Schema** (`lib/schema.ts`):
- Validates title, synopsis, lines array
- Ensures speaker, text, mood fields exist
- Fallback mood to 'neutral' if invalid

**Error Handling**:
- Strip markdown code blocks
- Parse JSON
- Validate structure
- Log errors and retry on failure

---

## 8. Game Logic & Features

### Game Modes

#### Solo Mode
- 1 player with AI co-stars
- AI takes 50-60% of lines
- No voting (results only)

#### Head-to-Head Mode
- 2 players competing
- Opposing character goals
- Voting round after performance

#### Ensemble Mode
- 3-6 players
- First player = "straight man"
- Others = "agents of chaos"
- Voting round after performance

### Content System

**Three Card Types**:
1. **Characters** (100+ per rating)
   - Safe: Michael Scott, Yoda, Batman, SpongeBob
   - Mature: Tony Soprano, Deadpool, Rick Sanchez

2. **Settings** (70+ per rating)
   - Safe: Central Perk, The Office, Jurassic Park
   - Mature: Crime scenes, dark scenarios

3. **Circumstances** (60+ per rating)
   - Safe: "Teaching a class", "Running a restaurant"
   - Mature: "Escaping from jail", "Confessing a crime"

**File**: `lib/content.ts` (20,991 lines)

### Teleprompter System

**Host View**:
- Full script visible
- Current line highlighted
- Manual controls (Previous, Next, Pause, Resume)
- Keyboard shortcuts (Arrow keys, Space)

**Player View**:
- Current line large and centered
- Next line preview
- Mood indicator (emoji)
- Vibration feedback when character speaks (mobile)

**Synchronization**:
- Reading time = `(words / 120 WPM) * 60` seconds
- All clients receive line updates in real-time
- Pause/resume functionality

### Voting System

**Head-to-Head / Ensemble Only**:
1. Voting screen after script completes
2. Each player votes for another player's MVP
3. Spectators can vote but don't affect results
4. Results sorted by vote count
5. Winner gets confetti celebration

### Green Room Trivia

**Purpose**: Mask AI generation wait time

**Implementation**: Setting-specific trivia questions
- Example: "What year did The Office premiere?" for office settings
- Keeps players engaged during 10-20 second wait

---

## 9. Data Structures

### Room State Example

```typescript
{
  code: "WXYZ",
  host: {
    id: "host-123",
    nickname: "Host",
    role: "HOST",
    socketId: "abc123",
    isHost: true
  },
  players: Map {
    "player1-id" => {
      id: "player1-id",
      nickname: "Alice",
      role: "PLAYER",
      socketId: "def456"
    },
    "player2-id" => {
      id: "player2-id",
      nickname: "Bob",
      role: "PLAYER",
      socketId: "ghi789"
    }
  },
  gameState: "PERFORMING",
  gameMode: "HEAD_TO_HEAD",
  isMature: false,
  selections: Map {
    "player1-id" => {
      character: "Batman",
      setting: "Starbucks",
      circumstance: "ordering coffee"
    },
    "player2-id" => {
      character: "Yoda",
      setting: "Starbucks",
      circumstance: "spilling drink"
    }
  },
  script: {
    title: "The Batista",
    synopsis: "Batman must order coffee while Yoda complains about the line",
    lines: [
      {
        speaker: "Yoda",
        text: "In line this long been, we have.",
        mood: "confused"
      },
      {
        speaker: "Batman",
        text: "I'm here for the justice, not the latte.",
        mood: "whispering"
      }
      // ... more lines
    ]
  },
  currentLineIndex: 5,
  isPaused: false,
  votes: Map {
    "player1-id" => "player2-id",
    "player2-id" => "player1-id"
  },
  createdAt: 1706000000000,
  lastActivity: 1706000300000
}
```

### Player Interface

```typescript
interface Player {
  id: string              // Unique player ID (UUID)
  nickname: string        // Display name (max 50 chars)
  role: PlayerRole        // HOST|PLAYER|SPECTATOR
  socketId: string        // Socket.io connection ID
  isHost: boolean         // Quick host check
  hasSubmittedCards?: boolean
}
```

### Script Interface

```typescript
interface Script {
  title: string           // Comedy title
  synopsis: string        // One-line summary
  lines: ScriptLine[]     // Array of dialogue lines
}

interface ScriptLine {
  speaker: string         // Character name
  text: string            // Dialogue text
  mood: Mood              // angry|happy|confused|whispering|neutral
}
```

---

## 10. User Flows

### Complete Game Session

```
HOST FLOW:
Landing Page
  ↓
Click "Host a Game"
  ↓
Room created automatically (4-letter code)
  ↓
QR Code + room code displayed
  ↓
Select game mode & content rating
  ↓
Wait for players to join
  ↓
Click "Start Game"
  ↓
Players receive available cards
  ↓
Teleprompter displays full script
  ↓
Controls: Pause/Resume/Jump/Advance
  ↓
Script completes → Voting phase
  ↓
Results & winner announcement
  ↓
Option: Request sequel or new game

PLAYER FLOW:
Landing Page
  ↓
Click "Join Game"
  ↓
Enter room code OR scan QR
  ↓
Enter nickname
  ↓
Join room (PLAYER or SPECTATOR if full)
  ↓
Receive available cards
  ↓
CardCarousel: Pick character/setting/circumstance
  ↓
Submit selections
  ↓
Green room trivia (wait for script)
  ↓
Script ready → see current & next lines
  ↓
Watch performance
  ↓
Vibration when your character speaks
  ↓
Voting phase: Select MVP player
  ↓
See results with confetti
  ↓
Play again or leave
```

---

## 11. Deployment

### Platform: Railway

**Why Railway?**
- Persistent Node.js server (required for Socket.io)
- Maintains WebSocket connections
- (Vercel is serverless, cannot maintain connections)

### Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...           # Claude API key (required)
PORT=3000                               # Server port (Railway auto-assigns)
NODE_ENV=production                    # Environment mode
NEXT_PUBLIC_WS_URL=your-app.up.railway.app  # WebSocket URL
```

### Configuration

**Railway**:
- Detects `Procfile` with `tsx server.ts`
- Automatically assigns `PORT` environment variable
- CORS configured for Railway domains

**Production Optimizations**:
- Image optimization (Next.js)
- Security headers (X-Frame-Options, CSP)
- Gzip compression
- CSS minification
- Code splitting

---

## 12. Recommended Improvements

### 🔴 Critical Priority

#### 1. Data Persistence
**Current State**: All room data stored in-memory (lost on server restart)

**Recommendations**:
- Add Redis for room state persistence
- Store active games, player data, voting results
- Enable server restarts without losing games
- Consider PostgreSQL for game history, analytics

**Impact**: High - Prevents data loss on deployments

#### 2. Rate Limiting
**Current State**: No rate limiting on API endpoints or Claude API calls

**Recommendations**:
- Add rate limiting middleware (express-rate-limit)
- Limit script generation requests per IP/room
- Prevent API key abuse
- Add request queuing for Claude API

**Impact**: High - Cost control and security

#### 3. Error Handling & Monitoring
**Current State**: Basic error logging, no monitoring

**Recommendations**:
- Add Sentry or similar error tracking
- Implement structured logging (Winston/Pino)
- Add health check endpoints
- Monitor Claude API failures
- Track WebSocket connection issues

**Impact**: High - Production reliability

### 🟡 High Priority

#### 4. Testing Infrastructure
**Current State**: No tests (`package.json` has placeholder)

**Recommendations**:
- Add Jest for unit tests
- Add React Testing Library for component tests
- Test critical paths (room creation, script generation, voting)
- Add E2E tests (Playwright) for full game flow
- Mock Claude API for testing

**Impact**: Medium-High - Code quality and reliability

#### 5. Security Enhancements
**Current State**: Basic input sanitization, no CSRF protection

**Recommendations**:
- Add CSRF token validation
- Implement room password protection (optional)
- Add input validation on all Socket.io events
- Sanitize HTML in player nicknames, room codes
- Add Content Security Policy headers
- Rate limit room creation per IP

**Impact**: High - Security and abuse prevention

#### 6. Mobile Experience
**Current State**: Basic mobile support, no PWA

**Recommendations**:
- Convert to Progressive Web App (PWA)
- Add offline support for static assets
- Improve touch gestures on card carousel
- Add haptic feedback (iOS)
- Optimize for portrait orientation
- Add "Add to Home Screen" prompt

**Impact**: Medium - User experience

### 🟢 Medium Priority

#### 7. Performance Optimization
**Current State**: Single server instance, no caching

**Recommendations**:
- Add Redis caching for frequently accessed data
- Implement CDN for static assets
- Optimize bundle size (analyze with next-bundle-analyzer)
- Lazy load components not needed on initial render
- Add service worker for asset caching
- Consider horizontal scaling with Socket.io adapter

**Impact**: Medium - Scalability

#### 8. Analytics & Metrics
**Current State**: Vercel Analytics only (frontend)

**Recommendations**:
- Add game metrics tracking (game duration, player count, mode popularity)
- Track Claude API usage (cost per game, generation time)
- Monitor room creation/join rates
- Track voting patterns, winner statistics
- Add user feedback mechanism
- Create admin dashboard for metrics

**Impact**: Medium - Product insights

#### 9. Content Management
**Current State**: Hardcoded content in `lib/content.ts` (20,991 lines)

**Recommendations**:
- Move content to database or CMS
- Allow community contributions (user-submitted characters)
- Add content moderation system
- Implement content versioning
- Add seasonal/themed content packs
- Allow hosts to create custom card packs

**Impact**: Medium - Scalability and engagement

#### 10. AI Script Quality
**Current State**: Single Claude model, no fallback

**Recommendations**:
- Implement script rating system (players vote on script quality)
- A/B test different system prompts
- Add fallback to cached scripts if API fails
- Implement script regeneration option
- Fine-tune prompts based on player feedback
- Add "script style" options (dry humor, slapstick, etc.)

**Impact**: Medium - User experience

### 🔵 Low Priority (Nice to Have)

#### 11. Social Features
**Recommendations**:
- Add script sharing (export to social media)
- Allow recording performances (video/audio)
- Create player profiles with stats
- Add friend system
- Implement leaderboards
- Add "replay" feature to watch past performances

**Impact**: Low-Medium - Engagement

#### 12. Accessibility
**Recommendations**:
- Add screen reader support (ARIA labels)
- Improve keyboard navigation
- Add color-blind mode
- Implement font size controls
- Add audio cues for line changes
- Support voice-to-text for voting

**Impact**: Medium - Inclusivity

#### 13. Internationalization (i18n)
**Recommendations**:
- Add multi-language support (next-intl)
- Translate UI strings
- Support international characters in Claude prompts
- Add region-specific content (UK vs US humor)

**Impact**: Low - Market expansion

#### 14. Advanced Features
**Recommendations**:
- Add "Director Mode" (host can give live notes)
- Implement audience reactions (emojis during performance)
- Add background music/sound effects
- Create "Tournament Mode" (bracket-style competition)
- Add "Improv Games" mode (different formats like Whose Line)
- Implement AI-generated sound effects

**Impact**: Low - Feature richness

### 🛠️ Technical Debt

#### 15. Code Organization
**Current State**: Single 1,275-line `server.ts` file

**Recommendations**:
- Split into modules:
  - `routes/` - HTTP endpoints
  - `socket/` - Socket.io event handlers
  - `services/` - Room management, AI generation
  - `models/` - Data structures
  - `utils/` - Helper functions
- Move types to shared `lib/types.ts`
- Create barrel exports for clean imports

**Impact**: Medium - Maintainability

#### 16. TypeScript Strictness
**Recommendations**:
- Enable `strict` mode in tsconfig.json
- Add stricter type checking
- Remove `any` types
- Add exhaustive type guards

**Impact**: Low-Medium - Type safety

---

## 13. Recent Improvements (2026-01-23)

### ✅ Implemented

#### Security Enhancements
- **Helmet.js Integration**: Added comprehensive security headers
  - Content Security Policy (CSP)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection
  - Referrer-Policy
- **Enhanced Input Validation**:
  - Sanitization of user input (nicknames, room codes)
  - XSS prevention (strip dangerous characters)
  - Format validation for room codes and UUIDs
  - Max length enforcement
- **Environment Validation**: Automatic check for required environment variables on startup

#### Rate Limiting
- **HTTP Rate Limiting** (express-rate-limit):
  - General API: 100 requests per 15 minutes
  - Room creation: 10 rooms per 5 minutes per IP
  - Script generation: 20 scripts per 10 minutes per IP
- **Socket.io Rate Limiting**:
  - Custom `SocketRateLimiter` class for per-connection limits
  - Room creation: 10 attempts per 5 minutes
  - Join room: 30 attempts per minute
  - Script generation: 20 attempts per 10 minutes
  - Automatic cleanup of stale rate limit records

#### Code Organization
- **New Module Structure**:
  ```
  server/
  ├── middleware/
  │   ├── rateLimiter.ts          # Rate limiting for HTTP & Socket.io
  │   └── security.ts             # Helmet config & env validation
  ├── utils/
  │   ├── constants.ts            # App-wide constants
  │   └── validation.ts           # Input sanitization & validation
  └── services/
      ├── room.service.ts         # Room management functions
      ├── ai.service.ts           # Claude API integration
      └── teleprompter.service.ts # Teleprompter sync logic
  ```
- **Benefits**:
  - Improved maintainability
  - Easier testing
  - Clearer separation of concerns
  - Reusable utilities

#### Testing Infrastructure
- **Jest Configuration**:
  - ts-jest for TypeScript support
  - jsdom environment for React components
  - Coverage thresholds (50% across all metrics)
  - Test scripts: `test`, `test:watch`, `test:unit`
- **Unit Tests Created**:
  - `validation.test.ts`: Input sanitization, room code validation, nickname validation
  - `rateLimiter.test.ts`: Socket rate limiter functionality
- **Test Coverage**: Initial tests for critical security and validation functions

#### PWA (Progressive Web App)
- **Manifest.json**:
  - Standalone display mode
  - App icons (192x192, 512x512)
  - Theme colors
  - Shortcuts (Join Game, Host Game)
  - Screenshots for app stores
- **Service Worker** (`sw.js`):
  - Cache-first strategy for static assets
  - Network-first with cache fallback for dynamic content
  - Automatic cache cleanup on updates
  - Offline support for core pages
- **Mobile Enhancements**:
  - Apple Web App capable
  - Status bar styling
  - Portrait orientation lock
  - Service worker registration in production

#### Dependencies Added
```json
{
  "dependencies": {
    "express-rate-limit": "^7.4.1",
    "helmet": "^8.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.1.0",
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.2.5"
  }
}
```

### Impact Assessment

**Security**: 🔴 High Impact
- XSS and injection attack prevention
- Rate limiting prevents API abuse and cost overruns
- Environment validation catches misconfigurations early

**Developer Experience**: 🟡 Medium Impact
- Cleaner code organization
- Testing infrastructure enables confidence in changes
- Modular structure simplifies debugging

**User Experience**: 🟢 Low-Medium Impact
- PWA enables "Add to Home Screen" on mobile
- Offline support for better reliability
- Faster loading with service worker caching

### Files Added/Modified

**New Files**:
- `server/middleware/rateLimiter.ts`
- `server/middleware/security.ts`
- `server/utils/constants.ts`
- `server/utils/validation.ts`
- `server/services/room.service.ts`
- `server/services/ai.service.ts`
- `server/services/teleprompter.service.ts`
- `public/manifest.json`
- `public/sw.js`
- `components/ServiceWorkerRegistration.tsx`
- `jest.config.js`
- `jest.setup.js`
- `__tests__/unit/server/utils/validation.test.ts`
- `__tests__/unit/server/middleware/rateLimiter.test.ts`

**Modified Files**:
- `server.ts` - Added rate limiting, security middleware, enhanced validation
- `package.json` - Added dependencies and test scripts
- `app/layout.tsx` - Added PWA meta tags and service worker registration

---

## 14. Critical Files Reference

| File | Lines | Purpose | Update Frequency |
|------|-------|---------|------------------|
| `/server.ts` | 1,275 | Backend core | High |
| `/app/globals.css` | 2,183 | Design system | Low |
| `/app/host/page.tsx` | ~400 | Host UI | Medium |
| `/app/join/page.tsx` | ~400 | Player UI | Medium |
| `/contexts/SocketContext.tsx` | 125 | Socket manager | Low |
| `/lib/types.ts` | 106 | Type definitions | Medium |
| `/lib/content.ts` | 20,991 | Game content | Low |
| `/lib/schema.ts` | 20 | Validation | Low |
| `/design-tokens.json` | 132 | Design tokens | Low |
| `/package.json` | 47 | Dependencies | Medium |

---

## Update Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-23 | 1.1 | Added security enhancements, rate limiting, testing infrastructure, PWA support, code organization | Claude |
| 2026-01-23 | 1.0 | Initial architecture documentation | Claude |

---

## Maintenance Notes

**When to Update This Document**:
- New features added
- Backend API changes
- New dependencies added
- Deployment configuration changes
- Critical bug fixes affecting architecture
- Performance optimizations
- Security updates

**Review Schedule**: Monthly or after major releases

---

## Quick Links

- [Claude API Docs](https://docs.anthropic.com)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Railway Docs](https://docs.railway.app)

---

**End of Architecture Documentation**
