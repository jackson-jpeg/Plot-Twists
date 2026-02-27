/**
 * Director's Review Service
 * Generates a tongue-in-cheek AI film critic review after each game.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logger } from '../../lib/logger'
import { extractJSON } from '../utils/jsonExtractor'
import type { DirectorsReview } from '../../lib/types'

interface ReviewInput {
  title: string
  synopsis: string
  cast: { nickname: string; character: string; isWinner: boolean }[]
  reactionCount: number
  plotTwists: string[]
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateDirectorsReview(input: ReviewInput): Promise<DirectorsReview | null> {
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
