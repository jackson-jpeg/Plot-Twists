# v4 Virality — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build three phases of viral growth features — Party Magnet (friction removal), Content Machine (auto-generated shareable assets), and Clip Factory foundations — turning every game into a growth engine.

**Architecture:** Leverages extensive existing infrastructure (guest play already works, push notifications wired, share codes + OG images exist, Apple Universal Links configured). New work focuses on: smart invite landing pages, push notification triggers, server-side shareable image generation, AI Director's Review post-game, and character card sharing.

**Tech Stack:** Next.js 16 App Router, Socket.IO, Firebase Admin (FCM), Anthropic Claude (Director's Review), Google Gemini (posters), Next.js `ImageResponse` (OG-style character cards), Capacitor (iOS deep links)

**Design Reference:** Paper artboards in Zippy Shell — see v4 artboards (YL-0 through YQ-0) for visual direction. Design tokens: cream `#FDFCFA`, near-black `#2A2722`, muted warm `#9B9590`, amber accent `#F59E42`. Fonts: Fredoka (display), DM Sans (UI).

---

## Phase 1: Party Magnet — Zero-Friction Growth

### Task 1: Smart Invite Link Landing Page

The current `/join?code=ABCD` goes straight to the JoinForm. We need a mini landing page that shows room info and lets guests jump in without an account — matching the Paper artboard `YP-0` (Guest Join).

**Files:**
- Create: `app/join/invite/[code]/page.tsx` — SSR landing page for invite links
- Create: `app/api/room-preview/[code]/route.ts` — REST API for room preview (needed for SSR, can't use socket)
- Create: `app/join/invite/[code]/opengraph-image.tsx` — Dynamic OG image for invite links
- Modify: `app/host/components/HostLobby.tsx` — Update invite URL to use new path
- Modify: `server/routes/index.ts` — Add `/join/invite/*` to Apple Universal Links AASA

**Step 1: Create REST API for room preview**

This endpoint lets the SSR landing page fetch room info without a socket connection.

```typescript
// app/api/room-preview/[code]/route.ts
import { NextResponse } from 'next/server'

// Room data is in-memory on the custom server, so we call it internally
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${wsUrl}/api/room-preview/${code}`, {
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Server unavailable' }, { status: 503 })
  }
}
```

**Step 2: Add room preview Express endpoint**

In `server/routes/api.ts`, add:

```typescript
router.get('/api/room-preview/:code', (req, res) => {
  const code = req.params.code?.toUpperCase()
  if (!code || !isValidRoomCode(code)) return res.status(400).json({ error: 'Invalid room code' })

  const room = roomService.getRoomFromCache(code)
  if (!room) return res.status(404).json({ error: 'Room not found' })

  const activePlayers = [...room.players.values()].filter(p => !p.isSpectator)
  res.json({
    gameMode: room.gameMode,
    playerCount: activePlayers.length,
    maxPlayers: room.maxPlayers,
    hostName: room.host.nickname,
    isMature: room.isMature,
    gameState: room.gameState,
    players: activePlayers.slice(0, 6).map(p => ({ nickname: p.nickname })),
  })
})
```

**Step 3: Create invite landing page**

```typescript
// app/join/invite/[code]/page.tsx
// Client component that fetches room preview and renders the Guest Join design
// Shows: Plot Twists branding, "You're invited", host name, room card with player avatars,
// nickname input, "Join the Show" CTA, "No account needed" reassurance
// On submit: redirects to /join?code=XXXX&nickname=NAME (JoinForm auto-joins)
```

Follow the Paper artboard `YP-0` design exactly:
- Left-aligned "You're invited" at 44px Fredoka Bold
- "{hostName} wants you to join the show" subtitle
- Room card showing code, player count, game mode, player avatars
- Single nickname input + amber "Join the Show" button
- "No account needed — jump straight in" footer text
- Post-game nudge hint: "Sign up to keep your XP"

**Step 4: Create dynamic OG image for invite links**

```typescript
// app/join/invite/[code]/opengraph-image.tsx
// Uses ImageResponse to generate "Join [Host]'s game on Plot Twists" preview
// Shows room code, player count, game mode
// 1200x630 with theater masks branding
```

**Step 5: Update HostLobby invite URL**

In `app/host/components/HostLobby.tsx`, change the share URL from:
```
${baseUrl}/join?code=${roomCode}
```
to:
```
${baseUrl}/join/invite/${roomCode}
```

**Step 6: Update Apple Universal Links**

In `server/routes/index.ts`, add `/join/invite/*` to the AASA paths array.

**Step 7: Commit**

```bash
git add app/join/invite/ app/api/room-preview/ server/routes/api.ts app/host/components/HostLobby.tsx server/routes/index.ts
git commit -m "feat: smart invite landing page with room preview and OG image"
```

---

### Task 2: Wire Push Notification Triggers

Push infrastructure exists (`server/services/push.service.ts`, `lib/pushNotifications.ts`, `public/sw.js`) but only fires on state changes to the host. We need triggers for the four v4 scenarios.

**Files:**
- Modify: `server.ts` — Add push triggers at game start, invite players
- Modify: `server/services/push.service.ts` — Add `sendPushToPlayAgainList` helper
- Create: `server/services/notification.service.ts` — Centralized notification trigger logic

**Step 1: Create notification service**

```typescript
// server/services/notification.service.ts
import { sendPushToUser, sendPushToRoom } from './push.service'
import { logger } from '../../lib/logger'
import * as roomService from './room.service'
import type { Room } from '../../lib/types'

/** "Game starting!" — sent to all players in lobby when host starts */
export async function notifyGameStarting(room: Room): Promise<void> {
  const playerUids = [...room.players.values()]
    .filter(p => p.uid && !p.isHost)
    .map(p => p.uid!)

  if (playerUids.length === 0) return

  await sendPushToRoom(room.code, '🎬 Showtime!', `The game in room ${room.code} is starting!`, playerUids)
}

/** "Jackson started a game" — sent to play-again contacts */
export async function notifyPlayAgainList(hostUid: string, hostName: string, roomCode: string): Promise<void> {
  // Look up recent co-players from game history (last 30 days)
  // This uses Firestore to find UIDs of people who played with this host recently
  try {
    const db = await getDb()
    if (!db) return

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const recentGames = await db.getRecentCoPlayers(hostUid, thirtyDaysAgo, 20)

    for (const uid of recentGames) {
      if (uid === hostUid) continue
      await sendPushToUser(uid, `${hostName} started a game!`, `Join room ${roomCode} for another round`, { roomCode })
    }
  } catch (error) {
    logger.error('[Notifications] notifyPlayAgainList failed:', error)
  }
}
```

**Step 2: Wire triggers into server.ts**

In the `start_game` handler (~line 482), after emitting `game_state_change`:
```typescript
// Push: notify players in lobby
notifyGameStarting(room).catch(() => {})
```

In the `create_room` handler, add opt-in play-again notification:
```typescript
// Push: notify play-again list if host opts in
if (settings.notifyFriends && room.hostUid) {
  notifyPlayAgainList(room.hostUid, room.host.nickname, room.code).catch(() => {})
}
```

**Step 3: Commit**

```bash
git add server/services/notification.service.ts server.ts
git commit -m "feat: push notification triggers for game start and play-again list"
```

---

### Task 3: Post-Game Guest Signup Nudge

Guest players (no auth) need a post-game prompt to convert. This goes in JoinResults.

**Files:**
- Modify: `app/join/components/JoinResults.tsx` — Add signup nudge for guests
- Modify: `hooks/useJoinSocket.ts` — Track if user is a guest (no auth token)

**Step 1: Add guest detection to useJoinSocket**

Check if `socket.auth` has a token. If not, expose `isGuest: true` from the hook.

**Step 2: Add signup nudge to JoinResults**

After the results/standings section, if `isGuest`:

```tsx
{isGuest && (
  <motion.div
    className="card mt-6 text-center"
    style={{ background: 'var(--color-highlight)', border: '2px dashed var(--color-accent)' }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.5 }}
  >
    <p className="font-display text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
      You earned {totalXP} XP!
    </p>
    <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
      Sign up to keep your stats, XP, and unlock achievements
    </p>
    <SignInButton mode="redirect">
      <button className="btn btn-primary">Create Account</button>
    </SignInButton>
  </motion.div>
)}
```

**Step 3: Commit**

```bash
git add app/join/components/JoinResults.tsx hooks/useJoinSocket.ts
git commit -m "feat: post-game signup nudge for guest players"
```

---

## Phase 2: Content Machine — Auto-Generated Shareable Assets

### Task 4: "My Character" Card — Server-Side Image Generation

After every game, each player gets a personalized shareable image card. Uses Next.js `ImageResponse` (same pattern as existing `app/replay/[code]/opengraph-image.tsx`).

**Files:**
- Create: `app/api/character-card/[gameId]/[playerId]/route.tsx` — ImageResponse endpoint
- Modify: `app/join/components/JoinResults.tsx` — Add "Share My Character" button
- Modify: `app/host/components/HostResults.tsx` — Add "Share My Character" button

**Step 1: Create character card image endpoint**

```typescript
// app/api/character-card/[gameId]/[playerId]/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ gameId: string; playerId: string }> }
) {
  const { gameId, playerId } = await params

  // Fetch game data from internal API
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
  const res = await fetch(`${wsUrl}/api/game-player/${gameId}/${playerId}`)
  if (!res.ok) return new Response('Not found', { status: 404 })

  const data = await res.json()
  // { playerName, character, bestLine, votesReceived, isWinner, title, posterUrl }

  // Render 1080x1350 (Instagram) or 1080x1920 (Story) based on ?format param
  const format = new URL(req.url).searchParams.get('format') || 'feed'
  const width = 1080
  const height = format === 'story' ? 1920 : 1350

  return new ImageResponse(
    // JSX matching Paper artboard YL-0 design:
    // - Dark gradient background (#2A2722 to #1A1816)
    // - Player name at 48px Fredoka Bold
    // - Character name + "as" prefix
    // - Best line in italics with amber left border
    // - Stats row: votes, reactions
    // - Film strip accent at bottom
    // - "Made with Plot Twists" watermark + QR
    (
      <div style={{ /* ... character card layout */ }}>
        {/* Implementation follows YL-0 artboard design */}
      </div>
    ),
    { width, height }
  )
}
```

**Step 2: Add Express endpoint for player game data**

In `server/routes/api.ts`:

```typescript
router.get('/api/game-player/:gameId/:playerId', async (req, res) => {
  const { gameId, playerId } = req.params
  const game = await gameHistoryService.getGame(gameId)
  if (!game) return res.status(404).json({ error: 'Game not found' })

  const player = game.players.find(p => p.id === playerId)
  if (!player) return res.status(404).json({ error: 'Player not found' })

  // Find the player's best line (most reaction-adjacent)
  const bestLine = game.script?.lines
    ?.filter(l => l.character === player.character)
    ?.sort((a, b) => (b.reactionCount || 0) - (a.reactionCount || 0))[0]

  res.json({
    playerName: player.nickname,
    character: player.character,
    bestLine: bestLine?.text || '',
    votesReceived: player.votesReceived,
    isWinner: player.isWinner,
    title: game.title,
    posterUrl: game.script?.imageUrl || null,
  })
})
```

**Step 3: Add "Share My Character" to results pages**

In both `HostResults.tsx` and `JoinResults.tsx`, add a button after the share scene button:

```tsx
<motion.button
  onClick={() => shareCharacterCard(gameId, myPlayerId)}
  className="btn btn-large"
  style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
