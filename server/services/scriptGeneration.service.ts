/**
 * Script Generation Service
 * Handles AI-powered comedy script generation using Anthropic Claude.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Script, ScriptLine, ScriptCustomization } from '../../lib/types'
import { ScriptSchema } from '../../lib/schema'
import { extractJSON } from '../utils/jsonExtractor'
import { getSystemPrompt, getModeInstructions } from './prompts/comedyPrompts'
import {
  buildCustomizationPrompt,
  getMaxTokens,
  getLineCountRange
} from './scriptCustomization.service'
import { logger } from '../../lib/logger'
import { CONFIG } from '../utils/config'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Generate a comedy script using Claude with streaming progress.
 */
export async function generateScript(
  characters: string[],
  setting: string,
  circumstance: string,
  isMature: boolean,
  gameMode: 'SOLO' | 'HEAD_TO_HEAD' | 'ENSEMBLE',
  previousScript?: Script,
  customization?: ScriptCustomization,
  onProgress?: (data: { phase: string; percent: number; title?: string }) => void,
  onUsage?: (usage: { inputTokens: number; outputTokens: number }) => void
): Promise<Script> {
  const isSoloMode = gameMode === 'SOLO'
  const numPlayers = characters.length
  const characterList = characters.join(', ')

  // Get customization prompt if provided
  const customizationPrompt = customization
    ? buildCustomizationPrompt(customization, gameMode)
    : ''

  // Script length requirements.
  //
  // BOTH BRANCHES MATTER AND THAT IS EASY TO GET WRONG. The host UI defaults
  // scriptLength:'standard' and sends it, so a real game almost always takes the CUSTOMIZATION
  // branch — while scripts/real-generation.ts passes no customization and takes the DEFAULT
  // branch. Capping only the default would have measured clean here and changed nothing in
  // production, which is the failure mode this comment exists to prevent repeating.
  const lineRange = customization
    ? getLineCountRange(customization.scriptLength)
    : { min: 30, max: 38 }

  const maxTokens = customization
    ? getMaxTokens(customization.scriptLength)
    : 2600

  const systemPrompt = getSystemPrompt(isMature, previousScript)
  const modeInstructions = getModeInstructions(gameMode, characters, setting, circumstance)

  const userMessage = `Write a scene using these ingredients:

═══════════════════════════════════════
THE SETUP
═══════════════════════════════════════
CHARACTERS: ${characterList}
SETTING: ${setting}
CIRCUMSTANCE: ${circumstance}
RATING: ${isMature ? '18+ (Adult comedy - profanity allowed, taboo topics fair game, SNL-level sharp writing)' : 'Family Friendly (Smart absurdist comedy for all ages - think peak Nickelodeon)'}

${modeInstructions}

═══════════════════════════════════════
SCRIPT REQUIREMENTS
═══════════════════════════════════════
SCRIPT LENGTH: ${lineRange.min}-${lineRange.max} lines — A HARD CEILING, NOT A SUGGESTION
PERFORMERS: ${numPlayers} player${numPlayers > 1 ? 's' : ''}
${customizationPrompt}

═══════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════
1. Find the GAME of this scene immediately (what's the core comic premise?)
2. Build each voice FROM ITS TRAIT, and never let two of them sound alike
3. Escalate from funny to FUNNIER to absolutely ridiculous
4. Use specific details, not generic reactions
5. Build patterns and break them (rule of three)
6. Include callbacks to jokes from earlier in the scene
7. Give every character emotional stakes (even if absurd)
8. End with a strong button - callback, twist, or perfect punchline

The premise is already absurd. Your job is to EXPLOIT that absurdity through sharp dialogue.

FINAL REMINDER — THIS WILL BE READ ALOUD:
- Keep lines SHORT (5-15 words average, 25 max)
- Write like a fast, dry, single-camera comedy — not like a novel
- If a line is longer than one breath, SPLIT IT
- One-word reactions ("No." "...What?" "Obviously.") are ENCOURAGED
- Every line must sound natural spoken out loud by a non-actor at a party

LENGTH, LAST AND LOUDEST: the "lines" array contains AT MOST ${lineRange.max} objects. Not
about ${lineRange.max}. At most. Count them before you close the array, and if you are over,
cut from the middle — the escalation is where the repetition hides, never the button.
${numPlayers} people are reading this aloud, so ${lineRange.max} lines is already several
minutes of performance; going long does not give them more of a good time, it gives them a
scene that outlives the joke. Coming in UNDER at ${lineRange.min} is a success. Going over
is a failure of the brief even if every line is funny.

Write the scene now. Make it genuinely funny - the kind of funny where people will want to perform it again.`

  try {
    logger.info(`AI SCRIPT GENERATION ${previousScript ? '(SEQUEL MODE)' : ''}`)
    logger.info(`Mode: ${gameMode}`)
    logger.debug(`Rating: ${isMature ? '18+ (Adult Comedy)' : 'Family Friendly'}`)
    logger.debug(`Characters: ${characterList}`)
    logger.debug(`Setting: ${setting}`)
    logger.debug(`Circumstance: ${circumstance}`)
    if (customization) {
      logger.debug(`Style: ${customization.comedyStyle}, Length: ${customization.scriptLength}, Difficulty: ${customization.difficulty}`)
    }
    if (previousScript) {
      logger.debug(`Sequel to: "${previousScript.title}"`)
    }
    if (isSoloMode) {
      logger.debug(`Note: AI will invent a hilarious Co-Star character to play opposite the human player`)
    }

    onProgress?.({ phase: 'Connecting to AI...', percent: 5 })

    // Use streaming for real-time progress
    const stream = anthropic.messages.stream({
      model: CONFIG.generation.model,
      max_tokens: maxTokens,
      temperature: 1, // Max creativity for comedy writing
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    let fullText = ''
    let titleEmitted = false
    let linesStarted = false
    let lineCount = 0
    // Drives the progress bar only. It was a hardcoded 45 for ENSEMBLE — above the 40 the prompt
    // asked for, so the bar was calibrated to the overrun rather than to the brief, and a script
    // that obeyed the brief would jump to 90% and sit there. Track the actual target instead.
    const expectedLines = lineRange.max

    onProgress?.({ phase: 'Writing script...', percent: 10 })

    stream.on('text', (text) => {
      fullText += text

      // Detect milestones for progress
      if (!titleEmitted && fullText.includes('"title"')) {
        // Try to extract title value
        const titleMatch = fullText.match(/"title"\s*:\s*"([^"]+)"/)
        if (titleMatch) {
          titleEmitted = true
          onProgress?.({ phase: 'Writing dialogue...', percent: 20, title: titleMatch[1] })
        }
      }

      if (!linesStarted && fullText.includes('"lines"')) {
        linesStarted = true
        onProgress?.({ phase: 'Writing dialogue...', percent: 40 })
      }

      if (linesStarted) {
        // Count line objects by counting "speaker" occurrences
        const newCount = (fullText.match(/"speaker"/g) || []).length
        if (newCount > lineCount) {
          lineCount = newCount
          const lineProgress = Math.min(40 + (lineCount / expectedLines) * 50, 90)
          onProgress?.({ phase: `Writing line ${lineCount}...`, percent: Math.round(lineProgress) })
        }
      }
    })

    // Add timeout to prevent indefinite hangs if the API stalls.
    // Chunk 3 item 3: now read from CONFIG so GENERATION_TIMEOUT_MS is a real knob. It was not
    // before — this constant was hardcoded at 120s while the config advertised 45s to nobody.
    const STREAM_TIMEOUT_MS = CONFIG.generation.timeoutMs
    let timeoutTimer: NodeJS.Timeout | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutTimer = setTimeout(() => {
        stream.abort()
        reject(new Error(`Script generation timed out after ${Math.round(STREAM_TIMEOUT_MS / 1000)}s`))
      }, STREAM_TIMEOUT_MS)
      timeoutTimer.unref()
    })

    let finalMessage: Awaited<ReturnType<typeof stream.finalMessage>>
    try {
      finalMessage = await Promise.race([stream.finalMessage(), timeoutPromise])
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer)
    }

    logger.info(`Script generated successfully!`)

    // Cost observability. This is the single most expensive call the product makes, it scales
    // linearly with rounds played, and until 2026-07-29 nothing anywhere recorded what one costs
    // — the question "is this budget 5 playtests or 500" could not be answered from the logs.
    // Emitted at info so it survives production log levels.
    const usage = {
      inputTokens: finalMessage.usage?.input_tokens ?? 0,
      outputTokens: finalMessage.usage?.output_tokens ?? 0,
    }
    logger.info(
      `Token usage: ${usage.inputTokens} in / ${usage.outputTokens} out ` +
        `(mode=${gameMode}, players=${numPlayers}, model=${CONFIG.generation.model})`,
    )
    onUsage?.(usage)

    // TRUNCATION IS NOW A DIAGNOSABLE FAILURE RATHER THAN A MYSTERY.
    //
    // `standard` dropped from an 8-10k ceiling to 2,600 on 2026-07-29. That is deliberate and
    // measured, but it makes a previously-unreachable failure reachable: if the model ignores
    // the line cap badly enough to hit the ceiling, the stream ends mid-JSON. Without this
    // check, `extractJSON` hands JSON.parse an unterminated object and the operator sees
    // "Unexpected end of JSON input" — which points at the parser, not at the ceiling that
    // caused it, and would send the next person debugging extractJSON for an afternoon.
    //
    // There is no salvage path worth having. A truncated script is missing its button, which is
    // the one line the whole scene is built to land on.
    if (finalMessage.stop_reason === 'max_tokens') {
      logger.error(
        `Script generation hit the ${maxTokens}-token ceiling and was truncated mid-output ` +
          `(mode=${gameMode}, players=${numPlayers}, target=${lineRange.min}-${lineRange.max} lines). ` +
          `The model overran the line cap. Raise the ceiling for this length in ` +
          `scriptCustomization.service.ts, or tighten the cap in the prompt — do not silently retry.`,
      )
      throw new Error(
        `Script generation truncated at the ${maxTokens}-token ceiling (mode=${gameMode})`,
      )
    }

    const content = finalMessage.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    onProgress?.({ phase: 'Validating script...', percent: 95 })

    // Use robust bracket-matching JSON extraction
    const jsonText = extractJSON(content.text)

    // Parse and validate with Zod
    const rawScript = JSON.parse(jsonText.trim())
    const validationResult = ScriptSchema.safeParse(rawScript)

    if (!validationResult.success) {
      logger.error('Script validation failed:', validationResult.error.format())
      throw new Error(`Invalid script format: ${validationResult.error.message}`)
    }

    onProgress?.({ phase: 'Script ready!', percent: 100 })
    const script = validationResult.data
    return script
  } catch (error) {
    logger.error('Error generating script:', error)
    throw error
  }
}
