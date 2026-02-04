export interface ContentItem {
  id: string              // e.g., "char-michael-scott"
  name: string            // "Michael Scott"
  category: string        // "sitcom", "action", "fantasy", etc.
  tags: string[]          // ["workplace", "comedy", "boss"]
  maturity: 'safe' | 'mature'
  source?: string         // "The Office"
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