>
  Share My Character
</motion.button>
```

The `shareCharacterCard` function:
1. Fetches the image from `/api/character-card/{gameId}/{playerId}?format=story`
2. Uses `navigator.share({ files: [blob] })` on native, or opens in new tab on web

**Step 4: Commit**

```bash
git add app/api/character-card/ server/routes/api.ts app/join/components/JoinResults.tsx app/host/components/HostResults.tsx
git commit -m "feat: shareable character cards with server-side image generation"
```

---

### Task 5: AI Director's Review

One extra Claude call post-game generates a tongue-in-cheek "movie review." Cheap, funny, highly shareable.

**Files:**
- Create: `server/services/directorsReview.service.ts` — Claude call for review generation
- Modify: `server.ts` — Trigger review generation after voting completes (async, non-blocking)
- Modify: `lib/types.ts` — Add `directorsReview` field to Room and SavedGame
- Modify: `app/host/components/HostResults.tsx` — Display review card
- Modify: `app/join/components/JoinResults.tsx` — Display review card
- Create: `components/DirectorsReview.tsx` — Shared review card component

**Step 1: Create directors review service**

```typescript
// server/services/directorsReview.service.ts
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '../../lib/logger'
import type { Script, SavedGamePlayer } from '../../lib/types'

export interface DirectorsReview {
  rating: number // 1-5 stars (always generous — it's comedy)
  headline: string // e.g. "A Masterclass in Burrito Surgery"
  review: string // 3-4 sentences, tongue-in-cheek film critic style
  bestMoment: string // One highlight moment
}

