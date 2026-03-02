/** Muted colors for player avatars in lobby/voting views */
export const AVATAR_COLORS = [
  '#3B5998', '#7B3F72', '#4A6741', '#8B6914', '#2D6A6A',
  '#6B4C3B', '#4B0082', '#8B4513', '#2F4F4F', '#3B3B3B',
]

/** Vibrant colors for cast lists in review/invite pages */
export const CAST_COLORS = [
  '#F59E42', '#EC4899', '#3B82F6', '#10B981', '#A855F7',
  '#EF4444', '#8B5CF6', '#14B8A6', '#F97316', '#6366F1',
]

export function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
