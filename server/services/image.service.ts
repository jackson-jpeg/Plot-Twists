/**
 * Image Generation Service
 * Uses Google Gemini (Imagen 3) to generate movie posters for scripts
 */

import { GoogleGenAI } from '@google/genai'
import { getStorage } from '../db/firestore'
import { v4 as uuidv4 } from 'uuid'

const PLACEHOLDER_IMAGE_URL = '/images/default-poster.svg'

/**
 * Generate a movie poster "title card" for a script
 * Returns the URL of the generated image (or placeholder on failure)
 */
export async function generateTitleCard(
  title: string,
  synopsis: string,
  setting: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not configured - using placeholder image')
    return PLACEHOLDER_IMAGE_URL
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const prompt = `Create a cinematic movie poster in 3D Pixar animation style.
Title: "${title}"
Setting: ${setting}
Synopsis: ${synopsis}
Style: Vibrant Pixar-quality 3D art, dramatic composition, include title text at bottom.`

    console.log(`[Image Service] Generating poster for "${title}"...`)

    const response = await genAI.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: { numberOfImages: 1 }
    })

    const imageData = response.generatedImages?.[0]?.image
    if (!imageData?.imageBytes) {
      throw new Error('No image data returned from Imagen')
    }

    const buffer = Buffer.from(imageData.imageBytes, 'base64')
    const url = await uploadToStorage(buffer)

    console.log(`[Image Service] Poster generated successfully for "${title}"`)
    return url
  } catch (error) {
    console.error('[Image Service] Poster generation failed:', error)
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
    console.warn('[Image Service] Firebase Storage not configured - using placeholder')
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
    console.error('[Image Service] Storage upload failed:', error)
    return PLACEHOLDER_IMAGE_URL
  }
}
