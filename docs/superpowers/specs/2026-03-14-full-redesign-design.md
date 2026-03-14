# Plot Twists — Full UX/UI Redesign

**Date:** 2026-03-14
**Scope:** Complete visual overhaul of every screen in the app
**Replaces:** `2026-03-14-chrome-redesign-design.md` (superseded — that was incremental polish on a bad foundation)

---

## Design Philosophy

Every screen is a **physical object**, not a digital layout. The app is a theater — you're backstage, on stage, or in the audience. Each screen maps to a real-world thing you'd find in a theater or film production.

**No:**
- Flat dark backgrounds with gradient cards
- Generic UI labels ("Start", "Submit", "Next")
- Emojis as decoration
- Beige/cream app backgrounds
- Centered-everything symmetry

**Yes:**
- Physical materials (paper, film, cards, tickets)
- Category-specific colors (red/blue/gold)
- Opinionated copy ("Action", "Take Your Seat", "Cast Vote", "Lock In Cards")
- Craft details (highlighter marks, sprocket holes, torn edges, blinking cursors)
- Each screen feels different because each screen IS a different object

---

## Color System

**Surfaces:**
- `--black: #08070b` — the void, the dark stage
- `--ink: #0f0e14` — elevated dark surfaces (tab bars, controls)
- `--paper: #f4f0e8` — cream paper for physical objects (scripts, cards, ballots, tickets)
- `--cream: #faf7f0` — bright paper (cue cards, playing cards)

**Accents:**
- `--red: #c23b22` — primary accent. LIVE dots, ticket stripes, character category, check marks
- `--gold: #c9a24d` — premium/spotlight. MVP badges, wild card category, marquee glow
- `--blue: #3a5a8c` — setting category
- `--green: #2d6a4f` — success/done states

**Text:**
- `--text-light: #f0ece4` — text on dark backgrounds
- `--text-dark: #1a1812` — text on paper/cream backgrounds

---

## Typography

- **Display:** `Instrument Serif` — elegant, has character. For titles, scene names, "The Sinking Interview"
- **Body:** `DM Sans` — clean, modern. For labels, descriptions, body text
- **Script:** `Courier Prime` — the actual screenplay font. For teleprompter, script content, dialogue
- **Code:** `Space Mono` — for room codes, technical elements

---

## Screens

### 1. Landing — The Marquee

**Metaphor:** A movie theater marquee. You're standing outside deciding to go in.

**Structure:**
- Marquee sign header with chase light animation (dots running along top/bottom edges)
- "Plot Twists" in Instrument Serif, "Now showing" subtitle
- Featured poster — large, fills most of the screen (4:5 ratio). Title and "Made by friends + AI in 30 seconds" overlaid at bottom
- Thumbnail strip below — horizontal scroll of other posters, tap to swap featured
- "Get Tickets" CTA button inside a ticket-booth styled container with dashed tear line

**Key copy:** "Get Tickets" (not "Start a Game"), "Now Showing" section label

**Files:** `components/LandingPage.tsx`

### 2. Join — The Ticket

**Metaphor:** A physical admission ticket.

**Structure:**
- Red stripe header: "ADMIT ONE" left, ticket number "NO. 0247" right
- Cream paper background
- "Enter your code" in serif
- 4 code input boxes on white backgrounds with red accent on active
- Name input as underlined field (not a box)
- Red "Take Your Seat" button
- Perforated tear line with semicircle notches on edges (CSS)
- Below tear: "or scan the QR code on your host's screen"

**Key copy:** "ADMIT ONE", "Take Your Seat" (not "Join"), ticket number

**Files:** `app/join/components/JoinForm.tsx`

### 3. Host Lobby — The Clapperboard

**Metaphor:** A film production clapperboard / movie set.

**Structure:**
- Clapperboard header: diagonal B&W stripes at top, fields for Prod/Scene/Take with production data
- Dark body with warm stage-light glow from above
- Room code: 96px Space Mono, warm text-shadow (marquee glow)
- QR code: white card, golden scan-line animation sweeping up/down
- Player chips: rounded pills, host gets gold border, "waiting..." is dashed
- "Action" button (not "Start")

**Key copy:** "Action" (not "Start"), Prod/Scene/Take fields

**Files:** `app/host/components/HostLobby.tsx`, `app/join/components/JoinLobby.tsx`

### 4. Card Selection — The Casting Table

**Metaphor:** A casting director's table covered in headshot cards.

**Structure:**
- Three category tabs at top: Character (red dot), Setting (blue dot), Wild Card (gold dot)
- Done tabs show picked card text in green
- Active tab has colored underline matching category
- Serif heading for category name, subtitle for prompt
- Search bar
- 2-column grid of cream paper cards on dark surface
  - Each card has a colored stripe at top matching category
  - Hover lifts card with shadow
  - Selected card: lifts higher, white bg, colored border, colored check circle in corner
  - Card shows text + pack source in small muted type
- "Shuffle cards" as subtle underlined link
- Bottom bar: three mini card slots showing picks (filled slots get colored bg, empty are dashed), "Lock In Cards" button

**Key copy:** "Lock In Cards" (not "Submit"), "Shuffle cards", category tabs show picked text when done

**Files:** `components/CardPicker.tsx`, `app/join/components/JoinSelection.tsx`, `app/host/components/HostSelection.tsx`

### 5. Script Loading — The Typewriter

**Metaphor:** A page being typed on a typewriter.

**Structure:**
- Dark background
- Cream paper card emerging from center (faded bottom edge like paper being pulled from typewriter)
- "A Plot Twists Original" in small caps at top of page
- Script title in Instrument Serif italic, large
- Blinking red cursor `|` at end of title (CSS animation)
- "Written by Claude" in faint text
- "Writing your scene..." status below the paper

