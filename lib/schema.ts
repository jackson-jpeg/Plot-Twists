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
