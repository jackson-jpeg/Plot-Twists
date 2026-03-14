# Chrome Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the app shell and chrome pages (nav, explore, landing, join, profile, install banner) to look like a real product instead of a shipped wireframe.

**Architecture:** Wrap all pages in an AppShell (top bar + bottom tabs), rebuild the Explore page with sections/carousel/filters, refine Landing/Join/Profile with targeted layout and content fixes, and make the install banner respect dismissal.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Framer Motion, Socket.IO, existing `lib/motion.ts` presets

**Spec:** `docs/superpowers/specs/2026-03-14-chrome-redesign-design.md`

---

## File Map

### New Files
- `components/AppShell.tsx` — layout wrapper: top bar + bottom tabs + game-state visibility
- `components/TopBar.tsx` — logo wordmark + profile avatar header

### Major Rewrites
- `app/explore/page.tsx` — full rebuild: quick play, trending, categories, pack grid

### Modifications
- `components/BottomTabBar.tsx` — adjust visibility logic to work with AppShell
- `app/layout.tsx` — wrap children in AppShell
- `components/LandingPage.tsx` — remove tag pills, redesign "How it works"
- `components/InstallPrompt.tsx` — permanent dismissal via localStorage
- `app/join/components/JoinForm.tsx` — desktop two-column layout, form polish
- `app/profile/page.tsx` — empty state, desktop layout, CTA tone-down
- `components/PlayerProfile.tsx` — empty state redesign
- `lib/types.ts` — add `gradient` to CardPackMetadata
- `server/data/communityPacks.ts` — add gradient values per pack
- `server/services/cardpack.service.ts` — include gradient in metadata response

---

## Chunk 1: App Shell & Navigation

### Task 1: Create TopBar component

**Files:**
- Create: `components/TopBar.tsx`

- [ ] **Step 1: Create TopBar component**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/join', label: 'Join' },
  { href: '/explore', label: 'Explore' },
  { href: '/profile', label: 'Profile' },
]

export function TopBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  return (
    <header className="sticky top-0 z-40 w-full"
      style={{
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
      }}>
      <div className="flex items-center justify-between px-5 mx-auto"
        style={{ maxWidth: 960, height: 52 }}>
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}>
          Plot Twists
        </Link>

        {isDesktop && (
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className="text-sm font-medium transition-colors"
                style={{
                  color: pathname === item.href
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)',
                }}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <Link href="/profile">
          <Avatar name={user?.displayName || '?'} size="sm" />
        </Link>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify it renders**

Run: `npx tsc --noEmit`
Expected: PASS, no type errors

- [ ] **Step 3: Commit**

```bash
git add components/TopBar.tsx
git commit -m "Add TopBar component with logo, desktop nav, and profile avatar"
```

---

### Task 2: Create AppShell wrapper

**Files:**
- Create: `components/AppShell.tsx`
- Modify: `components/BottomTabBar.tsx`

- [ ] **Step 1: Create AppShell component**

AppShell wraps all page content, renders TopBar and BottomTabBar, and hides nav during active gameplay phases.

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { BottomTabBar } from '@/components/BottomTabBar'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const ACTIVE_GAME_PHASES = ['SELECTION', 'LOADING', 'PERFORMING', 'VOTING']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const breakpoint = useBreakpoint()
  const isDesktop = breakpoint === 'desktop'

  // Hide nav during active gameplay on host/join pages
  const isGamePage = pathname.startsWith('/host') || pathname.startsWith('/join')
  // Admin page has its own nav
  const isAdminPage = pathname.startsWith('/admin')

  const showNav = !isAdminPage && !isGamePage

  return (
    <>
      {showNav && <TopBar />}
      <main style={{ paddingBottom: showNav && !isDesktop ? 72 : 0 }}>
        {children}
      </main>
      {showNav && !isDesktop && <BottomTabBar />}
    </>
  )
}
```

- [ ] **Step 2: Update BottomTabBar visibility logic**

Remove the internal `shouldShowTabBar()` logic from BottomTabBar — AppShell now controls when it renders. BottomTabBar should always render when mounted.

- [ ] **Step 3: Wire AppShell into layout.tsx**

In `app/layout.tsx`, wrap `{children}` with `<AppShell>`. Import and add it inside the SocketProvider but outside the page content area. Remove the standalone `<BottomTabBar />` that's currently in the layout since AppShell now renders it.

- [ ] **Step 4: Verify it renders**

Run: `npx tsc --noEmit`
Then: `npm run dev` — visit localhost:3000, verify top bar appears with logo and avatar, bottom tabs appear on mobile viewport.

- [ ] **Step 5: Commit**

```bash
git add components/AppShell.tsx components/BottomTabBar.tsx app/layout.tsx
git commit -m "Add AppShell with TopBar + BottomTabBar, hide nav during gameplay"
```

---

## Chunk 2: Install Banner Fix

### Task 3: Permanent dismissal for install banner

**Files:**
- Modify: `components/InstallPrompt.tsx`

- [ ] **Step 1: Change dismissal from 7-day to permanent**

In `InstallPrompt.tsx`, find the dismissal logic that stores a timestamp and compares against 7 days. Change it to store a simple boolean flag. On dismiss, set `localStorage.setItem('install-dismissed', 'true')`. On mount, check `localStorage.getItem('install-dismissed') === 'true'` — if so, don't show the banner at all.

- [ ] **Step 2: Test manually**

Visit localhost:3000, dismiss the banner, refresh — banner should not reappear.

- [ ] **Step 3: Commit**

```bash
git add components/InstallPrompt.tsx
git commit -m "Make install banner dismissal permanent via localStorage"
```

---

### Task 4: Add install prompt to profile page

**Files:**
- Modify: `app/profile/page.tsx`

- [ ] **Step 1: Add inline install card to profile page**

After the main profile content (below the account CTA section), add a subtle install card. Only show if not standalone and not already dismissed.

```tsx
// Inline install suggestion — subtle card, not a banner
{!isStandalone && !installDismissed && (
  <Card padding="md" className="mt-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Install Plot Twists
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Add to home screen for the best experience
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={handleInstall}>
        Install
      </Button>
    </div>
  </Card>
)}
```

Use `useStandaloneMode()` hook and check `localStorage.getItem('install-dismissed')`.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add app/profile/page.tsx
git commit -m "Add subtle install prompt card to profile page"
```