export async function generateDirectorsReview(
  title: string,
  synopsis: string,
  players: SavedGamePlayer[],
  reactionCount: number,
  plotTwists: string[],
): Promise<DirectorsReview | null> {
  try {
    const anthropic = new Anthropic()
    const cast = players.map(p => `${p.nickname} as ${p.character}`).join(', ')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a pretentious film critic writing a tongue-in-cheek review of a live comedy performance called "${title}".

Synopsis: ${synopsis}
Cast: ${cast}
Audience reactions: ${reactionCount}
Plot twists: ${plotTwists.join(', ') || 'none'}

Write a JSON response:
{
  "rating": <number 3-5, always generous>,
  "headline": "<witty one-line review headline>",
  "review": "<3-4 sentences of absurd film-critic prose>",
  "bestMoment": "<one specific funny highlight>"
}

Be funny, specific to THIS performance, and write like a real film critic reviewing something absurd with complete seriousness.`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return JSON.parse(text) as DirectorsReview
  } catch (error) {
    logger.error('[DirectorsReview] Generation failed:', error)
    return null
  }
}
```

**Step 2: Add type definitions**

In `lib/types.ts`, add `DirectorsReview` interface and add `directorsReview?: DirectorsReview` to:
- `Room` type (runtime)
- `SavedGame` type (persistence)

**Step 3: Trigger after voting completes**

In `server.ts`, after `calculateResults` is called and `room.gameState = 'RESULTS'`:

```typescript
// Fire-and-forget director's review generation
generateDirectorsReview(
  room.script?.title || '',
  room.script?.synopsis || '',
  [...room.players.values()].map(p => ({
    id: p.id, nickname: p.nickname, character: p.character || '',
    isHost: p.isHost, votesReceived: p.votesReceived || 0,
    isWinner: p.id === results.winner?.playerId,
  })),
  room.audienceInteraction?.reactionCounts
    ? Object.values(room.audienceInteraction.reactionCounts).reduce((a, b) => a + b, 0)
    : 0,
  room.audienceInteraction?.plotTwistHistory || [],
).then(review => {
  if (review) {
    room.directorsReview = review
    io.to(room.code).emit('directors_review', review)
  }
}).catch(() => {})
```

**Step 4: Add socket event types**

In `lib/types.ts`, add to `ServerToClientEvents`:
```typescript
directors_review: (review: DirectorsReview) => void
```

**Step 5: Create shared DirectorsReview component**

```typescript
// components/DirectorsReview.tsx
// Matches Paper artboard YO-0 design:
// - Star rating row (filled/empty stars as SVG)
// - Review headline in Fredoka Bold
// - Review body in DM Sans italic
// - "Best moment" callout with amber accent
// - Share button
```

**Step 6: Add to both results pages**

In `HostResults.tsx` and `JoinResults.tsx`, listen for `directors_review` socket event and render `<DirectorsReview />` when available. Show it with a staggered animation after the main results.

**Step 7: Commit**

```bash
git add server/services/directorsReview.service.ts components/DirectorsReview.tsx lib/types.ts server.ts app/host/components/HostResults.tsx app/join/components/JoinResults.tsx
git commit -m "feat: AI Director's Review — tongue-in-cheek post-game film review"
```

---

### Task 6: Poster Stories — Social-Formatted Poster Sharing

Repackage the existing AI movie poster for social sharing in Story (9:16) and Feed (4:5) formats.

**Files:**
- Create: `app/api/poster-story/[gameId]/route.tsx` — ImageResponse for story format
- Modify: `app/host/components/HostResults.tsx` — Add poster share options
- Modify: `app/join/components/JoinResults.tsx` — Add poster share options

**Step 1: Create poster story endpoint**

```typescript
// app/api/poster-story/[gameId]/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Generates social-formatted poster:
// Story (9:16, 1080x1920): poster centered, cast names below, "plottwists.live" link
// Feed (4:5, 1080x1350): poster + synopsis + cast list
// Uses game data from /api/game/:shareCode
```

**Step 2: Add share poster buttons to results**

Add a dropdown or button group next to existing poster display:
- "Share to Story" → fetches story format, triggers native share
- "Share to Feed" → fetches feed format, triggers native share

**Step 3: Commit**

```bash
git add app/api/poster-story/ app/host/components/HostResults.tsx app/join/components/JoinResults.tsx
git commit -m "feat: social-formatted poster sharing (story + feed)"
```

---

### Task 7: Enhanced Room Preview for Invite Links

The `get_room_preview` socket event only returns basic data. For the invite landing page, we need host name and player list.

**Files:**
- Modify: `server.ts` — Enhance `get_room_preview` response
- Modify: `lib/types.ts` — Update preview type
- Modify: `app/join/components/JoinForm.tsx` — Show enhanced preview

**Step 1: Enhance room preview response**

Add to the existing `get_room_preview` handler:
```typescript
hostName: room.host.nickname,
players: activePlayers.slice(0, 6).map(p => ({ nickname: p.nickname })),
```

**Step 2: Update types and JoinForm**

Update the preview type in `lib/types.ts` and show player names/avatars in the JoinForm room preview card.

**Step 3: Commit**

```bash
git add server.ts lib/types.ts app/join/components/JoinForm.tsx
git commit -m "feat: enhanced room preview with host name and player list"
```

---

## Phase 3: Clip Factory — Foundations Only

Phase 3 is complex (audio recording, FFmpeg, clip detection). For v4, we lay the foundation only.

### Task 8: Reaction Spike Tracking (Clip Detection Prep)

Track audience reaction timestamps server-side so we can later identify "clip-worthy moments" (3+ reactions within 5 seconds).

**Files:**
- Modify: `server/services/audience.service.ts` — Track reaction timestamps per line
- Modify: `lib/types.ts` — Add `reactionTimeline` to AudienceInteractionState

**Step 1: Add reaction timeline tracking**

In `audience.service.ts`, in the `recordReaction` function, also push to a timeline array:
```typescript
room.audienceInteraction.reactionTimeline.push({
  type: reactionType,
  lineIndex: room.currentLineIndex,
  timestamp: Date.now(),
})
```

**Step 2: Add clip-worthy moment detection function**

```typescript
export function findClipMoments(timeline: ReactionTimelineEntry[]): ClipMoment[] {
  // Sliding 5-second window
  // 3+ reactions in window = clip-worthy
  // Return: { startTime, endTime, lineIndex, reactionCount }
}
```

**Step 3: Persist timeline with saved game**

When saving game history, include `reactionTimeline` so clip detection can happen later.

**Step 4: Commit**

```bash
git add server/services/audience.service.ts lib/types.ts
git commit -m "feat: reaction timeline tracking for future clip detection"
```

---

## Verification

After all tasks:

1. `npm run build` — no TypeScript errors
2. `npm run test` — all existing tests pass
3. Manual test: create room, share invite link, open in incognito → should see landing page
4. Manual test: complete a game → character card + director's review should appear in results
5. Manual test: share character card → image renders correctly
6. Check mobile: all new UI matches Paper artboards on 375px viewport
7. Verify dark mode works with all new components

---

## Task Dependencies

```
Task 1 (Invite Landing) ← standalone, start here
Task 2 (Push Triggers) ← standalone
Task 3 (Guest Nudge) ← standalone
Task 4 (Character Cards) ← needs Task 7 for game-player API
Task 5 (Director's Review) ← standalone
Task 6 (Poster Stories) ← standalone
Task 7 (Enhanced Preview) ← standalone, but Task 1 benefits from it
Task 8 (Reaction Timeline) ← standalone
```

Recommended order: 7 → 1 → 2 → 3 → 5 → 4 → 6 → 8
