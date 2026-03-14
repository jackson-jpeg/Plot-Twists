# Chrome Redesign — Spec 1 of 2

**Date:** 2026-03-14
**Scope:** Navigation shell, Explore, Landing, Join, Profile pages, Install banner
**Out of scope:** Gameplay phases (Lobby → Selection → Loading → Performing → Voting → Results) — covered in Spec 2

---

## Problem Statement

The app has no global navigation, inconsistent page layouts, and several pages that look like shipped wireframes. The Explore page is a wall of identical beige cards with no visual hierarchy. The profile page looks like an error state. There is no way to move between pages without knowing URLs. The install banner never goes away.

## Design Decisions

All decisions below were made collaboratively via visual companion brainstorming session.

---

## 1. Global Navigation

**Pattern:** Hybrid — minimal top bar + bottom tab bar.

### Mobile (< 768px)
- **Top bar:** Logo ("Plot Twists" wordmark) + profile avatar, no nav links
- **Bottom tab bar:** 4 tabs — Home, Join, Explore, Profile
- Active tab indicated by filled icon + bold label + accent color
- Tab bar has `backdrop-filter: blur` + subtle top border

### Desktop (>= 768px)
- **Top bar:** Logo left, horizontal nav links (Home, Join, Explore, Profile) center, profile avatar right
- No bottom tab bar on desktop

### Gameplay behavior
- Nav auto-hides during active game phases (SELECTION, LOADING, PERFORMING, VOTING)
- Re-appears on LOBBY and RESULTS
- Implementation: game state check in the shell layout — if `gameState` is an active phase and user is in `/host` or `/join`, hide nav

### Implementation
- Promote existing `components/BottomTabBar.tsx` to the app shell
- Create `components/TopBar.tsx` for the logo + avatar header
- Wrap both in a `components/AppShell.tsx` layout component
- Add `AppShell` to `app/layout.tsx` so it wraps all pages
- `AppShell` reads current pathname and game state to determine visibility

---

## 2. Explore Page

**Direction:** Sections with purpose (option C from brainstorm). No emojis — gradient colors as visual identity per pack.

### Page structure (top to bottom)

#### Header
- "Explore" title (h1, 28px, weight 800)
- Search button (collapsed) — expands into a full search input on tap
- Clean, no subtitle clutter

#### Quick Play banner
- Dark background (`#1a1a1a` → `#2d2d2d` gradient), full width, 16px border radius
- Left: "Feeling lucky?" heading + "Random pack, instant scene" subtext
- Right: orange "Quick Play" button
- On click: pick a random pack, store in localStorage, navigate to `/host` or show pack preview
- Implementation: client-side random selection from the featured packs already loaded

#### Trending section
- Section header: "Trending" + "See all" link
- Horizontal scroll container (snap scroll, hidden scrollbar)
- 5 cards, each 220px wide (180px on mobile)
- Each card: gradient background (unique per pack), rank badge (1-5) top-left, pack name + rating + plays overlaid at bottom
- Gradient colors: defined as a static map in the pack data or derived from pack ID hash
- Data source: same `get_featured_packs` socket event, sorted by downloads descending, take top 5

#### Category filter pills
- Horizontal scrollable row of pill buttons
- Categories: All, Comedy, Horror, Fantasy, Drama, Sci-Fi, Romance, Action
- "All" is active by default (dark fill)
- Clicking a category filters the grid below
- Mapping: uses existing `theme` field on `CardPackMetadata`
- Implementation: client-side filter on the already-loaded packs array