---

## Chunk 3: Explore Page Rebuild

### Task 5: Add gradient field to pack data

**Files:**
- Modify: `lib/types.ts`
- Modify: `server/data/communityPacks.ts`
- Modify: `server/services/cardpack.service.ts`

- [ ] **Step 1: Add gradient to CardPackMetadata type**

In `lib/types.ts`, add to the `CardPackMetadata` interface:

```ts
gradient?: [string, string]  // [startColor, endColor] for pack visual identity
```

- [ ] **Step 2: Add gradient values to community packs**

In `server/data/communityPacks.ts`, add a `gradient` field to each pack object. Use curated color pairs:

```ts
// Example gradient assignments:
'after-dark':       ['#7b2d8e', '#e94560'],
'holiday-havoc':    ['#c0392b', '#e74c3c'],
'reality-tv-chaos': ['#8e44ad', '#3498db'],
'zombie-apocalypse':['#2d6a4f', '#40916c'],
'shark-tank':       ['#e76f51', '#f4a261'],
'wedding-disasters':['#d4a373', '#e9c46a'],
'superhero-support':['#264653', '#2a9d8f'],
'high-school-drama':['#6c5b7b', '#c06c84'],
'fairy-tale-remix': ['#606c38', '#283618'],
'time-travelers':   ['#457b9d', '#1d3557'],
'therapy-sessions': ['#9b5de5', '#f15bb5'],
'airport-terminal': ['#00b4d8', '#0077b6'],
'detective-noir':   ['#2b2d42', '#8d99ae'],
'haunted-house':    ['#3d0066', '#6a0dad'],
'royal-court':      ['#b08968', '#ddb892'],
'cooking-catastrophe':['#e63946', '#f1a208'],
'wild-west':        ['#bc6c25', '#606c38'],
'medieval-mayhem':  ['#5f0f40', '#9a031e'],
'office-comedy':    ['#3a86ff', '#8338ec'],
'sci-fi-adventures':['#023e8a', '#48cae4'],
```

- [ ] **Step 3: Ensure cardpack service includes gradient in metadata**

