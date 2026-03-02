/**
 * Image Generation Service
 * Uses Google Gemini to generate movie posters for scripts
 */

import { GoogleGenAI } from '@google/genai'
import { getStorage } from '../db/firestore'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../../lib/logger'

const PLACEHOLDER_IMAGE_URL = '/images/default-poster.svg'

// Singleton — reuse across calls
let genAIInstance: GoogleGenAI | null = null
function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  }
  return genAIInstance
}

/**
 * Generate a movie poster "title card" for a script.
 * Uses Gemini's native image generation to create context-aware posters —
 * animated characters stay animated, live-action settings stay live-action.
 */
export async function generateTitleCard(
  title: string,
  synopsis: string,
  setting: string,
  characters: string[] = []
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY not configured - using placeholder image')
    return PLACEHOLDER_IMAGE_URL
  }

  try {
    const genAI = getGenAI()

    const characterList = characters.length > 0
      ? characters.join(', ')
      : 'the main characters'

    const prompt = `Create a cinematic movie poster for a comedy film.

Title: "${title}"
Characters: ${characterList}
Setting: ${setting}
Synopsis: ${synopsis}

IMPORTANT STYLE RULES:
- Match each character's visual style to their source material. For example: if SpongeBob or Squidward appears, they should be 2D animated in their original cartoon style. If Tony Soprano or Walter White appears, they should look photorealistic/live-action.
- Mix styles naturally when characters come from different media — an animated character can appear alongside photorealistic ones (like Roger Rabbit or Space Jam).
- The setting should match the tone of the show/movie it comes from. A Sopranos setting should look gritty and realistic. A SpongeBob setting should look bright and cartoonish.
- Use dramatic cinematic composition with strong lighting.
- Include the title "${title}" as text at the bottom of the poster.
- Movie poster aspect ratio (2:3 portrait).`

    logger.info(`[Image Service] Generating poster for "${title}" with characters: ${characterList}`)

    const response = await genAI.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
      }
    })

    // Extract image data from Gemini response
    const parts = response.candidates?.[0]?.content?.parts
    const imagePart = parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'))

    if (!imagePart?.inlineData?.data) {
      throw new Error('No image data returned from Gemini')
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
    const url = await uploadToStorage(buffer)

    logger.info(`[Image Service] Poster generated successfully for "${title}"`)
    return url
  } catch (error) {
    logger.error('[Image Service] Poster generation failed:', error)
    return PLACEHOLDER_IMAGE_URL
  }
}

/**
 * Upload image buffer to Firebase Storage
 * Returns public URL or placeholder on failure
 */
async function uploadToStorage(buffer: Buffer): Promise<string> {
  const bucket = await getStorage()
  if (!bucket) {
    logger.warn('[Image Service] Firebase Storage not configured - using placeholder')
    return PLACEHOLDER_IMAGE_URL
  }

  try {
    const filename = `generated-posters/${uuidv4()}.png`
    const file = bucket.file(filename)

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000'
      }
    })
    await file.makePublic()

    return `https://storage.googleapis.com/${bucket.name}/${filename}`
  } catch (error) {
    logger.error('[Image Service] Storage upload failed:', error)
    return PLACEHOLDER_IMAGE_URL
  }
}