#### All Packs grid
- `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` — responsive 2-3 columns on desktop, 1 column on mobile
- Each card:
  - 4px vertical gradient accent stripe on the left edge (same gradient as trending card)
  - Pack name (14px, bold) + mature badge if applicable
  - 2-line description (13px, secondary color, `line-clamp: 2`)
  - Meta row: star rating (orange) + play count + theme tag pill
  - No author line (it's "by Plot Twists" on every pack — adds nothing)
  - No card count breakdown (6 chars | 4 settings | 4 twists — noise)
- Click opens existing pack preview modal (no changes to modal)
- Stagger animation on load using `STAGGER` from `lib/motion.ts`

#### Gradient system
- Each pack needs a unique gradient. Options:
  - **Static map:** define gradients in `communityPacks.ts` data (most control)
  - **Hash-derived:** generate from pack ID (automatic but less curated)
- Recommendation: static map — 20 packs is manageable and ensures good color distribution
- Add `gradient: [string, string]` tuple to `CardPackMetadata` type (two hex colors)

### Files to modify
- `app/explore/page.tsx` — full rewrite of page component
- `lib/types.ts` — add `gradient` field to `CardPackMetadata`
- `server/data/communityPacks.ts` — add gradient values per pack
- `server/services/cardpack.service.ts` — include gradient in metadata response

---

## 3. Landing Page

**Direction:** Keep hero + poster showcase, kill tag pills, redesign "How it works" to be visual and game-specific.

### Changes

#### Remove
- Tag pills ("Party Game", "AI-Powered", "Free to Start") — delete entirely

#### Redesign "How it works"
- Replace generic 1-2-3 circles with visual game previews:
  - **Step 1 "Pick your cards"**: show 3 actual sample cards fanned out (character, setting, wild card) with real text from a pack
  - **Step 2 "AI writes the script"**: show a mini script preview — a few lines of dialogue with character names, like a screenplay snippet
  - **Step 3 "Perform and vote"**: show a simplified voting UI or the MVP crown reveal
- Each step is a card/panel with the visual above and a short description below
- Mobile: stack vertically. Desktop: horizontal row.
- Use actual content from the game — not abstract icons

### Files to modify
- `components/LandingPage.tsx` — remove tag pills section, redesign "How it works" section

---

## 4. Join Page

**Direction:** Fix desktop layout, polish form. Keep onboarding modal as-is.

### Desktop layout (>= 768px)
- Two-column layout: visual on left (40%), form on right (60%)
- Left column: stylized illustration or card deck visual + tagline ("Pick cards. Get a script. Perform it live.")
- Can reuse/adapt the sample cards visual from the landing page "How it works"

### Form polish
- Room code inputs: larger touch targets, clearer focus states (accent border, subtle scale), auto-advance to next input on digit entry (already works)
- Nickname input: better placeholder styling
- Subtle background: very light gradient or texture instead of flat beige
- "Browse public games" section: collapse into a "or browse public games" link that expands the section, rather than showing it inline by default. Primary focus = enter code + join.

### Files to modify
- `app/join/components/JoinForm.tsx` — layout and polish changes
- `app/join/page.tsx` — minor wrapper adjustments for desktop layout

---

## 5. Profile Page

**Direction:** Redesign empty state, fix desktop layout, tone down account CTA.

### Empty/unauthenticated state
- Replace green "?" avatar with a neutral silhouette or the Plot Twists logo mark
- Show a "preview" of what a filled profile looks like: blurred/faded stat cards, locked achievement badges, a grayed-out leaderboard position
- Single clear CTA: "Play a game to start tracking your stats" (primary) + "Create account to save progress" (secondary, subtle)
- Aspirational, not barren

### Desktop layout
- Stats in a 2x2 or 3-column grid (games played, scripts performed, MVP wins, etc.)
- Achievements in a horizontal scrollable row
- Leaderboard as a sidebar or secondary tab content that uses available width
- Max-width container: 960px, same as Explore

### Account CTA
- Replace the massive orange "Create Free Account" billboard with:
  - A subtle inline card at the bottom of the profile content
  - Muted border, small icon, one line of text + link-style button
  - Should feel like a suggestion, not a sales pitch

### Files to modify
- `app/profile/page.tsx` — layout restructure
- `components/PlayerProfile.tsx` — empty state redesign, layout improvements

---

## 6. Install Banner

**Direction:** Show once + remember dismissal. Move suggestion to profile.

### Global banner behavior
- On first visit (no localStorage flag), show the install banner as it is now
- When user clicks "Not now", set `localStorage.setItem('install-banner-dismissed', 'true')`
- Never show the global banner again after dismissal
- When user clicks "Install", proceed with install flow as normal, then set the flag

### Profile page install prompt
- Add a subtle card in the profile page: "Install Plot Twists" with app icon + "Add to home screen for the best experience" + Install button
- Only show if: (a) not already installed (check `useStandaloneMode`), (b) install prompt is available
- Styled as a muted card, not a banner — consistent with the toned-down profile CTA approach

### Files to modify
- `components/InstallPrompt.tsx` — add localStorage check for dismissal
- `app/profile/page.tsx` — add inline install card
- `app/layout.tsx` or `components/AppShell.tsx` — ensure banner respects dismissal flag

---

## Design Tokens

All pages share these values:
- Max content width: `960px`
- Background: `#f8f6f2` (existing `--color-bg`)
- Card background: `white` with `1px solid #e8e4de` border
- Card radius: `12px`
- Accent color: `#e8973e` (existing `--color-accent`)
- Text primary: `#1a1a1a`
- Text secondary: `#777`
- Text muted: `#aaa`
- Font stack: existing system font stack
- Animations: `SPRING`, `SPRING_GENTLE`, `ENTER_Y`, `STAGGER` from `lib/motion.ts`

---

## What This Does NOT Cover

- Gameplay phase redesigns (Lobby, Selection, Loading, Performing, Voting, Results) — Spec 2
- New features (user-created packs, push notifications, etc.)
- Backend changes beyond adding gradient field to pack metadata
- Mobile-specific Capacitor changes