**Key copy:** "A Plot Twists Original", "Written by Claude"

**Files:** `app/host/components/HostLoading.tsx`, `app/join/components/JoinLoading.tsx`

### 6. Teleprompter (TV) — The Script on a Desk

**Metaphor:** A physical screenplay on a desk under a reading light.

**Structure:**
- Dark desk surface background with subtle warm overhead light
- Chrome bar: show title in Instrument Serif italic (gold), pause/chaos controls
- Script paper: cream/paper background with paper texture
  - LIVE indicator: pulsing red dot + "LIVE" text in top-right
  - Script title card: centered title in serif + "A Plot Twists Original"
  - Scene heading: `INT. CRUISE SHIP CONFERENCE ROOM — DAY` in caps, muted
  - Script blocks in proper screenplay format:
    - CHARACTER NAME centered, uppercase, Courier Prime
    - (parenthetical) centered, italic
    - Dialogue centered, max-width constrained
  - Active block: **yellow highlighter wash** + **red margin line** on left edge
  - Past blocks: opacity 0.15
  - Future blocks: opacity 0.25
  - Page number at bottom right
- Controls below script: transport buttons (prev, pause, next, chaos)

**Key details:** Yellow highlighter on active line. Red margin line. LIVE dot. Page numbers. Paper texture.

**Files:** `app/host/components/HostPerforming.tsx`

### 7. Teleprompter (Mobile) — The Cue Card

**Metaphor:** A physical cue card held up for you on set.

**Structure:**
- Cream paper background (entire screen is the card)
- Red "YOUR LINE" tab at top (solid red bar with white text)
- Center: character name (red, caps), parenthetical (italic, faint), YOUR LINE (large, ~28px Courier Prime)
- Bottom: slightly darker paper footer with "Up Next" preview

**Key details:** The ENTIRE screen is cream paper. Not dark with a card on it — the card IS the screen.

**Files:** `app/join/components/JoinPerforming.tsx`, `components/MobileTeleprompter.tsx`

### 8. Voting — The Ballot

**Metaphor:** Casting a ballot.

**Structure:**
- Dark background
- "Who stole the show?" in serif italic
- "Cast your vote" subtitle
- Ballot slips: cream paper cards, each with gradient avatar, name, role, and empty circle on right
- Selected ballot: slides right, circle fills red with white checkmark
- Red "Cast Vote" button

**Key copy:** "Who stole the show?", "Cast Vote" (not "Submit")

**Files:** `app/host/components/HostVoting.tsx`, `app/join/components/JoinVoting.tsx`

### 9. Results — The Premiere

**Metaphor:** A movie premiere / film screening.

**Structure:**
- Film strip sprocket holes running down both edges of the screen (repeating CSS pattern)
- Full-width poster (3:4 ratio) — the AI-generated poster fills the screen
  - Light shimmer sweep animation across poster surface
  - Bottom gradient fade to black for text legibility
  - Gold "MVP" badge (solid gold background, dark text) — not text, a physical badge
  - MVP name in large serif
  - "as The Candidate" role text
  - Show title in gold italic serif
- Credits section below poster: "The Cast" with actor names and roles
- Action buttons: "Play Again" (primary), "Share" (secondary), "Script" (secondary)

**Key details:** Sprocket holes. Gold badge. Credits with full cast. Shimmer sweep.

**Files:** `app/host/components/HostResults.tsx`, `app/join/components/JoinResults.tsx`

### 10. Explore — The Script Library

**Metaphor:** A shelf of scripts in manilla folders.

**Structure:**
- Dark background
- "Scripts" heading in serif (not "Explore")
- Category filter pills (uppercase, small)
- Card packs as manilla folders: tan/kraft paper color, colored tab sticking out top (different color per pack), pack name, description, rating/plays
- Folders have subtle paper shadow for stacking feel

**Key details:** "Scripts" not "Explore". Manilla folders not cards. Colored tabs.

**Files:** `app/explore/page.tsx`

---

## Global Elements

### Navigation
- **Top bar:** Minimal — "Plot Twists" logo left, "Join Game" link right. Semi-transparent over dark pages.
- **Bottom tabs (mobile):** Hidden during gameplay phases. Only shown on landing/explore/profile.
- **During gameplay:** NO navigation chrome. The game IS the screen.

### Install Banner
- Show once, permanent dismiss via localStorage
- Subtle install card on profile page only

### App Shell
- `components/AppShell.tsx` wraps all pages
- `components/TopBar.tsx` for the floating top bar
- `components/BottomTabBar.tsx` for mobile tabs
- Nav hides on `/host` and `/join` during active gameplay

---

## What Gets Deleted/Replaced

The previous "chrome redesign" changes need to be reverted or overridden:
- `components/LandingPage.tsx` — the "How it works" section gets replaced with the marquee design
- `app/explore/page.tsx` — the quick play/trending/category rebuild gets replaced with the script library
- `app/join/components/JoinForm.tsx` — the two-column layout gets replaced with the ticket
- `app/profile/page.tsx` — keep the empty state improvements but restyle to match new system
- All game-phase components get the physical treatment (clapperboard lobby, paper script, cue card, ballots, premiere)

---

## Implementation Notes

- The cream paper / physical card aesthetic means many components will use LIGHT backgrounds inside a DARK shell. This is intentional contrast.
- Category colors (red/blue/gold) should be defined as CSS custom properties and used consistently across selection, voting, and results.
- Courier Prime is already loaded in the app (`lib/fonts` or `layout.tsx`). Instrument Serif and Space Mono need to be added.
- The teleprompter paper texture can be a subtle CSS noise pattern or SVG filter — keep it performant.
- Film strip sprocket holes are a repeating CSS gradient, not images.
- Chase lights on the marquee are a CSS animation on a repeating-linear-gradient.
