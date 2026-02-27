# v4 Virality Design — Plot Twists

## Problem

Plot Twists generates infinite unique comedy performances, but the magic moment — a real human acting out absurd AI-written comedy — dies in the room. Sharing is manual, post-game, opt-in. The viral loop is broken.

## Insight

The performance is the product. The script is a prop, the poster is a souvenir, but the human acting out absurd comedy is what makes someone pull out their phone. We need to capture that moment and make it escape the room.

## Strategy

Three phases, ordered by effort-to-impact ratio. Each phase amplifies the next.

---

## Phase 1: Party Magnet — Zero-Friction Growth

Goal: every game that happens naturally pulls in more players.

### 1.1 Guest Play

No account required to join a game. Just a nickname.

- Server accepts `join_room` without auth token for player role
- Guest players get a temporary session ID (UUID)
- Guest state is ephemeral — no stats, no progression
- Post-game nudge: "You earned 150 XP! Sign up to keep it."
- If they sign up, retroactively link their game history via session ID

Flow: `Friend sends link → Tap → Enter nickname → Playing`

### 1.2 Smart Invite Links

Host taps "Invite" → gets `plottwists.live/join?room=XK7P` that:

- Opens the app directly if installed (Universal Links / Capacitor deep links)
- Opens the web app with room code pre-filled if not
- Shows a mini landing page: game mode, player count, host name
- QR code in Host Lobby encodes this full URL (not just room code)

### 1.3 Push Notifications (Wire Up Existing Infrastructure)

Triggers to implement:

- "Game starting!" — players in lobby when host starts
- "Jackson started a game" — people you've played with (opt-in play-again list)
- "Your weekly credits refreshed" — lapsed user re-engagement
- "New card pack available" — content-driven re-engagement

### 1.4 Live Activity / Dynamic Island (iOS)

When hosting, show persistent Live Activity:

- Room code + QR
- Player count: "3/6 joined"
- Game state: "Waiting for players..."
- Host can lock phone and hold it up for scanning

---

## Phase 2: Content Machine — Auto-Generated Shareable Assets

Goal: every game produces social-native content without user effort.

### 2.1 "My Character" Cards

After every game, each player gets a personalized shareable image:

- Player name, character, best line, vote count
- Styled as 1080x1350 (Instagram) or 1080x1920 (Story)
- Uses movie poster color palette as background
- Watermarked with Plot Twists branding + link
- Generated server-side via `ImageResponse` (next/og pattern)

### 2.2 Poster Stories

Repackage the AI movie poster for social:

- Story format (9:16): poster centered, cast below, replay link
- Feed format (4:5): poster + synopsis + cast
- Auto-generated after every game

### 2.3 AI Director's Review

One extra Claude call post-game:

- Reads script + audience reaction data
- Generates tongue-in-cheek "movie review" of the performance
- 3-4 sentence summary, shareable as text or image card
- Cheap (small Claude call), funny, highly shareable

### 2.4 Weekly Comedy Digest

Push + in-app card every Monday:

- Games played, MVPs, reactions received
- Best line of the week
- Funniest character
- Shareable as image card (Spotify Wrapped pattern)

---

## Phase 3: Clip Factory — Capture the Magic Moment

Goal: the funniest moments escape as short-form video clips.

### 3.1 Audio Recording

- Host device records ambient audio during performance
- Recording starts/stops automatically with performance phase
- Stored locally, uploaded to Firebase Storage on share
- Clear opt-in, recording indicator, delete capability

### 3.2 AI Clip Detection

- Cross-reference audio timeline with audience reaction spikes
- 3+ reactions within 5 seconds = clip-worthy moment
- Auto-trim to best 15-30 second segment

### 3.3 Clip Packaging

Raw audio → shareable video:

- Visual track: dialogue lines scrolling teleprompter-style, synced to audio
- Movie poster as title card
- 9:16 vertical, 15-30 seconds (TikTok/Reels/Shorts optimized)
- "Made with Plot Twists" watermark + download link
- Server-side generation via FFmpeg

### 3.4 Clip Gallery

Public feed of best clips:

- Opt-in public sharing
- Upvote/reaction system
- Trending algorithm (reactions + recency)
- In-app Explore tab + web at plottwists.live/clips
- Each clip links to "Play a game like this" → Quick Play

### 3.5 Streamer Mode

- OBS-friendly 16:9 host layout
- Viewer join as spectators via chat link
- Floating reaction overlay on stream
- "Join next round" spectator queue

---

## Viral Flywheel

```
Phase 1: More people in each game (friction removal)
    ↓
Phase 2: Every game produces shareable content (automatic)
    ↓
Phase 3: Best moments escape as clips (capture the magic)
    ↓
New users discover via social content
    ↓
Guest play → zero friction → playing in seconds
    ↓
They have fun → host their own game → cycle repeats
```

## Constraints

- No budget constraints — growth over cost efficiency
- Solo dev — features must be maintainable
- Capacitor iOS + web — all features must work on both
