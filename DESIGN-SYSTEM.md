# Plot Twists — Design System 🎭

**Direction:** "Theater Kid's Notebook"
**Vibe:** Fun, slightly nostalgic (90s/00s), not overwhelming

---

## Design Philosophy

This redesign moves away from aggressive neon game-show aesthetics toward a **warm, approachable, theatrical** experience that feels like rehearsing with friends using annotated scripts and index cards.

### Core Principles
1. **Warm, not loud** — Soft paper textures and warm orange accents instead of electric neon
2. **Scripts look like scripts** — Proper screenplay formatting with Courier Prime
3. **Playful, not childish** — Friendly typography (Fredoka) that's still professional
4. **Breathing room** — Generous whitespace and comfortable padding
5. **Intentional color** — One dominant accent (warm orange) with soft secondary blue

---

## Typography

### Fonts
- **Display/Headings:** [Fredoka](https://fonts.google.com/specimen/Fredoka) — Rounded, friendly, playful
  `font-family: 'Fredoka', ui-rounded, sans-serif`

- **UI/Body:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) — Clean, readable, modern-but-warm
  `font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif`

- **Script/Mono:** [Courier Prime](https://fonts.google.com/specimen/Courier+Prime) — Actual screenplay font
  `font-family: 'Courier Prime', 'Courier New', monospace`

### Type Scale (1.25 ratio)
| Size | Pixels | Line Height | Usage |
|------|--------|-------------|-------|
| xs | 12px | 1.5 | Captions, labels |
| sm | 14px | 1.5 | Small text, helper text |
| md | 16px | 1.6 | Body text (base) |
| lg | 20px | 1.5 | Large body, script dialogue |
| xl | 25px | 1.3 | Subheadings |
| 2xl | 31px | 1.2 | Section headings |
| 3xl | 39px | 1.1 | Major headings |
| 4xl | 49px | 1.0 | Hero titles |

---

## Colors

### Light Mode (Primary)
| Token | Hex | Usage |
|-------|-----|-------|
| **Background** | #FDFCFA | Page background (warm off-white) |
| **Surface** | #FFFFFF | Cards, panels |
| **Surface Alt** | #F7F5F2 | Elevated panels |
| **Border** | #E8E4DD | Soft tan borders |
| **Border Strong** | #D4CEC3 | Stronger dividers |
| **Text Primary** | #2A2722 | Body text (warm black) |
| **Text Secondary** | #6B6560 | Muted text |
| **Text Tertiary** | #9B9590 | Subtle text |
| **Accent** | #F59E42 | Primary actions (warm orange) |
| **Accent Hover** | #E68A2E | Hover state |
| **Accent 2** | #7C9FD9 | Secondary accent (periwinkle) |
| **Success** | #82B682 | Success states (sage green) |
| **Warning** | #E8A75D | Warnings (peachy) |
| **Danger** | #D77A7A | Errors (soft red) |
| **Highlight** | #FFF4D6 | Yellow highlighter |
| **Highlight Pink** | #FFE8F0 | Pink highlighter (your turn) |
| **Script BG** | #FFFFF8 | Script paper (cream) |
| **Script Active** | #FFF9E0 | Active line highlight |

### Dark Mode Support
Automatically switches via `prefers-color-scheme: dark`

---

## Layout & Spacing

### Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tiny gaps |
| space-2 | 8px | Compact elements |
| space-3 | 12px | Text-to-label |
| space-4 | 16px | Standard gap |
| space-5 | 24px | Section gap |
| space-6 | 32px | Component gap |
| space-7 | 48px | Major sections |
| space-8 | 64px | Page sections |
| space-9 | 96px | Hero spacing |

### Grid
- **Max width:** 1200px
- **Gutters:** 24px
- **Breakpoints:** 640 / 768 / 1024 / 1280

---

## Shape & Elevation

### Border Radius
- **sm:** 4px — Inputs, small buttons
- **md:** 8px — Cards, buttons
- **lg:** 12px — Panels, modals
- **xl:** 16px — Hero elements
- **full:** 9999px — Pills, avatars

### Shadows (Soft & Paper-like)
- **Level 1:** `0 1px 2px rgba(42, 39, 34, 0.06)` — Subtle card lift
- **Level 2:** `0 2px 8px rgba(42, 39, 34, 0.08)` — Hovering card
- **Level 3:** `0 8px 24px rgba(42, 39, 34, 0.12)` — Modal
- **Level 4:** `0 16px 48px rgba(42, 39, 34, 0.16)` — Highest (rare)

**Philosophy:** No heavy drop shadows. Soft, stacked-paper feel.

---

## Motion

### Durations
- **Fast:** 150ms — Hover, focus
- **Standard:** 250ms — General transitions
- **Slow:** 350ms — Page transitions

### Easings
- **Ease Out:** `cubic-bezier(0.33, 1, 0.68, 1)` — Snappy
- **Ease In-Out:** `cubic-bezier(0.65, 0, 0.35, 1)` — Smooth
- **Spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — Playful bounce

### Reduced Motion
All transforms disabled, opacity-only transitions at 50ms max.

---

## Components

### Buttons
**Primary** — Orange solid, white text
**Secondary** — Blue outline, transparent
**Ghost** — No border, subtle hover
**Large** — 20px text, 16px/32px padding

**States:**
- Hover: Lift 1px, shadow level-2
- Active: Press down, scale 0.98
- Disabled: 40% opacity

### Inputs
- Border: 1px solid border-strong
- Focus: Orange border + yellow highlight glow
- Padding: 12px 16px
- Font: DM Sans 16px

### Cards
- Background: surface white
- Border: 1px solid border
- Radius: 12px (lg)
- Padding: 32px
- Shadow: level-1
- **Card Accent:** 3px left border in orange

### Script View ⭐ **SIGNATURE COMPONENT**

The most important UI element — scripts must look like **real screenplays**:

```
┌─────────────────────────────────┐
│   SCRIPT TITLE (CENTERED)      │
│                                 │
│          CHARACTER              │
│       Dialogue text here,       │
│       indented properly         │
│       with line spacing.        │
│                                 │
│  ★  CHARACTER 2 (active line)   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│       Next line of dialogue     │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                 │
│       (parenthetical)           │
│       More dialogue             │
│                                 │
└─────────────────────────────────┘
```

**Formatting:**
- **Character name:** Courier Prime 14px, bold, uppercase, centered
- **Dialogue:** Courier Prime 18px, left-margin 96px, max-width 480px
- **Parenthetical:** Courier Prime 16px, italic, left-margin 64px
- **Active line:** Yellow highlight background (#FFF9E0)
- **Your turn:** Pink highlight + "★ YOUR TURN" indicator

**Mobile:** Full-width dialogue, larger text (20px), no left margins

---

## Key CSS Classes

```css
/* Typography */
.font-display    /* Fredoka for headings */
.font-ui         /* DM Sans for body */
.font-script     /* Courier Prime for scripts */

/* Components */
.btn             /* Base button */
.btn-primary     /* Orange solid button */
.btn-secondary   /* Blue outline button */
.btn-large       /* Larger button variant */

.card            /* Standard card */
.card-accent     /* Card with orange left border */

.input           /* Text input */
.label           /* Input label */

/* Script */
.script-container      /* Main script wrapper */
.script-title          /* Centered script title */
.script-line           /* Individual script line */
.script-line-active    /* Active line (yellow highlight) */
.script-character      /* Character name */
.script-dialogue       /* Dialogue text */
.script-your-turn      /* "Your turn" indicator */

/* Layout */
.page-container   /* Full-page wrapper */
.container        /* Max-width content */
.stack            /* Vertical stack (16px gap) */
.stack-sm         /* Small stack (8px gap) */
.stack-lg         /* Large stack (32px gap) */
.cluster          /* Horizontal wrap */
```

---

## Design QA Checklist ✓

### Typography
- [ ] Headings use Fredoka (not default)
- [ ] Body text uses DM Sans (readable)
- [ ] Scripts use Courier Prime (screenplay feel)
- [ ] No random all-caps text outside of labels
- [ ] Line heights are comfortable (1.5-1.6 for body)

### Color
- [ ] Warm paper background (#FDFCFA), not stark white or black
- [ ] One dominant accent (orange), not rainbow
- [ ] Text has sufficient contrast (11.5:1 for body)
- [ ] Highlights are soft (yellow/pink), not neon

### Layout
- [ ] Generous whitespace, not cramped
- [ ] Cards have soft shadows, not heavy drops
- [ ] Borders are subtle (soft tan), not harsh
- [ ] At least one asymmetric moment (script formatting)

### Components
- [ ] Buttons have proper states (hover lift, press scale)
- [ ] Inputs have focus glow (yellow highlight)
- [ ] Cards are rounded (12px), not sharp
- [ ] Script uses proper screenplay formatting

### Motion
- [ ] Transitions are subtle (150-250ms)
- [ ] Hover states lift slightly (1-2px)
- [ ] Page transitions fade smoothly
- [ ] Reduced motion mode works

### Accessibility
- [ ] Focus outlines are visible (2px orange)
- [ ] Color is not the only indicator
- [ ] Text is at least 16px
- [ ] Keyboard navigation works

---

## Before & After

### Before: "Neon Game Show"
- 🔴 All caps everywhere (SCREAMING)
- 🔴 Hot pink + cyan + yellow + lime (too many colors)
- 🔴 Heavy borders (4px) everywhere
- 🔴 Stark black background (#050508)
- 🔴 Aggressive neon glows on everything
- 🔴 Scripts in colored boxes, not screenplay format
- 🔴 No breathing room (cramped)

### After: "Theater Kid's Notebook"
- ✅ Mixed case (easier to read)
- ✅ Warm orange + soft blue (restrained)
- ✅ Soft borders (1-2px), 3px accent only
- ✅ Warm paper background (#FDFCFA)
- ✅ Subtle soft shadows, no neons
- ✅ **Proper screenplay formatting** ⭐
- ✅ Generous whitespace

---

## Files

- **Token JSON:** `/design-tokens.json`
- **Global CSS:** `/app/globals.css`
- **Home:** `/app/page.tsx`
- **Host:** `/app/host/page.tsx`
- **Join:** `/app/join/page.tsx`

---

**Design System Version:** 1.1
**Last Updated:** 2026-02-26
**Status:** Complete & Shipped (light + dark mode, safe area insets, 44px tap targets)
