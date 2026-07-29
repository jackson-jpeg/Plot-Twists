/**
 * Director's Review Service
 * Generates a tongue-in-cheek AI film critic review after each game.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logger } from '../../lib/logger'
import { extractJSON } from '../utils/jsonExtractor'
import type { DirectorsReview } from '../../lib/types'

export interface ReviewInput {
  title: string
  synopsis: string
  cast: { nickname: string; character: string; isWinner: boolean }[]
  reactionCount: number
  plotTwists: string[]
}

let anthropicClient: Anthropic | null = null

export function shouldGenerateDirectorsReview(): boolean {
  if (process.env.ENABLE_DIRECTORS_REVIEW === 'false') {
    return false
  }

  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_DIRECTORS_REVIEW !== 'true') {
    return false
  }

  return Boolean(process.env.ANTHROPIC_API_KEY)
}

function getAnthropicClient(): Anthropic | null {
  if (!shouldGenerateDirectorsReview()) {
    return null
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  return anthropicClient
}

export async function generateDirectorsReview(input: ReviewInput): Promise<DirectorsReview | null> {
  const anthropic = getAnthropicClient()
  if (!anthropic) {
    return null
  }

  try {
    const castText = input.cast
      .map(p => `${p.nickname} as "${p.character}"${p.isWinner ? ' (MVP)' : ''}`)
      .join(', ')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You're a pretentious film critic reviewing a live comedy called "${input.title}".

Synopsis: ${input.synopsis}
Cast: ${castText}
Audience reactions: ${input.reactionCount}
${input.plotTwists.length > 0 ? `Plot twists: ${input.plotTwists.join(', ')}` : ''}

Respond with JSON only:
{"rating": <3-5>, "headline": "<witty one-liner>", "review": "<3-4 sentences, film-critic tone, absurdly serious about something silly>", "bestMoment": "<one specific highlight from this performance>"}`
      }]
    })

    // Cost observability, same as scriptGeneration. This is the second AI call in a round and it
    // fires on every completed round, so it is a real per-round line item rather than a rounding
    // error — worth seeing in the logs instead of inferring.
    logger.info(
      `[DirectorsReview] Token usage: ${response.usage?.input_tokens ?? 0} in / ` +
        `${response.usage?.output_tokens ?? 0} out`,
    )

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonText = extractJSON(text)
    const parsed = JSON.parse(jsonText.trim())

    if (!parsed || typeof parsed.rating !== 'number') return null

    return parsed as DirectorsReview
  } catch (error) {
    logger.error('[DirectorsReview] Generation failed:', error)
    return null
  }
}
