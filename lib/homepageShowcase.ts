/**
 * Homepage "Now Showing" reel.
 *
 * Replaces `homepagePosterBriefs.ts` (deleted in Chunk 4a). That file did not
 * merely name third-party characters — it specified how to render them. Every
 * entry here is an archetype: no franchise, no character name, no studio.
 *
 * These are marketing copy, not game content. The playable catalog is
 * `lib/content.ts` and is the server-side source of truth.
 */

export interface HomepageShowcaseEntry {
  slug: string
  title: string
  hook: string
  /** Optional — the card renders the gradient when no artwork is present. */
  imagePath?: string
  palette: {
    background: string
    accent: string
    text: string
  }
}

export const HOMEPAGE_SHOWCASE: HomepageShowcaseEntry[] = [
  {
    slug: 'swamp-hermit-signs-a-lease',
    title: 'The Swamp Hermit Signs a Lease',
    hook: 'A mud-caked recluse discovers the two-drink minimum of a downtown friend group.',
    palette: {
      background: 'linear-gradient(180deg, #f4dbc3 0%, #dfc4aa 58%, #b98f63 100%)',
      accent: '#7a9f47',
      text: '#24160d',
    },
  },
  {
    slug: 'sunday-gravy-sunday-driver',
    title: 'Sunday Gravy, Sunday Driver',
    hook: 'A talking stock car is made an offer it cannot decline.',
    palette: {
      background: 'linear-gradient(180deg, #78808c 0%, #4a4c55 62%, #19181d 100%)',
      accent: '#d53b2f',
      text: '#faf7f1',
    },
  },
  {
    slug: 'the-warlord-gets-a-backstage-pass',
    title: 'The Warlord Gets a Backstage Pass',
    hook: 'A grim northern general must survive a glitter-cannon world tour.',
    palette: {
      background: 'linear-gradient(180deg, #8d8ac4 0%, #e7b5d5 54%, #f7ddb9 100%)',
      accent: '#353f7e',
      text: '#20152d',
    },
  },
  {
    slug: 'plastic-queenpin',
    title: 'Plastic Queenpin',
    hook: 'Immaculate styling, catastrophic decisions, one very dusty highway.',
    palette: {
      background: 'linear-gradient(180deg, #ffd4ea 0%, #f39bb6 42%, #d3ae72 100%)',
      accent: '#ff4d98',
      text: '#2d1621',
    },
  },
  {
    slug: 'dark-lord-of-human-resources',
    title: 'Dark Lord of Human Resources',
    hook: 'The most feared being in the galaxy now runs the quarterly review.',
    palette: {
      background: 'linear-gradient(180deg, #eef2f3 0%, #c8d0d2 48%, #8a9499 100%)',
      accent: '#101010',
      text: '#101820',
    },
  },
  {
    slug: 'gloom-girl-lifeguard',
    title: 'Gloom Girl Lifeguard',
    hook: 'She will save you. She will not be happy about it.',
    palette: {
      background: 'linear-gradient(180deg, #9ee3f5 0%, #ffb572 56%, #ff6b5f 100%)',
      accent: '#1b1a24',
      text: '#17161b',
    },
  },
]
