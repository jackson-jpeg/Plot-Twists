#!/usr/bin/env node
/**
 * Generate PWA icon PNGs from icon.svg using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'icon.svg')
const outDir = join(root, 'public', 'icons')

mkdirSync(outDir, { recursive: true })

const svgBuffer = readFileSync(svgPath)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const maskableSizes = [192, 512]

// Generate standard icons
for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(outDir, `icon-${size}.png`))
  console.log(`  icon-${size}.png`)
}

// Generate maskable icons (80% safe zone with #F59E42 background)
for (const size of maskableSizes) {
  const iconSize = Math.round(size * 0.8)
  const padding = Math.round((size - iconSize) / 2)

  const resizedIcon = await sharp(svgBuffer)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 245, g: 158, b: 66, alpha: 1 }, // #F59E42
    },
  })
    .composite([{ input: resizedIcon, left: padding, top: padding }])
    .png()
    .toFile(join(outDir, `icon-maskable-${size}.png`))
  console.log(`  icon-maskable-${size}.png`)
}

console.log('\nAll icons generated in public/icons/')
