# Full UX/UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every screen in the app to use a physical design language — clapperboards, paper scripts, cue cards, tickets, ballots, film strips — replacing the current flat beige/dark UI.

**Architecture:** Add new design tokens (colors, fonts) to the global CSS, then restyle each screen's JSX and inline styles. No structural/logic changes — only visual treatment. All socket events, state management, and game logic stay untouched.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Framer Motion, CSS custom properties, Google Fonts (Instrument Serif, Space Mono — new additions)

**Spec:** `docs/superpowers/specs/2026-03-14-full-redesign-design.md`

---

## File Map

### New Files
- `lib/design.ts` — shared design constants (physical metaphor colors, category colors, reusable CSS class strings)

### Modified Files (visual-only changes)
- `app/layout.tsx` — add Instrument Serif + Space Mono fonts
- `app/globals.css` — add new CSS custom properties for the physical design system
- `components/LandingPage.tsx` — marquee design
- `app/join/components/JoinForm.tsx` — ticket design
- `app/host/components/HostLobby.tsx` — clapperboard design
- `app/join/components/JoinLobby.tsx` — waiting room restyle
- `components/CardPicker.tsx` — casting table design
- `app/host/components/HostLoading.tsx` — typewriter design
- `app/join/components/JoinLoading.tsx` — typewriter design (player perspective)
- `app/host/components/HostPerforming.tsx` — script-on-desk design
- `app/join/components/JoinPerforming.tsx` — cue card design
- `components/MobileTeleprompter.tsx` — cue card restyle
- `app/host/components/HostVoting.tsx` — ballot host view
- `app/join/components/JoinVoting.tsx` — ballot player view
- `app/host/components/HostResults.tsx` — premiere design
- `app/join/components/JoinResults.tsx` — premiere player view
- `app/explore/page.tsx` — script library design
- `components/TopBar.tsx` — restyle to match new system
- `app/host/components/HostSelection.tsx` — casting table (host solo mode)
- `app/join/components/JoinSelection.tsx` — casting table (player)

---

## Chunk 1: Design System Foundation

### Task 1: Add fonts and CSS custom properties

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `lib/design.ts`

- [ ] **Step 1: Add Instrument Serif and Space Mono to layout.tsx**

In `app/layout.tsx`, add two new font imports from `next/font/google`:

```tsx
import { Instrument_Serif } from 'next/font/google'
import { Space_Mono } from 'next/font/google'

const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' })
```

Add their variables to the `<html>` className alongside existing font variables.

- [ ] **Step 2: Add physical design tokens to globals.css**

Add new CSS custom properties to the `:root` block in `app/globals.css`:

```css
/* Physical design system */
--color-void: #08070b;
--color-ink: #0f0e14;
--color-paper: #f4f0e8;
--color-cream: #faf7f0;
--color-paper-dark: #e8e2d4;
--color-stage-red: #c23b22;
--color-stage-gold: #c9a24d;
--color-stage-blue: #3a5a8c;
--color-category-character: var(--color-stage-red);
--color-category-setting: var(--color-stage-blue);
--color-category-wild: var(--color-stage-gold);

/* Font families for physical metaphors */
--font-serif: var(--font-instrument-serif), Georgia, serif;
--font-script: var(--font-courier-prime), 'Courier New', monospace;
--font-code: var(--font-space-mono), monospace;
```

- [ ] **Step 3: Create lib/design.ts with shared constants**