In `server/services/cardpack.service.ts`, verify that the metadata serialization includes the `gradient` field when returning pack metadata.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts server/data/communityPacks.ts server/services/cardpack.service.ts
git commit -m "Add gradient color pairs to pack metadata for visual identity"
```

---

### Task 6: Rebuild Explore page

**Files:**
- Rewrite: `app/explore/page.tsx`

This is the biggest task. The page gets a full rebuild with 4 sections: Quick Play, Trending, Category Pills, All Packs Grid.

- [ ] **Step 1: Rewrite the PackCard component**

New compact card with gradient accent stripe:

```tsx
function PackCard({ pack, onSelect, index = 0 }: { pack: CardPackMetadata; onSelect: (pack: CardPackMetadata) => void; index?: number }) {
  const [g1, g2] = pack.gradient || ['#888', '#aaa']

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * STAGGER, ...SPRING_GENTLE }}
    >
      <Card variant="interactive" padding="none" onClick={() => onSelect(pack)} style={{ overflow: 'hidden' }}>
        <div className="flex gap-0">
          <div className="w-1 rounded-l-xl shrink-0" style={{ background: `linear-gradient(180deg, ${g1}, ${g2})` }} />
          <div className="p-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {pack.name}
              </h3>
              {pack.isMature && <Badge variant="danger" size="sm">18+</Badge>}
            </div>
            <p className="text-[13px] leading-relaxed line-clamp-2 mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {pack.description}
            </p>
            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
              {pack.rating > 0 && (
                <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>
                  ★ {pack.rating.toFixed(1)}
                </span>
              )}
              <span>{pack.downloads} plays</span>
              {pack.theme && (
                <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-tertiary)' }}>
                  {pack.theme}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
```

- [ ] **Step 2: Add TrendingCard component**

Horizontal scroll card with gradient background, rank badge, and pack info overlay:

```tsx
function TrendingCard({ pack, rank, onSelect }: { pack: CardPackMetadata; rank: number; onSelect: (pack: CardPackMetadata) => void }) {
  const [g1, g2] = pack.gradient || ['#888', '#aaa']

  return (
    <motion.div
      className="shrink-0 cursor-pointer rounded-2xl overflow-hidden relative"
      style={{ width: 220, scrollSnapAlign: 'start' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(pack)}
    >
      <div className="h-[130px] relative" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
        <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          {rank}
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.75))' }}>
          <h3 className="text-sm font-bold text-white">{pack.name}</h3>
          <div className="flex gap-2 text-[11px] text-white/70 mt-0.5">
            <span>★ {pack.rating.toFixed(1)}</span>
            <span>{pack.downloads} plays</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Add QuickPlay banner component**

```tsx
function QuickPlayBanner({ onQuickPlay }: { onQuickPlay: () => void }) {
  return (
    <motion.div {...ENTER_Y} transition={SPRING_GENTLE}
      className="rounded-2xl p-5 mb-7 flex items-center justify-between gap-4 cursor-pointer"
      style={{ background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)', color: 'white' }}
      onClick={onQuickPlay}
    >
      <div>
        <h3 className="text-[17px] font-bold mb-0.5">Feeling lucky?</h3>
        <p className="text-[13px] text-white/50">Random pack, instant scene. No decisions required.</p>
      </div>
      <Button variant="primary" size="md" onClick={(e) => { e.stopPropagation(); onQuickPlay() }}>
        Quick Play
      </Button>
    </motion.div>
  )
}
```

- [ ] **Step 4: Add CategoryPills component**

```tsx
function CategoryPills({ categories, active, onSelect }: { categories: string[]; active: string; onSelect: (cat: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
      {categories.map(cat => (
        <button key={cat}
          className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors"
          style={active === cat
            ? { background: 'var(--color-text-primary)', color: 'white', borderColor: 'var(--color-text-primary)' }
            : { background: 'white', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }
          }
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Rewrite the main ExplorePage component**

Wire all the sub-components together. Keep existing socket event logic (`get_featured_packs`, `search_card_packs`, `get_card_pack`). Add:
- Quick play handler: random pack from loaded array, store in localStorage, navigate to `/host`
- Trending: top 5 packs sorted by downloads
- Categories: derive unique `theme` values from packs, filter grid on selection
- Search: collapsed button that expands into input on tap
- Keep existing `PackPreviewContent` modal — no changes

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Then: `npm run dev` — visit localhost:3000/explore, verify all sections render.

- [ ] **Step 7: Commit**

```bash
git add app/explore/page.tsx
git commit -m "Rebuild Explore page: quick play, trending carousel, category filters, compact grid"
```

---

## Chunk 4: Landing Page Refinements

### Task 7: Redesign landing page sections

**Files:**
- Modify: `components/LandingPage.tsx`

- [ ] **Step 1: Remove tag pills**

Delete the entire section at the bottom that renders the three Badge components ("Party Game", "AI-Powered", "Free to Start").

- [ ] **Step 2: Redesign "How it works" section**

Replace the generic numbered circles with visual, game-specific previews:

**Step 1 — "Pick your cards"**: Show 3 stylized card shapes fanned out, each labeled with a real example (e.g. "A pirate captain", "At a job interview", "Who speaks in questions"). Use gradient backgrounds per card matching the explore page aesthetic.

**Step 2 — "AI writes the script"**: Show a mini screenplay snippet — 3-4 lines of formatted dialogue with character names, stage directions in italics. Real example content.

**Step 3 — "Perform & vote"**: Show a simplified crown/trophy icon with "MVP" and a vote button mockup. Keep it abstract but recognizable.

Each step is a card with the visual on top and a short label + description below. Desktop: 3-column row. Mobile: vertical stack.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Then: `npm run dev` — visit localhost:3000, scroll to "How it works", verify new visuals.

- [ ] **Step 4: Commit**

```bash
git add components/LandingPage.tsx
git commit -m "Redesign 'How it works' with game previews, remove tag pills"
```

---

## Chunk 5: Join Page Polish

### Task 8: Fix join page desktop layout and form polish

**Files:**
- Modify: `app/join/components/JoinForm.tsx`

- [ ] **Step 1: Add two-column desktop layout**

Wrap the form in a flex container. On desktop (useBreakpoint), render a left column (40%) with a visual — stylized card deck illustration using CSS (3 stacked gradient cards, rotated, with sample text). Right column (60%) contains the existing form.

On mobile, only show the form column.

- [ ] **Step 2: Polish form inputs**

- Room code inputs: add accent border color on focus (`borderColor: 'var(--color-accent)'`), subtle scale transform on focus (`transform: scale(1.05)`), transition on border and transform
- Nickname input: same focus treatment
- Add subtle background treatment to the form area: very light gradient or slightly darker surface color

- [ ] **Step 3: Collapse "browse public games"**

Move the public games section behind a clickable "or browse public games" text link. On click, expand to show the existing Ensemble/Head-to-Head buttons and public rooms list. Default state is collapsed — primary focus on room code + join.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Then: `npm run dev` — visit localhost:3000/join at desktop width, verify two-column layout.

- [ ] **Step 5: Commit**

```bash
git add app/join/components/JoinForm.tsx
git commit -m "Polish join page: desktop two-column layout, form focus states, collapse public games"
```

---

## Chunk 6: Profile Page Improvements

### Task 9: Redesign profile empty state and layout

**Files:**
- Modify: `app/profile/page.tsx`
- Modify: `components/PlayerProfile.tsx`

- [ ] **Step 1: Fix the empty/unauthenticated state**

In `PlayerProfile.tsx`, replace the green "?" avatar with a neutral silhouette using the existing Avatar component with a muted color. Replace the "Ready for Your Debut?" empty state with:
- Blurred/faded preview cards showing what stats WOULD look like (games: --, MVP wins: --, etc.)
- Locked achievement placeholders (gray circles with lock icon)
- Clear CTA: "Play a game to start tracking your stats" as primary button
- Secondary subtle text: "Create an account to save progress" as a text link

- [ ] **Step 2: Fix desktop layout**

In `app/profile/page.tsx`:
- Set max-width to 960px with `mx-auto`
- Stats section: 2x2 or 3-column grid of stat cards
- Tab content area: use full available width
- Leaderboard tab: wider table/list layout

- [ ] **Step 3: Tone down account CTA**

Replace the large orange "Create Free Account" banner with a subtle inline card:
- Muted border, small icon, one line of text
- Link-style "Create account" button instead of massive orange block
- Positioned at the bottom of profile content, not dominating the page

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Then: `npm run dev` — visit localhost:3000/profile, verify new empty state and desktop layout.

- [ ] **Step 5: Commit**

```bash
git add app/profile/page.tsx components/PlayerProfile.tsx
git commit -m "Redesign profile: aspirational empty state, desktop layout, subtle account CTA"
```

---

## Chunk 7: Final Integration & Testing

### Task 10: Visual testing with Playwright

- [ ] **Step 1: Start dev server and run through all pages**

Use Playwright MCP to navigate and screenshot each page at both desktop (1280x800) and mobile (390x844) viewports:
- `/` — landing page
- `/explore` — explore page
- `/join` — join page
- `/profile` — profile page

Verify: no console errors, no layout breaks, nav appears on all pages, nav hides on `/host` and `/join` game pages.

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "Chrome redesign: polish and fixes from visual testing"
```

- [ ] **Step 4: Push**

```bash
git push origin v2
```
