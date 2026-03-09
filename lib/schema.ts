import { z } from 'zod'

// Define valid moods with a catch-all fallback
const MoodSchema = z.enum(['angry', 'happy', 'confused', 'whispering', 'neutral'])
  .catch('neutral')

export const ScriptLineSchema = z.object({
  speaker: z.string().min(1, "Speaker name is missing"),
  text: z.string().min(1, "Dialogue text is missing"),
  mood: MoodSchema
})

export const ScriptSchema = z.object({
  title: z.string().min(1, "Title is missing"),
  synopsis: z.string().min(1, "Synopsis is missing"),
  lines: z.array(ScriptLineSchema).min(1, "Script must have at least one line")
})

export type ValidatedScript = z.infer<typeof ScriptSchema>

// ── Room schemas ────────────────────────────────────────────

export const createRoomSchema = z.object({
  isPublic: z.boolean().default(false),
  allowSpectators: z.boolean().default(true),
  comedyStyle: z.string().optional(),
  scriptLength: z.enum(['short', 'medium', 'long']).default('medium'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  cardPackId: z.string().optional(),
  matureContent: z.boolean().default(false),
  customPrompt: z.string().max(500).optional(),
})

export const joinRoomSchema = z.object({
  roomCode: z.string().min(3).max(6).transform(s => s.toUpperCase()),
  nickname: z.string().trim().min(1, 'Nickname is required').max(50, 'Nickname too long'),
})

export const updateRoomSettingsSchema = createRoomSchema.partial()

// ── Selection schemas ───────────────────────────────────────

export const submitCardsSchema = z.object({
  character: z.string().min(1),
  setting: z.string().optional(),
  circumstance: z.string().optional(),
})

// ── Voting schemas ──────────────────────────────────────────

export const submitVoteSchema = z.object({
  targetPlayerId: z.string().min(1, 'Must select a player'),
})

// ── Card pack schemas ───────────────────────────────────────

export const createCardPackSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  theme: z.string().max(50).default(''),
  isMature: z.boolean().default(false),
  characters: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).min(3, 'Need at least 3 characters'),
  settings: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).min(1, 'Need at least 1 setting'),
  circumstances: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).min(1, 'Need at least 1 circumstance'),
})

export const rateCardPackSchema = z.object({
  packId: z.string().min(1),
  rating: z.number().min(1).max(5),
})

// ── Derived types ───────────────────────────────────────────

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type JoinRoomInput = z.infer<typeof joinRoomSchema>
export type SubmitCardsInput = z.infer<typeof submitCardsSchema>
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>
export type CreateCardPackInput = z.infer<typeof createCardPackSchema>