```tsx
// Physical design language constants
export const CATEGORY_COLORS = {
  character: { color: 'var(--color-stage-red)', bg: 'rgba(194,59,34,0.12)' },
  setting: { color: 'var(--color-stage-blue)', bg: 'rgba(58,90,140,0.12)' },
  circumstance: { color: 'var(--color-stage-gold)', bg: 'rgba(201,162,77,0.12)' },
} as const

export const PAPER_TEXTURE = "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E\")"
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```
git add app/layout.tsx app/globals.css lib/design.ts
git commit -m "Add physical design system: fonts, tokens, constants"
```

---

## Chunk 2: Landing Page — The Marquee

### Task 2: Restyle landing page as movie theater marquee

**Files:**
- Modify: `components/LandingPage.tsx`

- [ ] **Step 1: Read the full file**

Read `components/LandingPage.tsx` (432 lines). Understand the existing structure: hero section, scene ticker, poster showcase (HomepagePosterShowcase component), "How it works" section.

- [ ] **Step 2: Restyle the hero section as a marquee**

Replace the current hero section styling:
- Dark background (`var(--color-void)`) instead of the light bg
- Chase light animation at top: CSS `repeating-linear-gradient` with animation
- "Plot Twists" in `font-serif` (Instrument Serif), large
- "Now showing" subtitle in italic
- Remove the theater masks SVG icon
- Remove the scene ticker animation
- Make the poster showcase the dominant element — it should take most of the screen

- [ ] **Step 3: Restyle the CTA as a ticket booth**

Replace the "Get Started" button area:
- Dark container with dashed top border (like a ticket tear line)
- Button text: "Get Tickets" (not "Get Started")
- Below: "Free · No signup · Any device" in muted text

- [ ] **Step 4: Replace "How it works" or remove it**

The poster showcase component (`HomepagePosterShowcase`) already does the selling. The "How it works" section we redesigned earlier should be removed or radically simplified — the marquee design doesn't need an explainer. If keeping it, it should be minimal: 3 short lines of text, no cards.

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit`

```
git commit -m "Restyle landing page as movie theater marquee"
```

---

## Chunk 3: Join Page — The Ticket

### Task 3: Restyle join form as admission ticket

**Files:**
- Modify: `app/join/components/JoinForm.tsx`

- [ ] **Step 1: Read the full file**

Read `app/join/components/JoinForm.tsx` (740 lines). Key elements: room code digit inputs, nickname field, room preview, public games matchmaking, validation/error states.

- [ ] **Step 2: Restyle the form wrapper as a ticket**

Keep ALL existing logic (validation, socket events, auto-advance, room preview). Only change visual treatment:
- Cream paper background (`var(--color-cream)`) for the form area
- Red stripe header at top: "ADMIT ONE" left, ticket number right
- Code inputs: white background, red accent on active (`var(--color-stage-red)`)
- Nickname: underline-only input on cream background (no box border)
- Submit button: red background, white text, "Take Your Seat"
- Perforated tear line: CSS dashed border with semicircle notches using pseudo-elements
- Below tear: "or scan the QR code" as subtle text

- [ ] **Step 3: Restyle the public games section**

Keep it collapsed by default (already done from earlier work). When expanded, restyle to match — dark background, cream cards for public rooms.

- [ ] **Step 4: Remove the desktop two-column illustration**

The earlier redesign added a card deck illustration on desktop. Remove it — the ticket metaphor works on its own. Keep the desktop width reasonable (max ~420px centered, not two-column).

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit`

```
git commit -m "Restyle join form as admission ticket"
```

---

## Chunk 4: Lobby — The Clapperboard

### Task 4: Restyle host lobby as clapperboard

**Files:**
- Modify: `app/host/components/HostLobby.tsx`

- [ ] **Step 1: Read the full file**

Read `app/host/components/HostLobby.tsx` (655 lines). Key: QR code, room code display, player list, game mode selector, settings panels, start button.

- [ ] **Step 2: Add clapperboard header**

Above the main content, add a clapperboard-style header:
- Dark background with diagonal B&W stripes at top (8px height, `repeating-linear-gradient`)
- Fields: "PROD: Plot Twists", "SCENE: [pack name or 'TBD']", "TAKE: 1"
- Date in top-right
- Border-bottom separating from main content

- [ ] **Step 3: Restyle room code and QR**

- Room code: `font-code` (Space Mono), 80-96px on desktop, warm text-shadow for marquee glow
- QR code: white card with golden scan-line animation (CSS `@keyframes`)
- "plottwists.com/join → ABCD" URL below QR

- [ ] **Step 4: Restyle player chips and start button**

- Player chips: dark background with subtle border, host gets gold border/text
- "waiting..." chip: dashed border, muted text
- Start button text: **"Action"** (not "Start Game")
- Warm stage-light glow from above: `radial-gradient` on the body container

- [ ] **Step 5: Keep settings panels functional**

The expandable settings panels (script customization, card packs, audio) keep their existing logic. Just restyle their containers to use dark surface colors (`var(--color-ink)`) with subtle borders.

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit`

