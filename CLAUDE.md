# Plot Twists

Improv comedy game where players pick cards, AI generates a script, and they perform it live.

## Tech Stack

- **Frontend**: Next.js 16 (App Router, `'use client'`), React 19, TypeScript, Tailwind CSS
- **Backend**: Socket.IO server (TypeScript), runs alongside Next.js
- **AI**: OpenAI for script generation, image generation (movie posters)
- **Auth**: Firebase Auth (phone, anonymous)
- **DB**: Firestore (production) / JSON file (dev)
- **Payments**: Stripe (credit system)
- **Animations**: Framer Motion with centralized presets in `lib/animations.ts`

## Commands

```bash
npm run dev          # Start dev server (Next.js + Socket.IO)
npm run build        # Production build (checks TypeScript)
npm run start        # Start production server
npm run lint         # ESLint
```

## Project Structure

```
app/
  page.tsx                          # Landing page
  layout.tsx                        # Root layout
  host/
    page.tsx                        # Host orchestrator (~280 lines)
    components/
      HostLobby.tsx                 # QR, player list, game settings
      HostSelection.tsx             # Solo card picker + ensemble waiting
      HostLoading.tsx               # Script generation progress
      HostPerforming.tsx            # Teleprompter, controls, chaos
      HostVoting.tsx                # Voting status grid
      HostResults.tsx               # Winner, standings, share, actions
  join/
    page.tsx                        # Join orchestrator (~260 lines, Suspense-wrapped)
    components/
      JoinForm.tsx                  # Room code + nickname form (owns form state)
      JoinLobby.tsx                 # "You're In!" waiting view
      JoinSelection.tsx             # Card picker (spectator/player/submitted views)
      JoinLoading.tsx               # Loading progress + green room
      JoinPerforming.tsx            # Mobile teleprompter + spectator chat
      JoinVoting.tsx                # MVP vote buttons
      JoinResults.tsx               # Results + script actions
  explore/                          # Card pack browser
  profile/                          # Player profile + stats
  replay/[code]/                    # Shareable game replays

hooks/
  useHostSocket.ts                  # Host socket listeners + all host game state
  useJoinSocket.ts                  # Join socket listeners + all join game state
  useConfetti.ts                    # Confetti effects
  useTeleprompterSettings.ts        # Teleprompter display preferences
  useToast.tsx                      # Toast notification system
  useWakeLock.ts                    # Prevent screen sleep

components/                         # Shared UI components
contexts/
  AuthContext.tsx                    # Firebase auth provider
  SocketContext.tsx                  # Socket.IO connection provider

lib/
  types.ts                          # All shared TypeScript types (including socket events)
  animations.ts                     # Centralized MOTION presets + VARIANTS
  scriptUtils.ts                    # Script download/copy utilities
  teleprompterUtils.ts              # Mood indicators, visible line calculation
  analytics.ts                      # Event tracking
  logger.ts                         # Structured logging (replaces console.log)

server/
  services/                         # Business logic (script generation, voting, etc.)
  middleware/                        # Rate limiting, auth, error handling
  db/                               # Database adapters (Firestore/JSON)
  utils/                            # Constants, validation, serialization
```

## Architecture Patterns

### Game State Machine
`LOBBY -> SELECTION -> LOADING -> PERFORMING -> VOTING -> RESULTS`

Both host and join pages follow this state machine. The orchestrators (`host/page.tsx`, `join/page.tsx`) delegate socket event handling to custom hooks (`useHostSocket`, `useJoinSocket`) and render phase-specific components based on `gameState`.

### Socket Hooks
`useHostSocket` and `useJoinSocket` own all game state (gameState, players, script, etc.) and handle socket event subscriptions. They use `useRef` to avoid stale closures in socket listeners — the effect depends only on `[socket, isConnected]`.

### Styling
- CSS custom properties for colors: `var(--color-accent)`, `var(--color-text-primary)`, etc.
- Tailwind for layout/spacing; inline `style={{ color: 'var(--color-*)' }}` for theme colors
- Animation presets: `MOTION.spring`, `MOTION.gentle`, `MOTION.bouncy` from `lib/animations.ts`
- Page transitions: `VARIANTS.pageTransition` (blur + scale + opacity)

### Component Conventions
- Named exports, TypeScript interfaces for all props
- `'use client'` directive on all interactive components
- Dynamic imports (`next/dynamic`) for heavy client-only components (SmartCardSelector, AudienceReactionBar, PlotTwistVoting)
