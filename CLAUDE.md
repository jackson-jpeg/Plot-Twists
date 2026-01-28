# CLAUDE.md - Plot Twists Codebase Guide

## Project Overview

Plot Twists is an AI-powered Jackbox-style party game where players create and perform comedy scripts. The AI (Claude) generates scripts based on player-selected characters, settings, and circumstances.

**Core Gameplay:**
1. Host creates a room, players join via room code or QR
2. Players select Character, Setting, and Circumstance cards
3. Claude generates a comedic script based on selections
4. Players perform the script using phones as teleprompters
5. Audience votes for best performance

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16+ (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4.x |
| Backend | Custom Node.js server with Express |
| Real-time | Socket.io (polling in production, WebSocket in dev) |
| AI | Anthropic Claude API (claude-sonnet-4-5-20250929) |
| Validation | Zod for runtime schema validation |
| Auth | Firebase Authentication (optional) |
| Animation | Framer Motion |
| Testing | Jest + Testing Library |

## Project Structure

```
Plot-Twists/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── host/page.tsx      # Host game screen
│   ├── join/page.tsx      # Player join screen
│   ├── profile/page.tsx   # Player profile
│   ├── replay/[code]/     # Game replay viewer
│   ├── layout.tsx         # Root layout with providers
│   └── globals.css        # Global Tailwind styles
│
├── components/            # React components
│   ├── CardCarousel.tsx   # Card selection UI
│   ├── Modal.tsx          # Reusable modal
│   ├── Toast.tsx          # Toast notifications
│   ├── AudienceReactionBar.tsx
│   ├── PlotTwistVoting.tsx
│   └── ...
│
├── contexts/              # React Context providers
│   ├── SocketContext.tsx  # Socket.io connection management
│   └── AuthContext.tsx    # Firebase auth state
│
├── lib/                   # Shared utilities
│   ├── types.ts           # TypeScript interfaces for entire app
│   ├── schema.ts          # Zod validation schemas
│   ├── content.ts         # Game content (characters, settings)
│   ├── firebase.ts        # Firebase initialization
│   └── scriptUtils.ts     # Script parsing utilities
│
├── server/                # Backend services
│   ├── middleware/
│   │   ├── security.ts    # Helmet, CORS config
│   │   └── rateLimiter.ts # Socket.io rate limiting
│   ├── services/
│   │   ├── audience.service.ts      # Reactions, plot twists
│   │   ├── audio.service.ts         # Sound effects, ambience
│   │   ├── cardpack.service.ts      # Custom card packs
│   │   ├── gameHistory.service.ts   # Game persistence
│   │   ├── playerStats.service.ts   # Stats & achievements
│   │   └── scriptCustomization.service.ts
│   └── utils/
│       ├── constants.ts   # Server constants
│       └── validation.ts  # Input sanitization
│
├── __tests__/             # Jest test files
│   └── unit/
│       └── server/
│
├── server.ts              # Main server entry point
├── package.json
├── tsconfig.json
├── next.config.js
├── jest.config.js
└── .env.example
```

## Key Files

| File | Purpose |
|------|---------|
| `server.ts` | Main server: Socket.io events, room management, AI script generation |
| `lib/types.ts` | All TypeScript interfaces (Player, Room, Script, GameState, etc.) |
| `lib/schema.ts` | Zod schemas for runtime validation of AI responses |
| `contexts/SocketContext.tsx` | Singleton Socket.io client management |
| `app/host/page.tsx` | Host view with teleprompter and game controls |
| `app/join/page.tsx` | Player view with card selection and performance |

## Development Commands

```bash
# Development (runs custom server with hot reload)
npm run dev

# Production build
npm run build

# Production start
npm start

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit
```

## Environment Variables

Required:
```
ANTHROPIC_API_KEY=sk-ant-...   # Claude API key
```

Optional:
```
PORT=3000                       # Server port (default: 3000)
NODE_ENV=development            # development | production
NEXT_PUBLIC_WS_URL=            # WebSocket URL for production
```

## Code Conventions

### TypeScript

- Use strict mode (enforced in tsconfig.json)
- Define all types in `lib/types.ts`
- Use Zod for runtime validation of external data
- Prefer interfaces over type aliases for object shapes

### React Components

- Use functional components with hooks
- Use `'use client'` directive for client components
- Colocate component-specific types at the top of the file
- Use the `@/` path alias for imports

### Socket.io Events

Events are strongly typed via `ServerToClientEvents` and `ClientToServerEvents` in `lib/types.ts`.

Server-to-Client events:
- `room_created`, `player_joined`, `player_left`
- `game_state_change`, `players_update`
- `script_ready`, `sync_teleprompter`
- `audience_reaction_received`, `plot_twist_started`

Client-to-Server events:
- `create_room`, `join_room`
- `submit_cards`, `start_game`
- `submit_vote`, `advance_script_line`
- `send_audience_reaction`, `vote_plot_twist`

### Game States

```typescript
type GameState =
  | 'LOBBY'      // Waiting for players
  | 'SELECTION'  // Players choosing cards
  | 'LOADING'    // AI generating script
  | 'PERFORMING' // Reading script
  | 'VOTING'     // Voting for MVP
  | 'RESULTS'    // Showing winner
```

### Game Modes

```typescript
type GameMode =
  | 'SOLO'         // Single player with AI co-star
  | 'HEAD_TO_HEAD' // 2 players competing
  | 'ENSEMBLE'     // 3-6 players collaborating
```

## AI Script Generation

The AI script generation happens in `server.ts` in the `generateScript()` function. Key points:

1. Uses `claude-sonnet-4-5-20250929` model with temperature 1.0 for creativity
2. System prompt includes comedy writing guidelines based on rating (Family Friendly vs 18+)
3. Scripts are validated against `ScriptSchema` (Zod) before use
4. Supports sequel generation that references previous scripts

### Script Structure

```typescript
interface Script {
  title: string
  synopsis: string
  lines: Array<{
    speaker: string
    text: string
    mood: 'angry' | 'happy' | 'confused' | 'whispering' | 'neutral'
  }>
}
```

## Real-time Communication

### Socket.io Configuration

- Development: polling + websocket transports
- Production: polling-only (Railway WebSocket issues)
- Singleton pattern in `SocketContext` to prevent multiple connections
- 3-second grace period on disconnect before removing players

### Room Management

- In-memory Map storage (`rooms: Map<string, Room>`)
- 4-character room codes (A-Z, 2-9, excluding confusing chars)
- Auto-cleanup of inactive rooms after 1 hour
- Rate limiting on room creation, joins, and script generation

## Security Considerations

1. **Input Sanitization**: All user input goes through `sanitizeInput()` in `server/utils/validation.ts`
2. **Rate Limiting**: `SocketRateLimiter` class in `server/middleware/rateLimiter.ts`
3. **CORS**: Configured in `server.ts` with allowed origins
4. **Helmet**: Security headers configured in `server/middleware/security.ts`
5. **Environment Validation**: `validateEnvironment()` checks for required env vars

## Testing

Tests use Jest with ts-jest preset. Configuration in `jest.config.js`:

```javascript
// Run tests
npm test

// Coverage thresholds
branches: 5%
functions: 5%
lines: 5%
statements: 5%
```

Test files are in `__tests__/unit/` mirroring source structure.

## Common Tasks

### Adding a New Socket Event

1. Add types to `lib/types.ts` in `ServerToClientEvents` or `ClientToServerEvents`
2. Implement handler in `server.ts` inside `io.on('connection', ...)`
3. Add rate limiting if needed using `SocketRateLimiter`
4. Emit/listen in React components via `useSocket()` hook

### Adding New Content (Characters, Settings, Circumstances)

Edit `lib/content.ts`:
```typescript
export const CONTENT = {
  characters: { safe: [...], mature: [...] },
  settings: { safe: [...], mature: [...] },
  circumstances: { safe: [...], mature: [...] }
}
```

### Adding a New Game Feature

1. Add types to `lib/types.ts`
2. Add service in `server/services/`
3. Add socket events in `server.ts`
4. Create React components in `components/`
5. Wire up in page components (`app/host/page.tsx`, `app/join/page.tsx`)

### Modifying AI Script Generation

Edit `generateScript()` in `server.ts`. Key sections:
- `comedyGuidelines`: Rating-specific writing instructions
- `modeInstructions`: Game mode-specific scene dynamics
- `userMessage`: The actual prompt sent to Claude

## Deployment

### Railway (Recommended)

1. Connect GitHub repository
2. Set environment variables (ANTHROPIC_API_KEY, etc.)
3. Railway auto-detects Node.js and builds

Railway requires polling-only transport for Socket.io due to WebSocket upgrade issues.

### Docker

Set `DOCKER=true` environment variable to enable standalone output mode.

## Troubleshooting

### Socket Connection Issues
- Check `NEXT_PUBLIC_WS_URL` matches your backend URL
- Verify CORS origins in `server.ts`
- In production, ensure polling-only transport

### AI Generation Failures
- Check `ANTHROPIC_API_KEY` is valid
- Monitor rate limits (20 scripts per 10 minutes default)
- Check Zod validation errors in console

### Players Can't Join
- Verify room code (4 chars, case-insensitive)
- Check game hasn't already started (LOBBY state required)
- Verify player limits by game mode (Solo: 1, H2H: 2, Ensemble: 6)