```
git commit -m "Restyle host lobby as film clapperboard"
```

### Task 5: Restyle join lobby

**Files:**
- Modify: `app/join/components/JoinLobby.tsx`

- [ ] **Step 1: Restyle to match clapperboard aesthetic**

This is the player's waiting room (192 lines, simpler). Restyle:
- Dark background matching host lobby
- "You're in!" confirmation in serif font
- Player list matching host lobby style
- Waiting state: subtle animated dots, warm tone
- Keep spectator/player distinction, push permission prompt, auto-start countdown

- [ ] **Step 2: Verify and commit**

```
git commit -m "Restyle join lobby to match clapperboard aesthetic"
```

---

## Chunk 5: Card Selection — The Casting Table

### Task 6: Restyle CardPicker as casting table

**Files:**
- Modify: `components/CardPicker.tsx`

- [ ] **Step 1: Read the full file**

Read `components/CardPicker.tsx` (587 lines). Key: 3-tab interface, card grid, search, category filters, custom input, shuffle, auto-advance.

- [ ] **Step 2: Restyle tabs with category colors**

- Character tab: red dot indicator (`var(--color-stage-red)`)
- Setting tab: blue dot indicator (`var(--color-stage-blue)`)
- Circumstance tab: gold dot indicator (`var(--color-stage-gold)`)
- Active tab: colored underline matching category
- Done tabs: show selected card text in green
- Dark background for tab bar (`var(--color-ink)`)

- [ ] **Step 3: Restyle card grid items as physical cards**

Each card becomes a cream paper card:
- Background: `var(--color-cream)`
- Colored stripe at top (3px, matching category)
- Text: dark color on cream
- Pack source: small muted text at bottom
- Hover: lift with shadow
- Selected: white bg, colored border, colored check circle in corner
- Physical shadow: `box-shadow` for stacking feel

- [ ] **Step 4: Restyle bottom summary bar**

- Three mini card slots showing picks
- Filled slots: colored background matching category
- Empty slots: dashed border
- Submit button text: **"Lock In Cards"**

- [ ] **Step 5: Restyle search and filters**

Dark-themed search bar, category filter chips with dark styling.

- [ ] **Step 6: Verify and commit**

```
git commit -m "Restyle CardPicker as casting table with cream paper cards"
```

### Task 7: Update Selection components

**Files:**
- Modify: `app/host/components/HostSelection.tsx`
- Modify: `app/join/components/JoinSelection.tsx`

- [ ] **Step 1: Update HostSelection wrapper styling**

The CardPicker is rendered inside HostSelection (solo mode) and JoinSelection. Update the wrapper/container styling:
- Dark background
- Remove any old cream/beige page styling
- Ensure the CardPicker's new cream-on-dark aesthetic works within these wrappers

- [ ] **Step 2: Update JoinSelection wrapper styling**

Same treatment. Keep all logic (spectator view, submitted state, confirm mode).

- [ ] **Step 3: Verify and commit**

```
git commit -m "Update Selection wrappers for casting table aesthetic"
```

---

## Chunk 6: Loading — The Typewriter

### Task 8: Restyle loading screens as typewriter

**Files:**
- Modify: `app/host/components/HostLoading.tsx`
- Modify: `app/join/components/JoinLoading.tsx`

- [ ] **Step 1: Restyle HostLoading**

Read `app/host/components/HostLoading.tsx` (268 lines). Restyle:
- Dark background
- Center: cream paper card (like a page coming out of a typewriter)
  - Faded/masked bottom edge (CSS mask-image gradient)
  - "A Plot Twists Original" small caps label
  - Script title in `font-serif` italic
  - Blinking red cursor after title: `|` with CSS `@keyframes blink`
  - "Written by Claude" in faint text
- Keep: progress steps, title preview reveal (blur-to-clear), retry button
- Replace the typewriter icon with the paper element
- Status text below paper: "Writing your scene..."

- [ ] **Step 2: Restyle JoinLoading**

