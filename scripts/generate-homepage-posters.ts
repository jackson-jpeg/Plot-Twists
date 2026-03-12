import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'
import {
  HOMEPAGE_POSTER_BRIEFS,
  HOMEPAGE_POSTER_PRIMARY_MODEL,
  HOMEPAGE_POSTER_FALLBACK_MODEL,
} from '../lib/homepagePosterBriefs'

dotenv.config({ path: '.env.local', override: true })
dotenv.config({ path: '.env', override: false })

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'poster-showcase')
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json')

interface GeneratedPosterManifestEntry {
  slug: string
  title: string
  publicSafeTitle: string
  imagePath: string
  model: string
  generatedAt: string
}

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

async function generatePosterImage(prompt: string, model: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing')
  }

  const genAI = new GoogleGenAI({ apiKey })
  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ['IMAGE'],
    },
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((part) => part.inlineData?.mimeType?.startsWith('image/'))
  if (!imagePart?.inlineData?.data) {
    throw new Error(`No image data returned from model ${model}`)
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
    mimeType: imagePart.inlineData.mimeType || 'image/png',
  }
}

async function writeManifest(entries: GeneratedPosterManifestEntry[]) {
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf8')
}

async function main() {
  const requestedSlugs = new Set(process.argv.slice(2))
  const selectedBriefs = requestedSlugs.size > 0
    ? HOMEPAGE_POSTER_BRIEFS.filter((brief) => requestedSlugs.has(brief.slug))
    : HOMEPAGE_POSTER_BRIEFS

  if (selectedBriefs.length === 0) {
    throw new Error('No poster briefs selected')
  }

  await ensureOutputDir()

  const manifestEntries: GeneratedPosterManifestEntry[] = []
  let failedCount = 0

  for (const brief of selectedBriefs) {
    let modelUsed = HOMEPAGE_POSTER_PRIMARY_MODEL
    let buffer: Buffer | null = null

    try {
      try {
        const generated = await generatePosterImage(brief.prompt, HOMEPAGE_POSTER_PRIMARY_MODEL)
        buffer = generated.buffer
      } catch (primaryError) {
        console.warn(`Primary model failed for ${brief.slug}:`, primaryError)
        modelUsed = HOMEPAGE_POSTER_FALLBACK_MODEL
        const generated = await generatePosterImage(brief.prompt, HOMEPAGE_POSTER_FALLBACK_MODEL)
        buffer = generated.buffer
      }

      const imagePath = `/poster-showcase/${brief.slug}.png`
      await fs.writeFile(path.join(OUTPUT_DIR, `${brief.slug}.png`), buffer)

      manifestEntries.push({
        slug: brief.slug,
        title: brief.title,
        publicSafeTitle: brief.publicSafeTitle,
        imagePath,
        model: modelUsed,
        generatedAt: new Date().toISOString(),
      })

      console.log(`Generated ${brief.slug} with ${modelUsed}`)
    } catch (error) {
      failedCount += 1
      console.error(`Failed to generate ${brief.slug}:`, error)
    }
  }

  await writeManifest(manifestEntries)
  console.log(`Wrote manifest to ${MANIFEST_PATH}`)

  if (failedCount > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
