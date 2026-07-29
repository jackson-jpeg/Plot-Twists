/**
 * Catalog item shape.
 *
 * The field comments here used to give their examples by naming a protected character and the
 * show it came from. That is attribution, sitting in the type definition, and it survived Chunk 4
 * layer 1 for a full session because the source-audit gate read only `lib/content.ts` — the file
 * everyone assumed was the whole catalog surface. It is not: this file and the prompt path carry
 * catalog TEXT too, and both had leaked. All four files are now audited by
 * `__tests__/unit/lib/contentSource.test.ts`.
 *
 * `source` is deleted rather than deprecated. It existed to record which franchise an entry came
 * from, and there is no longer any such thing — the character deck is traits and flaws, and the
 * settings and situations are original or public domain. A nullable field whose only purpose is
 * attribution is an invitation to start attributing again.
 */
export interface ContentItem {
  id: string              // stable slug, e.g. "char-already-searched-bag"
  name: string            // the card text a player reads, e.g. "Has already searched your bag"
  category: string        // one of CATEGORIES below — drives filtering in the browse modal
  tags: string[]          // derived from `name` by scripts/build-catalog.ts; search only
  maturity: 'safe' | 'mature'
}

export interface ContentCategory {
  id: string
  name: string
  emoji: string
}

export const CATEGORIES: ContentCategory[] = [
  { id: 'sitcom', name: 'Sitcom', emoji: '📺' },
  { id: 'action', name: 'Action', emoji: '💥' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🧙' },
  { id: 'scifi', name: 'Sci-Fi', emoji: '🚀' },
  { id: 'horror', name: 'Horror', emoji: '👻' },
  { id: 'animation', name: 'Animation', emoji: '🎨' },
  { id: 'crime', name: 'Crime/Drama', emoji: '🔪' },
  { id: 'classic', name: 'Classic', emoji: '🎬' },
  { id: 'romance', name: 'Romance', emoji: '💕' },
  { id: 'workplace', name: 'Workplace', emoji: '💼' },
  { id: 'adventure', name: 'Adventure', emoji: '🗺️' },
  { id: 'mystery', name: 'Mystery', emoji: '🔍' },
]