Read `app/join/components/JoinLoading.tsx` (278 lines). Same typewriter treatment but from player perspective:
- Same paper + cursor aesthetic
- Keep: elapsed timer, timeout warnings, leave button
- Different messaging for join view

- [ ] **Step 3: Verify and commit**

```
git commit -m "Restyle loading screens as typewriter with paper and blinking cursor"
```

---

## Chunk 7: Teleprompter — Script on Desk + Cue Card

### Task 9: Restyle host teleprompter as script on desk

**Files:**
- Modify: `app/host/components/HostPerforming.tsx`

- [ ] **Step 1: Read the full file**

Read `app/host/components/HostPerforming.tsx` (424 lines). Key: script display with line-by-line navigation, mood indicators, plot twist button, audience reactions, movie poster, settings panel.

- [ ] **Step 2: Restyle script display area**

The main teleprompter area becomes a cream paper script:
- Paper background (`var(--color-paper)`) with subtle texture (use `PAPER_TEXTURE` from design.ts)
- Paper shadow: `box-shadow` for curl effect
- LIVE indicator: pulsing red dot + "LIVE" in top-right
- Script title in `font-serif` italic, centered
- Scene heading (if present): uppercase, muted, Courier Prime
- Each script line in proper screenplay format:
  - Character name: centered, uppercase, `font-script`, bold
  - Parenthetical: centered, italic, muted
  - Dialogue: centered, constrained max-width
- Active line: **yellow highlighter** (`background: linear-gradient(...)`) + **red margin line** (`border-left` or pseudo-element)
- Past lines: opacity 0.15
- Future lines: opacity 0.25
- Dark text on cream paper (not white text on dark)
- Page number bottom-right

- [ ] **Step 3: Restyle controls**

Transport controls below the script paper:
- Dark surface background
- Pause/play, prev/next, chaos buttons as subtle dark pills
- Active control (paused): red-tinted

- [ ] **Step 4: Keep poster, reactions, settings**

Movie poster display, audience reaction bar, and spectator ticker keep their existing logic. Restyle containers to match dark aesthetic with subtle borders.

- [ ] **Step 5: Verify and commit**

```
git commit -m "Restyle host teleprompter as script on desk with paper and highlighter"
```

### Task 10: Restyle mobile teleprompter as cue card

**Files:**
- Modify: `app/join/components/JoinPerforming.tsx`
- Modify: `components/MobileTeleprompter.tsx`

- [ ] **Step 1: Restyle JoinPerforming wrapper**

Read `app/join/components/JoinPerforming.tsx` (136 lines). Update:
- Header: keep LIVE indicator, restyle with serif title in gold
- Container: dark background for the overall page

- [ ] **Step 2: Restyle MobileTeleprompter as a cue card**

Read `components/MobileTeleprompter.tsx`. This is the component that shows the player's current line. Restyle:
- **Cream paper background** — the entire teleprompter area is cream, not dark
- Red "YOUR LINE" tab at top (solid red bar, white text, uppercase)
- Character name: red, uppercase, Courier Prime
- Parenthetical: italic, muted
- Dialogue: large (~28px), Courier Prime, dark text on cream
- "Up Next" section: slightly darker paper footer (`var(--color-paper-dark)`), separated by subtle border

- [ ] **Step 3: Verify and commit**

```
git commit -m "Restyle mobile teleprompter as physical cue card"
```

---

## Chunk 8: Voting — The Ballot

### Task 11: Restyle voting screens as ballots

**Files:**
- Modify: `app/host/components/HostVoting.tsx`
- Modify: `app/join/components/JoinVoting.tsx`

- [ ] **Step 1: Restyle HostVoting**

Read `app/host/components/HostVoting.tsx` (130 lines). Restyle:
- Dark background
- "Who stole the show?" in `font-serif` italic
- Each player card: cream paper ballot slip
  - Gradient avatar, name, role
  - Vote status indicator (checkbox circle on right)
  - Voted: red check, ballot slides right slightly
- Vote count display styled cleanly

- [ ] **Step 2: Restyle JoinVoting**

