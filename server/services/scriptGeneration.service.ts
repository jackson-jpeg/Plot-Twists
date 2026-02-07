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

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
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
  onProgress?: (data: { phase: string; percent: number; title?: string }) => void
): Promise<Script> {
  const isSoloMode = gameMode === 'SOLO'
  const numPlayers = characters.length
  const characterList = characters.join(', ')

  // Get customization prompt if provided
  const customizationPrompt = customization
    ? buildCustomizationPrompt(customization, gameMode)
    : ''

  // Get script length requirements
  const lineRange = customization
    ? getLineCountRange(customization.scriptLength)
    : { min: 30, max: 40 }

  // Get max tokens based on customization
  const maxTokens = customization
    ? getMaxTokens(customization.scriptLength, gameMode)
    : (gameMode === 'ENSEMBLE' ? 10000 : 8192)

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
SCRIPT LENGTH: ${lineRange.min}-${lineRange.max} lines
PERFORMERS: ${numPlayers} player${numPlayers > 1 ? 's' : ''}
${customizationPrompt}

═══════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════
1. Find the GAME of this scene immediately (what's the core comic premise?)
2. Write in the distinct voice of each character (Yoda talks like Yoda, pirates talk like pirates)
3. Escalate from funny to FUNNIER to absolutely ridiculous
4. Use specific details, not generic reactions
5. Build patterns and break them (rule of three)
6. Include callbacks to jokes from earlier in the scene
7. Give every character emotional stakes (even if absurd)
8. End with a strong button - callback, twist, or perfect punchline

The premise is already absurd. Your job is to EXPLOIT that absurdity through sharp dialogue.

Write the scene now. Make it genuinely funny - the kind of funny where people will want to perform it again.`

  try {
    console.log(`\n🎬 AI SCRIPT GENERATION ${previousScript ? '(SEQUEL MODE)' : ''}`)
    console.log(`════════════════════════════════════════`)
    console.log(`Mode: ${gameMode}`)
    console.log(`Rating: ${isMature ? '18+ (Adult Comedy)' : 'Family Friendly'}`)
    console.log(`Characters: ${characterList}`)
    console.log(`Setting: ${setting}`)
    console.log(`Circumstance: ${circumstance}`)
    if (customization) {
      console.log(`Style: ${customization.comedyStyle}, Length: ${customization.scriptLength}, Difficulty: ${customization.difficulty}`)
    }
    if (previousScript) {
      console.log(`Sequel to: "${previousScript.title}"`)
    }
    if (isSoloMode) {
      console.log(`Note: AI will invent a hilarious Co-Star character to play opposite the human player`)
    }
    console.log(`════════════════════════════════════════\n`)

    onProgress?.({ phase: 'Connecting to AI...', percent: 5 })

    // Use streaming for real-time progress
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
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
    const expectedLines = gameMode === 'ENSEMBLE' ? 45 : 35

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

    const finalMessage = await stream.finalMessage()

    console.log(`✅ Script generated successfully!\n`)

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
      console.error('❌ Script validation failed:', validationResult.error.format())
      throw new Error(`Invalid script format: ${validationResult.error.message}`)
    }

    onProgress?.({ phase: 'Script ready!', percent: 100 })
    const script = validationResult.data
    return script
  } catch (error) {
    console.error('Error generating script:', error)
    throw error
  }
}