Read `app/join/components/JoinVoting.tsx` (212 lines). Same ballot treatment:
- Cream ballot slips for each votable player
- Red "Cast Vote" button (not "Submit Vote")
- Submitted state: "Your ballot has been cast" with check
- Keep: player filtering (exclude host/spectators), progress bar, haptics

- [ ] **Step 3: Verify and commit**

```
git commit -m "Restyle voting screens as ballot slips"
```

---

## Chunk 9: Results — The Premiere

### Task 12: Restyle results screens as movie premiere

**Files:**
- Modify: `app/host/components/HostResults.tsx`
- Modify: `app/join/components/JoinResults.tsx`

- [ ] **Step 1: Restyle HostResults**

Read `app/host/components/HostResults.tsx` (357 lines). This is the most complex results screen. Restyle:
- Film strip sprocket holes on left and right edges: `repeating-linear-gradient` on `::before`/`::after` pseudo-elements
- MVP section:
  - Gold "MVP" badge: solid gold background, dark text, small physical badge
  - MVP name in large `font-serif`
  - Role text below
- Poster: full-width, 3:4 ratio
  - Shimmer sweep animation across surface
  - Bottom gradient fade for text overlay
  - Show title in gold italic serif
- Credits section below poster: "The Cast" with actor names + roles
- Action buttons: "Play Again" (primary), "Share" / "Script" (secondary)
- Keep: confetti, XP animations, directors review, share functionality, game highlights

- [ ] **Step 2: Restyle JoinResults**

Read `app/join/components/JoinResults.tsx` (335 lines). Same premiere treatment from player perspective:
- Same sprocket holes, MVP reveal, poster display
- Keep: guest signup nudge, character card share, leave button, poster lightbox
- "Play Again" button should wait for host

- [ ] **Step 3: Verify and commit**

```
git commit -m "Restyle results screens as movie premiere with sprocket holes and credits"
```

---

## Chunk 10: Explore — The Script Library

### Task 13: Restyle explore page as script library

**Files:**
- Modify: `app/explore/page.tsx`

- [ ] **Step 1: Restyle the page**

Read `app/explore/page.tsx`. Restyle:
- Dark background
- Title: **"Scripts"** in `font-serif` (not "Explore")
- Remove QuickPlayBanner (doesn't fit the library metaphor)
- Remove Trending carousel (simplify)
- Keep category filter pills: restyle dark with uppercase, small
- Pack cards become **manilla folders**:
  - Tan/kraft background: `linear-gradient(135deg, #d4c9a8, #c8bc98)`
  - Colored tab sticking out top: different color per pack (use pack gradient[0])
  - `border-radius: 4px 10px 10px 10px` (tab shape)
  - Pack name, description, rating in dark text on tan
  - Subtle paper shadow
- Keep: search, pack preview modal, socket events

- [ ] **Step 2: Verify and commit**

```
git commit -m "Restyle explore page as script library with manilla folders"
```

---

## Chunk 11: Navigation + Cleanup

### Task 14: Restyle TopBar and final cleanup

**Files:**
- Modify: `components/TopBar.tsx`
- Modify: `components/AppShell.tsx`

- [ ] **Step 1: Restyle TopBar**

- Semi-transparent dark background with blur
- "Plot Twists" in `font-serif`
- "Join Game" link as subtle bordered pill
- On game pages: already hidden by AppShell

- [ ] **Step 2: Remove old chrome redesign artifacts**

Check for any leftover styling from the previous incremental redesign that conflicts:
- Remove the old "How it works" fanned cards/script preview if not already replaced
- Remove tag pills if any remain
- Ensure no beige/cream app-level backgrounds remain (the dark void should be the base)

- [ ] **Step 3: TypeScript check and visual test**

Run: `npx tsc --noEmit`

Start dev server, navigate through all pages, verify:
- Landing: marquee with poster showcase
- Join: ticket with code inputs
- Host lobby: clapperboard
- Card selection: cream cards on dark
- Loading: typewriter paper
- Teleprompter: paper script (host), cue card (mobile)
- Voting: cream ballots
- Results: sprocket holes, premiere
- Explore: manilla folders

- [ ] **Step 4: Final commit and push**

```
git commit -m "Restyle navigation and clean up old design artifacts"
git push origin v2
```
